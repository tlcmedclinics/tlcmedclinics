import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { AppNotification } from "@/types";

// GET /api/notifications — the current user's own notifications, newest
// first. The bell also listens to Firestore directly for real-time
// updates; this endpoint exists for an initial load / non-realtime clients.
export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const snap = await adminDb
      .collection("notifications")
      .where("userId", "==", auth.uid)
      .get();
    const notifications = snap.docs
      .map((d) => d.data() as AppNotification)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
    return NextResponse.json(notifications);
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

// PATCH /api/notifications — { id } marks one as read, { all: true } marks
// every one of the caller's notifications as read.
export async function PATCH(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, all } = await req.json();

  try {
    if (all) {
      const snap = await adminDb
        .collection("notifications")
        .where("userId", "==", auth.uid)
        .where("read", "==", false)
        .get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const ref = adminDb.collection("notifications").doc(id);
    const snap = await ref.get();
    if (!snap.exists || (snap.data() as AppNotification).userId !== auth.uid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await ref.update({ read: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/notifications]", err);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
