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

/**
 * PATCH /api/coupons/[code] — admin only.
 *
 * Used by the admin panel's active/inactive switch, and to edit a coupon's
 * terms. Only the fields below can be changed: the body used to be passed
 * straight into `update()`, which meant any key at all could be written —
 * including `usedCount`, so a coupon at its limit could be quietly reset and
 * used again, and `code`, which would leave the document under one code
 * claiming to be another.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { code } = await params;
  const body = await req.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  if (typeof body.active === "boolean") updates.active = body.active;
  if (body.discountType === "percent" || body.discountType === "flat") {
    updates.discountType = body.discountType;
  }
  if (body.discountValue !== undefined && Number.isFinite(Number(body.discountValue))) {
    updates.discountValue = Number(body.discountValue);
  }
  if (body.maxUses !== undefined && Number.isFinite(Number(body.maxUses))) {
    updates.maxUses = Math.max(1, Number(body.maxUses));
  }
  if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const ref = adminDb.collection("coupons").doc(code.toUpperCase());
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  await ref.update(updates);
  return NextResponse.json({ ok: true, updated: Object.keys(updates) });
}

/**
 * DELETE /api/coupons/[code] — admin only.
 *
 * Deactivating and deleting are both offered, and they are not the same thing:
 * an inactive coupon stops working but its `usedCount` stays readable, so the
 * clinic can still see what a past campaign cost. Delete is for one created by
 * mistake.
 *
 * A coupon that has actually been used refuses to delete unless `?force=1` is
 * passed, because appointments store `couponCode` and removing the document
 * leaves those bookings pointing at a discount nobody can explain afterwards.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = await verifyRequest(req, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { code } = await params;
  const ref = adminDb.collection("coupons").doc(code.toUpperCase());
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  const coupon = snap.data() as Coupon;
  const force = req.nextUrl.searchParams.get("force") === "1";

  if (coupon.usedCount > 0 && !force) {
    return NextResponse.json(
      {
        error: `This coupon has been used ${coupon.usedCount} time(s). Deactivate it instead so the bookings that used it still make sense, or delete it anyway if you're sure.`,
        usedCount: coupon.usedCount,
        needsForce: true,
      },
      { status: 409 }
    );
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
