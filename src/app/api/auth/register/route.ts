import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { PatientProfile } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { uid, name, email, phone } = body;

  if (!uid || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Every public sign-up is a patient — admin accounts are provisioned
  // separately (see scripts/create-admin.mjs), never through this form.
  await adminAuth.setCustomUserClaims(uid, { role: "patient" });

  const patientProfile: PatientProfile = {
    uid,
    role: "patient",
    name,
    email,
    phone,
    createdAt: new Date().toISOString(),
  };
  await adminDb.collection("users").doc(uid).set(patientProfile);

  return NextResponse.json({ ok: true });
}
