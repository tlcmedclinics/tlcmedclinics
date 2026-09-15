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
 * This account straddles the two generations, which is worth writing down
 * because it is not what either set of documentation describes:
 *
 *   · `/order/v1/init` is the OLDER shape. It asks for `client` and
 *     `environment`, and says so itself — it answered 417 "Expected required
 *     but got for field: Client" to the newer payload.
 *   · the checkout page is the NEWER one, `/embedded`. `/components` is the
 *     path the older documentation gives, and it no longer exists: Safepay
 *     redirects it to their marketing site, so the patient lands on
 *     "Innovating for the ambitious" instead of a card form. No error, no
 *     clue — just somebody else's home page.
 *
 * The query string below carries both generations' parameter names anyway
 * (`tracker` and `beacon`, `environment` and `env`), so whichever the page
 * reads, it finds.
 */
const SANDBOX_CHECKOUT =
  process.env.SAFEPAY_CHECKOUT_URL?.trim() || "https://sandbox.api.getsafepay.com/embedded";
const LIVE_CHECKOUT =
  process.env.SAFEPAY_CHECKOUT_URL?.trim() || "https://getsafepay.com/embedded";

const live = () => process.env.PAYMENTS_MODE === "live";

/** See the note beside `amount` in the payload below. */
function amountForSafepay(rupees: number): number {
  const unit = process.env.SAFEPAY_AMOUNT_UNIT?.trim().toLowerCase();
  if (unit === "rupees" || unit === "major") return Math.round(rupees * 100) / 100;
  // Paisa by default. Safepay's current guide is explicit about this one:
  // "$100" is sent as `amount: 10000` — the lowest denomination. The older
  // write-ups passing 1000.00 belong to the retired endpoint.
  return Math.round(rupees * 100);
}

export async function startPayment(args: StartArgs): Promise<Handover> {
  const apiKey = process.env.SAFEPAY_API_KEY!.trim();
  const secret = process.env.SAFEPAY_SECRET_KEY?.trim();
  const environment = live() ? "production" : "sandbox";
  const base = live() ? LIVE_API : SANDBOX_API;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(secret ? { "X-SFPY-MERCHANT-SECRET": secret } : {}),
  };

  /** One place to report a refusal, because two calls can now refuse. */
  const refuse = async (step: string, endpoint: string, res: Response, sent?: unknown) => {
    const detail = await res.text().catch(() => "");
    console.error(
      [
        "",
        `──────── [safepay] ${step} REJECTED ────────`,
        `  POST    ${endpoint}`,
        `  status  ${res.status} ${res.statusText}`,
        sent
          ? `  sent    ${JSON.stringify({ ...(sent as object), merchant_api_key: `${apiKey.slice(0, 8)}…(${apiKey.length} chars)` })}`
          : "  sent    (no body)",
        `  said    ${detail || "(empty body)"}`,
        "────────────────────────────────────────────",
        "",
      ].join("\n")
    );
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `Safepay refused the ${step} request — ${res.status} ${res.statusText}: ${detail || "(empty body)"}`
      );
    }
    throw new Error(
      "Card payments are unavailable right now. Please try a wallet, or call the clinic."
    );
  };

  // ── 1. The payment session ────────────────────────────────────────────────
  //
  // `/order/payments/v3/`, not `/order/v1/init`.
  //
  // The older endpoint still answers on this account, and that is exactly what
  // made this hard: it accepted a `client` + `environment` payload and handed
  // back a perfectly real-looking `track_…` token. The token was simply from
  // the wrong generation, and Safepay's current checkout page answered the
  // only way it could — "Session expired!" — for a session created seconds
  // earlier. A working call to a retired endpoint is worse than a failing one.
  const sessionEndpoint = `${base}/order/payments/v3/`;
  const sessionBody = {
    merchant_api_key: apiKey,
    intent: "CYBERSOURCE",
    mode: "payment",
    currency: "PKR",
    amount: amountForSafepay(args.amountPkr),
  };

  const sessionRes = await fetch(sessionEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(sessionBody),
    signal: AbortSignal.timeout(15_000),
  });
  if (!sessionRes.ok) await refuse("session", sessionEndpoint, sessionRes, sessionBody);

  const sessionJson = (await sessionRes.json()) as {
    data?: { token?: string; tracker?: { token?: string } };
    token?: string;
  };
  const tracker =
    sessionJson.data?.tracker?.token ?? sessionJson.data?.token ?? sessionJson.token;

  if (!tracker) {
    console.error(
      "\n──────── [safepay] session returned 200 but no tracker ────────\n" +
        `  body  ${JSON.stringify(sessionJson)}\n` +
        "───────────────────────────────────────────────────────────────\n"
    );
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Safepay returned no tracker. Body: ${JSON.stringify(sessionJson)}`);
    }
    throw new Error(
      "Card payments are unavailable right now. Please try a wallet, or call the clinic."
    );
  }

  // ── 2. The time-bound token ───────────────────────────────────────────────
  //
  // This is the step that was missing, and its absence did not look like an
  // absence. The checkout page loads, shows its TEST MODE badge, and then
  // reports the session as expired — because without a `tbt` it cannot open
  // the session at all, and "expired" is the nearest thing it has to say.
  //
  // It lasts an hour, which is far longer than anyone takes to type a card.
  const passportEndpoint = `${base}/client/passport/v1/token`;
  const passportRes = await fetch(passportEndpoint, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!passportRes.ok) await refuse("passport token", passportEndpoint, passportRes);

  const passportJson = (await passportRes.json()) as {
    data?: string | { token?: string };
  };
  const tbt =
    typeof passportJson.data === "string" ? passportJson.data : passportJson.data?.token;

  if (!tbt) {
    console.error(
      "\n──────── [safepay] passport returned 200 but no token ────────\n" +
        `  body  ${JSON.stringify(passportJson)}\n` +
        "──────────────────────────────────────────────────────────────\n"
    );
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Safepay returned no tbt. Body: ${JSON.stringify(passportJson)}`);
    }
    throw new Error(
      "Card payments are unavailable right now. Please try a wallet, or call the clinic."
    );
  }

  // ── 3. Where the patient goes ─────────────────────────────────────────────
  const url = new URL(live() ? LIVE_CHECKOUT : SANDBOX_CHECKOUT);
  url.searchParams.set("environment", environment);
  url.searchParams.set("tracker", tracker);
  url.searchParams.set("tbt", tbt);
  url.searchParams.set("source", "hosted");
  url.searchParams.set("order_id", args.reference);
  // Both return URLs are left bare — no query string of our own.
  //
  // Putting `?order_id=…` on them looked like belt and braces and was in fact
  // the opposite: Safepay appends its own parameters to whatever it is given,
  // and the two query strings collided. The reference came back mangled, the
  // callback could not find the attempt, and a captured payment was answered
  // with "could not be matched to a booking".
  //
  // The reference travels as the checkout's own `order_id` parameter above,
  // and the tracker is written down beside the attempt before the patient
  // leaves — between them the callback can always find its way home.
  url.searchParams.set("redirect_url", args.returnUrl);
  url.searchParams.set("cancel_url", args.returnUrl);

  // The amount goes in the log beside the URL, because "did it charge rupees
  // or paisa" is the first question a wrong figure raises, and the answer
  // should not need a second run to find.
  console.log(
    `[safepay] handing over: PKR ${args.amountPkr} sent as ${amountForSafepay(args.amountPkr)} ` +
      `(SAFEPAY_AMOUNT_UNIT=${process.env.SAFEPAY_AMOUNT_UNIT?.trim() || "paisa (default)"}) →`,
    url.toString()
  );

  // The tracker travels back with the handover so the caller can write it
  // down beside the attempt. If Safepay's redirect ever comes back without
  // it, the callback still knows which tracker to go and ask about.
  return { kind: "url", url: url.toString(), gatewayReference: tracker };
}

function matches(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * States that say "paid" by themselves.
 *
 * `TRACKER_ENDED` is deliberately NOT in here. Ended means the tracker's life
 * is over, which is also true of one that ended without a payment — treating
 * it as proof would confirm appointments nobody paid for. It is accepted below,
 * but only alongside a successful attempt.
 */
const PAID_STATES = new Set([
  "TRACKER_COMPLETED",
  "COMPLETED",
  "CAPTURED",
  "PAID",
  "SUCCESS",
  "SUCCEEDED",
]);

/** The ones that mean it is not, and never will be. */
const DEAD_STATES = new Set([
  "TRACKER_CANCELLED",
  "TRACKER_CANCELED",
  "TRACKER_EXPIRED",
  "TRACKER_REJECTED",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
  "FAILED",
  "DECLINED",
  "VOIDED",
  "REFUNDED",
  "REVERSED",
]);

type TrackerReport = {
  ok?: boolean;
  data?: {
    token?: string;
    state?: string;
    intent?: string;
    charge?: {
      amount?: number;
      currency?: string;
      capture?: { kind?: string } | null;
    } | null;
    attempts?: Array<{ is_success?: boolean; actions?: Array<{ kind?: string }> }> | null;
    events?: Array<{ name?: string; kind?: string; status?: string; is_success?: boolean }> | null;
  } | null;
};

/**
 * Asks Safepay what happened to a tracker.
 *
 * Server to server, with the account secret, against Safepay's own reporting
 * API. Nothing the browser carries back is believed — the browser is only used
 * for the one thing it can be trusted with, which is telling us *which*
 * tracker to go and ask about.
 */
async function fetchTracker(tracker: string): Promise<TrackerReport | null> {
  const base = live() ? LIVE_API : SANDBOX_API;
  const secret = process.env.SAFEPAY_SECRET_KEY!.trim();
  const endpoint = `${base}/reporter/api/v1/payments/${encodeURIComponent(tracker)}`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-SFPY-MERCHANT-SECRET": secret,
      },
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[safepay] tracker report ${res.status} ${res.statusText} for ${tracker}: ${text || "(empty)"}`
      );
      return null;
    }
    return JSON.parse(text) as TrackerReport;
  } catch (err) {
    console.error("[safepay] tracker report unreachable for", tracker, err);
    return null;
  }
}

/** Was this tracker paid? Read from several places, because Safepay says it in several. */
function readPaid(report: TrackerReport): { paid: boolean; dead: boolean; state: string } {
  const data = report.data ?? {};
  const state = String(data.state ?? "").toUpperCase();

  if (DEAD_STATES.has(state)) return { paid: false, dead: true, state };

  // A capture object on the charge is the plainest statement there is: the
  // money has moved, not merely been held.
  const captured = Boolean(data.charge?.capture);

  const attemptSucceeded = (data.attempts ?? []).some((a) => a?.is_success === true);

  const captureEvent = (data.events ?? []).some((e) => {
    const name = String(e?.name ?? e?.kind ?? "").toUpperCase();
    if (!name.includes("CAPTURE")) return false;
    if (e?.is_success === false) return false;
    const status = String(e?.status ?? "").toUpperCase();
    return status === "" || status.includes("SUCCESS") || status.includes("COMPLETE");
  });

  const paid =
    captured ||
    captureEvent ||
    PAID_STATES.has(state) ||
    (state === "TRACKER_ENDED" && attemptSucceeded);

  return { paid, dead: false, state };
}

/** Whole rupees, back out of whatever unit we sent. */
function amountFromSafepay(amount: number | undefined): number | undefined {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return undefined;
  const unit = process.env.SAFEPAY_AMOUNT_UNIT?.trim().toLowerCase();
  if (unit === "rupees" || unit === "major") return amount;
  return amount / 100;
}

/**
 * Decides whether a patient coming back from Safepay actually paid.
 *
 * ── Why this is not a signature check any more ──
 *
 * It used to be: HMAC-SHA256 over the tracker, keyed with the account secret,
 * compared against a `sig` parameter. That is the *older* generation's contract
 * — the same generation as `/order/v1/init` — and this account is on the newer
 * one. The redirect from the current checkout carries no `sig` at all, so the
 * check could only ever fail, and it failed in the worst possible way: Safepay
 * captured PKR 4,000, the site read "no signature", marked the attempt failed
 * and released the slot. Money taken, no appointment, and a patient told the
 * payment could not be verified.
 *
 * So the question is asked of Safepay instead of of a query string. We take
 * only the tracker token from the browser and go and fetch that tracker from
 * Safepay's reporting API with the account secret. A browser cannot forge the
 * answer, because it never produces it.
 *
 * The old signature is still honoured when it is present — an account moved
 * back to the older generation keeps working — but its absence is no longer
 * treated as a refusal.
 */
export async function verifyCallback(params: Record<string, string>): Promise<CallbackResult> {
  // Trimmed at the first `?`, `&`, `#` or `/`.
  //
  // Not paranoia: a gateway that appends its own query string to a URL which
  // already had one hands back a "reference" with the rest of the URL still
  // stuck to it. A Firestore document id containing a slash throws outright,
  // and one containing a query string simply does not exist — both answer a
  // paid patient with "no such booking". The reference we issued has none of
  // those characters in it, so cutting at the first one can only help.
  const reference = (params.order_id ?? params.reference ?? params.orderId ?? "").split(
    /[?&#/]/
  )[0];
  const tracker = params.tracker ?? params.beacon ?? params.tracker_token ?? "";

  // The patient pressed cancel on Safepay's page. Not a failure to explain
  // away, and not worth a round trip to ask about.
  if (params.cancelled === "1" || params.cancel === "1" || params.status === "cancelled") {
    return { ok: false, reference, message: "Payment cancelled — no charge was made." };
  }

  if (!tracker) {
    console.error("[safepay] callback carried no tracker. params:", JSON.stringify(params));
    return { ok: false, reference, message: "That payment could not be verified." };
  }

  // Legacy path, kept deliberately. See the note above.
  const signature = params.sig ?? params.signature ?? "";
  if (signature) {
    const secret = process.env.SAFEPAY_SECRET_KEY!.trim();
    const expected = createHmac("sha256", secret).update(tracker, "utf8").digest("hex");
    if (matches(signature, expected)) {
      return {
        ok: true,
        reference,
        gatewayReference: params.reference_code || tracker,
        message: "Payment received.",
      };
    }
    // Not fatal on its own — fall through and ask Safepay directly, which is
    // the stronger check anyway.
    console.warn("[safepay] signature present but did not match; falling back to tracker report");
  }

  const report = await fetchTracker(tracker);
  if (!report) {
    // Safepay could not be reached, or refused. Never guess in this direction:
    // saying "paid" here would book an appointment nobody paid for.
    return {
      ok: false,
      pending: true,
      reference,
      message:
        "We could not confirm that payment yet. Please call the clinic before trying again — do not pay twice.",
    };
  }

  const { paid, dead, state } = readPaid(report);
  console.log(`[safepay] tracker ${tracker} → state ${state || "(none)"}, paid=${paid}`);

  if (!paid) {
    return {
      ok: false,
      // Only a state Safepay calls finished releases the slot. Anything still
      // in flight keeps its hold, because a slot given away under a payment
      // that lands a minute later is a double booking.
      pending: !dead,
      reference,
      message: dead
        ? "That payment did not go through — you have not been charged."
        : "That payment is still being processed. Please check your appointments in a minute before paying again.",
    };
  }

  return {
    ok: true,
    reference,
    gatewayReference: tracker,
    amountPkr: amountFromSafepay(report.data?.charge?.amount),
    message: "Payment received.",
  };
}
