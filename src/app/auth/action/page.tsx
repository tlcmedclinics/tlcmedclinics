"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useT } from "@/contexts/LanguageContext";
import VitalsLine from "@/components/VitalsLine";
import Loader from "@/components/Loader";

/**
 * Where Firebase's emailed links land — once the console is pointed here.
 *
 * ── Why the clinic hosts this page and not Google ──
 *
 * By default the link in a verification email goes to
 * `tlc-med-clinic.firebaseapp.com/__/auth/action`. That is a domain the
 * patient has never seen, on a page signed "Your project-561232508156 team".
 * It is indistinguishable from a phishing link, which is roughly what Gmail
 * concluded when it put the email in spam.
 *
 * This page does the same job on the clinic's own domain, in the clinic's own
 * language, and — the part that actually matters to a patient — finishes the
 * job instead of announcing it. They click the link and arrive already
 * verified and already moving; there is no second button asking them to
 * confirm the thing they just confirmed.
 *
 * To switch it on: Firebase Console → Authentication → Templates → Email
 * address verification → pencil → Customize action URL →
 * https://tlcmedclinics.com/auth/action
 *
 * ── On the modes it does not handle ──
 *
 * That console setting applies to *every* template, so this page receives
 * password resets as well. It now handles those itself — see below — and hands
 * anything it still does not recognise back to Google's own handler rather
 * than dead-ending somebody who is locked out of their account. Silence would
 * be the worst possible behaviour here.
 */
function ActionHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT();

  const mode = params.get("mode");
  const code = params.get("oobCode");
  const continueUrl = params.get("continueUrl");

  const [state, setState] = useState<
    "working" | "done" | "failed" | "reset" | "resetDone"
  >("working");
  const [reason, setReason] = useState<string>("");

  // Password reset only. The address is read back out of the code so the form
  // can say whose password is being changed — a patient who has three email
  // addresses should not have to guess which one this link belongs to.
  const [resetEmail, setResetEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const ran = useRef(false);

  useEffect(() => {
    // React runs effects twice in development. Applying an action code twice
    // is not harmless: the first call consumes it and the second fails, so
    // without this guard every verification in dev ends on an error screen
    // for a link that worked perfectly.
    if (ran.current) return;
    ran.current = true;

    if (!code) {
      setState("failed");
      setReason(t("auth.actionMissing"));
      return;
    }

    // ── Password reset ──
    //
    // Handled here rather than bounced to Google, and the difference is not
    // cosmetic: somebody resetting a password is, by definition, already
    // unsure they are in the right place. Sending them to a grey page on
    // `tlc-med-clinic.firebaseapp.com` at that exact moment is how a real
    // email gets treated as a fake one.
    //
    // The code is verified before the form is shown, so an expired link says
    // so immediately instead of after the patient has typed a new password
    // twice.
    if (mode === "resetPassword") {
      (async () => {
        try {
          const address = await verifyPasswordResetCode(auth, code);
          setResetEmail(address);
          setState("reset");
        } catch (err) {
          const errorCode = (err as { code?: string })?.code ?? "";
          setState("failed");
          setReason(
            errorCode === "auth/expired-action-code"
              ? t("auth.actionExpired")
              : errorCode === "auth/invalid-action-code"
                ? t("auth.actionUsed")
                : t("auth.actionFailed")
          );
        }
      })();
      return;
    }

    // Anything else this page was not built for belongs to Google's handler.
    // Sending them on is better than telling them their link is broken when
    // it isn't.
    if (mode && mode !== "verifyEmail") {
      const project = auth.app.options.authDomain;
      window.location.replace(
        `https://${project}/__/auth/action?${params.toString()}`
      );
      return;
    }

    (async () => {
      try {
        // Checked before applying, so an expired or already-used link can be
        // told apart from a broken one — those need different sentences.
        await checkActionCode(auth, code);
        await applyActionCode(auth, code);

        // The signed-in user in THIS browser still has a stale token saying
        // "not verified". Reloading is what lets the gate let them through
        // without a sign-out and back in.
        await auth.currentUser?.reload().catch(() => {});

        setState("done");

        // A beat on the confirmation, then onward. Long enough to read, short
        // enough that nobody has to press anything — which is the whole point
        // of doing this here instead of on Google's page.
        setTimeout(() => {
          const target =
            continueUrl && continueUrl.startsWith(window.location.origin)
              ? continueUrl
              : auth.currentUser
                ? "/patient/dashboard"
                : "/login";
          router.replace(target);
        }, 1600);
      } catch (err) {
        const errorCode = (err as { code?: string })?.code ?? "";
        setState("failed");
        setReason(
          errorCode === "auth/expired-action-code"
            ? t("auth.actionExpired")
            : errorCode === "auth/invalid-action-code"
              ? t("auth.actionUsed")
              : t("auth.actionFailed")
        );
      }
    })();
  }, [code, mode, params, continueUrl, router, t]);

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;

    // Checked here rather than left to Firebase, because Firebase only sees
    // one of the two boxes and cannot know they disagree.
    if (password.length < 6) {
      setFormError(t("auth.needPassword"));
      return;
    }
    if (password !== confirm) {
      setFormError(t("auth.passwordsDiffer"));
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      await confirmPasswordReset(auth, code, password);
      setState("resetDone");
      // Deliberately not signed in automatically. Firebase invalidates the old
      // sessions on a reset, and typing the new password once, now, is what
      // makes it stick in someone's memory.
      setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      const errorCode = (err as { code?: string })?.code ?? "";
      setFormError(
        errorCode === "auth/weak-password"
          ? t("auth.needPassword")
          : errorCode === "auth/expired-action-code"
            ? t("auth.actionExpired")
            : errorCode === "auth/invalid-action-code"
              ? t("auth.actionUsed")
              : t("common.somethingWrong")
      );
    } finally {
      setBusy(false);
    }
  }

  if (state === "reset") {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <p className="eyebrow text-indigo">{t("auth.resetEyebrow")}</p>
        <h1 className="mt-2.5 h2 text-ink">{t("auth.resetChooseTitle")}</h1>
        <VitalsLine className="mt-5 h-3 w-32" />
        <p className="mt-5 text-sm leading-relaxed text-ink-soft">
          {t("auth.resetChooseFor", { email: resetEmail })}
        </p>

        <form onSubmit={submitNewPassword} className="mt-7 space-y-5">
          <label className="field">
            <span className="label">{t("auth.newPassword")}</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="field-hint">{t("auth.passwordHint")}</span>
          </label>

          <label className="field">
            <span className="label">{t("auth.confirmPassword")}</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-crimson/25 bg-crimson/[0.06] px-4 py-3 text-sm text-crimson-deep"
            >
              {formError}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? t("auth.resetSaving") : t("auth.resetSave")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      {state === "working" && (
        <>
          <Loader label={t("auth.actionWorking")} />
        </>
      )}

      {state === "done" && (
        <>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-indigo/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-indigo">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1 className="mt-6 h1">{t("auth.actionVerified")}</h1>
          <VitalsLine className="mx-auto mt-5 h-3 w-36" />
          <p className="mt-4 text-sm text-ink-soft">{t("auth.actionVerifiedSub")}</p>
        </>
      )}

      {state === "resetDone" && (
        <>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-indigo/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-indigo">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h1 className="mt-6 h1">{t("auth.resetDoneTitle")}</h1>
          <VitalsLine className="mx-auto mt-5 h-3 w-36" />
          <p className="mt-4 text-sm text-ink-soft">{t("auth.resetDoneSub")}</p>
        </>
      )}

      {state === "failed" && (
        <>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-crimson/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-7 w-7 text-crimson-deep">
              <path d="M12 7.5v5.5" />
              <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
              <circle cx="12" cy="12" r="9" strokeWidth="1.4" />
            </svg>
          </div>
          <h1 className="mt-6 h1">{t("auth.actionFailedTitle")}</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{reason}</p>
          <Link
            href="/login"
            className="mt-7 rounded-full bg-indigo px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-deep"
          >
            {t("nav.login")}
          </Link>
        </>
      )}
    </div>
  );
}

export default function AuthActionPage() {
  // useSearchParams needs a Suspense boundary or the production build fails.
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ActionHandler />
    </Suspense>
  );
}
