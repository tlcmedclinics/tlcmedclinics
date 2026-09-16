import "server-only";

/**
 * A fixed sign-in code for local development, so the phone login can be tested
 * without spending an SMS — or an upgraded Twilio account.
 *
 * ── Why this exists ──
 *
 * Twilio has no sandbox for SMS. A trial account sends real messages, but only
 * to numbers verified in its console, and nothing at all to anyone else. That
 * is a reasonable rule for Twilio and a bad one for the twentieth time you are
 * testing the sign-in screen on a Tuesday afternoon.
 *
 * So: when this is switched on, the server skips Twilio entirely and accepts
 * one code that you chose. Nothing is texted; the code is printed in the
 * terminal running `npm run dev`, which becomes the inbox.
 *
 * ── Why it cannot escape into production ──
 *
 * Two independent guards, and both must pass:
 *
 *   1. NODE_ENV must not be "production". A deployed Next.js build sets that
 *      itself, so this is off on the live site whatever its environment says.
 *   2. PHONE_AUTH_DEV_CODE must be set by hand. It is absent by default and
 *      absent from .env.example, so nothing copies it anywhere by accident.
 *
 * One guard alone would be a footgun: someone copies a .env up to the server
 * and every account on the site is one guessable code away from being signed
 * into. Two means the mistake has to be made twice, in two different places.
 */

const MIN_LENGTH = 4;
const MAX_LENGTH = 8;

let warned = false;

/** The development code, or null when the real Twilio path should be used. */
export function devPhoneCode(): string | null {
  if (process.env.NODE_ENV === "production") return null;

  const raw = process.env.PHONE_AUTH_DEV_CODE?.trim();
  if (!raw) return null;

  // Digits only, and a sane length. A code with a letter in it would be typed
  // into the numeric keypad the sign-in screen shows and could never match.
  if (!/^\d+$/.test(raw) || raw.length < MIN_LENGTH || raw.length > MAX_LENGTH) {
    console.error(
      `[phone-auth] PHONE_AUTH_DEV_CODE must be ${MIN_LENGTH}-${MAX_LENGTH} digits — ignoring it.`
    );
    return null;
  }

  // Said once, loudly. A server quietly accepting a fixed sign-in code is
  // exactly the sort of thing that should never be discovered by accident.
  if (!warned) {
    warned = true;
    console.warn(
      "\n──────── [phone-auth] DEVELOPMENT MODE ────────\n" +
        "  Phone sign-in is NOT sending SMS.\n" +
        `  Any number is accepted with the code: ${raw}\n` +
        "  Unset PHONE_AUTH_DEV_CODE to use Twilio again.\n" +
        "───────────────────────────────────────────────\n"
    );
  }

  return raw;
}
