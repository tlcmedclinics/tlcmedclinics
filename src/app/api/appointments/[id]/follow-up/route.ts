import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { notify, notifyAllAdmins } from "@/lib/notifications";
import type { Appointment } from "@/types";
import type { Slot } from "@/types/slot";

/**
 * POST /api/appointments/[id]/follow-up  { slotId, note? }
 *
 * Books the patient's next visit straight after a session, without making them
 * go back through the booking flow. The doctor picks one of their own open
 * slots; booking it here creates a confirmed appointment and tells the patient
 * when to come back.
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
        status: "confirmed",
        amount: 0, // priced by the clinic when the patient pays for the visit
        patientType: "follow-up",
        bookingType: "call-back",
        paymentStatus: "unpaid",
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
      type: "appointment-booked",
      title: "Your next appointment is booked",
      message: `Dr. ${followUp.doctorName} scheduled your follow-up for ${when}.${
        followUp.notes ? ` Note: ${followUp.notes}` : ""
      }`,
      appointmentId: followUp.id,
    }),
    notifyAllAdmins({
      type: "appointment-booked",
      title: "Follow-up scheduled",
      message: `Dr. ${followUp.doctorName} booked ${followUp.patientName} in for ${when}.`,
      appointmentId: followUp.id,
    }),
  ]);

  return NextResponse.json({ ok: true, appointment: followUp });
}
