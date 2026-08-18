import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-server";
import { getStripe, PAYMENT_CURRENCY, toMinorUnits } from "@/lib/stripe";
import { createPendingBooking } from "@/lib/payments";

/**
 * Creates a Stripe Checkout Session for one appointment and returns its
 * hosted URL. The booking details are stashed server-side in a
 * `pendingBookings` doc (never trusted from the client again) — the
 * appointment itself is only created once Stripe confirms payment, via the
 * webhook (or the /verify fallback on the success page).
 */
export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { patientName, patientPhone, doctorId, doctorName, service, mode, date, time, notes, amount, couponCode, slotId, patientType, sessionType } = body;

  if (!service || !date || !time || !amount || !slotId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let pendingBookingId: string;
  try {
    pendingBookingId = await createPendingBooking({
      patientId: auth.uid,
      patientName: patientName ?? "",
      patientPhone: patientPhone || undefined,
      doctorId: doctorId || undefined,
      doctorName: doctorName || undefined,
      service,
      mode: mode ?? "video",
      date,
      time,
      notes: notes || undefined,
      amount: Number(amount) || 0,
      couponCode: couponCode || undefined,
      patientType: patientType === "follow-up" ? "follow-up" : "new",
      sessionType: sessionType || undefined,
      slotId,
    });
  } catch (err) {
    console.error("[POST /api/payments/stripe/checkout] createPendingBooking", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout" },
      { status: 500 }
    );
  }

  const origin = req.nextUrl.origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: PAYMENT_CURRENCY,
            unit_amount: toMinorUnits(Number(amount)),
            product_data: {
              name: `TLC Med Clinics — ${service}`,
              description: `${mode ?? "video"} consultation on ${date} at ${time}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { pendingBookingId },
      success_url: `${origin}/patient/book/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/patient/book?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout" },
      { status: 500 }
    );
  }
}
