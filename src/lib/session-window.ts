import type { Appointment } from "@/types";
import { clinicInstant } from "@/lib/clinic-time";

/**
 * How early the session opens on its own, in minutes before the scheduled time.
 *
 * Zero: the session becomes joinable at exactly the appointment's own time, and
 * nobody has to be asked to open it. Admin keeps a manual early start for the
 * cases that need judgement — a patient who turns up early, a doctor running
 * ahead — but that is an override, not the normal way in.
 */
const AUTO_JOIN_LEAD_MINUTES = 0;

export function getScheduledDateTime(appointment: Appointment): Date | null {
  // Via clinicInstant, not `new Date(date + "T" + time)`: that reads the time in
  // whatever timezone the code is running in, so the server (UTC) placed every
  // appointment five hours away from where it actually is. This function decides
  // whether a session can be joined *right now*, and it is called on the server
  // too — a five-hour error there means the join gate opens on the wrong side of
  // the appointment entirely.
  return clinicInstant(appointment.date, appointment.time);
}

/**
 * Whether the session can be joined right now.
 * - Only applies to video/chat appointments that are confirmed and not cancelled.
 * - True once someone has started it early (sessionStatus === "live").
 * - Otherwise true automatically from the scheduled time onwards, and it stays
 *   true (late is fine) until the session is ended.
 */
export function canJoinSession(appointment: Appointment, now: Date = new Date()): boolean {
  if (appointment.mode === "in-person") return false;
  if (appointment.status !== "confirmed") return false;
  if (appointment.sessionStatus === "ended") return false;
  if (appointment.sessionStatus === "live") return true;

  const scheduled = getScheduledDateTime(appointment);
  if (!scheduled) return false;

  const leadMs = AUTO_JOIN_LEAD_MINUTES * 60 * 1000;
  return now.getTime() >= scheduled.getTime() - leadMs;
}

export function minutesUntil(appointment: Appointment, now: Date = new Date()): number | null {
  const scheduled = getScheduledDateTime(appointment);
  if (!scheduled) return null;
  return Math.round((scheduled.getTime() - now.getTime()) / 60000);
}

/** Short human status line shown next to the join button. */
export function sessionStatusLabel(appointment: Appointment, now: Date = new Date()): string {
  if (appointment.mode === "in-person") return "In-person visit";
  if (appointment.status === "cancelled") return "Cancelled";
  if (appointment.status === "pending") return "Awaiting confirmation";
  if (appointment.status === "awaiting-payment") return "Awaiting patient payment";
  if (appointment.sessionStatus === "ended") return "Session ended";
  if (appointment.sessionStatus === "live") return "Live now";

  const mins = minutesUntil(appointment, now);
  if (mins === null) return "Scheduled";
  // Past the scheduled time the session is open — say so, rather than leaving
  // "Starting soon" next to a button that already works.
  if (mins <= 0) return "Ready to join";
  if (mins <= 5) return "Starting soon";
  if (mins < 60) return `Starts in ${mins} min`;
  const hrs = Math.round(mins / 60);
  return `Starts in ${hrs}h`;
}
