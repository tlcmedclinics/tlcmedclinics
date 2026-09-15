import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  confirmAppointmentPayment,
  finalizePendingBooking,
  releasePendingBooking,
  type PaymentProviderId,
} from "@/lib/payments";
import { isGatewayId, verifyCallback } from "@/lib/gateways/dispatch";
import type { GatewayId } from "@/lib/gateways";
import { publicOrigin } from "@/lib/public-url";

/**
 * Where the gateways send the patient back to.
 *
 * Public by necessity — JazzCash and EasyPaisa post here from the patient's
 * browser and carry no session — so nothing in here trusts the caller. What
 * makes it safe is the pair of checks below: the gateway's own signature, and
 * a `paymentAttempts` record this server wrote before the patient ever left.
 * A request naming a reference we have no record of is discarded without a
 * word to the sender.
 *
 * It always answers with a redirect, never with JSON. Whatever happens, there
 * is a person sitting in front of a browser waiting to find out whether they
 * have an appointment.
 */

/** Which name goes on the appointment for each gateway. */
const PROVIDER: Record<GatewayId, PaymentProviderId> = {
  jazzcash: "jazzcash",
  easypaisa: "easypaisa",
  safepay: "card",
};

type Attempt = {
  reference: string;
  kind: "booking" | "appointment";
  targetId: string;
  amount: number;
  status: "started" | "completed" | "failed";
  /** The gateway's own token, written down before the patient left. */
  gatewayReference?: string;
};

/** Both shapes turn up: a form post from the wallets, a query from Safepay. */
async function readParams(req: NextRequest): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  for (const [k, v] of req.nextUrl.searchParams) params[k] = v;

  if (req.method === "POST") {
    const type = req.headers.get("content-type") ?? "";
    try {
      if (type.includes("application/json")) {
        Object.assign(params, await req.json());
      } else {
        for (const [k, v] of await req.formData()) params[k] = String(v);
      }
    } catch {
      // An unreadable body leaves the query params, which is enough to fail
      // honestly rather than throw a 500 at someone who has just paid.
    }
  }
  return params;
}

async function handle(req: NextRequest, gatewayParam: string) {
  const origin = publicOrigin(req);
  const resultPage = (status: string, message: string) =>
    NextResponse.redirect(
      `${origin}/patient/book/result?status=${status}&message=${encodeURIComponent(message)}`,
      // 303: the gateway sent a POST, and the browser must follow with a GET.
      // A 302 here makes some browsers re-POST to a page that expects neither
      // the body nor the method.
      303
    );

  if (!isGatewayId(gatewayParam)) {
    return resultPage("failed", "Unknown payment method.");
  }
  const gateway = gatewayParam;

  const params = await readParams(req);

  // Every parameter, every time, on one line.
  //
  // This endpoint is the one place in the system where a mistake costs real
  // money, and it is also the one place that cannot be stepped through: the
  // request is made by somebody else's server, once, and if it is not
  // understood the patient is already staring at an answer. Guessing what a
  // gateway sends has now cost two captured payments. It does not need to be
  // guessed at.
  console.log(`[payments/callback] ${gateway} ←`, JSON.stringify(params));

  let outcome = await verifyCallback(gateway, params);

  // ── Finding the attempt ───────────────────────────────────────────────────
  //
  // Two ways in, on purpose.
  //
  // The reference is the front door: we gave it to the gateway and the gateway
  // gives it back. The tracker is the back door, and it exists because the
  // front door has failed twice — once mangled, once absent — and each failure
  // took a captured payment with it. A gateway that says "this tracker was
  // paid" is naming a payment we started, and we wrote the tracker down before
  // the patient left, so it identifies the booking just as surely as our own
  // reference does.
  let attemptSnap = outcome.reference
    ? await adminDb.collection("paymentAttempts").doc(outcome.reference).get()
    : null;

  if (!attemptSnap?.exists) {
    const tracker = params.tracker || params.beacon || params.tracker_token || "";
    if (tracker) {
      const found = await adminDb
        .collection("paymentAttempts")
        .where("gatewayReference", "==", tracker)
        .limit(1)
        .get();
      if (!found.empty) {
        attemptSnap = found.docs[0];
        console.warn(
          `[payments/callback] reference "${outcome.reference}" did not resolve; ` +
            `matched on tracker instead → ${attemptSnap.id}`
        );
      }
    }
  }

  if (!attemptSnap?.exists) {
    // Either a stale callback for something long since cleaned up, or someone
    // poking at the endpoint. Same answer for both.
    console.warn("[payments/callback] unknown reference", outcome.reference, JSON.stringify(params));
    return resultPage("failed", "That payment could not be matched to a booking.");
  }

  const attemptRef = attemptSnap.ref;
  const attempt = attemptSnap.data() as Attempt;
  // From here on the attempt's own reference is authoritative — the one we
  // wrote, not the one that came back over the wire.
  outcome = { ...outcome, reference: attempt.reference ?? attemptSnap.id };

  // The gateway may deliver the same result twice — a browser redirect and a
  // server notification, or a patient hitting back. Finalising is idempotent
  // underneath, but there is no reason to make it prove that every time.
  if (attempt.status === "completed") {
    return resultPage("ok", "Your appointment is confirmed.");
  }

  // Second chance, and the reason the tracker is stored at all.
  //
  // Safepay is asked about the payment by token, and the token normally
  // comes back on the redirect. When it does not — a parameter renamed, a
  // browser that dropped the query string — the answer is not "unverified",
  // it is "ask about the token we wrote down before they left".
  if (!outcome.ok && attempt.gatewayReference && !params.tracker) {
    outcome = await verifyCallback(gateway, {
      ...params,
      tracker: attempt.gatewayReference,
    });
  }

  // Paid, but for less than we asked. The tracker is fetched from the
  // gateway rather than read off the browser, so this is not a forgery so
  // much as a mismatch — but an appointment must never be confirmed against
  // a smaller charge, and a human should look at it either way.
  if (
    outcome.ok &&
    typeof outcome.amountPkr === "number" &&
    outcome.amountPkr + 0.5 < attempt.amount
  ) {
    console.error(
      "[payments/callback] AMOUNT MISMATCH",
      outcome.reference,
      `expected ${attempt.amount}, gateway reported ${outcome.amountPkr}`
    );
    await attemptRef.update({
      status: "failed",
      failedAt: new Date().toISOString(),
      needsAttention: true,
      reportedAmount: outcome.amountPkr,
    });
    return resultPage(
      "attention",
      "The amount paid does not match the booking. Please call the clinic — do not pay again."
    );
  }

  if (!outcome.ok && outcome.pending) {
    // Undecided. Nothing is written down as failed and nothing is released:
    // the attempt stays open, the slot stays held, and a later callback — or
    // the patient reloading — can still finish the job. Releasing here is how
    // a payment that succeeds thirty seconds late ends up with no slot to go
    // into.
    console.warn("[payments/callback] undecided, holding", outcome.reference);
    return resultPage("attention", outcome.message);
  }

  if (!outcome.ok) {
    await attemptRef.update({ status: "failed", failedAt: new Date().toISOString() });
    // The slot is being held for a booking that was never paid for. Letting it
    // go is the whole reason this branch exists — otherwise one abandoned
    // checkout takes a time slot off the calendar until someone notices.
    if (attempt.kind === "booking") {
      await releasePendingBooking(attempt.targetId).catch((err) =>
        console.error("[payments/callback] release failed", err)
      );
    }
    return resultPage("failed", outcome.message);
  }

  try {
    if (attempt.kind === "booking") {
      await finalizePendingBooking(attempt.targetId, {
        provider: PROVIDER[gateway],
        gateway,
        reference: outcome.gatewayReference || outcome.reference,
      });
    } else {
      await confirmAppointmentPayment(attempt.targetId, {
        provider: PROVIDER[gateway],
        gateway,
        reference: outcome.gatewayReference || outcome.reference,
      });
    }

    await attemptRef.update({
      status: "completed",
      completedAt: new Date().toISOString(),
      gatewayReference: outcome.gatewayReference ?? null,
    });

    return resultPage("ok", "Your appointment is confirmed.");
  } catch (err) {
    // The money is taken and the appointment is not. This is the one failure
    // that must never be swallowed: it is logged loudly, and the patient is
    // told to call rather than told to try again — a second attempt would
    // charge them twice.
    console.error("[payments/callback] PAID BUT NOT BOOKED", outcome.reference, err);
    await attemptRef.update({
      status: "failed",
      failedAt: new Date().toISOString(),
      needsAttention: true,
    });
    return resultPage(
      "attention",
      "Your payment went through but we could not confirm the appointment. Please call the clinic — do not pay again."
    );
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await ctx.params;
  return handle(req, gateway);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await ctx.params;
  return handle(req, gateway);
}
