import { adminDb } from "@/lib/firebase/admin";
import type { Appointment, PatientType, SessionType } from "@/types";
import type { Slot } from "@/types/slot";
import { sendMail } from "@/lib/mailer";
import { notify, notifyAllAdmins } from "@/lib/notifications";

export interface PendingBooking {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  service: string;
  mode: Appointment["mode"];
  date: string;
  time: string;
  notes?: string;
  amount: number;
  couponCode?: string;
  patientType?: PatientType;
  sessionType?: SessionType;
  slotId: string;
  createdAt: string;
}

/** Created right before redirecting to Stripe Checkout / opening PayPal
 *  buttons, so the booking details survive the round trip to the payment
 *  provider without trusting anything the client sends back afterwards.
 *
 *  Also reserves the slot immediately (status -> "booked") in the same
 *  transaction, same as the call-back path does — so the slot disappears
 *  from other patients' booking screens the moment checkout starts, not
 *  only once payment clears. If the patient abandons checkout, the slot is
 *  released again by releasePendingBooking() below (called from the PayPal
 *  cancel/error handlers, the Stripe cancel_url page, and the Stripe
 *  checkout.session.expired webhook — see those call sites). */
export async function createPendingBooking(
  data: Omit<PendingBooking, "id" | "createdAt">
): Promise<string> {
  const ref = adminDb.collection("pendingBookings").doc();
  const slotRef = adminDb.collection("slots").doc(data.slotId);

  await adminDb.runTransaction(async (tx) => {
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists) {
      throw new Error("This slot no longer exists — please pick another.");
    }
    const slot = slotSnap.data() as Slot;
    if (slot.status !== "available") {
      throw new Error("This slot was just booked by someone else — please pick another.");
    }
    const doc: PendingBooking = { ...data, id: ref.id, createdAt: new Date().toISOString() };
    tx.set(ref, doc);
    tx.update(slotRef, { status: "booked" }); // appointmentId linked once payment finalizes
  });

  return ref.id;
}

/** Called when a patient backs out of checkout (PayPal cancel/error, Stripe
 *  cancel_url, or a Stripe session expiring unused) — frees the slot back up
 *  and removes the pending booking. Safe to call more than once, and a no-op
 *  if the booking was already finalized into a real appointment (the doc is
 *  gone by then, since finalizePendingBooking deletes it). */
export async function releasePendingBooking(pendingBookingId: string): Promise<void> {
  const pendingRef = adminDb.collection("pendingBookings").doc(pendingBookingId);

  await adminDb.runTransaction(async (tx) => {
    const pendingSnap = await tx.get(pendingRef);
    if (!pendingSnap.exists) return; // already finalized or already released
    const pending = pendingSnap.data() as PendingBooking;

    if (pending.slotId) {
      const slotRef = adminDb.collection("slots").doc(pending.slotId);
      const slotSnap = await tx.get(slotRef);
      if (slotSnap.exists && (slotSnap.data() as Slot).appointmentId === undefined) {
        tx.update(slotRef, { status: "available" });
      }
    }
    tx.delete(pendingRef);
  });
}

/**
 * Turns a paid pendingBooking into a real, confirmed Appointment.
 *
 * Genuinely idempotent — safe to call more than once for the same payment
 * (the Stripe webhook and the /verify call from the success page both call
 * this, and can race each other, especially in dev where React re-fires
 * effects). Everything runs in a single Firestore transaction: it first
 * looks for an appointment already carrying this paymentReference, and only
 * creates one + deletes the pending doc if none exists yet. If two calls
 * race, Firestore's transaction retry means the loser's retry will see
 * either the pending doc gone or the appointment already there, and it
 * returns that same appointment instead of creating a second one.
 */
export async function finalizePendingBooking(
  pendingBookingId: string,
  opts: { provider: "card" | "paypal"; reference: string }
): Promise<Appointment> {
  const pendingRef = adminDb.collection("pendingBookings").doc(pendingBookingId);

  const result = await adminDb.runTransaction(async (tx) => {
    const existingSnap = await tx.get(
      adminDb.collection("appointments").where("paymentReference", "==", opts.reference).limit(1)
    );
    if (!existingSnap.empty) {
      return { appointment: existingSnap.docs[0].data() as Appointment, created: false };
    }

    const pendingSnap = await tx.get(pendingRef);
    if (!pendingSnap.exists) {
      throw new Error("Pending booking not found or already consumed");
    }
    const pending = pendingSnap.data() as PendingBooking;

    let consultMode: Appointment["consultMode"] = "online";
    if (pending.slotId) {
      const slotSnap = await tx.get(adminDb.collection("slots").doc(pending.slotId));
      if (slotSnap.exists) {
        const slot = slotSnap.data() as Slot;
        consultMode = slot.mode === "in-clinic" ? "in-clinic" : "online";
      }
    }

    const ref = adminDb.collection("appointments").doc();
    const appointment: Appointment = {
      id: ref.id,
      patientId: pending.patientId,
      patientName: pending.patientName,
      patientPhone: pending.patientPhone,
      doctorId: pending.doctorId,
      doctorName: pending.doctorName,
      service: pending.service,
      mode: pending.mode,
      date: pending.date,
      time: pending.time,
      status: "confirmed",
      amount: pending.amount,
      couponCode: pending.couponCode,
      patientType: pending.patientType === "follow-up" ? "follow-up" : "new",
      sessionType: pending.sessionType,
      consultMode,
      bookingType: "online-payment",
      paymentStatus: "paid",
      paymentProvider: opts.provider,
      paymentReference: opts.reference,
      notes: pending.notes,
      slotId: pending.slotId,
      createdAt: new Date().toISOString(),
    };

    tx.set(ref, appointment);
    tx.delete(pendingRef);
    if (pending.slotId) {
      tx.update(adminDb.collection("slots").doc(pending.slotId), { appointmentId: ref.id });
    }

    return { appointment, created: true };
  });

  if (!result.created) {
    return result.appointment;
  }

  const appointment = result.appointment;

  sendMail({
    subject: "New paid appointment booked",
    text: `${appointment.patientName} (${appointment.patientPhone ?? "no phone"}) booked ${appointment.service} on ${appointment.date} ${appointment.time}. Paid online via ${opts.provider} — confirmed automatically.`,
  }).catch(() => {});

  const when = `${appointment.date} ${appointment.time}`;
  await Promise.all([
    notify({
      userId: appointment.patientId,
      role: "patient",
      type: "appointment-confirmed",
      title: "Appointment confirmed",
      message: `Your ${appointment.service} appointment on ${when} is confirmed.`,
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

  return appointment;
}
