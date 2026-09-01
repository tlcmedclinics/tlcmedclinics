"use client";

import type { Appointment } from "@/types";
import { formatClinicTime } from "@/lib/clinic-time";

/**
 * Everything that has happened to one appointment, oldest first.
 *
 * Built from the appointment document rather than a separate audit collection.
 * Every event worth showing already leaves a timestamp on the doc — createdAt,
 * paidAt, sessionStartedAt, prescribedAt, ratedAt, cancelledAt and the rest —
 * so the history is a reading of data that was always there, not a new thing to
 * keep in step. A parallel log could drift from the appointment it describes;
 * this cannot.
 *
 * The same list for patient, doctor and admin, because disagreeing about what
 * happened is exactly the argument this is meant to settle. Only `showInternal`
 * differs: reminder deliveries are operational noise for a patient and the
 * first thing the clinic wants when someone says they were never told.
 */

type Event = {
  at: string;
  label: string;
  detail?: string;
};

function push(events: Event[], at: string | undefined, label: string, detail?: string) {
  if (!at) return;
  const ms = Date.parse(at);
  if (Number.isNaN(ms)) return; // a malformed timestamp shouldn't blank the list
  events.push({ at, label, detail });
}

const BOOKED_BY: Record<Appointment["bookingType"], string> = {
  "online-payment": "Booked and paid online",
  "call-back": "Booked — clinic to call back",
  "doctor-request": "Requested — no doctor available yet",
  "follow-up": "Held by the doctor as a follow-up",
};

export function buildAppointmentHistory(a: Appointment, showInternal: boolean): Event[] {
  const events: Event[] = [];

  push(
    events,
    a.createdAt,
    BOOKED_BY[a.bookingType] ?? "Booked",
    a.doctorName ? `with Dr. ${a.doctorName.replace(/^Dr\.?\s*/i, "")}` : "no doctor assigned yet"
  );

  if (a.followUpOf) {
    push(events, a.createdAt, "Scheduled from a previous visit");
  }

  push(
    events,
    a.paidAt,
    `Paid — PKR ${a.amount}`,
    a.paymentProvider ? `via ${a.paymentProvider}` : undefined
  );

  if (a.rescheduledFrom) {
    push(
      events,
      a.rescheduledFrom.at,
      "Rescheduled",
      `from ${a.rescheduledFrom.date} ${formatClinicTime(a.rescheduledFrom.time)}, by ${a.rescheduledFrom.by}`
    );
  }

  if (showInternal) {
    push(events, a.reminderSentAt, "Day-before reminder sent", "to the patient");
    push(events, a.startingSoonSentAt, "Starting-soon reminder sent", "to patient, doctor and clinic");
  }

  push(events, a.sessionStartedAt, "Session started");
  push(events, a.sessionEndedAt, "Session ended");
  push(events, a.prescribedAt, "Prescription issued");
  push(
    events,
    a.ratedAt,
    a.rating ? `Rated ${a.rating.toFixed(1)}/5` : "Rated",
    a.ratingComment || undefined
  );
  push(
    events,
    a.cancelledAt,
    `Cancelled${a.cancelledBy ? ` by ${a.cancelledBy}` : ""}`,
    a.cancelReason || undefined
  );
  push(events, a.refundProcessedAt, "Refund processed");

  return events.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentHistory({
  appointment,
  showInternal = false,
}: {
  appointment: Appointment;
  showInternal?: boolean;
}) {
  const events = buildAppointmentHistory(appointment, showInternal);

  // A hold that hasn't been paid or expired yet is a state, not a past event —
  // it belongs at the end of the list, where "what happens next" is.
  const pendingHold =
    appointment.status === "awaiting-payment" && appointment.paymentDueAt
      ? `Held until ${formatWhen(appointment.paymentDueAt)} — waiting for the patient to confirm`
      : null;

  return (
    // <details> rather than component state: collapsed by default so it doesn't
    // crowd the row, and every open one keeps working through a re-render, which
    // matters on lists that update live.
    <details className="mt-3 group">
      <summary className="cursor-pointer list-none text-xs font-medium text-ink-soft hover:text-ink">
        History<span className="ml-1 text-ink-soft/60">({events.length})</span>
        <span className="ml-1 inline-block transition-transform group-open:rotate-90">›</span>
      </summary>

      <ol className="mt-3 space-y-2 border-l border-line/70 pl-4">
        {events.length === 0 ? (
          <li className="text-xs text-ink-soft">Nothing recorded yet.</li>
        ) : (
          events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative text-xs">
              <span className="absolute -left-[1.3rem] top-1 h-1.5 w-1.5 rounded-full bg-line" />
              <span className="font-medium text-ink">{e.label}</span>
              {e.detail && <span className="text-ink-soft"> — {e.detail}</span>}
              <span className="block text-ink-soft/70">{formatWhen(e.at)}</span>
            </li>
          ))
        )}

        {pendingHold && (
          <li className="relative text-xs">
            <span className="absolute -left-[1.3rem] top-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-amber-800">{pendingHold}</span>
          </li>
        )}
      </ol>
    </details>
  );
}
