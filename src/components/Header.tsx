"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/Avatar";
import LanguageToggle from "@/components/LanguageToggle";
import { navLinks, site } from "@/data/site";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";

const dashboardPath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

export default function Header() {
  const { user, profile, loading } = useAuth();
  const t = useT();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Portals need a real document, which doesn't exist during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Navigating should always close the drawer.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  const signedIn = !loading && user && profile;

  // Signed out, these are the only two things that matter on the page — and
  // they need to be reachable on a phone, not just behind a desktop-only nav.
  const authButtons = (
    <>
      <Link href="/login" className="btn-outline btn-sm">
        {t("nav.login")}
      </Link>
      <Link href="/register" className="btn-primary btn-sm">
        {t("nav.register")}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image
            src="/images/logo-icon.png"
            alt="TLC Med Clinics"
            width={48}
            height={46}
            className="h-10 w-auto shrink-0 sm:h-11"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-ink">TLC</span>
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink-soft">
              Med Clinics
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
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

        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />

          <a href={`tel:${site.phone}`} className="numeric hidden text-sm text-ink-soft lg:inline">
            {site.phone}
          </a>

          {signedIn ? (
            <>
              {profile.role === "patient" && (
                <Link href="/patient/book" className="btn-primary btn-sm hidden sm:inline-flex">
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
            <div className="hidden items-center gap-2 sm:flex">{authButtons}</div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("common.menu")}
            aria-expanded={menuOpen}
            className="rounded-[var(--radius-sm)] p-2 text-ink-soft transition-colors hover:bg-mist hover:text-ink md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer. The public site had no mobile menu at all, so on a
          phone the nav links and the sign-in buttons were both unreachable. */}
      {menuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            aria-label={t("common.close")}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="animate-drawer safe-bottom absolute inset-y-0 end-0 flex w-[17rem] max-w-[85vw] flex-col overflow-y-auto bg-paper shell-scroll">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <span className="text-sm font-semibold text-ink">{t("common.menu")}</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label={t("common.close")}
                className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-mist hover:text-ink"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-0.5 p-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="shell-nav-link">
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-2 border-t border-line/70 p-4">
              {signedIn ? (
                <>
                  <Link
                    href={dashboardPath[profile.role] ?? "/"}
                    className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 transition-colors hover:bg-mist"
                  >
                    <Avatar name={profile.name} photoURL={profile.photoURL} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {profile.name}
                      </span>
                      <span className="block text-[0.7rem] text-ink-soft">
                        {t("nav.dashboard")}
                      </span>
                    </span>
                  </Link>
                  {profile.role === "patient" && (
                    <Link href="/patient/book" className="btn-primary w-full">
                      {t("nav.book")}
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2 [&>a]:w-full">{authButtons}</div>
              )}

              <a href={`tel:${site.phone}`} className="numeric block pt-2 text-center text-sm text-ink-soft">
                {site.phone}
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
