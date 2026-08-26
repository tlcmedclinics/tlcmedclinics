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

/**
 * The checkout page the patient is sent to.
 *
 * Still overridable, because Safepay do not publish this in their own docs and
 * an account can be pointed elsewhere: set SAFEPAY_CHECKOUT_URL and the query
 * string below is appended to whatever you give it.
 *
 * The path took two goes. `/components` served Safepay's dashboard login — the
 * patient wasn't shown an error, just the wrong page, which is the hardest kind
 * of wrong to spot. `/embedded` is right: it renders their checkout shell, TEST
 * MODE badge and all.
 */
const SANDBOX_CHECKOUT =
  process.env.SAFEPAY_CHECKOUT_URL?.trim() || "https://sandbox.api.getsafepay.com/embedded";
const LIVE_CHECKOUT =
  process.env.SAFEPAY_CHECKOUT_URL?.trim() || "https://getsafepay.com/embedded";

const live = () => process.env.PAYMENTS_MODE === "live";

export async function startPayment(args: StartArgs): Promise<Handover> {
  const apiKey = process.env.SAFEPAY_API_KEY!.trim();
  const environment = live() ? "production" : "sandbox";

  // The request body Safepay's own PHP library sends. Four of these five
  // fields were wrong or missing on the first attempt — `client` instead of
  // `merchant_api_key`, no `intent`, no `mode` — and the failure that produced
  // was not an error from this call but "Unable to make request" on their
  // checkout page a moment later, which points nowhere near here.
  //
  // `intent: CYBERSOURCE` is the card rail. `mode: payment` charges once, as
  // against "instrument", which saves a card for later.
  const endpoint = `${live() ? LIVE_API : SANDBOX_API}/order/v1/init`;
  const payload = {
    merchant_api_key: apiKey,
    intent: "CYBERSOURCE",
    mode: "payment",
    currency: "PKR",
    // Paisa, not rupees — PKR 4,000 goes as 400000.
    //
    // Worth checking on the first sandbox run rather than trusting: their
    // library's own example passes 600000 against PKR, which reads as
    // 6,000 rupees in the minor unit, but they do not say so in words. The
    // amount is printed on Safepay's page. If it says PKR 400,000 for a
    // 4,000 booking, drop the ×100 here — nothing else needs touching.
    amount: Math.round(args.amountPkr * 100),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Belt and braces on authentication. Their PHP library puts the key in
      // the body; their newer endpoints read a header instead, and which of
      // the two an account is on is not something this code can see. Sending
      // both costs one header and removes a whole round of guessing — the
      // header is ignored by the older API and the body field by the newer.
      ...(process.env.SAFEPAY_SECRET_KEY?.trim()
        ? { "X-SFPY-MERCHANT-SECRET": process.env.SAFEPAY_SECRET_KEY.trim() }
        : {}),
    },
    body: JSON.stringify(payload),
    // Safepay is quick, and a patient staring at a spinner needs an answer.
    // Without this the request can hang until the platform's own timeout,
    // by which point they have pressed the button three more times.
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Everything needed to fix this, in one block, without asking anyone to
    // reproduce it. The key is reduced to its first eight characters — enough
    // to tell "the wrong key" from "no key", not enough to use.
    console.error(
      [
        "",
        "──────── [safepay] init REJECTED ────────",
        `  POST    ${endpoint}`,
        `  status  ${res.status} ${res.statusText}`,
        `  sent    ${JSON.stringify({ ...payload, merchant_api_key: `${apiKey.slice(0, 8)}…(${apiKey.length} chars)` })}`,
        `  said    ${detail || "(empty body)"}`,
        "─────────────────────────────────────────",
        "",
      ].join("\n")
    );
    throw new Error("Card payments are unavailable right now. Please try a wallet, or call the clinic.");
  }

  // Their PHP library reads `$session->tracker->token`, older write-ups show a
  // bare `data.token`. Both are checked rather than picking one and finding out
  // in production which shape this account returns.
  const body = (await res.json()) as {
    data?: { token?: string; tracker?: { token?: string } };
    token?: string;
  };
  const token = body.data?.tracker?.token ?? body.data?.token ?? body.token;
  if (!token) {
    // A 200 with no token means the shape changed, not that anything is
    // broken. The whole body is printed so the new path is visible at a
    // glance rather than inferred.
    console.error(
      "\n──────── [safepay] init returned 200 but no token ────────\n" +
        `  body  ${JSON.stringify(body)}\n` +
        "──────────────────────────────────────────────────────────\n"
    );
    throw new Error("Card payments are unavailable right now. Please try a wallet, or call the clinic.");
  }

  const url = new URL(live() ? LIVE_CHECKOUT : SANDBOX_CHECKOUT);
  // `tracker`, not `beacon`, and `environment`, not `env`. Safepay's checkout
  // shell loads either way — it rendered its TEST MODE badge quite happily —
  // and then fails with "Unable to make request", because the token it was
  // looking for was sitting under a name it does not read.
  url.searchParams.set("environment", environment);
  url.searchParams.set("tracker", token);
  url.searchParams.set("source", "custom");
  url.searchParams.set("order_id", args.reference);
  url.searchParams.set("redirect_url", args.returnUrl);
  // Cancelling has to land somewhere that releases the slot, not on the
  // booking form with the time still held.
  url.searchParams.set("cancel_url", `${args.returnUrl}?cancelled=1`);

  // Logged so that when a patient lands somewhere unexpected, the exact URL
  // they were sent to is in the server log rather than reconstructed from a
  // description of what they saw. The amount goes with it, because "did it
  // charge rupees or paisa" is the first question a wrong figure raises.
  console.log(
    `[safepay] handing over: PKR ${args.amountPkr} sent as ${Math.round(args.amountPkr * 100)} →`,
    url.toString()
  );

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
