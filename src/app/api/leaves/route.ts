import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Leave, Slot } from "@/types/slot";

/**
 * Doctors' days off.
 *
 * A doctor manages their own; admin can see and manage everyone's. The
 * doctorId always comes from the caller's token when a doctor is asking, so no
 * request body can book leave in someone else's name.
 */

const MAX_LEAVE_DAYS = 180;

/** GET /api/leaves?doctorId= — a doctor's own, or admin's view of anyone's. */
export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const asked = req.nextUrl.searchParams.get("doctorId");
  const doctorId = auth.role === "doctor" ? auth.uid : asked;

  try {
    let query: FirebaseFirestore.Query = adminDb.collection("leaves");
    if (doctorId) query = query.where("doctorId", "==", doctorId);

    const snap = await query.get();
    const leaves = snap.docs
      .map((d) => d.data() as Leave)
      // Sorted here rather than in Firestore: adding an orderBy to the
      // doctorId filter would need a composite index for a list this small.
      .sort((a, b) => a.from.localeCompare(b.from));

    return NextResponse.json(leaves);
  } catch (err) {
    console.error("[GET /api/leaves]", err);
    return NextResponse.json({ error: "Failed to load leave" }, { status: 500 });
  }
}

/**
 * POST /api/leaves  { from, to, reason?, doctorId? }
 *
 * Books the days off and clears the doctor's *open* slots inside them, so the
 * calendar and the leave can't disagree.
 *
 * Slots that are already booked are deliberately left alone and reported back.
 * Cancelling a patient's appointment is not something to do silently as a side
 * effect of a doctor ticking a date — someone has to tell that patient, and the
 * response says which ones need it.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const from = String(body.from ?? "");
  const to = String(body.to ?? from);
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "Pick a start and end date." }, { status: 400 });
  }
  if (to < from) {
    return NextResponse.json({ error: "The end date is before the start date." }, { status: 400 });
  }

  const doctorId = auth.role === "doctor" ? auth.uid : String(body.doctorId ?? "");
  if (!doctorId) {
    return NextResponse.json({ error: "Which doctor is this leave for?" }, { status: 400 });
  }

  // Bounded so a mistyped year can't wipe a decade of slots.
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  if (!Number.isFinite(days) || days > MAX_LEAVE_DAYS) {
    return NextResponse.json(
      { error: `That's ${days} days. Book leave in stretches of ${MAX_LEAVE_DAYS} days or fewer.` },
      { status: 400 }
    );
  }

  try {
    const userSnap = await adminDb.collection("users").doc(doctorId).get();
    const doctorName = (userSnap.data()?.name as string | undefined) ?? "";

    const ref = adminDb.collection("leaves").doc();
    const leave: Leave = {
      id: ref.id,
      doctorId,
      doctorName,
      from,
      to,
      reason,
      createdAt: new Date().toISOString(),
    };

    // The doctor's slots across the range, in one query — then split by whether
    // a patient is already on them.
    const slotSnap = await adminDb
      .collection("slots")
      .where("doctorId", "==", doctorId)
      .where("date", ">=", from)
      .where("date", "<=", to)
      .get();

    const slots = slotSnap.docs.map((d) => d.data() as Slot);
    const open = slots.filter((s) => s.status !== "booked");
    const booked = slots.filter((s) => s.status === "booked");

    const batch = adminDb.batch();
    batch.set(ref, leave);
    for (const s of open) batch.delete(adminDb.collection("slots").doc(s.id));
    await batch.commit();

    return NextResponse.json({
      ok: true,
      leave,
      removedSlots: open.length,
      bookedSlots: booked.map((s) => ({ id: s.id, date: s.date, time: s.time })),
    });
  } catch (err) {
    console.error("[POST /api/leaves]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't save that leave" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leaves  { id }
 *
 * Removes the leave only. The slots it cleared are not restored — they were
 * deleted, and guessing which ones to recreate would be inventing a calendar.
 * The days simply become open to add slots to again.
 */
export async function DELETE(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ref = adminDb.collection("leaves").doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: true });

  const leave = snap.data() as Leave;
  if (auth.role === "doctor" && leave.doctorId !== auth.uid) {
    return NextResponse.json({ error: "Leave not found" }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
