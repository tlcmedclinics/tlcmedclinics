/**
 * Phone number formatting, shared by the browser and the API routes.
 *
 * Deliberately free of "use client" and of any Firebase import so a server
 * route can use it — the OTP endpoints normalise the number before it ever
 * reaches Twilio, and they must normalise it exactly the way the client does
 * or the "send" and "check" calls would disagree about which number is being
 * verified.
 */

/** Pakistan, since that's where the clinic is. Numbers are stored in E.164. */
const DEFAULT_COUNTRY_CODE = "+92";

/**
 * "0310-040-4444" → "+923100404444".
 *
 * Patients type their number the way they'd say it; Twilio and Firebase both
 * want E.164. An already-international number passes through untouched.
 * Returns null when the input can't be a real number, so callers can reject it
 * before spending an SMS on it.
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

  // Local format: 03XX XXXXXXX → drop the trunk 0, prefix the country code.
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
