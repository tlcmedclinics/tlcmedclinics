import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-server";
import { getStripe } from "@/lib/stripe";
import { confirmAppointmentPayment, finalizePendingBooking } from "@/lib/payments";

/**
 * Called by /patient/book/success right after Stripe redirects back. Gives
 * the patient an instant "booked!" instead of waiting on webhook latency,
 * while still checking Stripe's own record of the session (not just trusting
 * the redirect happened) before creating anything.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const reference = (session.payment_intent as string) || session.id;

    // Two kinds of payment come back through here, told apart by which id the
    // session carries. `pendingBookingId` means the appointment doesn't exist
    // yet and this payment creates it. `appointmentId` means the doctor already
    // booked it — a follow-up holding a slot — and this payment confirms it.
    const pendingBookingId = session.metadata?.pendingBookingId;
    const appointmentId = session.metadata?.appointmentId;

    if (!pendingBookingId && !appointmentId) {
      return NextResponse.json({ error: "Session missing booking reference" }, { status: 400 });
    }

    const appointment = pendingBookingId
      ? await finalizePendingBooking(pendingBookingId, { provider: "card", reference })
      : await confirmAppointmentPayment(appointmentId as string, {
          provider: "card",
          reference,
        });

    if (appointment.patientId !== auth.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, appointment });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not verify payment" },
      { status: 500 }
    );
  }
}
