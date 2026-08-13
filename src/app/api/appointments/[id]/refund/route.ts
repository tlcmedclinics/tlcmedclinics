import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { refundStripePayment } from "@/lib/stripe";
import { refundPaypalCapture } from "@/lib/paypal";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const ref = adminDb.collection("appointments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const appointment = snap.data();

  if (appointment?.paymentStatus !== "refunded" && appointment?.paymentStatus !== "paid") {
    return NextResponse.json({ error: "Nothing to refund on this booking" }, { status: 400 });
  }
  if (!appointment?.paymentReference) {
    return NextResponse.json({ error: "No payment reference on this booking" }, { status: 400 });
  }

  try {
    if (appointment.paymentProvider === "card") {
      await refundStripePayment(appointment.paymentReference);
    } else if (appointment.paymentProvider === "paypal") {
      await refundPaypalCapture(appointment.paymentReference);
    } else {
      return NextResponse.json(
        { error: "This booking wasn't paid through Stripe or PayPal — refund it manually." },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed at the payment provider" },
      { status: 502 }
    );
  }

  await ref.update({ paymentStatus: "refunded", refundProcessedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
