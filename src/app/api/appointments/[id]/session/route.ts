import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { createDailyRoom, createDailyToken } from "@/lib/daily";
import { canJoinSession } from "@/lib/session-window";
import type { Appointment } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["patient", "doctor", "admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { action } = await req.json(); // "start" | "end"

  const ref = adminDb.collection("appointments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const appointment = snap.data() as Appointment;

  const isAdmin = auth.role === "admin";
  const isDoctor = auth.role === "doctor" && appointment.doctorId === auth.uid;
  const isHost = isAdmin || isDoctor; // either can run the session as the clinic side
  const isOwner = auth.role === "patient" && appointment.patientId === auth.uid;
  if (!isHost && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (appointment.mode === "in-person") {
    return NextResponse.json({ error: "This appointment has no online session" }, { status: 400 });
  }

  if (action === "end") {
    if (!isHost) {
      return NextResponse.json({ error: "Only the clinic can end a session" }, { status: 403 });
    }
    const updates = {
      sessionStatus: "ended" as const,
      sessionEndedAt: new Date().toISOString(),
      status: "completed" as const,
    };
    await ref.update(updates);
    return NextResponse.json({ ok: true, appointment: { ...appointment, ...updates } });
  }

  if (action === "start") {
    if (appointment.sessionStatus === "ended") {
      return NextResponse.json({ error: "This session already ended" }, { status: 400 });
    }
    if (appointment.status !== "confirmed") {
      return NextResponse.json({ error: "Appointment is not confirmed yet" }, { status: 400 });
    }

    // Admin/doctor can always start (early or late, per the clinic's own judgement).
    // A patient can only start once the automatic join window opens.
    if (!isHost && appointment.sessionStatus !== "live" && !canJoinSession(appointment)) {
      return NextResponse.json(
        { error: "It's not time for this session yet — the clinic can start it early if needed." },
        { status: 400 }
      );
    }

    const updates: Partial<Appointment> = {
      sessionStatus: "live",
      sessionStartedAt: appointment.sessionStartedAt ?? new Date().toISOString(),
    };

    if ((appointment.mode === "video" || appointment.mode === "audio") && !appointment.roomUrl) {
      updates.roomUrl = await createDailyRoom(appointment.id);
    }
    if (appointment.mode === "chat" && !appointment.chatThreadId) {
      updates.chatThreadId = appointment.id;
    }

    await ref.update(updates);

    let joinToken: string | undefined;
    const roomUrl = updates.roomUrl ?? appointment.roomUrl;
    if ((appointment.mode === "video" || appointment.mode === "audio") && roomUrl) {
      joinToken = await createDailyToken(
        roomUrl,
        isHost ? appointment.doctorName || "Clinic" : appointment.patientName || "Patient",
        isHost
      );
    }

    return NextResponse.json({
      ok: true,
      appointment: { ...appointment, ...updates },
      joinToken,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
