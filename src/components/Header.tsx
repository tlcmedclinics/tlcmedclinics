"use client";

import Image from "next/image";
import Link from "next/link";
import { navLinks, site } from "@/data/site";
import { useAuth } from "@/contexts/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";

const dashboardPath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

export default function Header() {
  const { user, profile, loading } = useAuth();

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
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a
            href={`tel:${site.phone}`}
            className="hidden font-mono text-sm text-ink-soft lg:inline"
          >
            {site.phone}
          </a>

          {!loading && user && profile ? (
            <>
              {profile.role === "patient" && (
                <Link href="/patient/book" className="btn-primary !px-5 !py-2.5">
                  Book Appointment
                </Link>
              )}
              <Link
                href={dashboardPath[profile.role] ?? "/"}
                title="My Dashboard"
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo text-sm font-semibold text-white transition-opacity hover:opacity-85"
              >
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoURL} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  (profile.name?.trim()?.[0] ?? "?").toUpperCase()
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-outline !hidden !px-5 !py-2.5 sm:!inline-flex"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
