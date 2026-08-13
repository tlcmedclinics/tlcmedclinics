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

// Stripe doesn't settle in PKR for Pakistan-registered accounts (see README),
// so the checkout amount is charged in this currency instead. Override with
// PAYMENT_CURRENCY in .env.local once you know which currency your Stripe/PayPal
// accounts actually settle in. Defaults to USD.
export const PAYMENT_CURRENCY = (process.env.PAYMENT_CURRENCY || "usd").toLowerCase();

// PKR -> smallest-unit amount in PAYMENT_CURRENCY. This is a placeholder 1:1-ish
// passthrough (treats the PKR number as the charge amount in the target currency)
// so the flow is fully wired end to end; swap in a real conversion rate (or have
// the booking form collect the amount directly in PAYMENT_CURRENCY) before going live.
export function toMinorUnits(amountPkr: number): number {
  return Math.round(Math.max(amountPkr, 0) * 100);
}

/** Refunds a completed Stripe payment by its payment_intent id (what we store
 *  as an appointment's paymentReference for the "card" provider). */
export async function refundStripePayment(paymentIntentId: string) {
  const stripe = getStripe();
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}
