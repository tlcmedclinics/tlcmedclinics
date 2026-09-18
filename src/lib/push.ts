import { getMessaging } from "firebase-admin/messaging";
import { adminApp, adminDb } from "@/lib/firebase/admin";

/**
 * Push notifications to the phone.
 *
 * ── Why this exists separately from lib/notifications.ts ──
 *
 * That file writes a row into `notifications`, which is what the bell reads.
 * It is the record. This is the tap on the shoulder, and the difference is the
 * whole point: a row in a collection only reaches someone who has already
 * opened the app and gone looking. If the clinic's answer to "how will I know
 * my session started?" is "keep checking", the notification has not done its
 * job — it has moved the work onto the patient.
 *
 * So every notification written through `notify()` also goes out as a push,
 * and the phone raises it whether the app is open, backgrounded or closed.
 *
 * ── The token ──
 *
 * Firebase gives each install of the app a registration token. The app sends
 * it here after signing in, and it is stored against the uid. One person can
 * have several — a phone and a tablet — and a token can belong to a different
 * person tomorrow if the app is reinstalled or someone else signs in, which is
 * why the token document carries the uid and is rewritten on every sign-in
 * rather than trusted forever.
 *
 * Tokens also die quietly: the app is uninstalled, the OS rotates it, the
 * install is restored onto a new device. Firebase reports those as
 * `registration-token-not-registered`, and they are deleted here rather than
 * retried for the life of the project.
 */

const COLLECTION = "pushTokens";

export type PushTarget = {
  title: string;
  /** The same title in Urdu. */
  titleUr: string;
  body: string;
  /** The same body in Urdu. */
  bodyUr: string;
  /** Everything here must be a string — FCM refuses anything else. */
  data?: Record<string, string>;
};

/**
 * Which language this install wants its notifications in.
 *
 * On the token document rather than the user document on purpose: a push is
 * drawn by the phone's OS from whatever text the server sent, so the language
 * has to be chosen per *device*, at send time. One person can be reading the
 * website in English on a laptop and the app in Urdu on their phone, and the
 * phone is the thing the lock screen belongs to.
 */
export type PushLocale = "en" | "ur";

type TokenDoc = {
  token: string;
  userId: string;
  platform?: string;
  /** Absent on tokens registered before this field existed — read as "en". */
  locale?: PushLocale;
  updatedAt: string;
};

/** The errors that mean "this token is gone", not "try again later". */
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/** Records this install's token against a user. Called on sign-in. */
export async function saveToken(
  userId: string,
  token: string,
  platform?: string,
  locale: PushLocale = "en"
): Promise<void> {
  // The token is the document id, not a field. Two people signing into the
  // same phone must not leave two rows both claiming that token — the second
  // sign-in overwrites the first, so a push for the previous account cannot
  // land on a screen the new one is looking at.
  await adminDb
    .collection(COLLECTION)
    .doc(token)
    .set(
      {
        token,
        userId,
        platform: platform ?? "unknown",
        locale,
        updatedAt: new Date().toISOString(),
      } satisfies TokenDoc,
      { merge: false }
    );
}

/** Forgets a token. Called on sign-out, so the next person gets nothing. */
export async function deleteToken(token: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(token).delete();
}

type Registration = { token: string; locale: PushLocale };

async function tokensFor(userId: string): Promise<Registration[]> {
  const snap = await adminDb.collection(COLLECTION).where("userId", "==", userId).get();
  return snap.docs
    .map((d) => {
      const doc = d.data() as TokenDoc;
      return { token: doc.token, locale: doc.locale === "ur" ? "ur" : "en" } as Registration;
    })
    .filter((r) => Boolean(r.token));
}

/**
 * Sends one push to every device a user has registered.
 *
 * Never throws. A push is an extra courtesy on top of a notification that has
 * already been written down — a Firebase outage, a project without messaging
 * enabled, or an expired token must not fail the booking, the payment or the
 * session start that triggered it.
 */
export async function sendPush(userId: string, message: PushTarget): Promise<void> {
  try {
    const registrations = await tokensFor(userId);
    if (registrations.length === 0) return;
    const tokens = registrations.map((r) => r.token);

    // Both languages ride along in `data` as well as the one the OS will draw.
    //
    // The `notification` block is what the phone renders on a lock screen, and
    // it can only hold one language — so the server has to choose, using the
    // locale the app registered with this token. But that locale can be stale:
    // someone switches the app to Urdu and the token is not re-registered
    // until Firebase next rotates it. When the app *is* in the foreground it
    // draws its own in-app banner, and at that moment it knows the truth about
    // its own language. Sending both pairs costs a few dozen bytes and lets it
    // render the right one regardless of what the token says.
    const bilingualData: Record<string, string> = {
      ...message.data,
      title: message.title,
      titleUr: message.titleUr,
      body: message.body,
      bodyUr: message.bodyUr,
    };

    const response = await getMessaging(adminApp).sendEach(
      registrations.map(({ token, locale }) => ({
        token,
        // `notification` rather than data-only: this is what makes Android and
        // iOS draw the notification themselves when the app is not in the
        // foreground. A data-only message needs the app to be running to show
        // anything, which is precisely the case this is meant to cover.
        notification:
          locale === "ur"
            ? { title: message.titleUr, body: message.bodyUr }
            : { title: message.title, body: message.body },
        data: bilingualData,
        android: {
          priority: "high" as const,
          notification: {
            // Appointments are time-bound. A session starting now is not worth
            // batching until the phone next wakes up.
            channelId: "tlc_appointments",
            sound: "default",
          },
        },
        apns: {
          payload: { aps: { sound: "default" } },
        },
      }))
    );

    // Clean up the dead ones. Without this the list grows forever and every
    // future send wastes a slot on a phone that no longer exists.
    const dead: string[] = [];
    response.responses.forEach((res, i) => {
      if (res.success) return;
      const code = (res.error as { code?: string } | undefined)?.code ?? "";
      if (DEAD_TOKEN_CODES.has(code)) dead.push(tokens[i]);
      else console.warn("[push] send failed", code || res.error);
    });

    if (dead.length > 0) {
      const batch = adminDb.batch();
      for (const token of dead) batch.delete(adminDb.collection(COLLECTION).doc(token));
      await batch.commit();
      console.log(`[push] removed ${dead.length} dead token(s)`);
    }
  } catch (err) {
    console.error("[push] could not send", err);
  }
}

/** Several recipients, one round trip each. Used by the reminder cron. */
export async function sendPushMany(
  items: { userId: string; message: PushTarget }[]
): Promise<void> {
  await Promise.all(items.map(({ userId, message }) => sendPush(userId, message)));
}
