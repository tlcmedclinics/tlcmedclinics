import { site } from "@/data/site";

/**
 * Turning "I do 30-minute sessions" into a list of start times.
 *
 * The slots form used to be a text box: the doctor typed
 * "11:00 AM, 11:30 AM, 12:00 PM, 12:30 PM…" by hand, every day, and a typo
 * either got rejected or — worse — got accepted as the wrong hour. The
 * information the doctor actually has is much smaller than that list: how long
 * a session takes, and which hours they are around. Everything else is
 * arithmetic, and arithmetic belongs here rather than in someone's head at
 * eight in the morning.
 *
 * Two rules the generated grid follows, both of which the typed list did not:
 *
 *   - A session must *finish* inside its window. A 60-minute session cannot
 *     start at 13:30 when the clinic closes at 14:00, so 13:30 is not offered.
 *   - Times step by the session length, so back-to-back sessions line up and
 *     no two overlap.
 *
 * In clinic, the windows are the clinic's own opening hours — the doctor is not
 * asked, because the answer is not theirs to give. Online, they set their own
 * range: telemedicine runs later than the building is open, and that is the
 * whole point of it.
 */

/** The session lengths the form offers. */
export const SESSION_LENGTHS = [15, 30, 45, 60] as const;
export type SessionLength = (typeof SESSION_LENGTHS)[number];

export type TimeWindow = { opens: string; closes: string };

/** "14:45" → 885. Null for anything that isn't a 24-hour clock time. */
export function toMinutes(hhmm: string): number | null {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

/** 885 → "14:45". Always two digits, because everything downstream sorts on it. */
export function toHHmm(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * The weekday of a "YYYY-MM-DD" date, as a name.
 *
 * Built through Date.UTC rather than `new Date("2026-08-25")` so the answer
 * does not depend on the timezone of whichever machine is asking. A date-only
 * string is parsed as UTC midnight, which in Karachi is already 5am the same
 * day — fine — but the local-time constructors are not consistent about it.
 */
export function weekdayOf(date: string): string | null {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  return DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/**
 * The clinic's opening windows on a given date.
 *
 * Empty on a Sunday, which is correct and worth surfacing rather than
 * silently producing no times.
 */
export function clinicWindowsFor(date: string): TimeWindow[] {
  const day = weekdayOf(date);
  if (!day) return [];
  return site.openingHours
    .filter((h) => h.days.includes(day))
    .map((h) => ({ opens: h.opens, closes: h.closes }));
}

/** The default range for an online day — later than the building is open. */
export const TELEMEDICINE_WINDOW: TimeWindow = {
  opens: site.telemedicineWindow?.opens ?? "11:00",
  closes: site.telemedicineWindow?.closes ?? "21:30",
};

/**
 * Start times across the given windows, one every `stepMinutes`.
 *
 * A start is only offered if the whole session fits before the window closes.
 * Sorted and de-duplicated, so two overlapping windows can be passed in without
 * the caller having to merge them first.
 */
export function buildTimeGrid(windows: TimeWindow[], stepMinutes: number): string[] {
  if (!Number.isFinite(stepMinutes) || stepMinutes <= 0) return [];

  const out = new Set<string>();
  for (const w of windows) {
    const start = toMinutes(w.opens);
    const end = toMinutes(w.closes);
    if (start === null || end === null || end <= start) continue;

    // `+ stepMinutes <= end` is the whole rule: the session has to finish
    // inside the window, not merely begin inside it.
    for (let t = start; t + stepMinutes <= end; t += stepMinutes) {
      out.add(toHHmm(t));
    }
  }
  return [...out].sort();
}

/** Two sessions clash if either one starts before the other has finished. */
export function overlaps(
  aStart: string,
  aMinutes: number,
  bStart: string,
  bMinutes: number
): boolean {
  const a = toMinutes(aStart);
  const b = toMinutes(bStart);
  if (a === null || b === null) return false;
  return a < b + bMinutes && b < a + aMinutes;
}

/**
 * The subset of `candidates` that would clash with something already booked or
 * open on that day.
 *
 * A doctor cannot be in the clinic and on a video call at the same time, so
 * this deliberately ignores mode: an in-clinic slot at 11:00 blocks an online
 * one at 11:00 as surely as it blocks another in-clinic one.
 */
export function clashingTimes(
  candidates: string[],
  stepMinutes: number,
  existing: { time: string; durationMinutes?: number }[]
): Set<string> {
  const clashes = new Set<string>();
  for (const candidate of candidates) {
    for (const slot of existing) {
      if (overlaps(candidate, stepMinutes, slot.time, slot.durationMinutes || 30)) {
        clashes.add(candidate);
        break;
      }
    }
  }
  return clashes;
}

/** "11:00 – 11:30" — what one generated slot covers, for the chip's tooltip. */
export function windowLabel(start: string, stepMinutes: number): string {
  const s = toMinutes(start);
  if (s === null) return start;
  return `${start} – ${toHHmm(s + stepMinutes)}`;
}
