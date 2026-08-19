"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { phoneErrorInfo, requestCode, submitCode } from "@/lib/phone-auth";
import type { UserProfile } from "@/types";

const dashboardPath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Phone + code sign-in, shared by the login and register pages.
 *
 * `mode` only changes what happens after the number is verified: signing in
 * routes an existing user to their dashboard, registering also asks for a name
 * and creates the profile. Verification itself is identical, so someone who
 * taps "create account" but already has one is simply signed in.
 */
export default function PhoneAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const toast = useToast();
  const t = useT();

  const [stage, setStage] = useState<"phone" | "code" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Every SMS costs money and lands on someone's phone, so the server enforces
  // a gap between sends. Mirroring it here keeps the button honest rather than
  // letting people tap into a rejection.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    if (stage === "code") codeRef.current?.focus();
  }, [stage]);

  function reportError(err: unknown) {
    const { key, retryAfterSeconds } = phoneErrorInfo(err);
    toast.error(t(key));
    // The server tells us how long it wants us to wait; honour it so the
    // button isn't offering an action that will just be rejected.
    if (retryAfterSeconds) setResendIn(retryAfterSeconds);
  }

  async function sendCode() {
    if (!phone.trim()) {
      toast.error(t("auth.enterPhone"));
      return;
    }
    setBusy(true);
    try {
      await requestCode(phone);
      setStage("code");
      setResendIn(45);
      toast.success(t("auth.codeSent"));
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      const cred = await submitCode(phone, code);

      // The Firestore profile — not the Firebase user — is what says whether
      // this person has finished signing up, because that's where the role is.
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        toast.success(t("auth.signedIn"));
        router.push(dashboardPath[profile.role] ?? "/patient/dashboard");
        return;
      }

      if (mode === "login") toast.info(t("auth.finishSignup"));
      setStage("name");
    } catch (err) {
      reportError(err);
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
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="03XX-XXXXXXX"
              className="input numeric"
            />
            <span className="field-hint">{t("auth.phoneHint")}</span>
          </label>
          <button
            type="button"
            onClick={sendCode}
            disabled={busy || resendIn > 0}
            className="btn-indigo w-full"
          >
            {busy
              ? t("auth.sending")
              : resendIn > 0
              ? t("auth.resendIn", { seconds: resendIn })
              : t("auth.sendCode")}
          </button>
        </>
      )}

      {stage === "code" && (
        <>
          <label className="field">
            <span className="label">{t("auth.codeLabel")}</span>
            <input
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && code.length >= 4 && verify()}
              placeholder="______"
              className="input numeric text-center text-lg tracking-[0.4em]"
            />
            <span className="field-hint">{t("auth.codeHint", { phone })}</span>
          </label>
          <button
            type="button"
            onClick={verify}
            disabled={busy || code.length < 4}
            className="btn-indigo w-full"
          >
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
              onClick={sendCode}
              disabled={busy || resendIn > 0}
              className="font-semibold text-indigo disabled:text-ink-soft"
            >
              {resendIn > 0 ? t("auth.resendIn", { seconds: resendIn }) : t("auth.resendCode")}
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
              onKeyDown={(e) => e.key === "Enter" && finishSignup()}
              maxLength={80}
              autoComplete="name"
              className="input"
            />
            <span className="field-hint">{t("auth.nameHint")}</span>
          </label>
          <button
            type="button"
            onClick={finishSignup}
            disabled={busy}
            className="btn-indigo w-full"
          >
            {busy ? t("common.saving") : t("auth.createAccount")}
          </button>
        </>
      )}
    </div>
  );
}
