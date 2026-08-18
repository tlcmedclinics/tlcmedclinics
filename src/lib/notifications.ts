import { adminDb } from "@/lib/firebase/admin";
import type { AppNotification, NotificationType, UserRole } from "@/types";

type NotifyInput = {
  userId: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
};

function buildDoc(ref: FirebaseFirestore.DocumentReference, input: NotifyInput): AppNotification {
  return {
    id: ref.id,
    userId: input.userId,
    role: input.role,
    type: input.type,
    title: input.title,
    message: input.message,
    appointmentId: input.appointmentId,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

// Fire-and-forget by design — a notification failing to write should never
// block or fail the appointment action that triggered it.
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const ref = adminDb.collection("notifications").doc();
    await ref.set(buildDoc(ref, input));
  } catch (err) {
    console.error("[notify] failed to write notification", err);
  }
}

/** Several notifications in one round trip instead of one write each. */
export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    const batch = adminDb.batch();
    for (const input of inputs) {
      const ref = adminDb.collection("notifications").doc();
      batch.set(ref, buildDoc(ref, input));
    }
    await batch.commit();
  } catch (err) {
    console.error("[notifyMany] failed to write notifications", err);
  }
}

// The admin list changes maybe twice a year, but every booking, cancellation,
// reschedule and reminder used to re-query it — the reminder cron did so once
// per due appointment. Cache it in module scope for a few minutes: a newly
// added admin starts receiving notifications within the TTL, which is well
// inside the time it takes to hand over the credentials.
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;
let adminCache: { uids: string[]; fetchedAt: number } | null = null;

async function adminUids(): Promise<string[]> {
  if (adminCache && Date.now() - adminCache.fetchedAt < ADMIN_CACHE_TTL_MS) {
    return adminCache.uids;
  }
  const snap = await adminDb.collection("users").where("role", "==", "admin").get();
  const uids = snap.docs.map((d) => d.id);
  adminCache = { uids, fetchedAt: Date.now() };
  return uids;
}

// Every admin gets a copy of clinic-wide events (new booking, cancellation,
// reschedule, reminder) — there's no single "the admin", so this fans out to
// every user doc with role "admin".
export async function notifyAllAdmins(
  input: Omit<NotifyInput, "userId" | "role">
): Promise<void> {
  try {
    const uids = await adminUids();
    await notifyMany(
      uids.map((uid) => ({ ...input, userId: uid, role: "admin" as UserRole }))
    );
  } catch (err) {
    console.error("[notifyAllAdmins] failed", err);
  }
}
