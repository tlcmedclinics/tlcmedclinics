import { adminDb } from "@/lib/firebase/admin";
import type { Service } from "@/types";

/**
 * What a follow-up visit costs.
 *
 * One price for every follow-up, and it comes from a Service document so the
 * clinic can change it from the admin panel that already exists — no second
 * pricing screen, no redeploy to raise a fee.
 *
 * Which document: the first service whose category or name mentions "follow"
 * or "session". That is the same rule the patient-facing booking page already
 * uses to decide what counts as a follow-up service, kept deliberately
 * identical — two different definitions of "the follow-up service" would price
 * the same visit two ways depending on who booked it.
 *
 * FOLLOWUP_PRICE_PKR is the fallback for a clinic that hasn't created that
 * service yet. If neither exists this returns null rather than guessing: a
 * follow-up with an invented price is worse than one that refuses to be booked
 * until somebody says what it costs.
 */
export async function resolveFollowUpPrice(): Promise<number | null> {
  try {
    const snap = await adminDb.collection("services").get();

    const match = snap.docs
      .map((d) => d.data() as Service)
      .filter((s) => /follow|session/i.test(s.category ?? "") || /follow|session/i.test(s.name ?? ""))
      // Lowest `order` first, so the clinic controls which one wins by the same
      // ordering it already uses to arrange the services list.
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .find((s) => typeof s.price === "number" && s.price > 0);

    if (match?.price) return match.price;
  } catch (err) {
    // A Firestore failure here shouldn't decide the price — fall through to the
    // environment, and let the caller refuse if that's missing too.
    console.error("[resolveFollowUpPrice] could not read services", err);
  }

  const fromEnv = Number(process.env.FOLLOWUP_PRICE_PKR);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : null;
}

/** How long a follow-up slot stays held while waiting for the patient to pay. */
export const FOLLOW_UP_PAYMENT_WINDOW_HOURS = 24;
