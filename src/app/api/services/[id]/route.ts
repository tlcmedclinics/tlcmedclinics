import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { optionalNumber, optionalText, toLines } from "@/lib/service-fields";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snap = await adminDb.collection("services").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(snap.data());
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {
    ...body,
    updatedAt: new Date().toISOString(),
  };

  // The four list fields, English and Urdu. `...body` above already copied
  // whatever the form sent; these normalise the shape so a textarea's string
  // and an already-split array both end up as a clean array of lines.
  for (const key of ["points", "treatments", "pointsUr", "treatmentsUr"] as const) {
    if (body[key] !== undefined) updates[key] = toLines(body[key]);
  }

  // An emptied Urdu box has to remove the field, not store "". Otherwise
  // every service carries a blank Urdu column and the admin list can no
  // longer tell which ones still need translating.
  for (const key of ["nameUr", "shortUr", "introUr"] as const) {
    if (body[key] === undefined) continue;
    const text = optionalText(body[key]);
    updates[key] = text ?? FieldValue.delete();
  }
  /**
   * The three numeric fields, each of which can legitimately be cleared.
   *
   * An emptied input has to remove the field rather than store 0 or "". For
   * `advancePayment` that distinction is the whole point: absent means "charge
   * the full price online", 0 means "charge nothing" — so clearing the box has
   * to delete the field, not set it to zero, or the clinic would silently start
   * giving that treatment away.
   */
  for (const field of ["price", "advancePayment", "durationMinutes"] as const) {
    if (body[field] === undefined) continue;
    const value = optionalNumber(body[field]);
    updates[field] = value === undefined ? FieldValue.delete() : value;
  }

  await adminDb.collection("services").doc(id).update(updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  await adminDb.collection("services").doc(id).delete();
  return NextResponse.json({ ok: true });
}
