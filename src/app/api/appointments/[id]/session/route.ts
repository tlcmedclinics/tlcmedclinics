import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { createDailyRoom, createDailyToken } from "@/lib/daily";
import { canJoinSession } from "@/lib/session-window";
import { notify } from "@/lib/notifications";
import { sendSms, smsBody } from "@/lib/sms";
import { clinicInstant, formatClinicTime } from "@/lib/clinic-time";
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

    // An "audio" booking gets a room with the camera disabled outright, not a
    // video room people are asked to keep muted.
    const audioOnly = appointment.mode === "audio";

    if ((appointment.mode === "video" || appointment.mode === "audio") && !appointment.roomUrl) {
      updates.roomUrl = await createDailyRoom(appointment.id, audioOnly);
    }
    if (appointment.mode === "chat" && !appointment.chatThreadId) {
      updates.chatThreadId = appointment.id;
    }

    await ref.update(updates);

    // ── Telling the patient the session has opened ────────────────────────
    //
    // This is the whole reason a clinic is allowed to start early. Without it,
    // "the doctor is free now" is information the clinic has and the patient
    // does not, and the only way for them to find out is to keep opening the
    // app and looking — which turns a courtesy into a chore and means most
    // early starts are simply wasted.
    //
    // Two conditions, both necessary:
    //
    //   · only when the clinic side started it. A patient joining at their own
    //     appointment time does not need to be told they have joined.
    //   · only on the transition into "live". A doctor whose browser reloads,
    //     or who presses start twice, must not send a second alert — and this
    //     also goes out as a push, where a duplicate is a phone buzzing twice
    //     for nothing.
    const openedNow = isHost && appointment.sessionStatus !== "live";

    if (openedNow) {
      const scheduled = clinicInstant(appointment.date, appointment.time);
      // A minute or two of slack: a doctor pressing start at 10:59 for an
      // 11:00 appointment has not started early in any sense that matters to
      // the person being told about it.
      const early = scheduled ? scheduled.getTime() - Date.now() > 2 * 60_000 : false;
      const at = formatClinicTime(appointment.time);
      const doctor = (appointment.doctorName ?? "").replace(/^Dr\.?\s*/i, "");

      await notify({
        userId: appointment.patientId,
        role: "patient",
        type: "session-started",
        title: early ? "Your doctor is ready early" : "Your session has started",
        message: early
          ? `${doctor ? `Dr. ${doctor}` : "Your doctor"} has opened your ${appointment.service} session ahead of the ${at} slot — you can join now.`
          : `Your ${appointment.service} session is open. You can join now.`,
        appointmentId: appointment.id,
      });

      // And by SMS, because a patient who has not opened the app today is
      // exactly the person this is for. `sendSms` never throws — an SMS that
      // does not go out must not take the session down with it.
      await sendSms(
        appointment.patientPhone,
        smsBody(
          early
            ? `Your doctor is ready early — your ${appointment.service} session (booked for ${at}) is open now. Open the TLC Med Clinics app to join.`
            : `Your ${appointment.service} session is open now. Open the TLC Med Clinics app to join.`
        )
      );
    }

    let joinToken: string | undefined;
    const roomUrl = updates.roomUrl ?? appointment.roomUrl;
    if ((appointment.mode === "video" || appointment.mode === "audio") && roomUrl) {
      joinToken = await createDailyToken(
        roomUrl,
        isHost ? appointment.doctorName || "Clinic" : appointment.patientName || "Patient",
        isHost,
        audioOnly
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
