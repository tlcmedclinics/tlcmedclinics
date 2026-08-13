import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Coupon } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const snap = await adminDb.collection("coupons").doc(code.toUpperCase()).get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  const coupon = snap.data() as Coupon;
  const isValid =
    coupon.active &&
    coupon.usedCount < coupon.maxUses &&
    (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date());

  return NextResponse.json({ coupon, valid: isValid });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { code } = await params;
  const updates = await req.json();
  await adminDb.collection("coupons").doc(code.toUpperCase()).update(updates);
  return NextResponse.json({ ok: true });
}
