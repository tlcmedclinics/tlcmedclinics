import "server-only";
import { createHash } from "crypto";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Server-side throttle on "send me a code".
 *
 * Twilio Verify has its own limits, but every send costs money and every SMS
 * lands on a real person's phone — so an unthrottled endpoint is both a bill
 * and a way to harass someone by typing their number repeatedly. This is the
 * cheap guard that runs before we ever call Twilio.
 *
 * State lives in Firestore rather than memory because serverless instances are
 * per-request: an in-memory counter would reset constantly and enforce nothing.
 *
 * The phone number is stored hashed. A collection of plaintext numbers keyed by
 * "who tried to sign in" isn't something worth keeping.
 */

const COLLECTION = "otpThrottle";

/** Minimum gap between two codes to the same number. */
const MIN_INTERVAL_MS = 45_000;

/** Ceiling per number per window, so a stuck client can't run up a bill. */
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 60 * 60 * 1000;

function keyFor(phone: string) {
  return createHash("sha256").update(phone).digest("hex").slice(0, 40);
}

export type ThrottleResult =
  | { allowed: true }
  | { allowed: false; reason: "too-soon"; retryAfterSeconds: number }
  | { allowed: false; reason: "too-many"; retryAfterSeconds: number };

/**
 * Records an attempt and says whether it may proceed. Call this *before*
 * sending, so a burst of requests can't all pass the check first.
 */
export async function consumeOtpAllowance(phone: string): Promise<ThrottleResult> {
  const ref = adminDb.collection(COLLECTION).doc(keyFor(phone));
  const now = Date.now();

  try {
    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists
        ? (snap.data() as { windowStart?: number; count?: number; lastSentAt?: number })
        : {};

      const lastSentAt = data.lastSentAt ?? 0;
      const sinceLast = now - lastSentAt;
      if (sinceLast < MIN_INTERVAL_MS) {
        return {
          allowed: false as const,
          reason: "too-soon" as const,
          retryAfterSeconds: Math.ceil((MIN_INTERVAL_MS - sinceLast) / 1000),
        };
      }

      // A fresh window resets the count.
      const windowStart =
        data.windowStart && now - data.windowStart < WINDOW_MS ? data.windowStart : now;
      const count = windowStart === data.windowStart ? data.count ?? 0 : 0;

      if (count >= MAX_PER_WINDOW) {
        return {
          allowed: false as const,
          reason: "too-many" as const,
          retryAfterSeconds: Math.ceil((windowStart + WINDOW_MS - now) / 1000),
        };
      }

      tx.set(ref, { windowStart, count: count + 1, lastSentAt: now }, { merge: true });
      return { allowed: true as const };
    });
  } catch (err) {
    // Failing open would turn a Firestore blip into an open SMS relay, so this
    // fails closed instead — the user retries, nobody gets spammed.
    console.error("[otp-throttle]", err);
    return { allowed: false, reason: "too-many", retryAfterSeconds: 60 };
  }
}
