/**
 * The payment gateways this clinic can take money through.
 *
 * Stripe and PayPal are both in this codebase and neither is usable: neither
 * will onboard a merchant registered in Pakistan, so the card button on the
 * booking page can only ever have worked against a foreign account. The three
 * below are the ones a Lahore clinic can actually hold — JazzCash and EasyPaisa
 * for mobile wallets, Safepay for cards.
 *
 * Everything here is deliberately uniform. Each gateway is a module exporting
 * the same two functions, and the booking flow talks to *this* file rather than
 * to any of them, so adding a fourth is a new module and one line in the list —
 * not another button, another route and another success page.
 *
 * A gateway with no credentials in the environment is not "broken", it is
 * simply not switched on: `enabledGateways()` reports only the ones that are
 * configured, and the booking page shows only those. That means the clinic can
 * go live with JazzCash on the day JazzCash approves them, and add cards a
 * month later, with no deploy in between beyond setting the variables.
 */

export type GatewayId = "jazzcash" | "easypaisa" | "safepay";

/**
 * What the browser must do to hand the patient over to the gateway.
 *
 * JazzCash and EasyPaisa are both HTML form posts — a set of hidden fields
 * submitted to their URL — because that is the only flow they document for a
 * hosted page. Safepay hands back a URL. The client component that receives
 * this does not need to know which gateway it is talking to.
 */
export type Handover =
  | { kind: "form"; action: string; fields: Record<string, string> }
  | { kind: "url"; url: string };

export type StartArgs = {
  /** Our own id for this payment. Comes back with the gateway's answer. */
  reference: string;
  /** Whole rupees. Each gateway converts to whatever unit it wants. */
  amountPkr: number;
  description: string;
  /** Where the gateway sends the patient's browser afterwards. */
  returnUrl: string;
  customer?: { email?: string; phone?: string; name?: string };
};

export type CallbackResult = {
  /** True only when the gateway said paid *and* the signature checked out. */
  ok: boolean;
  /** Our reference, read back out of the gateway's response. */
  reference: string;
  /** The gateway's own transaction id, stored for reconciliation. */
  gatewayReference?: string;
  /** Safe to show a patient. */
  message: string;
};

export type GatewayMeta = {
  id: GatewayId;
  label: string;
  /** One line under the button. */
  blurb: string;
  /** Which env variables have to be set for this gateway to appear. */
  requires: string[];
};

export const GATEWAYS: GatewayMeta[] = [
  {
    id: "jazzcash",
    label: "JazzCash",
    blurb: "Pay from your JazzCash mobile wallet.",
    requires: ["JAZZCASH_MERCHANT_ID", "JAZZCASH_PASSWORD", "JAZZCASH_INTEGRITY_SALT"],
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    blurb: "Pay from your EasyPaisa mobile account.",
    requires: ["EASYPAISA_STORE_ID", "EASYPAISA_HASH_KEY"],
  },
  {
    id: "safepay",
    label: "Debit or credit card",
    blurb: "Visa, Mastercard and UnionPay, secured by Safepay.",
    requires: ["SAFEPAY_API_KEY", "SAFEPAY_SECRET_KEY"],
  },
];

/**
 * Gateways switched off by hand, whatever their credentials say.
 *
 * `PAYMENTS_DISABLED=safepay,jazzcash`. Deleting the credentials would also
 * work, and is worse: a gateway that starts misbehaving needs turning off in
 * one line at three in the afternoon, not a hunt for where the keys were
 * written down so they can be pasted back tomorrow.
 */
function disabledIds(): string[] {
  return (process.env.PAYMENTS_DISABLED ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True when every variable that gateway needs is set, and it isn't switched off. */
export function isConfigured(id: string): boolean {
  if (disabledIds().includes(id)) return false;
  const meta = GATEWAYS.find((g) => g.id === id);
  if (!meta) return false;
  return meta.requires.every((key) => Boolean(process.env[key]?.trim()));
}

/**
 * Stripe, listed alongside the local gateways but reached by a different road.
 *
 * It is not in GATEWAYS because it is not one of them: the three above are
 * redirect gateways this codebase drives itself, while Stripe has its own
 * route, its own success page and its own verify call, all of which already
 * work. Bending it into the same shape would mean rewriting a working payment
 * path to look tidy, and payment paths are the last place to trade working for
 * tidy.
 *
 * One thing to be clear about, because it will matter later: Stripe does not
 * pay out to a merchant registered in Pakistan. On test keys the whole flow
 * runs end to end, which is genuinely useful for building and demonstrating
 * the site. Real money still needs one of the local three.
 */
export const STRIPE_METHOD = {
  id: "stripe",
  label: "Debit or credit card",
  blurb: "Visa and Mastercard, processed by Stripe.",
  requires: ["STRIPE_SECRET_KEY"],
} as const;

export function isStripeConfigured(): boolean {
  if (disabledIds().includes("stripe")) return false;
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/**
 * The gateways the patient should be offered.
 *
 * Called on the server only — `process.env` is empty in the browser for
 * anything without the NEXT_PUBLIC_ prefix, and these must never carry it.
 * The booking page asks /api/payments/methods instead.
 */
export function enabledGateways(): GatewayMeta[] {
  return GATEWAYS.filter((g) => isConfigured(g.id));
}

/** Live or sandbox. Everything defaults to sandbox — going live is a decision. */
export function isLive(): boolean {
  return process.env.PAYMENTS_MODE === "live";
}

/**
 * A reference the gateways will accept and we can still recognise.
 *
 * JazzCash rejects anything with punctuation in `pp_TxnRefNo`, and EasyPaisa's
 * `orderRefNum` has to be unique forever — a repeat is refused outright, which
 * is why the timestamp is in there and not just the id.
 */
export function paymentReference(prefix: string, id: string): string {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return `${prefix}${stamp}${clean}`;
}
