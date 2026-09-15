"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";
import Loader from "@/components/Loader";
import { safeNext } from "@/lib/next-path";

/**
 * Keeps a signed-in person off the sign-in and sign-up forms.
 *
 * ── Why this is not cosmetic ──
 *
 * Firebase allows exactly one signed-in user per browser. Sign in again on a
 * page that never asked who was already there, and the new account silently
 * replaces the old one — same tab, no warning, and a patient who was three
 * steps into a booking is now somebody else. The most common way to reach that
 * state is entirely innocent: the dashboard is slow to load, the header still
 * shows "Sign in", and it gets clicked.
 *
 * So the form is not rendered at all until we know nobody is signed in. While
 * Firebase is still deciding, this shows the same loader the rest of the site
 * uses, which also removes the window in which the stale "Sign in" link could
 * be pressed.
 *
 * ── Where a signed-in visitor goes instead ──
 *
 * `?next=` first, if there is one — someone who was bounced here from a booking
 * page and turns out to be signed in already should land on that booking page,
 * not on a dashboard with their choice forgotten. Otherwise, their own panel,
 * by role.
 *
 * `router.replace`, never `push`: the login page must not sit in the history
 * behind the dashboard, or Back returns to a form that immediately bounces
 * forward again and the Back button appears broken.
 */

const DASHBOARD: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

export default function RedirectIfSignedIn({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (loading || !user) return;

    // The profile carries the role, and the role decides the destination. It
    // arrives a moment after the user does, so this waits for it rather than
    // guessing "patient" — a doctor sent to the patient dashboard would be
    // bounced again by RequireRole, which is two redirects and a flash of the
    // wrong panel.
    if (!profile) return;

    router.replace(safeNext() ?? DASHBOARD[profile.role] ?? "/");
  }, [loading, user, profile, router]);

  // Signed in, or not yet known. Either way the form stays off the screen.
  if (loading || user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader label={t("common.loading")} />
      </div>
    );
  }

  return <>{children}</>;
}
