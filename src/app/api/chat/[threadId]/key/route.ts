import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { deriveThreadKey } from "@/lib/chat-crypto";
import type { Appointment } from "@/types";

// threadId === appointment id (see Appointment.chatThreadId). Only the
// patient on that appointment, its assigned doctor, or an admin may ever
// receive the decryption key for it.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const auth = await verifyRequest(req, ["patient", "doctor", "admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { threadId } = await params;

  const snap = await adminDb.collection("appointments").doc(threadId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  const appointment = snap.data() as Appointment;

  const isParticipant =
    auth.role === "admin" ||
    (auth.role === "patient" && appointment.patientId === auth.uid) ||
    (auth.role === "doctor" && appointment.doctorId === auth.uid);

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let key: Buffer;
  try {
    key = deriveThreadKey(threadId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Encryption not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ key: key.toString("base64") });
}
