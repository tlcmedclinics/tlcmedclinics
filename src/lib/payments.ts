import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { Appointment, PatientType, SessionType } from "@/types";
import type { Slot } from "@/types/slot";
import { sendMail } from "@/lib/mailer";
import { sendSms, smsBody } from "@/lib/sms";
import { notify, notifyAllAdmins } from "@/lib/notifications";
import { formatClinicTime } from "@/lib/clinic-time";

/**
 * How the money arrived.
 *
 * Widened from "card" | "paypal" when the local gateways landed. Stripe and
 * PayPal are both unavailable to a merchant registered in Pakistan, so the two
 * names this started with were the two that could never be used; "card" now
 * means a card taken through Safepay, and the wallets say what they are.
 *
 * Matches Appointment["paymentProvider"] deliberately — this value is written
 * straight onto the appointment.
 */
export type PaymentProviderId = "card" | "paypal" | "jazzcash" | "easypaisa" | "cash";

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

    // The doctor comes from the slot, never from the request body.
    //
    // This is the same rule POST /api/appointments already follows, and it was
    // the one place that didn't. The booking form's payload builder never
    // included doctorId at all, so every card/PayPal booking arrived here with
    // no doctor — the appointment was created unassigned, the doctor was never
    // notified (that notify() call is guarded on doctorId), and it stayed
    // invisible to them because the doctor's list queries `doctorId == uid`.
    // An admin then had to assign, by hand, the doctor the patient had already
    // chosen. Reading it from the slot fixes card and PayPal in one place and
    // can't be faked by a client either, since the slot doc is the thing that
    // actually holds the appointment.
    const doc: PendingBooking = {
      ...data,
      doctorId: slot.doctorId || undefined,
      doctorName: slot.doctorName || undefined,
      id: ref.id,
      createdAt: new Date().toISOString(),
    };
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
 * Marks an appointment that already exists as paid, and confirms it.
 *
 * The counterpart to finalizePendingBooking, for the other direction a payment
 * can arrive from. A normal booking is paid for before the appointment exists,
 * so payment *creates* it. A follow-up is booked by the doctor first and paid
 * for afterwards, so the appointment is already sitting there holding a slot,
 * waiting to be confirmed — there is nothing to create, only a state to move.
 *
 * Idempotent for the same reasons and by the same means as its counterpart: the
 * Stripe webhook and the success page's /verify call both land here and can
 * race, so the transaction checks whether the appointment is already paid and
 * returns it untouched rather than confirming it twice or double-notifying.
 */
export async function confirmAppointmentPayment(
  appointmentId: string,
  opts: { provider: PaymentProviderId; reference: string }
): Promise<Appointment> {
  const ref = adminDb.collection("appointments").doc(appointmentId);

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Appointment not found");

    const appointment = snap.data() as Appointment;

    if (appointment.paymentStatus === "paid") {
      return { appointment, changed: false };
    }

    // A hold that has already lapsed must not be revivable by a late payment —
    // the slot may well have been given to someone else by then.
    if (appointment.status === "cancelled") {
      throw new Error("This appointment was cancelled — please book a new time.");
    }

    const paidAt = new Date().toISOString();

    tx.update(ref, {
      status: "confirmed",
      paymentStatus: "paid",
      paymentProvider: opts.provider,
      paymentReference: opts.reference,
      paidAt,
      // The hold is over. Left in place, the expiry sweep would later cancel an
      // appointment that has been paid for.
      paymentDueAt: FieldValue.delete(),
    });

    const confirmed: Appointment = {
      ...appointment,
      status: "confirmed",
      paymentStatus: "paid",
      paymentProvider: opts.provider,
      paymentReference: opts.reference,
      paidAt,
      paymentDueAt: undefined,
    };

    return { appointment: confirmed, changed: true };
  });

  if (!result.changed) return result.appointment;

  const appointment = result.appointment;
  const when = `${appointment.date} ${formatClinicTime(appointment.time)}`;

  // The patient's own confirmation, to the number they gave. The clinic gets an
  // email; without this the person who just paid receives nothing outside the
  // app. Not awaited — a Twilio outage must not fail a booking that is already
  // paid for and written.
  sendSms(
    appointment.patientPhone,
    smsBody(
      `Payment received: ${appointment.service} on ${when}` +
        (appointment.doctorName ? ` with Dr. ${appointment.doctorName}` : "") +
        "."
    )
  ).catch(() => {});

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
          type: "appointment-confirmed",
          title: "Follow-up confirmed",
          message: `${appointment.patientName} paid for the follow-up on ${when}.`,
          appointmentId: appointment.id,
        })
      : Promise.resolve(),
    notifyAllAdmins({
      type: "appointment-confirmed",
      title: "Follow-up paid",
      message: `${appointment.patientName} confirmed ${when}${
        appointment.doctorName ? ` with Dr. ${appointment.doctorName}` : ""
      } — PKR ${appointment.amount}.`,
      appointmentId: appointment.id,
    }),
  ]);

  return appointment;
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
  opts: { provider: PaymentProviderId; reference: string }
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

  const when = `${appointment.date} ${formatClinicTime(appointment.time)}`;

  // The patient's own confirmation, to the number they gave. The clinic gets an
  // email; without this the person who just paid receives nothing outside the
  // app. Not awaited — a Twilio outage must not fail a booking that is already
  // paid for and written.
  sendSms(
    appointment.patientPhone,
    smsBody(
      `Confirmed: ${appointment.service} on ${when}` +
        (appointment.doctorName ? ` with Dr. ${appointment.doctorName}` : "") +
        "."
    )
  ).catch(() => {});

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
