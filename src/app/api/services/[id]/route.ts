import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";

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

  if (body.points !== undefined) {
    updates.points = Array.isArray(body.points)
      ? body.points
      : String(body.points)
          .split("\n")
          .map((p: string) => p.trim())
          .filter(Boolean);
  }
  if (body.treatments !== undefined) {
    updates.treatments = Array.isArray(body.treatments)
      ? body.treatments
      : String(body.treatments)
          .split("\n")
          .map((t: string) => t.trim())
          .filter(Boolean);
  }
  if (body.price !== undefined) updates.price = Number(body.price) || 0;

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
