"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import VitalsLine from "@/components/VitalsLine";
import { useToast } from "@/contexts/ToastContext";
import type { UserProfile } from "@/types";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a15.5 15.5 0 0 1-3.4 4.2M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5">
      <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.6c-.13 1.1-.85 2.75-2.45 3.87l-.02.15 3.56 2.76.25.02c2.26-2.09 3.58-5.16 3.58-8.47Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.79-2.93c-1.01.7-2.37 1.19-4.14 1.19-3.17 0-5.86-2.09-6.82-4.99l-.14.01-3.7 2.86-.05.14C3.28 21.3 7.31 24 12 24Z" />
      <path fill="#FBBC05" d="M5.18 14.37a7.4 7.4 0 0 1-.4-2.37c0-.83.15-1.63.39-2.37l-.01-.16-3.75-2.9-.12.06A11.98 11.98 0 0 0 0 12c0 1.93.47 3.76 1.29 5.37l3.89-3Z" />
      <path fill="#EA4335" d="M12 4.75c2.25 0 3.77.97 4.64 1.78l3.38-3.3C17.94 1.19 15.24 0 12 0 7.31 0 3.28 2.7 1.29 6.63l3.88 3.01c.97-2.9 3.66-4.89 6.83-4.89Z" />
    </svg>
  );
}

const dashboardPath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        String(data.email),
        String(data.password)
      );

      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const profile = snap.data() as UserProfile | undefined;

      toast.success("Logged in.");
      router.push(dashboardPath[profile?.role ?? "patient"] ?? "/patient/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message.replace("Firebase: ", ""));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setGoogleSubmitting(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);

      // First time this Google account has signed in anywhere on the site —
      // create a patient profile for them (doctors always go through the
      // register page so they can be routed into the approval queue).
      if (!snap.exists()) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: cred.user.uid,
            name: cred.user.displayName || "Google user",
            email: cred.user.email,
            role: "patient",
          }),
        });
        if (!res.ok) throw new Error("Couldn't finish setting up your account");
        await cred.user.getIdToken(true);
        toast.success("Account created — welcome!");
        router.push("/patient/dashboard");
        return;
      }

      const profile = snap.data() as UserProfile;
      toast.success("Logged in.");
      router.push(dashboardPath[profile.role] ?? "/patient/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't sign in with Google. Please try again.";
      toast.error(message.replace("Firebase: ", ""));
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 animate-fade-up">
      <p className="eyebrow text-indigo">Welcome back</p>
      <h1 className="mt-3 h1-hero">Log In</h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <input name="email" type="email" required placeholder="Email" className="input" />
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Password"
            className="input pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-indigo"
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting || googleSubmitting}
          className="w-full rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log In"}
        </button>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line/70" />
        <span className="text-xs text-ink-soft">or</span>
        <div className="h-px flex-1 bg-line/70" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={submitting || googleSubmitting}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full border border-line px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-indigo disabled:opacity-60"
      >
        <GoogleIcon />
        {googleSubmitting ? "Connecting…" : "Continue with Google"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-indigo hover:text-indigo-deep">
          Create one
        </Link>
      </p>
    </div>
  );
}
