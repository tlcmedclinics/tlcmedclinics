import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth-server";
import { capturePaypalOrder } from "@/lib/paypal";
import { finalizePendingBooking } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { orderId } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const result = await capturePaypalOrder(orderId);

    if (result.status !== "COMPLETED" || !result.referenceId || !result.transactionId) {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const appointment = await finalizePendingBooking(result.referenceId, {
      provider: "paypal",
      reference: result.transactionId,
    });

    if (appointment.patientId !== auth.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, appointment });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not capture PayPal order" },
      { status: 500 }
    );
  }
}
