import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Appointment } from "@/types";
import type { Slot } from "@/types/slot";
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
    slotId,
    notes,
    amount,
    couponCode,
    bookingType,
    paymentProvider,
    paymentReference,
  } = body;

  if (!service || !slotId || !bookingType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const isPaid = bookingType === "online-payment" && Boolean(paymentReference);

  if (bookingType === "online-payment" && !isPaid) {
    return NextResponse.json(
      { error: "Payment not verified — complete payment before booking." },
      { status: 402 }
    );
  }

  const appointmentRef = adminDb.collection("appointments").doc();
  const slotRef = adminDb.collection("slots").doc(slotId);

  let appointment: Appointment;
  try {
    appointment = await adminDb.runTransaction(async (tx) => {
      const slotSnap = await tx.get(slotRef);
      if (!slotSnap.exists) {
        throw new Error("This slot no longer exists — please pick another.");
      }
      const slot = slotSnap.data() as Slot;
      if (slot.status !== "available") {
        throw new Error("This slot was just booked by someone else — please pick another.");
      }

      // Date/time/doctor always come from the slot itself, never from the
      // client — the patient only ever picks a slot, not a date/time.
      const built: Appointment = {
        id: appointmentRef.id,
        patientId: auth.uid,
        patientName: patientName ?? "",
        patientPhone: patientPhone ?? undefined,
        doctorId: slot.doctorId || undefined,
        doctorName: slot.doctorName || undefined,
        service,
        mode: mode ?? "video",
        date: slot.date,
        time: slot.time,
        status: isPaid ? "confirmed" : "pending",
        amount: Number(amount) || 0,
        couponCode: couponCode || undefined,
        bookingType,
        paymentStatus: isPaid ? "paid" : "unpaid",
        paymentProvider: isPaid ? paymentProvider ?? "card" : undefined,
        paymentReference: isPaid ? paymentReference : undefined,
        notes: notes || undefined,
        slotId,
        createdAt: new Date().toISOString(),
      } as Appointment & { slotId: string };

      tx.set(appointmentRef, built);
      tx.update(slotRef, { status: "booked", appointmentId: appointmentRef.id });
      return built;
    });
  } catch (err) {
    console.error("[POST /api/appointments]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save appointment" },
      { status: err instanceof Error && err.message.includes("just booked") ? 409 : 500 }
    );
  }

  sendMail({
    subject: isPaid ? "New paid appointment booked" : "New appointment — call-back requested",
    text: `${appointment.patientName} (${patientPhone ?? "no phone"}) booked ${appointment.service} on ${appointment.date} ${appointment.time}. ${
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
    let query: FirebaseFirestore.Query = adminDb.collection("appointments");

    if (auth.role === "patient") {
      query = query.where("patientId", "==", auth.uid);
    } else if (auth.role === "doctor") {
      query = query.where("doctorId", "==", auth.uid);
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    const snap = await query.get();
    const appointments = snap.docs.map((d) => d.data() as Appointment);

    if (auth.role !== "admin") {
      appointments.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    }

    return NextResponse.json(appointments);
  } catch (err: unknown) {
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
  const appointment = snap.data() as Appointment & { slotId?: string };
  if (doctorId !== undefined || doctorName !== undefined) {
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Only the clinic can assign a doctor" }, { status: 403 });
    }
    await ref.update({ doctorId: doctorId || null, doctorName: doctorName || null });
  }
  if (prescription !== undefined) {
    if (auth.role !== "doctor" || appointment?.doctorId !== auth.uid) {
      return NextResponse.json({ error: "Only the treating doctor can add a prescription" }, { status: 403 });
    }
    await ref.update({ prescription, prescribedAt: new Date().toISOString() });
  }

  if (status) {
    if (auth.role === "patient") {
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
        paymentStatus: wasPaid ? "refunded" : appointment?.paymentStatus,
      });
      if (appointment.slotId) {
        await adminDb
          .collection("slots")
          .doc(appointment.slotId)
          .update({ status: "available", appointmentId: null })
          .catch(() => {});
      }
      return NextResponse.json({ ok: true });
    }

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
    if (status === "cancelled" && appointment.slotId) {
      await adminDb
        .collection("slots")
        .doc(appointment.slotId)
        .update({ status: "available", appointmentId: null })
        .catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
