"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";
import { auth } from "@/lib/firebase/client";
import type { UserRole, DoctorProfile } from "@/types";
import Loader from "@/components/Loader";
import VerifyEmail from "@/components/VerifyEmail";
import { needsEmailVerification } from "@/lib/email-verification";

export default function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      /**
       * Where they were going, carried through the sign-in.
       *
       * This used to be a bare replace("/login"), which threw the destination
       * away: someone who clicked "Book this appointment" on the ketamine page
       * signed in and landed on their dashboard with the treatment they had
       * chosen forgotten. The query string is where that choice lives, so it
       * has to travel too.
       *
       * Read from window rather than useSearchParams(): that hook forces every
       * page using this guard to sit inside a <Suspense> boundary or the build
       * fails, and this runs in an effect, where window is always there.
       */
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (profile && profile.role !== role) {
      router.replace(`/${profile.role}/dashboard`);
    }
  }, [loading, user, profile, role, router]);

  if (loading || !user || !profile || profile.role !== role) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader label={t("common.loading")} />
      </div>
    );
  }

  // Checked here rather than inside the sign-in page, because there are three
  // ways to arrive signed in — creating an account, signing in, and simply
  // coming back tomorrow — and all three have to end at the same place. One
  // gate is also one thing to get right.
  //
  // It sits above the doctor-approval branch on purpose: a doctor whose email
  // has never been proved should not be told they are waiting for the clinic,
  // because they are not. They are waiting for themselves.
  if (needsEmailVerification(user)) {
    return <VerifyEmail />;
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
            <h1 className="h1">{t("doctor.rejected")}</h1>
            <p className="mt-4 text-sm text-ink-soft">{t("doctor.rejectedHint")}</p>
          </>
        ) : (
          <>
            <h1 className="h1">{t("doctor.pendingApproval")}</h1>
            <p className="mt-4 text-sm text-ink-soft">{t("doctor.pendingApprovalHint")}</p>
          </>
        )}
        <button
          onClick={() => signOut(auth).then(() => router.replace("/login"))}
          className="mt-6 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
        >
          {t("common.logout")}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
