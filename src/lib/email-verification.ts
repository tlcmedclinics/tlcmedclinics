import type { User } from "firebase/auth";

/**
 * Email verification starts applying to accounts created on or after this
 * date, and never to older ones.
 *
 * ── Why a date and not simply "everyone" ──
 *
 * Every patient who signed up before this was asked for nothing of the kind.
 * Switching the rule on for all of them at once would meet each of those
 * people, the next time they opened the site, with a wall — for a step they
 * were never told about, on an inbox some of them registered years ago and may
 * no longer read. That cost is paid entirely by people who did nothing wrong.
 *
 * So the rule looks forward. Accounts made from here on must verify; accounts
 * that already exist keep working exactly as they do today. The clinic loses
 * nothing, because nobody was verifying before either, and gains a checked
 * address on every account from now on.
 *
 * This date is the same one the mobile app uses (`AppConfig.verifyEmailFrom`).
 * If it ever changes, it has to change in both, or the same patient is let in
 * by one and stopped by the other.
 */
export const VERIFY_EMAIL_FROM = Date.UTC(2026, 8, 14); // 14 September 2026

/**
 * Whether this account has to prove it owns its email address.
 *
 * Four conditions, and each exclusion is deliberate:
 *
 *   · **There is an email.** An account made with a phone number and a 6-digit
 *     code has none. Nothing to verify, nothing to send, and the number was
 *     already proved by the code itself.
 *
 *   · **It is not already verified.** Google says so for its own accounts on
 *     the way in, which is why a "Continue with Google" account never sees
 *     this: Google has done the check, and asking again would be asking
 *     somebody to prove something we were just told.
 *
 *   · **There is a password sign-in on the account.** That is the only way in
 *     where an unproved address can be typed, because it is the only one where
 *     neither the address nor the number has to answer back.
 *
 *   · **The account was made on or after the cut-off.** See above.
 *
 * An unreadable creation time means "let them in": the cost of wrongly
 * blocking a patient who needs a doctor is not the same as the cost of wrongly
 * letting one unverified address through.
 */
export function needsEmailVerification(user: User | null): boolean {
  if (!user) return false;
  if (user.emailVerified) return false;
  if (!user.email?.trim()) return false;

  const hasPassword = user.providerData.some((p) => p.providerId === "password");
  if (!hasPassword) return false;

  const createdAt = user.metadata.creationTime;
  if (!createdAt) return false;

  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;

  return created >= VERIFY_EMAIL_FROM;
}
