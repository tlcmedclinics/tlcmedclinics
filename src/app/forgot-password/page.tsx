"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { passwordResetSettings } from "@/lib/auth-actions";
import VitalsLine from "@/components/VitalsLine";
import RedirectIfSignedIn from "@/components/RedirectIfSignedIn";
import { useT } from "@/contexts/LanguageContext";
import { useNextQuery } from "@/lib/next-path";

/**
 * "I've forgotten my password."
 *
 * ── Why the answer is always the same ──
 *
 * Whatever the address, this page says the same thing: if there is an account,
 * an email is on its way. It never says "no account with that email".
 *
 * That sentence sounds helpful and is a disclosure. A form that answers
 * truthfully turns into a tool for asking "does this person have an account at
 * a mental health clinic?", one address at a time, by anyone. For this clinic
 * that is not a hypothetical inconvenience — it is a patient's medical
 * relationship, confirmed to a stranger.
 *
 * Firebase's `sendPasswordResetEmail` is careful in the same way: recent
 * versions no longer distinguish `auth/user-not-found` from success. The page
 * matches that rather than fighting it.
 *
 * ── Where the link goes ──
 *
 * `passwordResetSettings()` points the link back at this site's own
 * /auth/action, which now handles the reset itself. Without it the patient
 * lands on Google's grey default page, on a domain they have never heard of —
 * which is exactly what a phishing link looks like.
 */
function ForgotPasswordForm() {
  const t = useT();
  const nextQuery = useNextQuery();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim();

    if (!address || !address.includes("@")) {
      setError(t("auth.needEmail"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, address, passwordResetSettings());
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";

      // "No such user" is reported as success on purpose — see the note above.
      if (code === "auth/user-not-found") {
        setSent(true);
      } else if (code === "auth/invalid-email") {
        setError(t("auth.invalidEmail"));
      } else if (code === "auth/too-many-requests") {
        setError(t("auth.tooManyRequests"));
      } else if (code === "auth/network-request-failed") {
        setError(t("common.offline"));
      } else {
        console.error("[forgot-password]", err);
        setError(t("common.somethingWrong"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <p className="eyebrow text-indigo">{t("auth.resetEyebrow")}</p>
      <h1 className="mt-2.5 h2 text-ink">{t("auth.resetTitle")}</h1>
      <VitalsLine className="mt-5 h-3 w-32" />

      {sent ? (
        <div className="mt-8">
          <div className="rounded-2xl border border-line bg-paper-dim/50 px-5 py-5">
            <p className="text-sm font-semibold text-ink">{t("auth.resetSentTitle")}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t("auth.resetSentBody", { email: email.trim() })}
            </p>
            {/* Said before they go looking, not after they give up. A reset
                email in the spam folder is the single most common reason a
                patient reports that "the link never came". */}
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              {t("auth.resetSpamHint")}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <Link href={`/login${nextQuery}`} className="btn-primary btn-sm">
              {t("auth.backToSignIn")}
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              {t("auth.resetTryAnother")}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <p className="text-sm leading-relaxed text-ink-soft">{t("auth.resetBlurb")}</p>

          <label className="field">
            <span className="label">{t("settings.email")}</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-crimson/25 bg-crimson/[0.06] px-4 py-3 text-sm text-crimson-deep"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? t("auth.resetSending") : t("auth.resetSend")}
          </button>

          <p className="text-center text-sm text-ink-soft">
            <Link
              href={`/login${nextQuery}`}
              className="font-medium text-indigo hover:text-indigo-deep"
            >
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordRoute() {
  return (
    <RedirectIfSignedIn>
      <ForgotPasswordForm />
    </RedirectIfSignedIn>
  );
}
