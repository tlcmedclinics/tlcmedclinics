import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { confirmAppointmentPayment, finalizePendingBooking } from "@/lib/payments";

/**
 * Stripe calls this directly (not the browser) — register it at
 * Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   {your domain}/api/payments/stripe/webhook, event: checkout.session.completed
 * then copy the signing secret into STRIPE_WEBHOOK_SECRET.
 *
 * This is the reliable path: it fires even if the patient closes the tab
 * right after paying, before /patient/book/success gets a chance to call
 * /verify. Both paths call the same idempotent finalizePendingBooking, so
 * whichever runs first "wins" and the other is a no-op.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: Record<string, string>; payment_intent?: string; id: string };
    const pendingBookingId = session.metadata?.pendingBookingId;
    const appointmentId = session.metadata?.appointmentId;
    const reference = (session.payment_intent as string) || session.id;

    try {
      if (pendingBookingId) {
        await finalizePendingBooking(pendingBookingId, { provider: "card", reference });
      } else if (appointmentId) {
        // A follow-up the patient just paid for. This path matters more than
        // the booking one: the patient is sent back to their dashboard rather
        // than a success page that calls /verify, so for these payments the
        // webhook is often the only thing that confirms the appointment.
        await confirmAppointmentPayment(appointmentId, { provider: "card", reference });
      }
    } catch {
      // Already handled by the success-page /verify call, or the pending doc is
      // gone — either way there's nothing more to do here.
    }
  }

  return NextResponse.json({ received: true });
}
