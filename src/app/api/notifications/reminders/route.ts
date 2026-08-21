import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { notify, notifyAllAdmins } from "@/lib/notifications";
import { clinicInstant } from "@/lib/clinic-time";
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

/** Firestore caps a batch at 500 writes; stay clear of the edge. */
const BATCH_LIMIT = 400;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Turns the clinic's wall-clock date + time into a real instant.
 *
 * Shared with the session join gate rather than defined twice — the two have to
 * agree about when an appointment is, and the timezone rule they both depend on
 * is the sort that gets fixed in one copy.
 */
const appointmentInstant = clinicInstant;

/** Human-readable "21 Aug 2026 at 14:00", in the clinic's own time. */
function readableWhen(a: Appointment) {
  return `${a.date} at ${a.time}`;
}

/**
 * Releases follow-up slots the patient never paid for.
 *
 * A doctor books a follow-up, which holds a slot and asks the patient to
 * confirm it. If they don't, that time has to come back — otherwise the
 * doctor's calendar fills with appointments nobody agreed to, and the slot is
 * invisible to every other patient for good.
 *
 * It rides on this cron rather than having its own because it needs to run
 * often and does almost nothing most of the time. The query is a single-field
 * `status ==`, so it needs no composite index of its own.
 */
async function expireUnpaidHolds(now: Date, dryRun: boolean): Promise<string[]> {
  const snap = await adminDb
    .collection("appointments")
    .where("status", "==", "awaiting-payment")
    .get();

  const lapsed = snap.docs
    .map((d) => d.data() as Appointment)
    .filter((a) => a.paymentDueAt && Date.parse(a.paymentDueAt) < now.getTime());

  if (dryRun || lapsed.length === 0) return lapsed.map((a) => a.id);

  for (const a of lapsed) {
    try {
      // Appointment and slot move together, or neither moves. A cancelled
      // appointment whose slot stayed "booked" would take that time out of
      // circulation permanently, with nothing left pointing at why.
      await adminDb.runTransaction(async (tx) => {
        const apptRef = adminDb.collection("appointments").doc(a.id);
        const fresh = (await tx.get(apptRef)).data() as Appointment | undefined;

        // Re-read inside the transaction: the patient may have paid in the time
        // between the query above and this write.
        if (!fresh || fresh.status !== "awaiting-payment") return;

        tx.update(apptRef, {
          status: "cancelled",
          cancelledBy: "admin",
          cancelReason: "Not confirmed in time — the held slot was released.",
          cancelledAt: new Date().toISOString(),
        });

        if (fresh.slotId) {
          const slotRef = adminDb.collection("slots").doc(fresh.slotId);
          const slotSnap = await tx.get(slotRef);
          if (slotSnap.exists) {
            tx.update(slotRef, { status: "available", appointmentId: FieldValue.delete() });
          }
        }
      });

      await Promise.all([
        notify({
          userId: a.patientId,
          role: "patient",
          type: "appointment-payment-expired",
          title: "Your held appointment was released",
          message: `${readableWhen(a)} wasn't confirmed in time, so the time has been released. You can book again whenever you're ready.`,
          appointmentId: a.id,
        }),
        a.doctorId
          ? notify({
              userId: a.doctorId,
              role: "doctor",
              type: "appointment-payment-expired",
              title: "Follow-up not confirmed",
              message: `${a.patientName} didn't confirm ${readableWhen(a)} — the slot is open again.`,
              appointmentId: a.id,
            })
          : Promise.resolve(),
      ]);
    } catch (err) {
      // One stuck appointment must not stop the rest, and must not stop the
      // reminders that run after this.
      console.error(`[reminders] could not expire hold on ${a.id}`, err);
    }
  }

  return lapsed.map((a) => a.id);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ?dry=1 works out what it *would* send and reports it, without notifying
  // anyone or stamping any flags.
  //
  // Worth having because "no reminder arrived" has several causes that look
  // identical from outside: the cron never ran, the appointment wasn't
  // confirmed, its date fell outside the query window, the flag was already
  // stamped by an earlier tick, or the query needs a composite index that
  // hasn't been deployed. A live run tells you none of that — and testing it
  // for real means waiting for an appointment to come within minutes of
  // starting, then having one chance to watch.
  const dryRun = req.nextUrl.searchParams.get("dry") === "1";

  const now = new Date();
  const cutoff = new Date(now.getTime() + DAY_AHEAD_MS);

  try {
    // Yesterday through tomorrow. Yesterday is included because the clinic is
    // ahead of UTC: just after midnight in Lahore it is still "yesterday" by
    // the server's calendar, and an appointment early in the Lahore morning
    // would otherwise fall outside the range and never be reminded.
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Before the reminders: a lapsed hold shouldn't get a "your appointment is
    // tomorrow" on its way out.
    const expired = await expireUnpaidHolds(now, dryRun);

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

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        serverTimeUtc: now.toISOString(),
        window: { from: isoDate(yesterday), to: isoDate(cutoff) },
        confirmedInWindow: rows.length,
        holdsThatWouldExpire: expired,
        wouldSend: {
          dayBefore: dayBefore.map((a) => a.id),
          startingSoon: startingSoon.map((a) => a.id),
        },
        // Every confirmed appointment the query returned, with the number that
        // actually decides its fate. If a reminder didn't go out, this row says
        // why: minutesAway outside the window, or a flag already stamped.
        candidates: rows.map((a) => ({
          id: a.id,
          date: a.date,
          time: a.time,
          patient: a.patientName,
          doctorId: a.doctorId ?? null,
          minutesAway: (() => {
            const when = appointmentInstant(a.date, a.time);
            return when ? Math.round((when.getTime() - now.getTime()) / 60_000) : null;
          })(),
          reminderSentAt: a.reminderSentAt ?? null,
          startingSoonSentAt: a.startingSoonSentAt ?? null,
        })),
      });
    }

    if (dayBefore.length === 0 && startingSoon.length === 0) {
      return NextResponse.json({
        ok: true,
        dayBefore: 0,
        startingSoon: 0,
        expiredHolds: expired.length,
      });
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
      expiredHolds: expired.length,
    });
  } catch (err) {
    console.error("[GET /api/notifications/reminders]", err);
    // The message is returned, not swallowed. This endpoint is already behind
    // CRON_SECRET, and the one failure that matters here — Firestore's
    // FAILED_PRECONDITION for a missing composite index — carries a link to
    // create that index. Hiding it behind "Failed to process reminders" turns a
    // two-minute fix into an afternoon, and the caller is a cron job whose
    // output nobody reads unless something is already wrong.
    return NextResponse.json(
      {
        error: "Failed to process reminders",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
