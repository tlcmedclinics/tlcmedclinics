import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { createPendingBooking } from "@/lib/payments";
import { isConfigured, paymentReference } from "@/lib/gateways";
import { isGatewayId, startPayment } from "@/lib/gateways/dispatch";
import { publicOrigin } from "@/lib/public-url";
import type { Appointment } from "@/types";

/**
 * Starts a payment through any of the local gateways.
 *
 * One route for all three, because from the app's point of view they differ
 * only in which URL the patient ends up at. The three-route-per-gateway shape
 * this replaces is how the Stripe and PayPal paths drifted apart until one of
 * them was reading the doctor off the slot and the other wasn't.
 *
 * Two things a patient can pay for:
 *
 *   - a new booking, which does not exist yet. The details are written to a
 *     `pendingBookings` doc and the slot is held; the appointment is created
 *     only once the gateway confirms.
 *   - a follow-up the doctor already scheduled, which exists and is unpaid.
 *
 * The amount is never taken from the request in the second case, and in the
 * first it is written down server-side before the patient leaves. A browser
 * that comes back claiming a different figure is ignored.
 */

/** What the callback needs to know, recorded before the patient leaves. */
type PaymentAttempt = {
  reference: string;
  gateway: string;
  kind: "booking" | "appointment";
  targetId: string;
  patientId: string;
  amount: number;
  status: "started" | "completed" | "failed";
  createdAt: string;
};

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const gateway = String(body.gateway ?? "");

  if (!isGatewayId(gateway)) {
    return NextResponse.json({ error: "Unknown payment method." }, { status: 400 });
  }
  // Checked rather than assumed: without it, a gateway whose credentials were
  // never set throws a raw "cannot read property of undefined" at the patient.
  if (!isConfigured(gateway)) {
    return NextResponse.json(
      { error: "That payment method isn't available yet. Please choose another." },
      { status: 400 }
    );
  }

  let kind: PaymentAttempt["kind"];
  let targetId: string;
  let amount: number;
  let description: string;
  let phone: string | undefined;
  let email: string | undefined;

  if (body.appointmentId) {
    /* ---- paying for a follow-up that already exists ---- */
    const snap = await adminDb.collection("appointments").doc(String(body.appointmentId)).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }
    const appointment = snap.data() as Appointment;

    // Ownership, not just existence. Without this any signed-in patient could
    // pay off — or probe the price of — anyone else's appointment by id.
    if (appointment.patientId !== auth.uid) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }
    if (appointment.paymentStatus === "paid") {
      return NextResponse.json({ error: "This appointment is already paid." }, { status: 409 });
    }

    kind = "appointment";
    targetId = appointment.id;
    amount = Number(appointment.amount) || 0;
    description = `${appointment.service} — ${appointment.date}`;
    phone = appointment.patientPhone;
  } else {
    /* ---- a new booking ---- */
    const { patientName, patientPhone, service, mode, date, time, notes, couponCode, slotId, patientType, sessionType } = body;

    if (!service || !date || !time || !slotId) {
      return NextResponse.json({ error: "Missing booking details." }, { status: 400 });
    }

    amount = Number(body.amount) || 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "Nothing to pay for this booking." }, { status: 400 });
    }

    try {
      targetId = await createPendingBooking({
        patientId: auth.uid,
        patientName: patientName ?? "",
        patientPhone: patientPhone || undefined,
        service,
        mode: mode ?? "video",
        date,
        time,
        notes: notes || undefined,
        amount,
        couponCode: couponCode || undefined,
        patientType: patientType === "follow-up" ? "follow-up" : "new",
        sessionType: sessionType || undefined,
        slotId,
      });
    } catch (err) {
      // createPendingBooking throws when the slot went in the last few seconds,
      // and that message is written for a patient to read.
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not start payment." },
        { status: 409 }
      );
    }

    kind = "booking";
    description = `${service} — ${date}`;
    phone = patientPhone || undefined;
  }

  const reference = paymentReference(kind === "booking" ? "TLCB" : "TLCA", targetId);

  const attempt: PaymentAttempt = {
    reference,
    gateway,
    kind,
    targetId,
    patientId: auth.uid,
    amount,
    status: "started",
    createdAt: new Date().toISOString(),
  };
  // Written before the handover, not after. The callback arrives from the
  // gateway's servers or from the patient's browser, and it is only trustworthy
  // to the extent that it names something we wrote down first.
  await adminDb.collection("paymentAttempts").doc(reference).set(attempt);

  const origin = publicOrigin(req);

  try {
    const handover = await startPayment(gateway, {
      reference,
      amountPkr: amount,
      description,
      returnUrl: `${origin}/api/payments/callback/${gateway}`,
      customer: { phone, email, name: body.patientName },
    });
    return NextResponse.json(handover);
  } catch (err) {
    console.error(`[payments/start] ${gateway}`, err);
    await adminDb.collection("paymentAttempts").doc(reference).update({ status: "failed" });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start payment." },
      { status: 502 }
    );
  }
}
