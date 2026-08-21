/**
 * Appointment `date` and `time` are stored as the clinic's wall clock — the
 * numbers the patient was shown when they booked. They carry no timezone, so
 * turning them into a real instant needs one stated explicitly.
 *
 * Asia/Karachi is UTC+5 and observes no daylight saving, which is why a fixed
 * offset is honest here rather than a simplification.
 *
 * The alternative — `new Date("2026-08-21T14:00")` — is what this replaces, and
 * it is wrong in a way that hides: it means "14:00 wherever this code happens to
 * be running". In the patient's browser in Lahore that is right by accident. On
 * the server it is UTC, so every appointment reads five hours out of place, and
 * on a phone set to another timezone it is wrong by that much. Anything with a
 * tolerance wider than the error still looks fine, which is how this survives:
 * a day-before reminder shrugs it off, while "can this session be joined now?"
 * gets a five-hour-wrong answer from the same data.
 */
export const CLINIC_UTC_OFFSET_MIN = 5 * 60;

/** The clinic's wall-clock date + time as a real instant. */
export function clinicInstant(date?: string, time?: string): Date | null {
  if (!date || !time) return null;

  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;

  return new Date(Date.UTC(y, m - 1, d, hh, mm) - CLINIC_UTC_OFFSET_MIN * 60_000);
}
