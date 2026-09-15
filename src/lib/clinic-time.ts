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

/**
 * Reads a stored time into hours and minutes.
 *
 * Accepts "14:45", "9:00", "2:45 PM" and "2:45pm", because all of these have
 * turned up in the data. The unpadded form is the dangerous one: an admin
 * typing "2:45" into the slots box means a quarter to three in the afternoon,
 * and `new Date("2026-08-21T2:45")` is not 02:45 — it is Invalid Date, since
 * ISO 8601 requires two digits. Everything downstream then got null instead of
 * a time, which is why the join button stayed dead through the whole
 * appointment and the five-minute reminder never matched anything.
 *
 * Where there is no AM/PM this reads the number literally: "2:45" is 02:45.
 * That is wrong about what the clinic meant, and it is still the right thing to
 * do here — guessing "afternoon" would quietly move real appointments by twelve
 * hours, and a wrong time that looks deliberate is worse than one that looks
 * wrong. `normaliseClinicTime` is where the ambiguity gets settled, on the way
 * in, once.
 */
function parseTimeParts(time: string): { hh: number; mm: number } | null {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?$/i);
  if (!m) return null;

  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const suffix = m[3]?.toLowerCase().replace(/\./g, "");

  if (Number.isNaN(hh) || Number.isNaN(mm) || mm > 59) return null;

  if (suffix === "pm" && hh < 12) hh += 12;
  if (suffix === "am" && hh === 12) hh = 0;

  if (hh > 23) return null;
  return { hh, mm };
}

/**
 * Puts a time into the one format everything else can rely on: "HH:mm", 24-hour.
 *
 * Called on the way in, so unpadded and 12-hour values are settled once, at the
 * point where a person is still around to be told they got it wrong — rather
 * than by every reader afterwards, each guessing separately.
 *
 * Returns null for anything it can't read, so the caller can refuse it.
 */
export function normaliseClinicTime(time?: string): string | null {
  if (!time) return null;
  const parts = parseTimeParts(time);
  if (!parts) return null;
  return `${String(parts.hh).padStart(2, "0")}:${String(parts.mm).padStart(2, "0")}`;
}

/**
 * "14:45" as "2:45 PM" — how the clinic reads a time.
 *
 * Storage stays 24-hour, because that is the only form that sorts correctly,
 * compares correctly and can't be misread. Nobody in a clinic says "fourteen
 * forty-five", though, so the conversion happens at the edge, on the way to the
 * screen — one function, rather than each page inventing its own.
 */
export function formatClinicTime(time?: string): string {
  if (!time) return "";
  const parts = parseTimeParts(time);
  if (!parts) return time; // unrecognised: show it as stored rather than blank

  const suffix = parts.hh < 12 ? "AM" : "PM";
  const hour12 = parts.hh % 12 === 0 ? 12 : parts.hh % 12;
  return `${hour12}:${String(parts.mm).padStart(2, "0")} ${suffix}`;
}

/** The clinic's wall-clock date + time as a real instant. */
export function clinicInstant(date?: string, time?: string): Date | null {
  if (!date || !time) return null;

  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;

  const parts = parseTimeParts(time);
  if (!parts) return null;

  return new Date(
    Date.UTC(y, m - 1, d, parts.hh, parts.mm) - CLINIC_UTC_OFFSET_MIN * 60_000
  );
}

/**
 * Today's date in the clinic's own calendar, as "YYYY-MM-DD".
 *
 * Not `new Date().toISOString().slice(0,10)`, which is today *in UTC*. Between
 * midnight and 5am in Lahore those are different days, and the difference
 * shows up as the whole of today's schedule vanishing from the booking page
 * for five hours every night.
 */
export function clinicToday(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + CLINIC_UTC_OFFSET_MIN * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * True when this slot's start time has already gone by — or is so close that
 * offering it would be a promise the clinic cannot keep.
 *
 * ── Why a lead time and not simply "is it past" ──
 *
 * A patient arriving at 10:58 for an 11:00 slot has two minutes to read the
 * summary, type their name and finish a card payment. They will not make it,
 * and what they get instead is a payment that succeeds against a slot the
 * doctor is already sitting in. `leadMinutes` is how long the booking itself
 * plausibly takes; thirty is generous to the patient and still honest to the
 * doctor.
 *
 * Slots on a later date are never past, so the cheap string comparison runs
 * first and most calls stop there.
 */
export function isSlotPast(
  date: string,
  time: string,
  leadMinutes = 30,
  now: Date = new Date()
): boolean {
  const today = clinicToday(now);
  if (date > today) return false;
  if (date < today) return true;

  const at = clinicInstant(date, time);
  // An unreadable time is not evidence that the slot has gone. Hiding it would
  // silently remove a bookable appointment from the calendar over a formatting
  // problem, which is the more expensive mistake of the two.
  if (!at) return false;

  return at.getTime() - now.getTime() < leadMinutes * 60_000;
}
