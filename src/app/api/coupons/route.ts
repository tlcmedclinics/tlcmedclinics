import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Coupon } from "@/types";

export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const snap = await adminDb.collection("coupons").get();
  return NextResponse.json(snap.docs.map((d) => d.data()));
}

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.code || !body.discountType || !body.discountValue) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const coupon: Coupon = {
    code: String(body.code).toUpperCase(),
    discountType: body.discountType,
    discountValue: Number(body.discountValue),
    maxUses: Number(body.maxUses) || 1,
    usedCount: 0,
    restrictedEmails: body.restrictedEmails
      ? String(body.restrictedEmails).split(",").map((e: string) => e.trim())
      : undefined,
    expiresAt: body.expiresAt || undefined,
    active: true,
  };

  await adminDb.collection("coupons").doc(coupon.code).set(coupon);
  return NextResponse.json({ ok: true, coupon });
}
