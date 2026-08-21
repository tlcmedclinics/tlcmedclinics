import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { getStripe, PAYMENT_CURRENCY, toMinorUnits } from "@/lib/stripe";
import { publicOrigin } from "@/lib/public-url";
import type { Appointment } from "@/types";

/**
 * POST /api/payments/stripe/pay-appointment  { appointmentId }
 *
 * Starts Stripe Checkout for an appointment that already exists — the follow-up
 * a doctor booked at the end of a visit, which is holding a slot and waiting on
 * the patient to confirm it.
 *
 * Separate from /checkout rather than a flag on it, because the two do opposite
 * things. /checkout takes booking details and reserves a slot: it is the start
 * of a booking that does not exist yet. Here the booking, the slot and the price
 * are already fixed, and the only open question is payment. Sharing one route
 * would mean a request body where half the fields must be present and the other
 * half must not.
 *
 * Nothing about the charge comes from the request. The amount is read from the
 * appointment document, so a patient cannot pay one rupee for a visit the clinic
 * priced at five thousand by editing what the browser sends.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { appointmentId } = await req.json().catch(() => ({}));
  if (!appointmentId) {
    return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
  }

  const snap = await adminDb.collection("appointments").doc(appointmentId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const appointment = snap.data() as Appointment;

  // 404, not 403: a patient poking at other people's ids shouldn't be able to
  // learn which of them exist.
  if (appointment.patientId !== auth.uid) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appointment.paymentStatus === "paid") {
    return NextResponse.json({ error: "This appointment is already paid for." }, { status: 409 });
  }

  if (appointment.status !== "awaiting-payment") {
    return NextResponse.json(
      { error: "This appointment isn't waiting for payment." },
      { status: 409 }
    );
  }

  // Checked here as well as in the sweep. The sweep runs on the cron's rhythm,
  // so between a hold lapsing and the sweep noticing there is a window where a
  // patient could still pay for a time the clinic no longer considers theirs.
  if (appointment.paymentDueAt && Date.parse(appointment.paymentDueAt) < Date.now()) {
    return NextResponse.json(
      { error: "This time is no longer being held. Please book a new appointment." },
      { status: 410 }
    );
  }

  if (!appointment.amount || appointment.amount <= 0) {
    return NextResponse.json(
      { error: "This appointment has no price set — please contact the clinic." },
      { status: 409 }
    );
  }

  const origin = publicOrigin(req);

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: PAYMENT_CURRENCY,
            unit_amount: toMinorUnits(appointment.amount),
            product_data: {
              name: `TLC Med Clinics — ${appointment.service} (follow-up)`,
              description: `${appointment.mode} consultation on ${appointment.date} at ${appointment.time}`,
            },
          },
          quantity: 1,
        },
      ],
      // `appointmentId`, where a new booking carries `pendingBookingId`. That
      // difference is what /verify and the webhook branch on to decide whether
      // this payment confirms an appointment or creates one.
      metadata: { appointmentId: appointment.id },
      success_url: `${origin}/patient/book/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/patient/dashboard?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[POST /api/payments/stripe/pay-appointment]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout" },
      { status: 500 }
    );
  }
}
