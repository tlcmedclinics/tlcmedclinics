"use client";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

/**
 * Phone sign-in helpers.
 *
 * Some patients don't have an email address at all, so a phone number is a
 * first-class way into the app — not a fallback. Firebase sends the OTP
 * itself, so there's no SMS provider to configure here.
 *
 * Firebase requires a reCAPTCHA challenge before it will send a code. We use
 * the invisible variant so it never interrupts the user unless Firebase
 * decides the traffic looks automated.
 */

/** Pakistan, since that's where the clinic is. Numbers are stored in E.164. */
const DEFAULT_COUNTRY_CODE = "+92";

/**
 * "0310-040-4444" → "+923100404444".
 *
 * Patients type their number the way they'd say it; Firebase only accepts
 * E.164. An already-international number is passed through untouched.
 */
export function toE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits.length >= 8 ? `+${digits}` : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  // Local format: 03XX XXXXXXX → drop the trunk 0 and prefix the country code.
  if (digits.startsWith("0")) {
    const national = digits.slice(1);
    return national.length >= 9 ? `${DEFAULT_COUNTRY_CODE}${national}` : null;
  }
  // Already includes the country code without the plus.
  if (digits.startsWith("92")) return `+${digits}`;
  // Bare national number.
  return digits.length >= 9 ? `${DEFAULT_COUNTRY_CODE}${digits}` : null;
}

/** Display form for a stored E.164 number: +923100404444 → 0310 040 4444 */
export function formatPhone(e164?: string | null): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  const national = digits.startsWith("92") ? digits.slice(2) : digits;
  if (national.length < 10) return e164;
  return `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

// Firebase attaches the verifier to a specific DOM node and refuses to
// re-render into one it already owns, so the instance is kept per container
// and torn down explicitly when the form unmounts.
let verifier: RecaptchaVerifier | null = null;
let verifierContainerId: string | null = null;

function getVerifier(containerId: string): RecaptchaVerifier {
  if (verifier && verifierContainerId === containerId) return verifier;
  clearRecaptcha();
  verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  verifierContainerId = containerId;
  return verifier;
}

/** Tear the challenge down — call this when the form unmounts. */
export function clearRecaptcha() {
  try {
    verifier?.clear();
  } catch {
    // Already gone (fast refresh, double unmount) — nothing to do.
  }
  verifier = null;
  verifierContainerId = null;
}

/**
 * Sends the OTP. Returns the confirmation handle the caller passes back to
 * `confirmCode` along with whatever the user typed.
 */
export async function sendOtp(
  phone: string,
  containerId: string
): Promise<ConfirmationResult> {
  const e164 = toE164(phone);
  if (!e164) throw new Error("INVALID_PHONE");
  return signInWithPhoneNumber(auth, e164, getVerifier(containerId));
}

/** Completes sign-in. Throws if the code is wrong or expired. */
export async function confirmCode(confirmation: ConfirmationResult, code: string) {
  const cleaned = code.replace(/\D/g, "");
  if (cleaned.length < 6) throw new Error("INVALID_CODE");
  return confirmation.confirm(cleaned);
}

/**
 * Firebase's error codes are not user-facing. Map the ones a patient can
 * actually hit to i18n keys; anything else falls through to a generic message.
 */
export function phoneErrorKey(err: unknown): string {
  const code =
    (err as { code?: string })?.code ?? (err as { message?: string })?.message ?? "";
  if (code.includes("INVALID_PHONE") || code.includes("invalid-phone-number")) {
    return "auth.invalidPhone";
  }
  if (code.includes("INVALID_CODE") || code.includes("invalid-verification-code")) {
    return "auth.invalidCode";
  }
  if (code.includes("code-expired")) return "auth.codeExpired";
  if (code.includes("too-many-requests")) return "auth.tooManyRequests";
  if (code.includes("quota-exceeded")) return "auth.smsQuota";
  if (code.includes("operation-not-allowed")) return "auth.phoneNotEnabled";
  return "common.somethingWrong";
}
