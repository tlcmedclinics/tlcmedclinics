import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Appointment } from "@/types";
import { sendMail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const {
    patientName,
    patientPhone,
    service,
    mode,
    date,
    time,
    notes,
    amount,
    couponCode,
    bookingType,
    paymentProvider,
    paymentReference,
    doctorId,
    doctorName,
  } = body;

  if (!service || !date || !time || !bookingType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Online payment must carry a verified payment reference from
  // /api/payments/checkout before an appointment is confirmed — no
  // reference, no confirmed booking. The call-back path never touches
  // payment and is left "pending" for the clinic to confirm by phone.
  const isPaid = bookingType === "online-payment" && Boolean(paymentReference);

  if (bookingType === "online-payment" && !isPaid) {
    return NextResponse.json(
      { error: "Payment not verified — complete payment before booking." },
      { status: 402 }
    );
  }

  const ref = adminDb.collection("appointments").doc();
  const appointment: Appointment = {
    id: ref.id,
    patientId: auth.uid,
    patientName: patientName ?? "",
    patientPhone: patientPhone ?? undefined,
    doctorId: doctorId || undefined,
    doctorName: doctorName || undefined,
    service,
    mode: mode ?? "video",
    date,
    time,
    status: isPaid ? "confirmed" : "pending",
    amount: Number(amount) || 0,
    couponCode: couponCode || undefined,
    bookingType,
    paymentStatus: isPaid ? "paid" : "unpaid",
    paymentProvider: isPaid ? paymentProvider ?? "card" : undefined,
    paymentReference: isPaid ? paymentReference : undefined,
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    await ref.set(appointment);
  } catch (err) {
    console.error("[POST /api/appointments]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save appointment" },
      { status: 500 }
    );
  }

  sendMail({
    subject: isPaid ? "New paid appointment booked" : "New appointment — call-back requested",
    text: `${appointment.patientName} (${patientPhone ?? "no phone"}) booked ${appointment.service} on ${date} ${time}. ${
      isPaid ? "Paid online — confirmed automatically." : "Wants a call to confirm — please call them back."
    }`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, appointment });
}

export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let query = adminDb.collection("appointments").orderBy("createdAt", "desc");

    if (auth.role === "patient") {
      query = query.where("patientId", "==", auth.uid) as typeof query;
    } else if (auth.role === "doctor") {
      // A doctor only ever sees the patients assigned to them by admin.
      query = query.where("doctorId", "==", auth.uid) as typeof query;
    }
    // admin sees every appointment across every doctor

    const snap = await query.get();
    const appointments = snap.docs.map((d) => d.data());

    return NextResponse.json(appointments);
  } catch (err: unknown) {
    // A where()+orderBy() combo needs a Firestore composite index the first
    // time it's ever run — without this catch, that failure crashed the
    // route with an empty 500 and no clue in the browser. Now the real
    // Firestore message (which includes a direct "create index" link when
    // that's the cause) reaches the client and the server logs.
    const message = err instanceof Error ? err.message : "Failed to load appointments";
    console.error("[GET /api/appointments]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor", "patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, status, doctorId, doctorName, prescription, cancelReason } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ref = adminDb.collection("appointments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const appointment = snap.data();

  // Only admin assigns/reassigns a doctor to a booking.
  if (doctorId !== undefined || doctorName !== undefined) {
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Only the clinic can assign a doctor" }, { status: 403 });
    }
    await ref.update({ doctorId: doctorId || null, doctorName: doctorName || null });
  }

  // Only the assigned doctor can write a prescription, and only once there's
  // actually been a session (not on a still-pending booking).
  if (prescription !== undefined) {
    if (auth.role !== "doctor" || appointment?.doctorId !== auth.uid) {
      return NextResponse.json({ error: "Only the treating doctor can add a prescription" }, { status: 403 });
    }
    await ref.update({ prescription, prescribedAt: new Date().toISOString() });
  }

  if (status) {
    if (auth.role === "patient") {
      // A patient may only cancel their own booking — nothing else.
      if (appointment?.patientId !== auth.uid) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status !== "cancelled") {
        return NextResponse.json({ error: "Patients can only cancel a booking" }, { status: 403 });
      }
      if (appointment?.status === "completed" || appointment?.status === "cancelled") {
        return NextResponse.json({ error: "This appointment can no longer be cancelled" }, { status: 400 });
      }
      const wasPaid = appointment?.paymentStatus === "paid";
      await ref.update({
        status: "cancelled",
        cancelledBy: "patient",
        cancelReason: cancelReason || undefined,
        cancelledAt: new Date().toISOString(),
        // Flag it for the clinic to actually process the refund — we don't
        // touch money automatically here, admin confirms and triggers it.
        paymentStatus: wasPaid ? "refunded" : appointment?.paymentStatus,
      });
      return NextResponse.json({ ok: true });
    }

    // A doctor may only update the status of their own assigned patients.
    if (auth.role === "doctor" && appointment?.doctorId !== auth.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const updates: Record<string, unknown> = { status };
    if (status === "cancelled") {
      updates.cancelledBy = auth.role;
      updates.cancelReason = cancelReason || undefined;
      updates.cancelledAt = new Date().toISOString();
    }
    await ref.update(updates);
  }

  return NextResponse.json({ ok: true });
}
