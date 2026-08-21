import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { notify, notifyAllAdmins } from "@/lib/notifications";
import {
  resolveFollowUpPrice,
  FOLLOW_UP_PAYMENT_WINDOW_HOURS,
} from "@/lib/follow-up-price";
import type { Appointment } from "@/types";
import type { Slot } from "@/types/slot";

/**
 * POST /api/appointments/[id]/follow-up  { slotId, note? }
 *
 * Books the patient's next visit straight after a session, without making them
 * go back through the booking flow. The doctor picks one of their own open
 * slots; the time is held and the patient is asked to confirm it by paying.
 *
 * The appointment starts as "awaiting-payment", not "confirmed". Previously it
 * was created confirmed, with `amount: 0` and `paymentStatus: "unpaid"`, and
 * there was no way for the patient to pay for it anywhere in the app — so every
 * follow-up a doctor booked became a free visit that looked, on every screen,
 * exactly like one that had been paid for. The doctor's time was committed
 * without the patient ever agreeing to it, and the clinic had no way of telling
 * the two apart.
 *
 * The patient now gets a notification with the price and a Pay button, and the
 * visit only becomes real when they pay. The slot is still claimed immediately
 * so nobody else can take it in the meantime — held for
 * FOLLOW_UP_PAYMENT_WINDOW_HOURS, after which the sweep in
 * /api/notifications/reminders releases it.
 *
 * Slot-based rather than a free-text date/time on purpose: the slot is the
 * only thing that prevents double-booking, and it is claimed in the same
 * transaction that creates the appointment — so two doctors (or a doctor and a
 * patient) racing for the same time can't both win.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["doctor", "admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { slotId, note } = await req.json().catch(() => ({}));
  if (!slotId) {
    return NextResponse.json({ error: "Pick a time for the follow-up" }, { status: 400 });
  }

  const sourceRef = adminDb.collection("appointments").doc(id);
  const sourceSnap = await sourceRef.get();
  if (!sourceSnap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const source = sourceSnap.data() as Appointment;

  // A doctor may only schedule a follow-up for their own patient.
  if (auth.role === "doctor" && source.doctorId !== auth.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Priced before anything is written. A follow-up nobody has put a price on
  // cannot be paid for, and creating it anyway is how the old version ended up
  // with permanently unpayable appointments sitting in patients' lists.
  const amount = await resolveFollowUpPrice();
  if (!amount) {
    return NextResponse.json(
      {
        error:
          "No follow-up price is set. Add a service under a “Follow-up” category with a price, then try again.",
      },
      { status: 409 }
    );
  }

  const paymentDueAt = new Date(
    Date.now() + FOLLOW_UP_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const followUpRef = adminDb.collection("appointments").doc();
  const slotRef = adminDb.collection("slots").doc(slotId);

  let followUp: Appointment;
  try {
    followUp = await adminDb.runTransaction(async (tx) => {
      const slotSnap = await tx.get(slotRef);
      if (!slotSnap.exists) throw new Error("SLOT_MISSING");
      const slot = slotSnap.data() as Slot;
      if (slot.status !== "available") throw new Error("SLOT_TAKEN");

      // Keep the follow-up with the doctor who actually asked for it.
      if (auth.role === "doctor" && slot.doctorId !== auth.uid) {
        throw new Error("SLOT_NOT_YOURS");
      }

      const appointment: Appointment = {
        id: followUpRef.id,
        patientId: source.patientId,
        patientName: source.patientName,
        patientPhone: source.patientPhone,
        service: source.service,
        mode: source.mode,
        consultMode: source.consultMode,
        doctorId: slot.doctorId,
        doctorName: slot.doctorName,
        date: slot.date,
        time: slot.time,
        status: "awaiting-payment",
        amount,
        patientType: "follow-up",
        bookingType: "follow-up",
        paymentStatus: "unpaid",
        paymentDueAt,
        notes: typeof note === "string" && note.trim() ? note.trim().slice(0, 500) : undefined,
        slotId,
        followUpOf: source.id,
        createdAt: new Date().toISOString(),
      } as Appointment;

      tx.set(followUpRef, appointment);
      tx.update(slotRef, { status: "booked", appointmentId: followUpRef.id });
      // Link it back so the original visit shows what was scheduled next.
      tx.update(sourceRef, { followUpAppointmentId: followUpRef.id });
      return appointment;
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "That time was just taken — please pick another." },
        { status: 409 }
      );
    }
    if (code === "SLOT_MISSING") {
      return NextResponse.json({ error: "That time no longer exists." }, { status: 404 });
    }
    if (code === "SLOT_NOT_YOURS") {
      return NextResponse.json(
        { error: "You can only schedule follow-ups in your own slots." },
        { status: 403 }
      );
    }
    console.error("[POST /api/appointments/[id]/follow-up]", err);
    return NextResponse.json({ error: "Couldn't schedule the follow-up" }, { status: 500 });
  }

  const when = `${followUp.date} at ${followUp.time}`;
  await Promise.all([
    notify({
      userId: followUp.patientId,
      role: "patient",
      type: "appointment-awaiting-payment",
      title: "Confirm your next appointment",
      // Says the price, the deadline and what happens if they do nothing.
      // "Your next appointment is booked" was the old wording, and it was the
      // reason nobody paid: it told the patient the matter was settled.
      message:
        `Dr. ${followUp.doctorName} has held ${when} for your follow-up — PKR ${followUp.amount}. ` +
        `Confirm it from your dashboard within ${FOLLOW_UP_PAYMENT_WINDOW_HOURS} hours or the time is released.` +
        (followUp.notes ? ` Note: ${followUp.notes}` : ""),
      appointmentId: followUp.id,
    }),
    notifyAllAdmins({
      type: "appointment-awaiting-payment",
      title: "Follow-up awaiting payment",
      message: `Dr. ${followUp.doctorName} held ${when} for ${followUp.patientName} (PKR ${followUp.amount}) — waiting on the patient to pay.`,
      appointmentId: followUp.id,
    }),
  ]);

  return NextResponse.json({ ok: true, appointment: followUp });
}
