"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/LanguageContext";
import { playNotificationChime } from "@/lib/notification-sound";
import type { AppNotification } from "@/types";

// Renders a bell icon with a live unread badge — updates in real time as
// new notifications land in Firestore (no polling), and chimes when one
// arrives. Drop this into any panel layout/header; it no-ops until `profile`
// is loaded.
export default function NotificationBell() {
  const { profile } = useAuth();
  const t = useT();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Ids present the last time we looked. The very first snapshot seeds this
  // without chiming — otherwise every page load would replay the backlog.
  const seenIds = useRef<Set<string> | null>(null);
  // The sound preference now lives on the user's profile (Settings) so it
  // follows them across devices. Read through a ref so the snapshot handler
  // always sees the current value without re-subscribing.
  const soundOn = profile?.notificationSound !== false;
  const soundOnRef = useRef(soundOn);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    if (!profile?.uid) return;
    // A new subscription (different user) starts a fresh baseline.
    seenIds.current = null;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", profile.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => d.data() as AppNotification);
      setItems(next);

      const ids = new Set(next.map((n) => n.id));
      const previous = seenIds.current;
      seenIds.current = ids;

      if (!previous) return; // first snapshot — seed only, stay quiet
      const hasArrival = next.some((n) => !previous.has(n.id) && !n.read);
      if (hasArrival && soundOnRef.current) playNotificationChime();
    });
    return () => unsub();
  }, [profile?.uid]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await authedFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      }).catch(() => {});
    }
  }

  if (!profile?.uid) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line/70 text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[0.6rem] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-line/70 bg-paper shadow-lg">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <Link
              href={`/${profile.role}/settings`}
              className="rounded-full border border-line px-2.5 py-1 text-[0.65rem] font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
            >
              {t("common.settings")}
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-ink-soft">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-line/50 px-4 py-3 last:border-0 ${
                    n.read ? "" : "bg-indigo/5"
                  }`}
                >
                  <p className="text-xs font-semibold text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{n.message}</p>
                  <p className="mt-1 text-[0.65rem] text-ink-soft/70">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
