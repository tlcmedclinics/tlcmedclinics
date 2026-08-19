import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { PatientProfile } from "@/types";

/**
 * POST /api/auth/phone-register
 *
 * Finishes signup for someone who came in through phone + OTP. Firebase has
 * already verified the number by the time this is called; the client sends the
 * resulting ID token and this route creates the Firestore profile and grants
 * the patient role.
 *
 * Unlike the email route this takes no uid from the body — the uid comes from
 * the verified token, so a caller can only ever create their own profile.
 *
 * Phone signup always produces a patient. Doctors are provisioned by admin,
 * and admin accounts by script.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { name, email } = await req.json().catch(() => ({}));
  const trimmedName = typeof name === "string" ? name.trim().slice(0, 80) : "";
  if (!trimmedName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const ref = adminDb.collection("users").doc(auth.uid);
  const existing = await ref.get();

  // Already registered — this is a returning user whose client called signup
  // again. Don't touch their profile or role; just report what they are.
  if (existing.exists) {
    const profile = existing.data() as PatientProfile;
    return NextResponse.json({ ok: true, role: profile.role, existing: true });
  }

  // Guard against privilege escalation: if this account somehow already holds
  // a staff claim, refuse rather than silently rewriting it to "patient".
  if (auth.role && auth.role !== "patient") {
    return NextResponse.json(
      { error: "This account already exists. Please sign in instead." },
      { status: 409 }
    );
  }

  const record = await adminAuth.getUser(auth.uid);
  const optionalEmail =
    typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined;

  await adminAuth.setCustomUserClaims(auth.uid, { role: "patient" });

  const profile: PatientProfile = {
    uid: auth.uid,
    role: "patient",
    name: trimmedName,
    // Both identities are optional and either can be added later from
    // Settings — the account is identified by uid, not by email.
    email: optionalEmail ?? record.email ?? undefined,
    phone: record.phoneNumber ?? undefined,
    phoneVerified: Boolean(record.phoneNumber),
    createdAt: new Date().toISOString(),
  };

  await ref.set(profile);

  // Keep the auth record's display name in step so anything reading the auth
  // user (rather than the Firestore doc) shows a name instead of a blank.
  await adminAuth
    .updateUser(auth.uid, { displayName: trimmedName })
    .catch(() => {});

  return NextResponse.json({ ok: true, role: "patient" });
}
