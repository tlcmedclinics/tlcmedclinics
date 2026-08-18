"use client";

import Image from "next/image";
import Link from "next/link";
import { navLinks, site } from "@/data/site";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/Avatar";
import LanguageToggle from "@/components/LanguageToggle";
import { useT } from "@/contexts/LanguageContext";

const dashboardPath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

export default function Header() {
  const { user, profile, loading } = useAuth();
  const t = useT();

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image
            src="/images/logo-icon.png"
            alt="TLC Med Clinics"
            width={48}
            height={46}
            className="h-11 w-auto shrink-0"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="h3 font-medium tracking-tight text-ink">
              TLC
            </span>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ink-soft">
              Med Clinics
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink-soft transition-colors hover:text-indigo-deep"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a
            href={`tel:${site.phone}`}
            className="numeric hidden text-sm text-ink-soft lg:inline"
          >
            {site.phone}
          </a>

          {!loading && user && profile ? (
            <>
              {profile.role === "patient" && (
                <Link href="/patient/book" className="btn-primary !px-5 !py-2.5">
                  {t("nav.book")}
                </Link>
              )}
              <Link
                href={dashboardPath[profile.role] ?? "/"}
                title={t("nav.dashboard")}
                className="transition-opacity hover:opacity-85"
              >
                <Avatar name={profile.name} photoURL={profile.photoURL} size="lg" />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-outline !hidden !px-5 !py-2.5 sm:!inline-flex"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
