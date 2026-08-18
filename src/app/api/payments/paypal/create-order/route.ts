import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-server";
import { createPaypalOrder } from "@/lib/paypal";
import { createPendingBooking } from "@/lib/payments";

/** Same pattern as the Stripe checkout route: stash booking details server-side
 *  first, then create the PayPal order referencing that pending booking. */
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

  const pendingBookingId = await createPendingBooking({
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

  try {
    const orderId = await createPaypalOrder(Number(amount), pendingBookingId);
    return NextResponse.json({ orderId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create PayPal order" },
      { status: 500 }
    );
  }
}
