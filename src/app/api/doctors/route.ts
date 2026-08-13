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
  // active ones — and never their email/contact details.
  if (auth.role === "patient") {
    doctors = doctors
      .filter((d) => d.active)
      .map(({ uid, name, specialization, bio, photoURL, active, online }) => ({
        uid,
        name,
        specialization,
        bio,
        photoURL,
        active,
        online,
        role: "doctor",
        email: "",
        createdAt: "",
      }));
  }

  return NextResponse.json(doctors);
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { uid, active, online } = await req.json();

  // A doctor may only flip their own presence status.
  if (auth.role === "doctor") {
    if (uid !== auth.uid || typeof online !== "boolean" || active !== undefined) {
      return NextResponse.json({ error: "Doctors can only update their own presence status" }, { status: 403 });
    }
    await adminDb.collection("users").doc(uid).update({ online });
    return NextResponse.json({ ok: true });
  }

  // Admin path: suspend/reinstate a doctor account.
  if (!uid || typeof active !== "boolean") {
    return NextResponse.json({ error: "Missing uid or active" }, { status: 400 });
  }

  // Suspending disables login entirely — a suspended doctor can't be used
  // to read patient data even if their token hasn't expired yet.
  await adminAuth.updateUser(uid, { disabled: !active });
  await adminDb.collection("users").doc(uid).update({ active });

  return NextResponse.json({ ok: true });
}
