"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import VitalsLine from "@/components/VitalsLine";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        String(data.email),
        String(data.password)
      );

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, uid: cred.user.uid }),
      });

      if (!res.ok) throw new Error("Profile setup failed");

      // Force a token refresh so the patient custom claim is available
      await cred.user.getIdToken(true);

      router.push("/patient/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message.replace("Firebase: ", ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 animate-fade-up">
      <p className="eyebrow text-indigo">Create account</p>
      <h1 className="mt-3 h1-hero">Join TLC Med Clinics</h1>
      <VitalsLine className="mt-5 h-3 w-40" />
      <p className="mt-4 text-sm text-ink-soft">
        Create a patient account to book appointments, pay online, and track your
        visit history.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <input name="name" required placeholder="Full name" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="phone" required placeholder="Phone number" className="input" />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password (min. 6 characters)"
          className="input"
        />

        {error && <p className="text-sm text-crimson-deep">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo hover:text-indigo-deep">
          Log in
        </Link>
      </p>
    </div>
  );
}
