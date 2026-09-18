import { adminDb } from "@/lib/firebase/admin";
import { sendPush } from "@/lib/push";
import type { AppNotification, NotificationType, UserRole } from "@/types";

type NotifyInput = {
  userId: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  /** The same title in Urdu. Required — see the note on `AppNotification`. */
  titleUr: string;
  message: string;
  /** The same message in Urdu. */
  messageUr: string;
  appointmentId?: string;
};

function buildDoc(ref: FirebaseFirestore.DocumentReference, input: NotifyInput): AppNotification {
  return {
    id: ref.id,
    userId: input.userId,
    role: input.role,
    type: input.type,
    title: input.title,
    titleUr: input.titleUr,
    message: input.message,
    messageUr: input.messageUr,
    appointmentId: input.appointmentId,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * The push that goes with a written notification.
 *
 * Deliberately every notification rather than a chosen few. The bell is a
 * record; the push is the part that reaches somebody who is not looking at the
 * app — and which notifications matter enough to interrupt for is a decision
 * already made upstream, at the point where someone decided to write one at
 * all. Splitting that decision across two files means the day a new
 * notification type is added, it silently is not pushed.
 *
 * Never allowed to throw: the row is already written, and a phone that could
 * not be reached is not a reason to fail a booking.
 */
function push(input: NotifyInput): Promise<void> {
  return sendPush(input.userId, {
    title: input.title,
    titleUr: input.titleUr,
    body: input.message,
    bodyUr: input.messageUr,
    data: {
      type: input.type,
      // The app uses this to open straight onto the appointment instead of
      // dropping the patient on a list to find it themselves.
      ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
    },
  });
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
  // Outside the try above, on purpose. A push is worth attempting even if the
  // write failed — the person still needs to know their session has started.
  await push(input);
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
  await Promise.all(inputs.map(push));
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
