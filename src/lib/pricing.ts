import { adminDb } from "@/lib/firebase/admin";
import type { Coupon, Service } from "@/types";

/**
 * What a booking actually costs, worked out on the server.
 *
 * ── Why this exists ──
 *
 * `POST /api/payments/start` used to take the figure from the request body:
 *
 *     amount = Number(body.amount) || 0;
 *
 * That is the browser telling the server what to charge. A patient who opens
 * the network tab and changes 4000 to 1 gets a confirmed, *paid* appointment
 * for one rupee — and nothing downstream ever questions it, because by then
 * the number has been written into `paymentAttempts`, sent to the gateway, and
 * stamped on the appointment. It is not a bug that shows up in testing; it is
 * one that shows up in the accounts, months later.
 *
 * So the price comes from the service document, the discount from the coupon
 * document, and the browser's figure is used for exactly one thing: noticing
 * when the two disagree.
 *
 * ── On the coupon ──
 *
 * Checked here, not trusted: expiry, the active flag, the use count and — when
 * the clinic has restricted it — the email it was issued to. An expired or
 * spent code is ignored rather than refused, because the patient is mid-booking
 * and the honest outcome is "you pay the normal price", not a dead end. The
 * caller is told, so the page can say so.
 */
export type Quote = {
  /** Whole rupees, what the patient pays now. */
  amount: number;
  /** The full price before any discount, for showing alongside. */
  fullPrice: number;
  /** Applied only if the coupon survived every check. */
  couponCode?: string;
  discount: number;
  /** Set when a code was sent and could not be used. */
  couponRejected?: string;
};

export async function quoteBooking(args: {
  service: string;
  couponCode?: string;
  patientEmail?: string;
}): Promise<Quote> {
  // Services are keyed by name on the appointment, which is how the rest of
  // the codebase refers to them, so that is what is matched here.
  const snap = await adminDb
    .collection("services")
    .where("name", "==", args.service)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error("That service is no longer offered. Please pick another.");
  }

  const service = snap.docs[0].data() as Service;
  const fullPrice = Number(service.price) || 0;

  // `advancePayment` undefined means the full price is charged at booking;
  // a zero means nothing is taken now. Both are meaningful, so `??` and not
  // `||` — the difference between them is a free consultation.
  const payable = Number(service.advancePayment ?? service.price ?? 0) || 0;

  if (payable <= 0) {
    throw new Error("There is nothing to pay for this service online.");
  }

  const code = args.couponCode?.trim().toUpperCase();
  if (!code) {
    return { amount: payable, fullPrice, discount: 0 };
  }

  const couponSnap = await adminDb.collection("coupons").doc(code).get();
  const reject = (why: string): Quote => ({
    amount: payable,
    fullPrice,
    discount: 0,
    couponRejected: why,
  });

  if (!couponSnap.exists) return reject("That code was not recognised.");
  const coupon = couponSnap.data() as Coupon;

  if (!coupon.active) return reject("That code is no longer active.");
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now()) {
    return reject("That code has expired.");
  }
  if (coupon.maxUses > 0 && (coupon.usedCount ?? 0) >= coupon.maxUses) {
    return reject("That code has already been used the maximum number of times.");
  }
  if (coupon.restrictedEmails?.length) {
    const email = args.patientEmail?.trim().toLowerCase();
    const allowed = coupon.restrictedEmails.map((e) => e.trim().toLowerCase());
    if (!email || !allowed.includes(email)) {
      return reject("That code is not valid for this account.");
    }
  }

  const raw =
    coupon.discountType === "percent"
      ? (payable * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);

  // Never below zero, and never more than the amount itself — a flat discount
  // larger than the advance would otherwise produce a negative charge, which
  // some gateways accept and turn into a refund.
  const discount = Math.min(Math.max(Math.round(raw) || 0, 0), payable);

  return {
    amount: payable - discount,
    fullPrice,
    couponCode: code,
    discount,
  };
}
