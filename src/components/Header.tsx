"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/Avatar";
import LanguageToggle from "@/components/LanguageToggle";
import { ChevronDownIcon, ClockIcon, MapPinIcon, PhoneIcon } from "@/components/Icons";
import { navTree, type NavItem } from "@/data/nav";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";

const dashboardPath: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

/**
 * A top-level item on the desktop bar, with its panel if it has one.
 *
 * Declared out here rather than inside Header on purpose. A component defined
 * in a render body is a new component type on every render, so React unmounts
 * and remounts the whole subtree each time — which throws away the CSS
 * transition mid-flight and makes the dropdown flicker as it opens.
 */
function DesktopItem({
  item,
  pathname,
  open,
  onOpen,
  onCloseSoon,
  onClose,
  label,
}: {
  item: NavItem;
  pathname: string;
  open: boolean;
  onOpen: () => void;
  onCloseSoon: () => void;
  onClose: () => void;
  label: string;
}) {
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <li
      className="relative"
      onMouseEnter={() => item.sections && onOpen()}
      onMouseLeave={onCloseSoon}
      // Tabbing out of the last link in the panel should close it. Checking
      // relatedTarget means moving *within* the panel doesn't.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onClose();
      }}
    >
      <Link
        href={item.href}
        onFocus={() => item.sections && onOpen()}
        aria-haspopup={item.sections ? "true" : undefined}
        aria-expanded={item.sections ? open : undefined}
        className={`flex items-center gap-1 whitespace-nowrap py-2 text-sm transition-colors ${
          active ? "font-medium text-indigo-deep" : "text-ink-soft hover:text-indigo-deep"
        }`}
      >
        {label}
        {item.sections && (
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </Link>

      {/* The underline is the active indicator, drawn rather than bordered so
          it can grow from the centre on hover. */}
      <span
        aria-hidden
        className={`absolute -bottom-px start-0 h-0.5 rounded-full bg-crimson transition-all duration-300 ${
          active || open ? "w-full" : "w-0"
        }`}
      />

      {item.sections && (
        <div
          className={`absolute start-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-150 ${
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-1 opacity-0"
          }`}
        >
          <div
            className={`rounded-2xl border border-line bg-paper p-5 shadow-[0_24px_60px_-24px_rgba(36,31,102,0.45)] ${
              item.width === "lg" ? "w-[42rem]" : "w-[19rem]"
            }`}
          >
            <div className={item.width === "lg" ? "grid grid-cols-2 gap-x-8 gap-y-5" : "space-y-4"}>
              {item.sections.map((section, i) => (
                <div key={section.heading ?? `s${i}`}>
                  {section.heading && (
                    <p className="eyebrow mb-2 text-indigo">{section.heading}</p>
                  )}
                  <ul className="space-y-0.5">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`block rounded-lg px-2.5 py-1.5 text-sm leading-snug transition-colors hover:bg-mist hover:text-indigo-deep ${
                            pathname === link.href
                              ? "font-medium text-indigo-deep"
                              : "text-ink-soft"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * The public header.
 *
 * Two bars: a thin utility strip carrying the address, the hours and the phone
 * number, and the navigation itself. The strip exists because a clinic's
 * visitors divide into two groups — people deciding whether to come, who read
 * the menu, and people who have already decided, who only want the phone
 * number. Making the second group hunt through a dropdown for it is the most
 * common mistake a clinic site makes.
 *
 * The dropdowns open on hover for a mouse and on focus for a keyboard, and
 * every top-level item is itself a link: hovering is a shortcut to the
 * sub-pages, never the only way through. On a touch screen there is no hover at
 * all, so the whole tree is reproduced as an accordion in the drawer rather
 * than being quietly unreachable.
 */
export default function Header() {
  const { user, profile, loading } = useAuth();
  const t = useT();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  /** Which desktop dropdown is showing, by href. */
  const [openKey, setOpenKey] = useState<string | null>(null);
  /** Which drawer accordion is expanded, by href. */
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  // Portals need a real document, which doesn't exist during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // A hover that leaves the bar for a fraction of a second on its way to the
  // panel below shouldn't close the panel. The delay is short enough not to
  // feel sticky and long enough to cross the gap.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function openNow(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }
  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 140);
  }
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Navigating should always close everything.
  useEffect(() => {
    setMenuOpen(false);
    setOpenKey(null);
    setDrawerKey(null);
  }, [pathname]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpenKey(null);
      setMenuOpen(false);
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const signedIn = !loading && user && profile;

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
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur">
      {/* ---- Utility strip ---- */}
      <div className="hidden bg-indigo-deep text-paper/85 lg:block">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-6 px-6 py-2 text-xs sm:px-10">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
              {site.address}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5 shrink-0" />
              {site.hours[0].label} · <span className="numeric">{site.hours[0].value}</span>
            </span>
          </div>
          <a
            href={`tel:${site.phoneE164}`}
            className="flex items-center gap-1.5 font-medium text-paper transition-opacity hover:opacity-80"
          >
            <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="numeric">{site.phone}</span>
          </a>
        </div>
      </div>

      {/* ---- Main bar ---- */}
      <div className="border-b border-line/70">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-5 py-3 sm:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src={images.logoIcon}
              alt={site.name}
              width={48}
              height={46}
              className="logo-zoom h-10 w-auto shrink-0 sm:h-11"
              priority
            />
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-ink">TLC</span>
              <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink-soft">
                Med Clinics
              </span>
            </span>
          </Link>

          <nav aria-label="Main">
            <ul className="hidden items-center gap-4 lg:flex xl:gap-7">
              {navTree.map((item) => (
                <DesktopItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  label={t(item.labelKey)}
                  open={openKey === item.href}
                  onOpen={() => openNow(item.href)}
                  onCloseSoon={closeSoon}
                  onClose={() => setOpenKey(null)}
                />
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />

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
              className="rounded-[var(--radius-sm)] p-2 text-ink-soft transition-colors hover:bg-mist hover:text-ink lg:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ---- Drawer ---- */}
      {menuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label={t("common.close")}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="animate-drawer safe-bottom absolute inset-y-0 end-0 flex w-[20rem] max-w-[88vw] flex-col overflow-y-auto bg-paper shell-scroll">
            <div className="sticky top-0 flex items-center justify-between border-b border-line/70 bg-paper px-4 py-3">
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

            <nav aria-label="Main" className="flex flex-col gap-0.5 p-3">
              {navTree.map((item) => {
                const expanded = drawerKey === item.href;
                return (
                  <div key={item.href}>
                    <div className="flex items-center">
                      <Link href={item.href} className="shell-nav-link flex-1">
                        {t(item.labelKey)}
                      </Link>
                      {item.sections && (
                        <button
                          type="button"
                          onClick={() => setDrawerKey(expanded ? null : item.href)}
                          aria-expanded={expanded}
                          aria-label={`${t(item.labelKey)} — ${t("common.menu")}`}
                          className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-mist hover:text-ink"
                        >
                          <ChevronDownIcon
                            className={`h-4 w-4 transition-transform duration-200 ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {item.sections && expanded && (
                      <div className="ms-3 border-s border-line/70 ps-3 pb-2">
                        {item.sections.map((section, i) => (
                          <div key={section.heading ?? `s${i}`} className="mt-2">
                            {section.heading && (
                              <p className="eyebrow px-2 py-1 text-indigo">{section.heading}</p>
                            )}
                            {section.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="block rounded-lg px-2 py-1.5 text-[0.82rem] leading-snug text-ink-soft transition-colors hover:bg-mist hover:text-ink"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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

              <a
                href={`tel:${site.phoneE164}`}
                className="flex items-center justify-center gap-2 pt-2 text-sm text-ink-soft"
              >
                <PhoneIcon className="h-4 w-4" />
                <span className="numeric">{site.phone}</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
