"use client";

import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Re-exported so existing imports keep working; the implementation is shared
// with the server (see lib/phone-format.ts).
export { toE164, formatPhone } from "@/lib/phone-format";

/**
 * Phone sign-in, delivered by Twilio.
 *
 * The browser never sees the code or decides whether it was right: it asks the
 * server to send one, then hands back what the user typed. The server checks
 * it with Twilio and only then mints a Firebase custom token. Firebase remains
 * the identity system; Twilio just proves the person holds the number.
 *
 * This replaced Firebase Phone Auth, which needed an invisible reCAPTCHA in
 * the page and its own provider setup. Nothing here touches reCAPTCHA.
 */

/** The API returns i18n keys, so a failure can be shown in the user's language. */
async function readError(res: Response): Promise<{ key: string; retryAfterSeconds?: number }> {
  const data = await res.json().catch(() => ({}));
  const key = typeof data?.error === "string" ? data.error : "common.somethingWrong";
  return { key, retryAfterSeconds: data?.retryAfterSeconds };
}

export class PhoneAuthError extends Error {
  /** An i18n key, not display text. */
  readonly key: string;
  readonly retryAfterSeconds?: number;
  constructor(key: string, retryAfterSeconds?: number) {
    super(key);
    this.key = key;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Asks the server to text a code to this number. */
export async function requestCode(phone: string): Promise<void> {
  const res = await fetch("/api/auth/phone/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const { key, retryAfterSeconds } = await readError(res);
    throw new PhoneAuthError(key, retryAfterSeconds);
  }
}

/**
 * Submits the code. On success the user is signed in to Firebase and the
 * returned credential's uid can be used immediately.
 */
export async function submitCode(phone: string, code: string) {
  const res = await fetch("/api/auth/phone/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) {
    const { key, retryAfterSeconds } = await readError(res);
    throw new PhoneAuthError(key, retryAfterSeconds);
  }
  const { token } = await res.json();
  return signInWithCustomToken(auth, token);
}

/**
 * Turns any thrown error into something the form can render: an i18n key, plus
 * how long to wait when the server asked us to back off.
 */
export function phoneErrorInfo(err: unknown): {
  key: string;
  retryAfterSeconds?: number;
} {
  if (err && typeof err === "object" && "key" in err) {
    const e = err as { key?: unknown; retryAfterSeconds?: unknown };
    return {
      key: typeof e.key === "string" ? e.key : "common.somethingWrong",
      retryAfterSeconds:
        typeof e.retryAfterSeconds === "number" ? e.retryAfterSeconds : undefined,
    };
  }
  return { key: "common.somethingWrong" };
}
