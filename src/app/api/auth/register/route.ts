import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { PatientProfile, DoctorProfile, UserProfile } from "@/types";

/**
 * Turns a freshly created Firebase account into a patient, or into a doctor
 * waiting for approval.
 *
 * ── What this route used to be, and why that mattered ──
 *
 * It took a `uid` from the request body, wrote `users/{uid}` with `.set()`,
 * and called `setCustomUserClaims` on it — with no authentication of any kind.
 * Anyone who knew a uid could, from a terminal, overwrite that person's
 * profile document and reassign their role. Not "in theory": a uid is not a
 * secret, and `.set()` replaces rather than merges, so one request could erase
 * a doctor's approval, their specialisation and the date they joined.
 *
 * Two changes close it, and both are the same idea — the caller does not get
 * to say who they are:
 *
 *   1. **The token decides the uid.** `verifyRequest` checks a real Firebase
 *      ID token and hands back the uid inside it. `body.uid` is now read only
 *      to be compared and refused; it is never written.
 *
 *   2. **An existing profile is never overwritten.** This route creates; it
 *      does not edit. A second call for somebody who already has a document is
 *      answered with what they already are. That also makes it safe to call
 *      more than once, which the app relies on: when it finds an account with
 *      no profile it calls this to repair it, and repairing must never be able
 *      to flatten a record that turned out to be fine.
 *
 * `/api/profile` is where a profile gets *changed*, and it has always scoped
 * every write to the caller's own uid.
 */
export async function POST(req: NextRequest) {
  // No role list: this is called seconds after sign-up, when the token has no
  // role claim on it yet. Being signed in at all is the bar here.
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const { name, email, phone, role, specialization, bio } = body;

  // Sent by the older clients and by the mobile app. Kept only so that a
  // mismatch is refused loudly rather than ignored quietly — a client asking
  // to register somebody else is a bug worth seeing, not a request to serve.
  if (body.uid && body.uid !== auth.uid) {
    console.warn("[auth/register] uid mismatch — token:", auth.uid, "body:", body.uid);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const uid = auth.uid;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const cleanName = name.trim().slice(0, 80);

  const ref = adminDb.collection("users").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    // Already registered. Answer with the truth rather than an error: the app
    // calls this to heal a missing profile and should not be handed a failure
    // for an account that is, in fact, fine.
    const profile = existing.data() as UserProfile;
    return NextResponse.json({
      ok: true,
      role: profile.role,
      approvalStatus: (profile as DoctorProfile).approvalStatus,
      existing: true,
    });
  }

  const requestedRole = role === "doctor" ? "doctor" : "patient";

  // No document, but the token already carries a staff claim. Refuse rather
  // than write a fresh patient record over an account that Firebase Auth
  // considers a doctor or an admin. The same guard is in the phone route, for
  // the same reason.
  if (auth.role && auth.role !== "patient" && requestedRole === "patient") {
    return NextResponse.json(
      { error: "This account already exists. Please sign in instead." },
      { status: 409 }
    );
  }

  // Public sign-up only ever creates a patient, or a doctor pending admin
  // approval — admin accounts are provisioned separately, never through this
  // form (see scripts/create-admin.mjs).

  if (requestedRole === "doctor") {
    // The doctor claim is set so the account routes to /doctor/* instead of
    // /patient/*, but RequireRole + the doctor dashboard both also check
    // approvalStatus === "approved" — a pending doctor sees a "waiting for
    // approval" screen instead of real patient data, and is invisible to
    // patients until an admin approves them from Admin > Doctors.
    await adminAuth.setCustomUserClaims(uid, { role: "doctor" });

    const doctorProfile: DoctorProfile = {
      uid,
      role: "doctor",
      name: cleanName,
      email: email || undefined,
      phone: phone || undefined,
      specialization: specialization || undefined,
      bio: bio || undefined,
      active: false,
      approvalStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    await ref.set(doctorProfile);
    return NextResponse.json({ ok: true, role: "doctor", approvalStatus: "pending" });
  }

  await adminAuth.setCustomUserClaims(uid, { role: "patient" });

  const patientProfile: PatientProfile = {
    uid,
    role: "patient",
    name: cleanName,
    email: email || undefined,
    phone: phone || undefined,
    createdAt: new Date().toISOString(),
  };
  await ref.set(patientProfile);

  return NextResponse.json({ ok: true, role: "patient" });
}
