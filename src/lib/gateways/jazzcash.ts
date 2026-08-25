import { createHmac, timingSafeEqual } from "crypto";
import type { CallbackResult, Handover, StartArgs } from "@/lib/gateways";

/**
 * JazzCash, over the hosted "Page Redirection" flow.
 *
 * The patient's browser posts a signed form to JazzCash, pays there, and
 * JazzCash posts the result back to our return URL. No card or wallet details
 * ever touch this server, which is the point: it keeps the clinic out of PCI
 * scope entirely, and it is the only flow JazzCash will approve a small
 * merchant for without an audit.
 *
 * There is no SDK. JazzCash's own integration kits are PHP and .NET samples,
 * so this is written against the field list in their sandbox documentation —
 * about sixty lines, which is less than wrapping someone else's wrapper.
 *
 * ── If the sandbox answers "secure hash mismatch" ──
 * `secureHash` below is the only thing to look at. JazzCash has shipped more
 * than one hashing rule across versions, and which one an account gets is
 * decided by the account manager who onboards it, not by anything visible from
 * here. The rule implemented is the documented v2.0 one: every non-empty
 * pp_/ppmpf_ field, sorted by field name, values joined with "&", the integrity
 * salt in front, HMAC-SHA256 keyed with that same salt, hex. Compare it against
 * the guide that arrives with the credentials before changing anything else.
 */

const SANDBOX_URL =
  "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
const LIVE_URL =
  "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

/** JazzCash timestamps are yyyyMMddHHmmss in Pakistan Standard Time. */
function stamp(at: Date): string {
  // PKT is UTC+5 year-round — no daylight saving to account for. Built by
  // shifting the instant rather than by asking the server what time it thinks
  // it is, because the server is on UTC and JazzCash rejects a transaction
  // dated five hours in the past.
  const pkt = new Date(at.getTime() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().replace(/\D/g, "").slice(0, 14);
}

/**
 * The v2.0 secure hash.
 *
 * Only non-empty fields take part — an empty `pp_SubMerchantID` contributes
 * nothing, and including it as a bare "&" is the single most common reason an
 * otherwise correct integration is rejected.
 */
export function secureHash(fields: Record<string, string>, salt: string): string {
  const ordered = Object.keys(fields)
    .filter((k) => k !== "pp_SecureHash")
    .sort()
    .map((k) => fields[k])
    .filter((v) => v !== undefined && v !== null && String(v).length > 0);

  const message = `${salt}&${ordered.join("&")}`;
  return createHmac("sha256", salt).update(message, "utf8").digest("hex").toUpperCase();
}

export function startPayment(args: StartArgs): Handover {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID!.trim();
  const password = process.env.JAZZCASH_PASSWORD!.trim();
  const salt = process.env.JAZZCASH_INTEGRITY_SALT!.trim();

  const now = new Date();
  // An hour to pay. Long enough for a patient who has to find their phone,
  // short enough that an abandoned checkout releases the slot the same morning.
  const expiry = new Date(now.getTime() + 60 * 60 * 1000);

  const fields: Record<string, string> = {
    pp_Version: "2.0",
    // Blank means "let the patient choose on JazzCash's page" — wallet or card.
    // Setting "MWALLET" here would lock every payment to the wallet.
    pp_TxnType: "",
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_SubMerchantID: "",
    pp_Password: password,
    pp_BankID: "",
    pp_ProductID: "",
    pp_TxnRefNo: args.reference,
    // Paisa, as an integer. 3,000 rupees is "300000". A decimal point here is
    // rejected, and rounding rather than truncating avoids losing a rupee on
    // a discounted amount.
    pp_Amount: String(Math.round(args.amountPkr * 100)),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: stamp(now),
    pp_BillReference: args.reference,
    pp_Description: args.description.slice(0, 100),
    pp_TxnExpiryDateTime: stamp(expiry),
    pp_ReturnURL: args.returnUrl,
    // Pass-through fields: JazzCash hands these back untouched. The reference
    // is already in pp_TxnRefNo; the phone helps the clinic match a payment to
    // a patient when someone calls about one.
    ppmpf_1: args.customer?.phone ?? "",
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  fields.pp_SecureHash = secureHash(fields, salt);

  return {
    kind: "form",
    action: process.env.PAYMENTS_MODE === "live" ? LIVE_URL : SANDBOX_URL,
    fields,
  };
}

/** Constant-time compare, so a wrong hash leaks nothing through timing. */
function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a.toUpperCase(), "utf8");
  const right = Buffer.from(b.toUpperCase(), "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Reads JazzCash's answer.
 *
 * The signature check is not optional and not a formality. This route's URL is
 * public and the browser is the one delivering the result, so without it
 * anyone could post `pp_ResponseCode=000` and be handed a confirmed
 * appointment they never paid for.
 */
export function verifyCallback(params: Record<string, string>): CallbackResult {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT!.trim();
  const reference = params.pp_TxnRefNo ?? "";
  const claimed = params.pp_SecureHash ?? "";

  const expected = secureHash(params, salt);
  if (!claimed || !hashesMatch(claimed, expected)) {
    console.error("[jazzcash] secure hash mismatch for", reference);
    return {
      ok: false,
      reference,
      message: "We could not verify that payment. Nothing has been charged twice — please contact the clinic.",
    };
  }

  // "000" is success. "121" and "124" are the pending/insufficient-balance
  // family, which are failures as far as a booking is concerned.
  const code = params.pp_ResponseCode ?? "";
  if (code !== "000") {
    return {
      ok: false,
      reference,
      gatewayReference: params.pp_RetreivalReferenceNo || undefined,
      message: params.pp_ResponseMessage || "The payment was declined.",
    };
  }

  return {
    ok: true,
    reference,
    gatewayReference: params.pp_RetreivalReferenceNo || undefined,
    message: "Payment received.",
  };
}
