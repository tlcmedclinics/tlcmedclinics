import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { normaliseClinicTime } from "@/lib/clinic-time";
import { isOnLeave } from "@/lib/leaves";
import { verifyRequest } from "@/lib/auth-server";
import type { Slot } from "@/types/slot";

const MAX_SLOTS = 1000;

// GET /api/slots?doctorId=&date=&from=&to=&service=&onlyAvailable=true
// Any authenticated user can read — patients need this to see what's
// bookable, admin needs it to manage.
//
// Bounded to today onwards by default. Slots are created per doctor, per day,
// per time, so the collection grows by hundreds a month and never shrinks;
// without a lower bound this returned every slot ever created, including
// long-past ones that nobody can book. Pass an explicit `from` (YYYY-MM-DD) to
// look further back, or `date` for a single day.
//
// `service` and `mode` are still matched in JS below — see the note there.
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
  const mode = searchParams.get("mode"); // "in-clinic" | "online"
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    let query: FirebaseFirestore.Query = adminDb.collection("slots");
    if (doctorId) query = query.where("doctorId", "==", doctorId);
    if (onlyAvailable) query = query.where("status", "==", "available");

    if (date) {
      // A single explicit day — equality, no range needed.
      query = query.where("date", "==", date);
    } else {
      query = query.where("date", ">=", from || new Date().toISOString().slice(0, 10));
      if (to) query = query.where("date", "<=", to);
      // Firestore requires the range field to be ordered first; ordering by
      // date here also means the JS sort below only has to settle times.
      query = query.orderBy("date", "asc");
    }

    const snap = await query.limit(MAX_SLOTS).get();
    let slots = snap.docs.map((d) => d.data() as Slot);

    // service is matched in JS, not Firestore — a slot with no `service`
    // set is open to any service, so it can't be expressed as a single
    // equality filter server-side.
    if (service) {
      slots = slots.filter((s) => !s.service || s.service === service);
    }
    if (mode === "in-clinic" || mode === "online") {
      // Missing mode on older slots defaults to "online".
      slots = slots.filter((s) => (s.mode ?? "online") === mode);
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
  // Doctors manage their own calendar; admin manages everyone's. Which of the
  // two is talking decides whose slots can be written, below — a doctor's
  // doctorId is taken from their token, never from the request, so no request
  // body can put a slot in someone else's diary.
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { service, date, time, times, durationMinutes, mode } = body;

  // A doctor is always writing their own slots. Admin says whose.
  //
  // The name is read from the user document, not taken from the body: it is
  // denormalised onto every slot so lists need no second read, and a
  // client-supplied name would let a slot claim to belong to someone else.
  const doctorId = auth.role === "doctor" ? auth.uid : body.doctorId;
  let doctorName = body.doctorName;
  if (auth.role === "doctor") {
    const me = await adminDb.collection("users").doc(auth.uid).get();
    doctorName = (me.data()?.name as string | undefined) ?? "";
  }

  const rawTimes: string[] = Array.isArray(times) && times.length > 0 ? times : time ? [time] : [];

  if (!doctorId || !doctorName || !date || rawTimes.length === 0) {
    return NextResponse.json(
      { error: "doctorId, doctorName, date and at least one time are required" },
      { status: 400 }
    );
  }

  // Every time is stored as 24-hour "HH:mm", settled here rather than trusted
  // as typed.
  //
  // Slots used to be written down exactly as entered, so "2:45" went into
  // Firestore as "2:45" — which is not a time any reader can use. Building an
  // ISO string from it gives "2026-08-21T2:45", and that is Invalid Date rather
  // than 02:45, because ISO 8601 wants two digits for the hour. So the join
  // gate got null and refused to open for the entire appointment, and the
  // five-minute reminder had nothing to compare against. Neither failure
  // pointed anywhere near the slots form.
  //
  // Rejected rather than guessed. "2:45" reads as 02:45 here, and the clinic
  // means 14:45 — nothing in the data can tell those apart, so the person who
  // knows is asked while they are still looking at the form.
  const timeList: string[] = [];
  for (const t of rawTimes) {
    const normalised = normaliseClinicTime(String(t));
    if (!normalised) {
      return NextResponse.json(
        {
          error: `“${t}” isn't a time we can read. Write it with AM or PM — “9:00 AM”, “2:45 PM” — or as a 24-hour time like 14:45. A bare “2:45” is read as the early morning.`,
        },
        { status: 400 }
      );
    }
    timeList.push(normalised);
  }

  // A slot on a day the doctor is away is a booking the clinic will have to
  // unpick later, so it is refused at the point of creation rather than caught
  // afterwards.
  const onLeave = await isOnLeave(doctorId, date);
  if (onLeave) {
    return NextResponse.json(
      { error: `${onLeave.doctorName} is marked away from ${onLeave.from} to ${onLeave.to}. Remove that leave first if this day should be bookable.` },
      { status: 409 }
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
        mode: mode === "in-clinic" ? "in-clinic" : "online",
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
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { id, date, durationMinutes, service, status, mode } = body;
  // Reassigned below once normalised, so it can't be a const.
  let time: string | undefined = body.time;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ref = adminDb.collection("slots").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }
  const slot = snap.data() as Slot;

  // 404 rather than 403: a doctor probing ids shouldn't be able to map out
  // another doctor's calendar by which ones come back "forbidden".
  if (auth.role === "doctor" && slot.doctorId !== auth.uid) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  const changingSchedule = date !== undefined || time !== undefined;
  if (changingSchedule && slot.status === "booked") {
    return NextResponse.json(
      { error: "This slot is booked — cancel that appointment before changing its date/time" },
      { status: 400 }
    );
  }

  // Normalised on edit too. Validating only on create leaves the back door
  // open: editing a slot to "2:45" would write the same unusable string back
  // into Firestore, and the failure it causes surfaces nowhere near this route.
  if (time !== undefined) {
    const normalisedTime = normaliseClinicTime(String(time));
    if (!normalisedTime) {
      return NextResponse.json(
        { error: `“${time}” isn’t a time we can read. Write it with AM or PM — “9:00 AM”, “2:45 PM” — or as a 24-hour time like 14:45.` },
        { status: 400 }
      );
    }
    time = normalisedTime;
  }

  const updates: Record<string, unknown> = {};
  if (date !== undefined) updates.date = date;
  if (time !== undefined) updates.time = time;
  if (durationMinutes !== undefined) updates.durationMinutes = Number(durationMinutes) || slot.durationMinutes;
  if (service !== undefined) updates.service = service || null;
  if (mode !== undefined) updates.mode = mode === "in-clinic" ? "in-clinic" : "online";
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
  const auth = await verifyRequest(req, ["admin", "doctor"]);
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
  if (auth.role === "doctor" && slot.doctorId !== auth.uid) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }
  if (slot.status === "booked") {
    return NextResponse.json(
      { error: "This slot is booked — cancel that appointment before deleting it" },
      { status: 400 }
    );
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
