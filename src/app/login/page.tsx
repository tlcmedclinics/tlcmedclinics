"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import VitalsLine from "@/components/VitalsLine";
import { useToast } from "@/contexts/ToastContext";
import type { UserProfile } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

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
      router.push(profile?.role === "admin" ? "/admin/dashboard" : "/patient/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message.replace("Firebase: ", ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 animate-fade-up">
      <p className="eyebrow text-indigo">Welcome back</p>
      <h1 className="mt-3 h1-hero">Log In</h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="password" type="password" required placeholder="Password" className="input" />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don't have an account?{" "}
        <Link href="/register" className="font-medium text-indigo hover:text-indigo-deep">
          Create one
        </Link>
      </p>
    </div>
  );
}
