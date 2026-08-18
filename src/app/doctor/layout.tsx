"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import RequireRole from "@/components/RequireRole";
import { auth } from "@/lib/firebase/client";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const { profile } = useAuth();

  const links = [
    { href: "/doctor/dashboard", label: t("nav.overview") },
    { href: "/doctor/appointments", label: t("nav.appointments") },
    { href: "/doctor/patients", label: t("nav.patients") },
  ];

  async function handleLogout() {
    try {
      await signOut(auth);
      toast.success("Logged out.");
      router.push("/login");
    } catch {
      toast.error("Couldn't log out. Please try again.");
    }
  }

  return (
    <RequireRole role="doctor">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="eyebrow text-indigo">{t("role.doctor")}</p>
              <NotificationBell />
            </div>
            {profile?.name && (
              <p className="mt-1 truncate text-sm font-medium text-ink">{profile.name}</p>
            )}
            <nav className="mt-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname === link.href
                      ? "bg-indigo text-white"
                      : "text-ink-soft hover:bg-mist"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-8 space-y-3">
            <p className="rounded-lg border border-line/70 bg-mist/40 px-3 py-2 text-[0.7rem] leading-relaxed text-ink-soft">
              🔒 {t("security.badge")}
            </p>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg border border-line px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:border-crimson hover:text-crimson-deep"
            >
              {t("common.logout")}
            </button>
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </RequireRole>
  );
}
