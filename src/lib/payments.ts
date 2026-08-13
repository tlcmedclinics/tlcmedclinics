import { adminDb } from "@/lib/firebase/admin";
import type { Appointment } from "@/types";
import { sendMail } from "@/lib/mailer";

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
  createdAt: string;
}

/** Created right before redirecting to Stripe Checkout / opening PayPal
 *  buttons, so the booking details survive the round trip to the payment
 *  provider without trusting anything the client sends back afterwards. */
export async function createPendingBooking(
  data: Omit<PendingBooking, "id" | "createdAt">
): Promise<string> {
  const ref = adminDb.collection("pendingBookings").doc();
  const doc: PendingBooking = { ...data, id: ref.id, createdAt: new Date().toISOString() };
  await ref.set(doc);
  return ref.id;
}

/**
 * Turns a paid pendingBooking into a real, confirmed Appointment. Safe to
 * call more than once for the same payment (webhook + return-page both call
 * this) — if an appointment already exists for this paymentReference, it's
 * returned as-is instead of creating a duplicate.
 */
export async function finalizePendingBooking(
  pendingBookingId: string,
  opts: { provider: "card" | "paypal"; reference: string }
): Promise<Appointment> {
  const existing = await adminDb
    .collection("appointments")
    .where("paymentReference", "==", opts.reference)
    .limit(1)
    .get();

  if (!existing.empty) {
    return existing.docs[0].data() as Appointment;
  }

  const pendingRef = adminDb.collection("pendingBookings").doc(pendingBookingId);
  const pendingSnap = await pendingRef.get();
  if (!pendingSnap.exists) {
    throw new Error("Pending booking not found or already consumed");
  }
  const pending = pendingSnap.data() as PendingBooking;

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
    bookingType: "online-payment",
    paymentStatus: "paid",
    paymentProvider: opts.provider,
    paymentReference: opts.reference,
    notes: pending.notes,
    createdAt: new Date().toISOString(),
  };

  await ref.set(appointment);
  await pendingRef.delete();

  sendMail({
    subject: "New paid appointment booked",
    text: `${appointment.patientName} (${appointment.patientPhone ?? "no phone"}) booked ${appointment.service} on ${appointment.date} ${appointment.time}. Paid online via ${opts.provider} — confirmed automatically.`,
  }).catch(() => {});

  return appointment;
}
