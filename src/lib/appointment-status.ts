import type { AppointmentStatus } from "@/types";

/**
 * The badge colours for an appointment's status, in one place.
 *
 * These used to be copied into four screens — patient dashboard, doctor
 * appointments, admin appointments, the doctor's patient detail page — each
 * typed `Record<AppointmentStatus, string>`. That typing is what saves it:
 * adding a status breaks all four at compile time rather than at runtime. But
 * "fix the same map in four files" is a step that gets done three times, and
 * the fourth screen then renders a badge with no colour at all.
 *
 * Amber for awaiting-payment is deliberate. It is the only status where someone
 * outside the clinic has to act, and it should not read as calmly as the ones
 * where nobody does.
 */
export const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-mist text-ink-soft",
  "awaiting-payment": "bg-amber-100 text-amber-800",
  confirmed: "bg-indigo/10 text-indigo",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-crimson/10 text-crimson-deep",
};

/**
 * Clinic-facing wording — what admin and doctors see.
 *
 * Dictionary keys rather than sentences, because the clinic's own staff read
 * these screens in Urdu too. The map still has to be a
 * `Record<AppointmentStatus, string>`: that is what makes adding a status a
 * compile error in all four screens at once rather than a badge with no label
 * on the one screen nobody opened this week.
 *
 * Both waiting states say who is being waited on, because that is the only
 * thing anyone reads a status list to find out.
 */
export const APPOINTMENT_STATUS_LABEL_KEYS: Record<AppointmentStatus, string> = {
  pending: "status.callBackNeeded",
  "awaiting-payment": "status.awaitingPayment",
  confirmed: "status.confirmed",
  completed: "status.completed",
  cancelled: "status.cancelled",
};
