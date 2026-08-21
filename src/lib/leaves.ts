import { adminDb } from "@/lib/firebase/admin";
import type { Leave } from "@/types/slot";

/**
 * Days a doctor is away.
 *
 * Modelled as its own record rather than as a flag on slots, because leave is
 * about a stretch of time, not about the slots that happen to exist in it. A
 * doctor booking two weeks off wants those two weeks closed — including the
 * days they hadn't opened yet, which a per-slot flag can say nothing about.
 *
 * Slot creation checks this and refuses; taking leave removes the open slots in
 * that range. Between the two, a day off cannot quietly become bookable again.
 */

/**
 * The leave covering this date, if there is one.
 *
 * Dates are ISO "YYYY-MM-DD", which compare correctly as strings, so the range
 * test needs no parsing and cannot pick up a timezone on the way.
 *
 * Filtered in memory after a single-field query: a doctor has a handful of
 * leave records, and the two-range Firestore query this would otherwise need
 * (`from <= date` and `to >= date` on different fields) isn't allowed at all.
 */
export async function isOnLeave(
  doctorId: string | undefined,
  date: string | undefined
): Promise<Leave | null> {
  if (!doctorId || !date) return null;

  try {
    const snap = await adminDb.collection("leaves").where("doctorId", "==", doctorId).get();
    const match = snap.docs
      .map((d) => d.data() as Leave)
      .find((l) => l.from <= date && date <= l.to);
    return match ?? null;
  } catch (err) {
    // Never block slot creation because the leave lookup itself failed — a
    // clinic that can't add tomorrow's slots is worse than one that has to
    // remove a slot it shouldn't have made.
    console.error("[isOnLeave] lookup failed", err);
    return null;
  }
}

/** Every date from `from` to `to` inclusive, as ISO strings. */
export function datesInRange(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return out;

  // Guard rail: a typo like 2026 → 2126 would otherwise loop for a century.
  for (let d = start; d <= end && out.length < 400; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
