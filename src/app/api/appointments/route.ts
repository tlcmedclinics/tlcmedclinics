import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { isMissingIndexError, missingIndexMessage } from "@/lib/firestore-errors";
import type { Appointment } from "@/types";
import type { Slot } from "@/types/slot";
import { sendMail } from "@/lib/mailer";
import { notify, notifyAllAdmins } from "@/lib/notifications";

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
    patientType,
    sessionType,
    preferredWhen,
  } = body;

  if (!service || !bookingType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // A doctor-request has no slot by definition — nobody was available to book.
  // Every other booking type must hold one.
  const isDoctorRequest = bookingType === "doctor-request";
  if (!isDoctorRequest && !slotId) {
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

  let appointment: Appointment;

  if (isDoctorRequest) {
    // No transaction needed: there's no slot to contend for. The clinic picks
    // both the doctor and the time, so this is a request record, not a hold.
    appointment = {
      id: appointmentRef.id,
      patientId: auth.uid,
      patientName: patientName ?? "",
      patientPhone: patientPhone ?? undefined,
      service,
      mode: mode ?? "video",
      date: "",
      time: "",
      status: "pending",
      amount: Number(amount) || 0,
      couponCode: couponCode || undefined,
      patientType: patientType === "follow-up" ? "follow-up" : "new",
      sessionType: sessionType || undefined,
      bookingType: "doctor-request",
      paymentStatus: "unpaid",
      notes: notes || undefined,
      needsDoctor: true,
      preferredWhen: typeof preferredWhen === "string" ? preferredWhen.slice(0, 300) : undefined,
      createdAt: new Date().toISOString(),
    } as Appointment;

    try {
      await appointmentRef.set(appointment);
    } catch (err) {
      console.error("[POST /api/appointments doctor-request]", err);
      return NextResponse.json({ error: "Could not save your request" }, { status: 500 });
    }

    sendMail({
      subject: "Appointment request — no doctor available",
      text: `${appointment.patientName} (${patientPhone ?? "no phone"}) requested ${appointment.service}. Preferred: ${appointment.preferredWhen || "not specified"}. No doctor covering this service had an open slot — please assign one.`,
    }).catch(() => {});

    await Promise.all([
      notify({
        userId: appointment.patientId,
        role: "patient",
        type: "appointment-booked",
        title: "Request received",
        message: `We received your ${appointment.service} request. The clinic will assign a doctor and confirm your time shortly.`,
        appointmentId: appointment.id,
      }),
      notifyAllAdmins({
        type: "appointment-booked",
        title: "Needs a doctor",
        message: `${appointment.patientName} requested ${appointment.service} but no doctor had an open slot. Preferred: ${appointment.preferredWhen || "not specified"}.`,
        appointmentId: appointment.id,
      }),
    ]);

    return NextResponse.json({ ok: true, appointment });
  }

  const slotRef = adminDb.collection("slots").doc(slotId);

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
        patientType: patientType === "follow-up" ? "follow-up" : "new",
        sessionType: sessionType || undefined,
        consultMode: slot.mode === "in-clinic" ? "in-clinic" : "online",
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

  const when = `${appointment.date} ${appointment.time}`;
  await Promise.all([
    notify({
      userId: appointment.patientId,
      role: "patient",
      type: isPaid ? "appointment-confirmed" : "appointment-booked",
      title: isPaid ? "Appointment confirmed" : "Appointment requested",
      message: isPaid
        ? `Your ${appointment.service} appointment on ${when} is confirmed.`
        : `We received your ${appointment.service} request for ${when} — we'll call to confirm.`,
      appointmentId: appointment.id,
    }),
    appointment.doctorId
      ? notify({
          userId: appointment.doctorId,
          role: "doctor",
          type: "appointment-booked",
          title: "New appointment",
          message: `${appointment.patientName} booked ${appointment.service} on ${when}.`,
          appointmentId: appointment.id,
        })
      : Promise.resolve(),
    notifyAllAdmins({
      type: "appointment-booked",
      title: "New appointment booked",
      message: `${appointment.patientName} booked ${appointment.service} on ${when}${
        appointment.doctorName ? ` with Dr. ${appointment.doctorName}` : ""
      }.`,
      appointmentId: appointment.id,
    }),
  ]);

  return NextResponse.json({ ok: true, appointment });
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

// GET /api/appointments?status=&patientId=&date=&limit=&before=
//
// Always scoped to the caller: a patient only ever sees their own bookings, a
// doctor only the ones assigned to them, admin sees everything. Filtering,
// ordering and paging all happen in Firestore rather than in JS — this used to
// fetch the entire collection on every call, which grew without bound as the
// clinic booked more appointments.
//
// `before` is a cursor: pass the `createdAt` of the last row you already have
// to fetch the next page. See firestore.indexes.json for the composite index
// each filter combination needs.
export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const patientId = searchParams.get("patientId");
  const date = searchParams.get("date");
  const before = searchParams.get("before");
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  try {
    let query: FirebaseFirestore.Query = adminDb.collection("appointments");

    // Role scoping comes first — this is the security boundary, not a filter.
    if (auth.role === "patient") {
      query = query.where("patientId", "==", auth.uid);
    } else if (auth.role === "doctor") {
      query = query.where("doctorId", "==", auth.uid);
      // A doctor may narrow to one of *their* patients; the doctorId filter
      // above still applies, so this can't reach another doctor's records.
      if (patientId) query = query.where("patientId", "==", patientId);
    } else if (patientId) {
      query = query.where("patientId", "==", patientId);
    }

    if (status) query = query.where("status", "==", status);
    if (date) query = query.where("date", "==", date);

    query = query.orderBy("createdAt", "desc");
    if (before) query = query.startAfter(before);

    const snap = await query.limit(limit).get();
    const appointments = snap.docs.map((d) => d.data() as Appointment);

    return NextResponse.json(appointments);
  } catch (err: unknown) {
    console.error("[GET /api/appointments]", err);
    if (isMissingIndexError(err)) {
      return NextResponse.json({ error: missingIndexMessage(err) }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Failed to load appointments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor", "patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, status, doctorId, doctorName, prescription, cancelReason, newSlotId } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ref = adminDb.collection("appointments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const appointment = snap.data() as Appointment & { slotId?: string };

  // Reschedule — admin only. Moves the booking to a different open slot:
  // frees the old slot, claims the new one, updates date/time, and notifies
  // patient + doctor + admin. Runs as a transaction so two reschedules (or
  // a reschedule racing a new booking) can't double-book the new slot.
  if (newSlotId) {
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Only the clinic can reschedule an appointment" }, { status: 403 });
    }
    if (appointment.status === "completed" || appointment.status === "cancelled") {
      return NextResponse.json({ error: "This appointment can no longer be rescheduled" }, { status: 400 });
    }
    const newSlotRef = adminDb.collection("slots").doc(newSlotId);
    const oldSlotRef = appointment.slotId ? adminDb.collection("slots").doc(appointment.slotId) : null;

    try {
      await adminDb.runTransaction(async (tx) => {
        const newSlotSnap = await tx.get(newSlotRef);
        if (!newSlotSnap.exists) throw new Error("That slot no longer exists.");
        const newSlot = newSlotSnap.data() as { status: string; date: string; time: string; doctorId: string; doctorName: string; mode?: string };
        if (newSlot.status !== "available") throw new Error("That slot was just taken — pick another.");

        if (oldSlotRef) {
          const oldSlotSnap = await tx.get(oldSlotRef);
          if (oldSlotSnap.exists) tx.update(oldSlotRef, { status: "available", appointmentId: null });
        }
        tx.update(newSlotRef, { status: "booked", appointmentId: id });
        tx.update(ref, {
          date: newSlot.date,
          time: newSlot.time,
          doctorId: newSlot.doctorId,
          doctorName: newSlot.doctorName,
          consultMode: newSlot.mode === "in-clinic" ? "in-clinic" : "online",
          slotId: newSlotId,
          // Scheduling it into a real slot is what resolves a "needs a doctor"
          // request — the patient now has both a doctor and a time.
          needsDoctor: false,
          rescheduledFrom: { date: appointment.date, time: appointment.time, at: new Date().toISOString(), by: auth.role },
        });
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not reschedule this appointment" },
        { status: 409 }
      );
    }

    const updatedSnap = await ref.get();
    const updated = updatedSnap.data() as Appointment;
    const when = `${updated.date} ${updated.time}`;
    await Promise.all([
      notify({
        userId: updated.patientId,
        role: "patient",
        type: "appointment-rescheduled",
        title: "Appointment rescheduled",
        message: `Your ${updated.service} appointment was moved to ${when}.`,
        appointmentId: updated.id,
      }),
      updated.doctorId
        ? notify({
            userId: updated.doctorId,
            role: "doctor",
            type: "appointment-rescheduled",
            title: "Appointment rescheduled",
            message: `${updated.patientName}'s ${updated.service} appointment was moved to ${when}.`,
            appointmentId: updated.id,
          })
        : Promise.resolve(),
      notifyAllAdmins({
        type: "appointment-rescheduled",
        title: "Appointment rescheduled",
        message: `${updated.patientName}'s ${updated.service} appointment was moved to ${when}.`,
        appointmentId: updated.id,
      }),
    ]);

    return NextResponse.json({ ok: true, appointment: updated });
  }

  if (doctorId !== undefined || doctorName !== undefined) {
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Only the clinic can assign a doctor" }, { status: 403 });
    }
    await ref.update({ doctorId: doctorId || null, doctorName: doctorName || null });
    if (doctorId) {
      await notify({
        userId: doctorId,
        role: "doctor",
        type: "doctor-assigned",
        title: "New appointment assigned",
        message: `${appointment.patientName}'s ${appointment.service} appointment on ${appointment.date} ${appointment.time} was assigned to you.`,
        appointmentId: appointment.id,
      });
    }
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
      await Promise.all([
        appointment.doctorId
          ? notify({
              userId: appointment.doctorId,
              role: "doctor",
              type: "appointment-cancelled",
              title: "Appointment cancelled",
              message: `${appointment.patientName} cancelled the ${appointment.service} appointment on ${appointment.date} ${appointment.time}.`,
              appointmentId: appointment.id,
            })
          : Promise.resolve(),
        notifyAllAdmins({
          type: "appointment-cancelled",
          title: "Appointment cancelled",
          message: `${appointment.patientName} cancelled the ${appointment.service} appointment on ${appointment.date} ${appointment.time}.`,
          appointmentId: appointment.id,
        }),
      ]);
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
    if (status === "cancelled" || status === "confirmed") {
      await Promise.all([
        notify({
          userId: appointment.patientId,
          role: "patient",
          type: status === "cancelled" ? "appointment-cancelled" : "appointment-confirmed",
          title: status === "cancelled" ? "Appointment cancelled" : "Appointment confirmed",
          message:
            status === "cancelled"
              ? `Your ${appointment.service} appointment on ${appointment.date} ${appointment.time} was cancelled.`
              : `Your ${appointment.service} appointment on ${appointment.date} ${appointment.time} is confirmed.`,
          appointmentId: appointment.id,
        }),
        notifyAllAdmins({
          type: status === "cancelled" ? "appointment-cancelled" : "appointment-confirmed",
          title: status === "cancelled" ? "Appointment cancelled" : "Appointment confirmed",
          message: `${appointment.patientName}'s ${appointment.service} appointment on ${appointment.date} ${appointment.time} was marked ${status} by ${auth.role}.`,
          appointmentId: appointment.id,
        }),
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}
