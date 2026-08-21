import Stripe from "stripe";

// Single shared Stripe client for the whole server. Throws at call time (not
// at import time) if the key is missing, so pages that don't touch payments
// still build/run fine without STRIPE_SECRET_KEY set.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  _stripe = new Stripe(key);
  return _stripe;
}

/**
 * The currency the card is actually charged in. Defaults to PKR, because that
 * is what every price in this app is quoted in.
 *
 * It used to default to USD while `toMinorUnits` passed the PKR number straight
 * through, so a PKR 1,500 consultation was charged as USD 1,500 — roughly two
 * hundred times the intended amount, with nothing on the checkout page looking
 * wrong. That was left as a deliberate placeholder to be swapped "before going
 * live"; the site went live first.
 */
export const PAYMENT_CURRENCY = (process.env.PAYMENT_CURRENCY || "pkr").toLowerCase();

/**
 * How many PKR make one unit of PAYMENT_CURRENCY.
 *
 * Only needed when the account settles in something other than PKR — Stripe
 * does not support PKR for every account, and some Pakistan-registered ones
 * have to charge in USD. Set PAYMENT_FX_RATE to the PKR-per-unit rate (e.g. 278
 * for USD) and the PKR price is converted before charging.
 */
const FX_RATE = Number(process.env.PAYMENT_FX_RATE);

/** Currencies Stripe expects as whole units — no minor unit to multiply by. */
const ZERO_DECIMAL = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);

/**
 * A PKR price as the smallest unit of PAYMENT_CURRENCY, ready for Stripe.
 *
 * Throws rather than guessing when the currency isn't PKR and no rate is set.
 * The alternative is what this replaced: quietly treating "1500" as 1500 of a
 * currency worth ~280× more. A checkout that refuses to open is a bad afternoon;
 * a checkout that overcharges a patient by two orders of magnitude is worse, and
 * only one of the two announces itself.
 */
export function toMinorUnits(amountPkr: number): number {
  const pkr = Math.max(amountPkr, 0);

  let amount = pkr;
  if (PAYMENT_CURRENCY !== "pkr") {
    if (!Number.isFinite(FX_RATE) || FX_RATE <= 0) {
      throw new Error(
        `PAYMENT_CURRENCY is "${PAYMENT_CURRENCY}" but PAYMENT_FX_RATE is not set. ` +
          `Set it to how many PKR make one ${PAYMENT_CURRENCY.toUpperCase()}, or set PAYMENT_CURRENCY=pkr.`
      );
    }
    amount = pkr / FX_RATE;
  }

  return ZERO_DECIMAL.has(PAYMENT_CURRENCY) ? Math.round(amount) : Math.round(amount * 100);
}

/** Refunds a completed Stripe payment by its payment_intent id (what we store
 *  as an appointment's paymentReference for the "card" provider). */
export async function refundStripePayment(paymentIntentId: string) {
  const stripe = getStripe();
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}
