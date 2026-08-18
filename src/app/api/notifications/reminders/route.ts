import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { notify, notifyAllAdmins } from "@/lib/notifications";
import type { Appointment } from "@/types";

// GET /api/notifications/reminders
//
// Sends the 24-hour "your appointment is tomorrow" reminder to all three
// sides — patient, assigned doctor, and every admin. Meant to be hit by a
// scheduler (vercel.json declares it hourly), never from the UI.
//
// Protect it with CRON_SECRET in .env and send the same value as
// `Authorization: Bearer <secret>` on the cron job.
//
// The query is bounded to today + tomorrow. It used to read every confirmed
// appointment in history on every run and filter in JS, which grew without
// limit — at 96 runs a day that was quietly the most expensive query in the
// system. Needs the (status, date) composite index in firestore.indexes.json.

/** How far ahead to look. Anything further out isn't due for a reminder yet. */
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

/** Firestore caps a batch at 500 writes; stay clear of the edge. */
const BATCH_LIMIT = 400;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() + LOOKAHEAD_MS);

  try {
    // Two calendar days cover every appointment inside the next 24 hours
    // whatever the current time of day; the exact window is applied below.
    const snap = await adminDb
      .collection("appointments")
      .where("status", "==", "confirmed")
      .where("date", ">=", isoDate(now))
      .where("date", "<=", isoDate(cutoff))
      .get();

    const due = snap.docs
      .map((d) => d.data() as Appointment)
      .filter((a) => {
        if (a.reminderSentAt) return false; // already reminded
        if (!a.date || !a.time) return false;
        const when = new Date(`${a.date}T${a.time}:00`);
        if (Number.isNaN(when.getTime())) return false;
        return when > now && when <= cutoff;
      });

    if (due.length === 0) {
      return NextResponse.json({ ok: true, remindersSent: 0 });
    }

    // Fan out concurrently rather than one appointment at a time — a run with
    // 40 due reminders used to make ~80 sequential round trips and could
    // outlive the function's timeout.
    await Promise.all(
      due.map(async (a) => {
        const when = `${a.date} ${a.time}`;
        const base = `Reminder: ${a.service} appointment on ${a.date} at ${a.time}.`;

        await Promise.all([
          notify({
            userId: a.patientId,
            role: "patient",
            type: "appointment-reminder",
            title: "Your appointment is tomorrow",
            message: `${base} We'll see you then.`,
            appointmentId: a.id,
          }),
          a.doctorId
            ? notify({
                userId: a.doctorId,
                role: "doctor",
                type: "appointment-reminder",
                title: "Appointment tomorrow",
                message: `${base} Patient: ${a.patientName}.`,
                appointmentId: a.id,
              })
            : Promise.resolve(),
          notifyAllAdmins({
            type: "appointment-reminder",
            title: "Appointment tomorrow",
            message: `${a.patientName} — ${a.service} on ${when}${
              a.doctorName ? ` with Dr. ${a.doctorName}` : " (no doctor assigned yet)"
            }.`,
            appointmentId: a.id,
          }),
        ]);
      })
    );

    // Stamp them in batches so the next tick doesn't re-notify. Written after
    // the notifications, so a failure here means someone gets a duplicate
    // reminder rather than none at all — the safer direction to fail.
    for (let i = 0; i < due.length; i += BATCH_LIMIT) {
      const batch = adminDb.batch();
      for (const a of due.slice(i, i + BATCH_LIMIT)) {
        batch.update(adminDb.collection("appointments").doc(a.id), {
          reminderSentAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    return NextResponse.json({ ok: true, remindersSent: due.length });
  } catch (err) {
    console.error("[GET /api/notifications/reminders]", err);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
