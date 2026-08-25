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
  const outcome = verifyCallback(gateway, params);

  if (!outcome.reference) {
    return resultPage("failed", "That payment could not be matched to a booking.");
  }

  const attemptRef = adminDb.collection("paymentAttempts").doc(outcome.reference);
  const attemptSnap = await attemptRef.get();
  if (!attemptSnap.exists) {
    // Either a stale callback for something long since cleaned up, or someone
    // poking at the endpoint. Same answer for both.
    console.warn("[payments/callback] unknown reference", outcome.reference);
    return resultPage("failed", "That payment could not be matched to a booking.");
  }
  const attempt = attemptSnap.data() as Attempt;

  // The gateway may deliver the same result twice — a browser redirect and a
  // server notification, or a patient hitting back. Finalising is idempotent
  // underneath, but there is no reason to make it prove that every time.
  if (attempt.status === "completed") {
    return resultPage("ok", "Your appointment is confirmed.");
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
        reference: outcome.gatewayReference || outcome.reference,
      });
    } else {
      await confirmAppointmentPayment(attempt.targetId, {
        provider: PROVIDER[gateway],
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
