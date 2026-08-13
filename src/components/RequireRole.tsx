"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase/client";
import type { UserRole, DoctorProfile } from "@/types";

export default function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile && profile.role !== role) {
      router.replace(`/${profile.role}/dashboard`);
    }
  }, [loading, user, profile, role, router]);

  if (loading || !user || !profile || profile.role !== role) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-ink-soft">Loading…</p>
      </div>
    );
  }

  // A doctor who self-registered but hasn't been approved yet gets a
  // dedicated waiting screen instead of the real dashboard — they have a
  // valid account and the "doctor" custom claim, but no patient data and
  // no access until Admin > Doctors approves the request.
  if (role === "doctor" && (profile as DoctorProfile).approvalStatus !== "approved") {
    const status = (profile as DoctorProfile).approvalStatus;
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        {status === "rejected" ? (
          <>
            <p className="eyebrow text-crimson-deep">Request declined</p>
            <h1 className="mt-3 h1-hero">Application not approved</h1>
            <p className="mt-4 text-sm text-ink-soft">
              The clinic wasn&apos;t able to approve your doctor account. Please contact
              the clinic directly if you believe this is a mistake.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow text-indigo">Almost there</p>
            <h1 className="mt-3 h1-hero">Waiting for admin approval</h1>
            <p className="mt-4 text-sm text-ink-soft">
              Your doctor account has been created. The clinic reviews every doctor
              request before it goes live — you&apos;ll be able to sign in and see your
              dashboard as soon as it&apos;s approved.
            </p>
          </>
        )}
        <button
          onClick={() => signOut(auth).then(() => router.replace("/login"))}
          className="mt-6 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
        >
          Log out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
