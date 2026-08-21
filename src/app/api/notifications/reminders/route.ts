import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { notify, notifyAllAdmins } from "@/lib/notifications";
import type { Appointment } from "@/types";

// GET /api/notifications/reminders
//
// Sends two different reminders, and it matters that they are different:
//
//   24 hours before — PATIENT ONLY.
//     A patient has one appointment to remember. A doctor may have twenty in a
//     day and the clinic has all of them, so sending this to the doctor and to
//     every admin produced a wall of notifications that nobody read — which
//     also buries the ones that do matter.
//
//   ~5 minutes before — PATIENT, DOCTOR AND ADMIN.
//     This one is operational rather than informational: it's the "go now"
//     nudge. The doctor needs it to be at their desk, the admin needs it to see
//     that a session is about to start, and the patient needs it to open the
//     app. Everyone gets it because everyone has something to do.
//
// Meant to be hit by a scheduler, never from the UI. Protect it with
// CRON_SECRET and send the same value as `Authorization: Bearer <secret>`.
//
// IMPORTANT: the five-minute reminder is only as accurate as how often this
// runs. An hourly cron cannot deliver it. Schedule it every 2 minutes — on
// Hostinger that's hPanel -> Advanced -> Cron Jobs.

/** How far ahead the day-before reminder looks. */
const DAY_AHEAD_MS = 24 * 60 * 60 * 1000;

/**
 * The "starting soon" window, in minutes before the appointment.
 *
 * It's a window, not an exact instant, because the scheduler ticks on its own
 * rhythm — if it runs every 2 minutes it will rarely land exactly 5 minutes
 * out. Anything from 6 minutes before up to the start time counts, and the
 * `startingSoonSentAt` flag stops a second tick inside that window sending it
 * twice.
 */
const STARTING_SOON_MAX_MIN = 6;
const STARTING_SOON_MIN_MIN = -1; // a minute late still counts as "now"

/**
 * The clinic's UTC offset, in minutes. Asia/Karachi is UTC+5 and observes no
 * daylight saving.
 *
 * Appointment `date` and `time` are stored as the clinic's wall clock — what
 * the patient was shown when they booked. The server runs in UTC, so parsing
 * "2026-08-21T14:00:00" there would read 14:00 as UTC and put the appointment
 * five hours out of place. A day-before reminder survives that; a five-minute
 * one is simply wrong, which is why this is explicit.
 */
const CLINIC_UTC_OFFSET_MIN = 5 * 60;

/** Firestore caps a batch at 500 writes; stay clear of the edge. */
const BATCH_LIMIT = 400;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Turns the clinic's wall-clock date + time into a real instant. */
function appointmentInstant(date?: string, time?: string): Date | null {
  if (!date || !time) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - CLINIC_UTC_OFFSET_MIN * 60_000);
}

/** Human-readable "21 Aug 2026 at 14:00", in the clinic's own time. */
function readableWhen(a: Appointment) {
  return `${a.date} at ${a.time}`;
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
  const cutoff = new Date(now.getTime() + DAY_AHEAD_MS);

  try {
    // Yesterday through tomorrow. Yesterday is included because the clinic is
    // ahead of UTC: just after midnight in Lahore it is still "yesterday" by
    // the server's calendar, and an appointment early in the Lahore morning
    // would otherwise fall outside the range and never be reminded.
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const snap = await adminDb
      .collection("appointments")
      .where("status", "==", "confirmed")
      .where("date", ">=", isoDate(yesterday))
      .where("date", "<=", isoDate(cutoff))
      .get();

    const rows = snap.docs.map((d) => d.data() as Appointment);

    const dayBefore: Appointment[] = [];
    const startingSoon: Appointment[] = [];

    for (const a of rows) {
      const when = appointmentInstant(a.date, a.time);
      if (!when) continue;

      const minutesAway = (when.getTime() - now.getTime()) / 60_000;

      if (
        !a.startingSoonSentAt &&
        minutesAway <= STARTING_SOON_MAX_MIN &&
        minutesAway >= STARTING_SOON_MIN_MIN
      ) {
        startingSoon.push(a);
        continue; // never both in the same tick
      }

      if (!a.reminderSentAt && minutesAway > STARTING_SOON_MAX_MIN && when <= cutoff) {
        dayBefore.push(a);
      }
    }

    if (dayBefore.length === 0 && startingSoon.length === 0) {
      return NextResponse.json({ ok: true, dayBefore: 0, startingSoon: 0 });
    }

    // Fan out concurrently rather than one appointment at a time — a run with
    // 40 due reminders would otherwise make dozens of sequential round trips
    // and could outlive the function's timeout.
    await Promise.all([
      // ---- 24 hours before: the patient, and only the patient ----
      ...dayBefore.map((a) =>
        notify({
          userId: a.patientId,
          role: "patient",
          type: "appointment-reminder",
          title: "Your appointment is tomorrow",
          message:
            `${a.service} on ${readableWhen(a)}` +
            (a.doctorName ? ` with Dr. ${a.doctorName}` : "") +
            ". We'll see you then.",
          appointmentId: a.id,
        })
      ),

      // ---- ~5 minutes before: everyone who has something to do ----
      ...startingSoon.map((a) =>
        Promise.all([
          notify({
            userId: a.patientId,
            role: "patient",
            type: "appointment-starting-soon",
            title: "Your appointment starts in a few minutes",
            message:
              `${a.service} at ${a.time}` +
              (a.doctorName ? ` with Dr. ${a.doctorName}` : "") +
              (a.consultMode === "online"
                ? " — open your dashboard to join."
                : " — please head to the clinic."),
            appointmentId: a.id,
          }),
          a.doctorId
            ? notify({
                userId: a.doctorId,
                role: "doctor",
                type: "appointment-starting-soon",
                title: "Session starting in a few minutes",
                message: `${a.patientName} — ${a.service} at ${a.time}.`,
                appointmentId: a.id,
              })
            : Promise.resolve(),
          notifyAllAdmins({
            type: "appointment-starting-soon",
            title: "Session starting now",
            message: a.doctorName
              ? `Dr. ${a.doctorName} has an appointment with ${a.patientName} at ${a.time} — ${a.service}.`
              : `${a.patientName} has a ${a.service} appointment at ${a.time}, with no doctor assigned.`,
            appointmentId: a.id,
          }),
        ])
      ),
    ]);

    // Stamp them so the next tick doesn't re-notify. Written after the
    // notifications, so a failure here means someone gets a duplicate rather
    // than none at all — the safer direction to fail.
    const stamps: { id: string; field: "reminderSentAt" | "startingSoonSentAt" }[] = [
      ...dayBefore.map((a) => ({ id: a.id, field: "reminderSentAt" as const })),
      ...startingSoon.map((a) => ({ id: a.id, field: "startingSoonSentAt" as const })),
    ];

    const stampedAt = new Date().toISOString();
    for (let i = 0; i < stamps.length; i += BATCH_LIMIT) {
      const batch = adminDb.batch();
      for (const s of stamps.slice(i, i + BATCH_LIMIT)) {
        batch.update(adminDb.collection("appointments").doc(s.id), {
          [s.field]: stampedAt,
        });
      }
      await batch.commit();
    }

    return NextResponse.json({
      ok: true,
      dayBefore: dayBefore.length,
      startingSoon: startingSoon.length,
    });
  } catch (err) {
    console.error("[GET /api/notifications/reminders]", err);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
