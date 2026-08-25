import { createCipheriv } from "crypto";
import type { CallbackResult, Handover, StartArgs } from "@/lib/gateways";

/**
 * EasyPaisa, over their hosted checkout ("Easypay").
 *
 * Same shape as JazzCash — a signed form post out, a result posted back — with
 * one genuine difference worth knowing about: EasyPaisa does not sign the
 * request with an HMAC. It encrypts it. `merchantHashedReq` is the request
 * parameters, sorted and joined, run through AES-128-ECB with the store's hash
 * key and base64-encoded. Anyone reading this expecting a digest will be
 * confused for a while, so: it is a cipher, not a hash, whatever the field is
 * called.
 *
 * ── The part that needs checking against your own guide ──
 * EasyPaisa issue a 16-character hash key to some merchants and a 32-character
 * one to others, which selects AES-128 or AES-256. `encryptRequest` picks by
 * key length, so both work — but if the sandbox rejects the request, that
 * function and the field list in `startPayment` are the two places to compare
 * against the integration guide that comes with the credentials.
 *
 * The response is *not* encrypted, and EasyPaisa do not sign it either. That is
 * their design, not an omission here, and it is why `verifyCallback` treats the
 * posted result as a claim rather than as proof — see the note there.
 */

const SANDBOX_URL = "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf";
const LIVE_URL = "https://easypay.easypaisa.com.pk/easypay/Index.jsf";

/** "yyyyMMdd HHmmss" in Pakistan Standard Time — EasyPaisa's expiry format. */
function expiryStamp(at: Date): string {
  const pkt = new Date(at.getTime() + 5 * 60 * 60 * 1000).toISOString();
  const [date, time] = pkt.split("T");
  return `${date.replace(/-/g, "")} ${time.slice(0, 8).replace(/:/g, "")}`;
}

/**
 * AES-ECB over "key1=value1&key2=value2", keys sorted.
 *
 * ECB is a weak mode and would be the wrong choice for anything we were
 * designing. It is what EasyPaisa specify, and both sides have to agree, so
 * this is a compatibility requirement rather than a recommendation. It is not
 * protecting the parameters — they are also posted in the clear alongside it —
 * it is proving the request came from someone holding the store's key.
 */
export function encryptRequest(params: Record<string, string>, hashKey: string): string {
  const message = Object.keys(params)
    .filter((k) => k !== "merchantHashedReq")
    .sort()
    .filter((k) => String(params[k] ?? "").length > 0)
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const key = Buffer.from(hashKey, "utf8");
  const algorithm =
    key.length === 32 ? "aes-256-ecb" : key.length === 24 ? "aes-192-ecb" : "aes-128-ecb";

  const cipher = createCipheriv(algorithm, key, null);
  cipher.setAutoPadding(true); // PKCS#7, which is what their samples use
  return Buffer.concat([cipher.update(message, "utf8"), cipher.final()]).toString("base64");
}

export function startPayment(args: StartArgs): Handover {
  const storeId = process.env.EASYPAISA_STORE_ID!.trim();
  const hashKey = process.env.EASYPAISA_HASH_KEY!.trim();

  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  const params: Record<string, string> = {
    storeId,
    // Rupees with one decimal — "3000.0", not "300000" and not "3,000". This
    // is the opposite convention to JazzCash, which is exactly the sort of
    // detail that costs an afternoon if the two are written from memory.
    amount: args.amountPkr.toFixed(1),
    postBackURL: args.returnUrl,
    orderRefNum: args.reference,
    expiryDate: expiryStamp(expiry),
    // 1 = go straight to EasyPaisa rather than showing their interstitial.
    autoRedirect: "1",
    // Blank lets the patient pick mobile account or card on EasyPaisa's page.
    paymentMethod: "",
    emailAddr: args.customer?.email ?? "",
    mobileNum: args.customer?.phone ?? "",
  };

  params.merchantHashedReq = encryptRequest(params, hashKey);

  return {
    kind: "form",
    action: process.env.PAYMENTS_MODE === "live" ? LIVE_URL : SANDBOX_URL,
    fields: params,
  };
}

/**
 * Reads EasyPaisa's answer.
 *
 * Read the caveat before trusting this. EasyPaisa post the result back
 * unsigned, so unlike JazzCash there is no cryptographic proof that the
 * browser delivering it is telling the truth — a determined person could hit
 * the callback URL with `status=0000` themselves.
 *
 * What stops that from becoming a free appointment is upstream, in the route:
 * the reference has to match a pendingBooking that this same server created
 * minutes earlier for this signed-in patient, at an amount the server set. So
 * a forged callback can only ever confirm a booking the patient had already
 * begun and could have paid for — not conjure one, and not change the price.
 *
 * That is a mitigation, not a signature. Before this gateway goes live the
 * clinic should turn on EasyPaisa's server-to-server IPN, which is signed, and
 * treat this browser callback as the redirect it is. Left as it stands, a
 * technically-minded patient can skip paying. Flagged loudly here rather than
 * left for someone to discover in the ledger.
 */
export function verifyCallback(params: Record<string, string>): CallbackResult {
  const reference = params.orderRefNum ?? "";
  const status = params.status ?? "";

  // "0000" is EasyPaisa's success code; "0001" is a duplicate order number.
  if (status !== "0000") {
    return {
      ok: false,
      reference,
      gatewayReference: params.transactionId || undefined,
      message: params.desc || "The payment was not completed.",
    };
  }

  return {
    ok: true,
    reference,
    gatewayReference: params.transactionId || undefined,
    message: "Payment received.",
  };
}
