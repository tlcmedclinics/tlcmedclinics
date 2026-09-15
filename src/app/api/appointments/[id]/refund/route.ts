import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { refundStripePayment } from "@/lib/stripe";
import { refundPaypalCapture } from "@/lib/paypal";
import type { Appointment } from "@/types";

/**
 * Refunds a paid appointment.
 *
 * ── Why this is not one call to one API ──
 *
 * A refund can only be issued by whoever is holding the money, and this clinic
 * takes money four different ways. Stripe and PayPal both expose an API for it
 * and are issued here. Safepay, JazzCash and EasyPaisa are refunded from their
 * own merchant dashboards — so for those this route does the only honest thing
 * available to it: it tells the admin exactly where to go, and then records
 * the refund once they confirm they have made it.
 *
 * The bug this replaces is worth naming, because it was silent. Safepay
 * bookings are stored with `paymentProvider: "card"` — correctly, because a
 * card is what the patient used — and the old code read that field and called
 * *Stripe's* refund API with a Safepay tracker token. Stripe, quite reasonably,
 * has never heard of it. An admin pressing "refund" on a real Safepay payment
 * got an error that named Stripe, a company the clinic does not even use, and
 * the patient's money stayed where it was.
 *
 * `paymentGateway` is now recorded at the moment the payment is confirmed and
 * is the field this route reads.
 *
 * POST { }              — issue the refund through the gateway's API.
 * POST { manual: true } — record a refund the admin has already made by hand
 *                         in the gateway's dashboard.
 */

/** The two that can be refunded from here without anyone opening a dashboard. */
const AUTOMATIC = new Set(["stripe", "paypal"]);

/** Where to go for the rest. Named, because "refund it manually" is not a step. */
const DASHBOARD: Record<string, string> = {
  safepay: "the Safepay dashboard (Payments → find the transaction → Refund)",
  jazzcash: "the JazzCash merchant portal",
  easypaisa: "the EasyPaisa merchant portal",
  cash: "the clinic's own cash record — nothing was taken online",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const manual = body?.manual === true;

  const ref = adminDb.collection("appointments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const appointment = snap.data() as Appointment;

  if (appointment.paymentStatus === "refunded") {
    // Not an error. Two admins looking at the same list is normal, and the
    // second one should be told it is already done rather than shown a failure.
    return NextResponse.json({ ok: true, alreadyRefunded: true });
  }
  if (appointment.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Nothing to refund on this booking" }, { status: 400 });
  }
  if (!appointment.paymentReference) {
    return NextResponse.json({ error: "No payment reference on this booking" }, { status: 400 });
  }

  // Falls back to the old field for bookings taken before `paymentGateway`
  // existed. On those, "card" genuinely did mean Stripe — it was the only card
  // gateway the site had at the time.
  const gateway =
    appointment.paymentGateway ??
    (appointment.paymentProvider === "card"
      ? "stripe"
      : appointment.paymentProvider === "paypal"
      ? "paypal"
      : appointment.paymentProvider);

  const record = async (how: "api" | "manual") => {
    await ref.update({
      paymentStatus: "refunded",
      refundProcessedAt: new Date().toISOString(),
      refundedBy: auth.uid,
      refundMethod: how,
    });
  };

  if (manual) {
    // The admin says they have refunded it in the gateway's own dashboard.
    // Recorded, with who said so and that it was done by hand — a refund that
    // exists only in one system and not the other is how reconciliation goes
    // wrong months later.
    await record("manual");
    return NextResponse.json({ ok: true, method: "manual" });
  }

  if (!gateway || !AUTOMATIC.has(gateway)) {
    const where = (gateway && DASHBOARD[gateway]) || "the payment provider's dashboard";
    return NextResponse.json(
      {
        error:
          `This payment was taken through ${gateway ?? "an unknown gateway"}, which has no refund API here. ` +
          `Refund PKR ${appointment.amount} in ${where}, using reference ${appointment.paymentReference}, ` +
          `then press Refund again to record it.`,
        needsManualRefund: true,
        gateway: gateway ?? null,
        reference: appointment.paymentReference,
        amount: appointment.amount,
      },
      { status: 409 }
    );
  }

  try {
    if (gateway === "stripe") {
      await refundStripePayment(appointment.paymentReference);
    } else {
      await refundPaypalCapture(appointment.paymentReference);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed at the payment provider" },
      { status: 502 }
    );
  }

  await record("api");
  return NextResponse.json({ ok: true, method: "api" });
}
