import type { ActionCodeSettings } from "firebase/auth";

/**
 * Where Firebase's verification link should bring the patient back to.
 *
 * ── Why this exists at all ──
 *
 * Without it, the email Firebase sends points at
 * `tlc-med-clinic.firebaseapp.com` — a domain the patient has never seen,
 * belonging to a Google project with a number for a name. The page it opens is
 * Google's own grey default, signed "Your project-561232508156 team". It looks
 * exactly like the kind of link people are taught not to click, and Gmail
 * agrees: it files it as spam.
 *
 * `continueUrl` is half the fix — it puts a way back to the clinic's own site
 * on that page. The other half is a console setting, because Firebase decides
 * the link's domain, not this code: Authentication → Templates → Email address
 * verification → "Customize action URL" → https://tlcmedclinics.com/auth/action
 *
 * With that set, the link in the email points at the clinic's own domain and
 * lands on `/auth/action`, which verifies and sends them straight in. Until it
 * is set, the flow still works — it just goes through Google's page first.
 */
export function verificationSettings(): ActionCodeSettings {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "https://tlcmedclinics.com");

  return {
    url: `${origin}/auth/action`,
    // false: the link opens in a browser, which is what we want. `true` is for
    // apps that intercept the link themselves, and would strip the web flow.
    handleCodeInApp: false,
  };
}
