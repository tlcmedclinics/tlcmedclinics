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
