import { createHmac, timingSafeEqual } from "crypto";
import type { CallbackResult, Handover, StartArgs } from "@/lib/gateways";

/**
 * Safepay — card payments.
 *
 * This exists because Stripe and PayPal do not onboard Pakistani merchants,
 * and a clinic in Lahore still needs to take a Visa. Safepay is a Pakistani
 * acquirer that does, and it settles into a local bank account.
 *
 * Two steps rather than one: ask Safepay for a tracker token against an amount,
 * then send the patient to a checkout page carrying that token. The amount is
 * fixed at the first step, server to server, so nothing the browser does
 * between here and the card form can change what gets charged.
 *
 * Unlike the two wallet gateways, this one talks over HTTPS instead of posting
 * a form, so it returns a URL and can fail before the patient goes anywhere —
 * which is better, because a failure here is still on our page.
 */

const SANDBOX_API = "https://sandbox.api.getsafepay.com";
const LIVE_API = "https://api.getsafepay.com";
const SANDBOX_CHECKOUT = "https://sandbox.api.getsafepay.com/components";
const LIVE_CHECKOUT = "https://www.getsafepay.com/components";

const live = () => process.env.PAYMENTS_MODE === "live";

export async function startPayment(args: StartArgs): Promise<Handover> {
  const apiKey = process.env.SAFEPAY_API_KEY!.trim();
  const environment = live() ? "production" : "sandbox";

  const res = await fetch(`${live() ? LIVE_API : SANDBOX_API}/order/v1/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client: apiKey,
      amount: args.amountPkr,
      currency: "PKR",
      environment,
    }),
    // Safepay is quick, and a patient staring at a spinner needs an answer.
    // Without this the request can hang until the platform's own timeout,
    // by which point they have pressed the button three more times.
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[safepay] init failed", res.status, detail);
    throw new Error("Card payments are unavailable right now. Please try a wallet, or call the clinic.");
  }

  const body = (await res.json()) as { data?: { token?: string }; token?: string };
  const token = body.data?.token ?? body.token;
  if (!token) {
    console.error("[safepay] init returned no token", body);
    throw new Error("Card payments are unavailable right now. Please try a wallet, or call the clinic.");
  }

  const url = new URL(live() ? LIVE_CHECKOUT : SANDBOX_CHECKOUT);
  url.searchParams.set("env", environment);
  url.searchParams.set("beacon", token);
  url.searchParams.set("source", "custom");
  url.searchParams.set("order_id", args.reference);
  url.searchParams.set("redirect_url", args.returnUrl);
  // Cancelling has to land somewhere that releases the slot, not on the
  // booking form with the time still held.
  url.searchParams.set("cancel_url", `${args.returnUrl}?cancelled=1`);

  return { kind: "url", url: url.toString() };
}

function matches(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Verifies the signature Safepay appends on the way back.
 *
 * HMAC-SHA256 over the tracker token, keyed with the account's secret. The
 * secret never leaves this server, so a browser cannot produce a valid
 * signature for a tracker it invented.
 */
export function verifyCallback(params: Record<string, string>): CallbackResult {
  const secret = process.env.SAFEPAY_SECRET_KEY!.trim();
  const tracker = params.tracker ?? "";
  const signature = params.sig ?? params.signature ?? "";
  const reference = params.order_id ?? "";

  if (!tracker || !signature) {
    return { ok: false, reference, message: "That payment could not be verified." };
  }

  const expected = createHmac("sha256", secret).update(tracker, "utf8").digest("hex");
  if (!matches(signature, expected)) {
    console.error("[safepay] signature mismatch for", reference);
    return {
      ok: false,
      reference,
      message: "We could not verify that payment — please contact the clinic before trying again.",
    };
  }

  return {
    ok: true,
    reference,
    gatewayReference: params.reference_code || tracker,
    message: "Payment received.",
  };
}
