import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { DoctorProfile } from "@/types";

// Doctors are created by admin only (never self-registered) — this mirrors
// how the clinic actually onboards a doctor: admin issues the account,
// hands over the credentials, the doctor logs in and only ever sees their
// own assigned patients.
export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { email, password, name, specialization, bio } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  let user;
  try {
    user = await adminAuth.createUser({ email, password, displayName: name });
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Couldn't create the account";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await adminAuth.setCustomUserClaims(user.uid, { role: "doctor" });

  const profile: DoctorProfile = {
    uid: user.uid,
    role: "doctor",
    name,
    email,
    specialization: specialization || undefined,
    bio: bio || undefined,
    active: true,
    approvalStatus: "approved",
    createdAt: new Date().toISOString(),
  };
  await adminDb.collection("users").doc(user.uid).set(profile);

  return NextResponse.json({ ok: true, doctor: profile });
}

export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor", "patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const snap = await adminDb.collection("users").where("role", "==", "doctor").get();
  let doctors = snap.docs.map((d) => d.data() as DoctorProfile);

  // Patients only get to see doctors they could actually be booked with —
  // approved, active ones — and never their email/contact details.
  if (auth.role === "patient") {
    doctors = doctors
      .filter((d) => d.active && d.approvalStatus === "approved")
      .map(({ uid, name, specialization, bio, photoURL, active, online, approvalStatus }) => ({
        uid,
        name,
        specialization,
        bio,
        photoURL,
        active,
        online,
        approvalStatus,
        role: "doctor",
        email: "",
        createdAt: "",
      }));
  }

  // A doctor logging into their own dashboard only ever needs their own
  // record here (used for the "Doctor" select elsewhere) — admin sees
  // everyone, including pending requests, so the approvals list can render.
  if (auth.role === "doctor") {
    doctors = doctors.filter((d) => d.uid === auth.uid);
  }

  return NextResponse.json(doctors);
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { uid, active, online, approvalStatus } = await req.json();

  // A doctor may only flip their own presence status.
  if (auth.role === "doctor") {
    if (uid !== auth.uid || typeof online !== "boolean" || active !== undefined) {
      return NextResponse.json({ error: "Doctors can only update their own presence status" }, { status: 403 });
    }
    await adminDb.collection("users").doc(uid).update({ online });
    return NextResponse.json({ ok: true });
  }

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  // Admin path: approve / reject a self-registered doctor's request.
  if (approvalStatus === "approved" || approvalStatus === "rejected") {
    if (approvalStatus === "approved") {
      // Approving activates the account — the doctor now shows up to
      // patients and can sign in to the doctor dashboard.
      await adminAuth.updateUser(uid, { disabled: false });
      await adminDb.collection("users").doc(uid).update({ approvalStatus, active: true });
    } else {
      // Rejecting disables login outright — a rejected request should not
      // be able to sign in and see a half-built dashboard.
      await adminAuth.updateUser(uid, { disabled: true });
      await adminDb.collection("users").doc(uid).update({ approvalStatus, active: false });
    }
    return NextResponse.json({ ok: true });
  }

  // Admin path: suspend/reinstate an already-approved doctor account.
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Missing active or approvalStatus" }, { status: 400 });
  }

  // Suspending disables login entirely — a suspended doctor can't be used
  // to read patient data even if their token hasn't expired yet.
  await adminAuth.updateUser(uid, { disabled: !active });
  await adminDb.collection("users").doc(uid).update({ active });

  return NextResponse.json({ ok: true });
}
