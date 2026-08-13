import type { Appointment } from "@/types";

// How early a patient/admin can join before the scheduled time on their own,
// without the admin manually starting it early.
const AUTO_JOIN_LEAD_MINUTES = 5;

export function getScheduledDateTime(appointment: Appointment): Date | null {
  if (!appointment.date || !appointment.time) return null;
  const iso = `${appointment.date}T${appointment.time}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Whether the session can be joined right now.
 * - Only applies to video/chat appointments that are confirmed and not cancelled.
 * - True once the admin has manually started it (sessionStatus === "live"),
 *   whether that was early or late.
 * - Otherwise true automatically once we're within AUTO_JOIN_LEAD_MINUTES of
 *   the scheduled time (the "right time" case) — from then on it stays
 *   joinable (late is fine too) until the session is ended.
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
  if (appointment.sessionStatus === "ended") return "Session ended";
  if (appointment.sessionStatus === "live") return "Live now";

  const mins = minutesUntil(appointment, now);
  if (mins === null) return "Scheduled";
  if (mins <= 5) return "Starting soon";
  if (mins < 60) return `Starts in ${mins} min`;
  const hrs = Math.round(mins / 60);
  return `Starts in ${hrs}h`;
}
