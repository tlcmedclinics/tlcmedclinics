"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { usePresence } from "@/lib/use-presence";
import Avatar from "@/components/Avatar";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationBell from "@/components/NotificationBell";
import RequireRole from "@/components/RequireRole";
import type { UserRole } from "@/types";
import { useConfirm } from "@/contexts/ConfirmContext";

export type NavItem = {
  href: string;
  /** i18n key, resolved here so callers pass data rather than rendered text. */
  labelKey: string;
  icon: React.ReactNode;
};

type Props = {
  role: UserRole;
  nav: NavItem[];
  children: React.ReactNode;
};

/* --- Icons -------------------------------------------------------------
   Inline so the shell has no icon-library dependency and each one inherits
   currentColor. 20px on a 24 viewBox, stroked to match the UI weight. */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-[18px] w-[18px] shrink-0",
};

export const icons = {
  overview: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  calendar: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 19v-1.5a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  stethoscope: (
    <svg {...iconProps}>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" />
      <path d="M10 12v3a5 5 0 0 0 10 0v-2" />
      <circle cx="20" cy="11" r="2" />
    </svg>
  ),
  clock: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  tag: (
    <svg {...iconProps}>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  ),
  doc: (
    <svg {...iconProps}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  ),
  plus: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  settings: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.46V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.46-1H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H10a1.6 1.6 0 0 0 1-1.46V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.46 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V10a1.6 1.6 0 0 0 1.46 1H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.46 1Z" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" className="flip-rtl" />
    </svg>
  ),
  menu: (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

export default function AppShell({ role, nav, children }: Props) {
  return (
    <RequireRole role={role}>
      <Shell role={role} nav={nav}>
        {children}
      </Shell>
    </RequireRole>
  );
}

function Shell({ role, nav, children }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const { profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Doctors are marked online automatically while they're here — no manual
  // toggle. The hook no-ops for other roles and respects the user's
  // "show my status" preference.
  usePresence(role === "doctor");

  // Navigating should always close the mobile drawer, otherwise it stays over
  // the page the user just opened.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock background scroll while the drawer covers the screen.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [drawerOpen]);

  const settingsHref = `/${role}/settings`;
  const items: NavItem[] = [
    ...nav,
    { href: settingsHref, labelKey: "nav.settings", icon: icons.settings },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const currentLabel = items.find((item) => isActive(item.href))?.labelKey;

  async function handleLogout() {
    // Asked first, because the logout control sits in the same nav as the
    // pages, and on a phone it sits next to them in a menu — a mis-tap ends
    // the session mid-consultation, and signing back in is not quick when the
    // account is a phone number waiting on an SMS code.
    const ok = await confirm({
      title: t("common.logout"),
      message: "You'll need to sign in again to get back to your dashboard.",
      confirmLabel: t("common.logout"),
      cancelLabel: "Stay signed in",
    });
    if (!ok) return;

    try {
      await signOut(auth);
      router.push("/login");
    } catch {
      toast.error(t("common.somethingWrong"));
    }
  }

  const navList = (
    <nav className="space-y-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          data-active={isActive(item.href)}
          className="shell-nav-link"
        >
          {item.icon}
          <span className="truncate">{t(item.labelKey)}</span>
        </Link>
      ))}
    </nav>
  );

  const sidebarBody = (
    <>
      <div className="px-3">
        <Link href="/" className="flex items-center gap-2.5 py-1">
          <Image
            src="/images/logo-icon.png"
            alt="TLC Med Clinics"
            width={40}
            height={38}
            className="h-9 w-auto shrink-0"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-ink">TLC</span>
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink-soft">
              Med Clinics
            </span>
          </span>
        </Link>
      </div>

      <div className="mt-5 px-3">
        <p className="eyebrow text-indigo">{t(`role.${role}`)}</p>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-3 shell-scroll">{navList}</div>

      <div className="space-y-2 border-t border-line/70 px-3 pt-3">
        <Link
          href={settingsHref}
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 transition-colors hover:bg-mist"
        >
          <Avatar name={profile?.name} photoURL={profile?.photoURL} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {profile?.name ?? "—"}
            </span>
            <span className="block truncate text-[0.7rem] text-ink-soft">
              {t("common.settings")}
            </span>
          </span>
        </Link>
        <button onClick={handleLogout} className="shell-nav-link w-full text-start">
          {icons.logout}
          <span>{t("common.logout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-paper-dim/40">
      {/* Desktop sidebar — fixed so long pages scroll under it. */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[var(--shell-sidebar)] flex-col border-e border-line/70 bg-paper py-4 lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label={t("common.close")}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <aside className="animate-drawer absolute inset-y-0 start-0 flex w-[17rem] max-w-[85vw] flex-col border-e border-line/70 bg-paper py-4">
            <div className="mb-1 flex justify-end px-3">
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t("common.close")}
                className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-mist hover:text-ink"
              >
                {icons.close}
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="lg:ps-[var(--shell-sidebar)]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex min-h-[var(--shell-topbar)] items-center gap-3 border-b border-line/70 bg-paper/90 px-4 py-2 backdrop-blur sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t("common.menu")}
            className="rounded-[var(--radius-sm)] p-2 text-ink-soft transition-colors hover:bg-mist hover:text-ink lg:hidden"
          >
            {icons.menu}
          </button>

          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {currentLabel ? t(currentLabel) : t("nav.dashboard")}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Page content. The bottom padding clears the mobile tab bar. */}
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:pb-16">
          {children}
        </main>
      </div>

      {/* Mobile tab bar — the four most-used destinations, thumb-reachable. */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex border-t border-line/70 bg-paper/95 backdrop-blur lg:hidden">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-active={isActive(item.href)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium text-ink-soft transition-colors data-[active=true]:text-indigo"
          >
            {item.icon}
            <span className="max-w-full truncate px-1">{t(item.labelKey)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
