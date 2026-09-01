import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { averageRating, parseRatingAnswers } from "@/lib/rating";

// POST /api/appointments/[id]/rate
//
// The patient satisfaction survey: five questions, each 1-5. See
// src/lib/rating.ts — the questions and the validation come from there, so the
// form and this route cannot disagree about what a valid submission is.
//
// What gets written:
//   ratings        the five answers, by question key
//   rating         their mean, to two decimals
//   ratingComment  optional, capped
//   ratedAt        when
//
// `rating` is the field the admin dashboard, the per-doctor rollup and the
// doctor's own appointment list already read. Keeping the mean in it means all
// of that carried on working unchanged when the survey went from one question
// to five, and visits rated under the old single-question form still average
// together with the new ones.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["patient"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { answers: rawAnswers, comment } = (body ?? {}) as {
    answers?: unknown;
    comment?: unknown;
  };

  const answers = parseRatingAnswers(rawAnswers);
  if (!answers) {
    return NextResponse.json(
      { error: "Answer all five questions with a whole number from 1 to 5" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "You can only rate a completed appointment" },
      { status: 400 }
    );
  }
  if (appointment?.rating) {
    return NextResponse.json(
      { error: "You've already rated this appointment" },
      { status: 400 }
    );
  }

  // Built without an undefined in it. Firestore's update() rejects undefined
  // values unless the client was created with ignoreUndefinedProperties, and
  // the previous version of this route always sent `ratingComment: undefined`
  // when the patient left the box empty — which is most of the time.
  const updates: Record<string, unknown> = {
    ratings: answers,
    rating: averageRating(answers),
    ratedAt: new Date().toISOString(),
  };
  const trimmed = typeof comment === "string" ? comment.trim().slice(0, 500) : "";
  if (trimmed) updates.ratingComment = trimmed;

  try {
    await ref.update(updates);
  } catch (err) {
    console.error("[POST /api/appointments/[id]/rate]", err);
    return NextResponse.json({ error: "Couldn't save your rating" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, appointment: { ...appointment, ...updates, id } });
}
