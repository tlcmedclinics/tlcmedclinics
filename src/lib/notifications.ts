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

// Fire-and-forget by design — a notification failing to write should never
// block or fail the appointment action that triggered it. Callers should
// call this without awaiting inline in the critical path where possible,
// but it's async so it can be awaited when ordering matters.
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const ref = adminDb.collection("notifications").doc();
    const doc: AppNotification = {
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
    await ref.set(doc);
  } catch (err) {
    console.error("[notify] failed to write notification", err);
  }
}

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  await Promise.all(inputs.map((i) => notify(i)));
}

// Every admin gets a copy of clinic-wide events (new booking, cancellation,
// reschedule) — there's no single "the admin", so fan this out to every
// user doc with role "admin".
export async function notifyAllAdmins(
  input: Omit<NotifyInput, "userId" | "role">
): Promise<void> {
  try {
    const snap = await adminDb.collection("users").where("role", "==", "admin").get();
    await notifyMany(
      snap.docs.map((d) => ({ ...input, userId: d.id, role: "admin" as UserRole }))
    );
  } catch (err) {
    console.error("[notifyAllAdmins] failed", err);
  }
}
