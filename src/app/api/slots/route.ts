import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Slot } from "@/types/slot";

// GET /api/slots?doctorId=&date=&service=&onlyAvailable=true
// Any authenticated user can read — patients need this to see what's
// bookable, admin needs it to manage. We deliberately avoid orderBy() here
// (sorting happens in JS below) so this doesn't need a Firestore composite
// index just to filter by doctor/date/service together.
export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");
  const service = searchParams.get("service");
  const onlyAvailable = searchParams.get("onlyAvailable") === "true";

  try {
    let query: FirebaseFirestore.Query = adminDb.collection("slots");
    if (doctorId) query = query.where("doctorId", "==", doctorId);
    if (date) query = query.where("date", "==", date);
    if (onlyAvailable) query = query.where("status", "==", "available");

    const snap = await query.get();
    let slots = snap.docs.map((d) => d.data() as Slot);

    // service is matched in JS, not Firestore — a slot with no `service`
    // set is open to any service, so it can't be expressed as a single
    // equality filter server-side.
    if (service) {
      slots = slots.filter((s) => !s.service || s.service === service);
    }

    slots.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    return NextResponse.json(slots);
  } catch (err) {
    console.error("[GET /api/slots]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load slots" },
      { status: 500 }
    );
  }
}

// POST /api/slots — admin only. Accepts either a single { time } or a
// { times: string[] } to create several slots for the same doctor/date in
// one go (e.g. adding a whole day's schedule at once).
export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { doctorId, doctorName, service, date, time, times, durationMinutes } = body;

  const timeList: string[] = Array.isArray(times) && times.length > 0 ? times : time ? [time] : [];

  if (!doctorId || !doctorName || !date || timeList.length === 0) {
    return NextResponse.json(
      { error: "doctorId, doctorName, date and at least one time are required" },
      { status: 400 }
    );
  }

  try {
    const batch = adminDb.batch();
    const created: Slot[] = [];
    for (const t of timeList) {
      const ref = adminDb.collection("slots").doc();
      const slot: Slot = {
        id: ref.id,
        doctorId,
        doctorName,
        service: service || undefined,
        date,
        time: t,
        durationMinutes: Number(durationMinutes) || 30,
        status: "available",
        createdAt: new Date().toISOString(),
      };
      batch.set(ref, slot);
      created.push(slot);
    }
    await batch.commit();
    return NextResponse.json({ ok: true, slots: created });
  } catch (err) {
    console.error("[POST /api/slots]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create slot(s)" },
      { status: 500 }
    );
  }
}

// PATCH /api/slots — admin only. Edit a slot's date/time/duration/service,
// or manually flip its status (e.g. freeing one up after a call-back
// cancellation that was handled outside the normal flow).
export async function PATCH(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, date, time, durationMinutes, service, status } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ref = adminDb.collection("slots").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }
  const slot = snap.data() as Slot;

  const changingSchedule = date !== undefined || time !== undefined;
  if (changingSchedule && slot.status === "booked") {
    return NextResponse.json(
      { error: "This slot is booked — cancel that appointment before changing its date/time" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (date !== undefined) updates.date = date;
  if (time !== undefined) updates.time = time;
  if (durationMinutes !== undefined) updates.durationMinutes = Number(durationMinutes) || slot.durationMinutes;
  if (service !== undefined) updates.service = service || null;
  if (status !== undefined) {
    // Only allow manually freeing a slot here, not manually marking one
    // booked — booking always goes through /api/appointments so the
    // appointmentId stays consistent.
    if (status === "available") {
      updates.status = "available";
      updates.appointmentId = null;
    } else {
      return NextResponse.json(
        { error: "Use the appointment flow to book a slot — this can only free one up" },
        { status: 400 }
      );
    }
  }

  await ref.update(updates);
  return NextResponse.json({ ok: true });
}

// DELETE /api/slots — admin only, { id } in body. Booked slots can't be
// deleted directly so a linked appointment never points at a missing slot.
export async function DELETE(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ref = adminDb.collection("slots").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: true });
  }
  const slot = snap.data() as Slot;
  if (slot.status === "booked") {
    return NextResponse.json(
      { error: "This slot is booked — cancel that appointment before deleting it" },
      { status: 400 }
    );
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
