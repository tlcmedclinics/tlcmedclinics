import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { rating, comment } = await req.json();

  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return NextResponse.json({ error: "Rating must be a whole number from 1 to 5" }, { status: 400 });
  }

  const ref = adminDb.collection("appointments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  const appointment = snap.data();

  if (appointment?.patientId !== auth.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (appointment?.status !== "completed") {
    return NextResponse.json({ error: "You can only rate a completed appointment" }, { status: 400 });
  }
  if (appointment?.rating) {
    return NextResponse.json({ error: "You've already rated this appointment" }, { status: 400 });
  }

  const updates = {
    rating: value,
    ratingComment: comment ? String(comment).slice(0, 500) : undefined,
    ratedAt: new Date().toISOString(),
  };
  await ref.update(updates);

  return NextResponse.json({ ok: true, appointment: { ...appointment, ...updates } });
}
