import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { UserProfile } from "@/types";

// The caller's own profile. Everything here is scoped to `auth.uid`, so this
// route can never read or write somebody else's record — that's what makes it
// safe to expose to patients and doctors alike. Admin-only operations
// (approving doctors, suspending accounts) stay in /api/doctors.

const MAX_NAME = 80;
const MAX_BIO = 600;
const MAX_SPECIALIZATION = 120;

function clamp(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : "";
}

export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const snap = await adminDb.collection("users").doc(auth.uid).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(snap.data() as UserProfile);
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const ref = adminDb.collection("users").doc(auth.uid);

  // Heartbeat is its own tiny write path — it fires every minute per active
  // doctor, so it skips validation and touches exactly one field.
  if (body.heartbeat === true) {
    await ref.set({ lastSeenAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, unknown> = {};

  const name = clamp(body.name, MAX_NAME);
  if (name !== undefined) {
    if (!name) {
      return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
    }
    updates.name = name;
  }

  const phone = clamp(body.phone, 40);
  if (phone !== undefined) updates.phone = phone || null;

  if (typeof body.photoURL === "string") {
    updates.photoURL = body.photoURL.trim() || null;
  }

  // Preferences. Stored on the user doc so they follow the person across
  // devices rather than living only in that browser's localStorage.
  if (typeof body.presenceVisible === "boolean") {
    updates.presenceVisible = body.presenceVisible;
  }
  if (typeof body.notificationSound === "boolean") {
    updates.notificationSound = body.notificationSound;
  }
  if (typeof body.messageSound === "boolean") {
    updates.messageSound = body.messageSound;
  }
  if (body.locale === "en" || body.locale === "ur") {
    updates.locale = body.locale;
  }

  // Doctor-only fields — a patient sending these is simply ignored rather than
  // rejected, so the shared settings form can post one payload for every role.
  if (auth.role === "doctor") {
    const specialization = clamp(body.specialization, MAX_SPECIALIZATION);
    if (specialization !== undefined) updates.specialization = specialization || null;

    const bio = clamp(body.bio, MAX_BIO);
    if (bio !== undefined) updates.bio = bio || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    await ref.set(updates, { merge: true });

    // Keep the Firebase Auth record in step so the name/photo are right
    // anywhere that reads the auth user rather than the Firestore doc.
    if (typeof updates.name === "string" || typeof updates.photoURL === "string") {
      await adminAuth.updateUser(auth.uid, {
        ...(typeof updates.name === "string" ? { displayName: updates.name } : {}),
        ...(typeof updates.photoURL === "string"
          ? { photoURL: updates.photoURL || undefined }
          : {}),
      });
    }

    const snap = await ref.get();
    return NextResponse.json({ ok: true, profile: snap.data() });
  } catch (err) {
    console.error("[PATCH /api/profile]", err);
    return NextResponse.json({ error: "Couldn't save your changes" }, { status: 500 });
  }
}
