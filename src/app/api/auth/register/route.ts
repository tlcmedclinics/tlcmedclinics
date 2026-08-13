import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { PatientProfile, DoctorProfile } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { uid, name, email, phone, role, specialization, bio } = body;

  if (!uid || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Public sign-up only ever creates a patient, or a doctor pending admin
  // approval — admin accounts are provisioned separately, never through
  // this form (see scripts/create-admin.mjs).
  const requestedRole = role === "doctor" ? "doctor" : "patient";

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
      name,
      email,
      phone: phone || undefined,
      specialization: specialization || undefined,
      bio: bio || undefined,
      active: false,
      approvalStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    await adminDb.collection("users").doc(uid).set(doctorProfile);
    return NextResponse.json({ ok: true, role: "doctor", approvalStatus: "pending" });
  }

  await adminAuth.setCustomUserClaims(uid, { role: "patient" });

  const patientProfile: PatientProfile = {
    uid,
    role: "patient",
    name,
    email,
    phone: phone || undefined,
    createdAt: new Date().toISOString(),
  };
  await adminDb.collection("users").doc(uid).set(patientProfile);

  return NextResponse.json({ ok: true, role: "patient" });
}
