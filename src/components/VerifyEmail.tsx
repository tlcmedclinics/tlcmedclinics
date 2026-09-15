"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { needsEmailVerification } from "@/lib/email-verification";
import { verificationSettings } from "@/lib/auth-actions";
import VitalsLine from "@/components/VitalsLine";

/**
 * "Open the link we emailed you."
 *
 * ── Why it checks by itself ──
 *
 * Firebase does not tell the app when a verification link is clicked: it
 * happens on Google's servers, in whatever tab the patient opened their inbox
 * in. The only way to find out is to ask. So this reloads the user every few
 * seconds while it is on screen, and there is a button for the impatient.
 * Somebody who has just clicked the link and comes back to a page still
 * insisting they haven't would reasonably conclude the site is broken.
 *
 * The poll is deliberately slow and stops the moment the component unmounts —
 * this is a person walking to their inbox, not a race.
 */
const POLL_MS = 4000;

/** Firebase rate-limits verification emails and its error for too many is
 *  unhelpful. Holding the button for a minute is kinder to read and keeps the
 *  account well clear of that limit. */
const RESEND_COOLDOWN_S = 60;

export default function VerifyEmail() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const toast = useToast();

  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const done = useRef(false);

  const check = useCallback(
    async (quiet: boolean) => {
      const current = auth.currentUser;
      if (!current || done.current) return;
      if (!quiet) setChecking(true);
      try {
        await current.reload();
        if (!needsEmailVerification(auth.currentUser)) {
          done.current = true;
          toast.success(t("auth.verifyThanks"));
          // The gate above re-reads the user on the next render; refresh makes
          // that happen now rather than on the patient's next click.
          router.refresh();
          return;
        }
        // Never on the quiet pass: a toast every four seconds saying "not yet"
        // would be unbearable.
        if (!quiet) toast.error(t("auth.verifyNotYet"));
      } catch {
        if (!quiet) toast.error(t("auth.verifyFailed"));
      } finally {
        if (!quiet) setChecking(false);
      }
    },
    [router, t, toast]
  );

  useEffect(() => {
    const id = setInterval(() => void check(true), POLL_MS);
    return () => clearInterval(id);
  }, [check]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function resend() {
    const current = auth.currentUser;
    if (!current || cooldown > 0 || sending) return;
    setSending(true);
    try {
      await sendEmailVerification(current, verificationSettings());
      setCooldown(RESEND_COOLDOWN_S);
      toast.success(t("auth.verifyResent"));
    } catch (err) {
      const code = (err as { code?: string })?.code;
      toast.error(
        code === "auth/too-many-requests" ? t("auth.verifyTooMany") : t("auth.verifyFailed")
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-14">
      <p className="eyebrow text-indigo">{t("auth.verifyEyebrow")}</p>
      <h1 className="mt-3 h1-hero">{t("auth.verifyHeading")}</h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      <p className="mt-5 text-sm leading-relaxed text-ink-soft">
        {t("auth.verifySentTo")}
      </p>

      {/* The address gets its own line and its own frame. It is the one thing
          on this page the patient has to check — a typo here is why the email
          never arrives, and it should be readable at a glance rather than
          buried in a sentence. */}
      <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-paper-dim/50 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo/[0.08] text-indigo-deep">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-[1.1rem] w-[1.1rem]">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink" dir="ltr">
          {user?.email}
        </span>
      </div>

      {/* Numbered, not bulleted. These are steps in an order, and two of them
          happen somewhere other than this page — a list that looks like a
          sequence is read as one. */}
      <ol className="mt-7 space-y-4">
        {[t("auth.verifyStep1"), t("auth.verifyStep2"), t("auth.verifySpam")].map(
          (step, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="numeric mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo/[0.08] text-xs font-bold text-indigo-deep">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink-soft">{step}</span>
            </li>
          )
        )}
      </ol>

      {/* Said out loud, because it changes what the patient does next: there
          is nothing to come back and press. The dot is the only motion on the
          page, which is the right amount for "we are watching". */}
      <p className="mt-6 flex items-center gap-2.5 rounded-[var(--radius-card)] bg-paper-dim/60 px-4 py-3 text-xs text-ink-soft">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo" />
        </span>
        {t("auth.verifyWatching")}
      </p>

      <button
        type="button"
        onClick={() => void check(false)}
        disabled={checking}
        className="mt-7 w-full rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
      >
        {checking ? t("common.loading") : t("auth.verifyDone")}
      </button>

      <button
        type="button"
        onClick={() => void resend()}
        disabled={cooldown > 0 || sending}
        className="mt-3 w-full rounded-full border border-line px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-indigo hover:text-indigo disabled:opacity-55 disabled:hover:border-line disabled:hover:text-ink"
      >
        {sending
          ? t("common.saving")
          : cooldown > 0
            ? `${t("auth.verifyResend")} · ${cooldown}s`
            : t("auth.verifyResend")}
      </button>

      <div className="mt-9 border-t border-line/70 pt-6 text-center">
        <p className="text-xs text-ink-soft">{t("auth.verifyWrongEmail")}</p>
        <button
          type="button"
          onClick={() => void signOut(auth).then(() => router.replace("/login"))}
          className="mt-1.5 text-sm font-semibold text-indigo hover:text-indigo-deep"
        >
          {t("auth.verifyStartAgain")}
        </button>
      </div>
    </div>
  );
}
