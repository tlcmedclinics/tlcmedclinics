"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import type { ConfirmationResult } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { clearRecaptcha, confirmCode, phoneErrorKey, sendOtp } from "@/lib/phone-auth";
import type { UserProfile } from "@/types";

const dashboardPath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Phone + OTP sign-in, shared by the login and register pages.
 *
 * `mode` only changes what happens after the code is verified: signing in
 * routes an existing user to their dashboard, while registering also asks for
 * a name and creates the profile. The verification itself is identical, so a
 * patient who taps "register" but already has an account is signed in rather
 * than being told off.
 */
export default function PhoneAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const toast = useToast();
  const t = useT();

  // Firebase renders its invisible challenge into this node, so the id has to
  // be unique per mounted form.
  const recaptchaId = `recaptcha-${useId().replace(/:/g, "")}`;

  const [stage, setStage] = useState<"phone" | "code" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => () => clearRecaptcha(), []);

  // Firebase rate-limits SMS hard, so don't let people hammer "resend".
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function requestCode() {
    if (!phone.trim()) {
      toast.error(t("auth.enterPhone"));
      return;
    }
    setBusy(true);
    try {
      confirmationRef.current = await sendOtp(phone, recaptchaId);
      setStage("code");
      setResendIn(45);
      toast.success(t("auth.codeSent"));
    } catch (err) {
      toast.error(t(phoneErrorKey(err)));
      // A failed attempt leaves the challenge in a bad state; next try gets a
      // fresh one.
      clearRecaptcha();
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    const confirmation = confirmationRef.current;
    if (!confirmation) return;
    setBusy(true);
    try {
      const cred = await confirmCode(confirmation, code);

      // The Firestore profile — not Firebase Auth — is what decides whether
      // this is a returning user, because that's where the role lives.
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        toast.success(t("auth.signedIn"));
        router.push(dashboardPath[profile.role] ?? "/patient/dashboard");
        return;
      }

      if (mode === "login") {
        // Verified number, but nobody has ever finished signing up with it.
        setStage("name");
        toast.info(t("auth.finishSignup"));
        return;
      }
      setStage("name");
    } catch (err) {
      toast.error(t(phoneErrorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function finishSignup() {
    if (!name.trim()) {
      toast.error(t("auth.enterName"));
      return;
    }
    setBusy(true);
    try {
      const res = await authedFetch("/api/auth/phone-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("common.somethingWrong"));

      // The role arrives as a custom claim, so the token has to be refreshed
      // before any API call will be authorised as a patient.
      const { auth: clientAuth } = await import("@/lib/firebase/client");
      await clientAuth.currentUser?.getIdToken(true);

      toast.success(t("auth.accountCreated"));
      router.push(dashboardPath[data.role ?? "patient"] ?? "/patient/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {stage === "phone" && (
        <>
          <label className="field">
            <span className="label">{t("settings.phone")}</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XX-XXXXXXX"
              className="input numeric"
            />
            <span className="field-hint">{t("auth.phoneHint")}</span>
          </label>
          <button type="button" onClick={requestCode} disabled={busy} className="btn-indigo w-full">
            {busy ? t("auth.sending") : t("auth.sendCode")}
          </button>
        </>
      )}

      {stage === "code" && (
        <>
          <label className="field">
            <span className="label">{t("auth.codeLabel")}</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="______"
              className="input numeric text-center text-lg tracking-[0.4em]"
            />
            <span className="field-hint">{t("auth.codeHint", { phone })}</span>
          </label>
          <button type="button" onClick={verifyCode} disabled={busy} className="btn-indigo w-full">
            {busy ? t("auth.verifying") : t("auth.verify")}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStage("phone");
                setCode("");
              }}
              className="font-semibold text-indigo"
            >
              {t("auth.changeNumber")}
            </button>
            <button
              type="button"
              onClick={requestCode}
              disabled={busy || resendIn > 0}
              className="font-semibold text-indigo disabled:text-ink-soft"
            >
              {resendIn > 0
                ? t("auth.resendIn", { seconds: resendIn })
                : t("auth.resendCode")}
            </button>
          </div>
        </>
      )}

      {stage === "name" && (
        <>
          <label className="field">
            <span className="label">{t("settings.name")}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              className="input"
            />
            <span className="field-hint">{t("auth.nameHint")}</span>
          </label>
          <button type="button" onClick={finishSignup} disabled={busy} className="btn-indigo w-full">
            {busy ? t("common.saving") : t("auth.createAccount")}
          </button>
        </>
      )}

      {/* Firebase mounts the invisible reCAPTCHA challenge here. */}
      <div id={recaptchaId} />
    </div>
  );
}
