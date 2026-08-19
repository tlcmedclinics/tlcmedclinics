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

// A bell with a live unread badge, updating in real time as notifications land
// in Firestore. Opening one shows its full detail and marks that one read —
// opening the panel no longer bulk-marks everything, because a patient
// glancing at the bell hadn't actually read anything.

function timeAgo(iso: string, t: (k: string, v?: Record<string, string | number>) => string) {
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("time.justNow");
  if (minutes < 60) return t("time.minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("time.hoursAgo", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("time.daysAgo", { n: days });
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const { profile } = useAuth();
  const t = useT();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Ids seen last time. The first snapshot seeds this without chiming —
  // otherwise every page load would replay the whole backlog.
  const seenIds = useRef<Set<string> | null>(null);

  // Read through a ref so the snapshot handler always sees the current
  // preference without having to re-subscribe when the user changes it.
  const soundOn = profile?.notificationSound !== false;
  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    if (!profile?.uid) return;
    seenIds.current = null; // new subscription → fresh baseline

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

      if (!previous) return; // seed only
      const hasArrival = next.some((n) => !previous.has(n.id) && !n.read);
      if (hasArrival && soundOnRef.current) playNotificationChime();
    });
    return () => unsub();
  }, [profile?.uid]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setExpandedId(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  async function markRead(id: string) {
    // Optimistic: the Firestore listener will confirm it a moment later.
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await authedFetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await authedFetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  function toggleItem(n: AppNotification) {
    const next = expandedId === n.id ? null : n.id;
    setExpandedId(next);
    if (next && !n.read) void markRead(n.id);
  }

  if (!profile?.uid) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notifications.title")}
        aria-expanded={open}
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
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[0.6rem] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-paper shadow-[var(--shadow-pop)]">
          <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
            <p className="text-sm font-semibold text-ink">{t("notifications.title")}</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[0.65rem] font-semibold text-indigo hover:text-indigo-deep"
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
              <Link
                href={`/${profile.role}/settings`}
                className="rounded-full border border-line px-2.5 py-1 text-[0.65rem] font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
              >
                {t("common.settings")}
              </Link>
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto shell-scroll">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-ink-soft">
                {t("notifications.empty")}
              </p>
            ) : (
              items.map((n) => {
                const expanded = expandedId === n.id;
                return (
                  <div
                    key={n.id}
                    className={`border-b border-line/50 last:border-0 ${n.read ? "" : "bg-indigo/5"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(n)}
                      aria-expanded={expanded}
                      className="flex w-full items-start gap-2 px-4 py-3 text-start transition-colors hover:bg-mist/60"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          n.read ? "bg-transparent" : "bg-crimson"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-ink">{n.title}</span>
                        <span
                          className={`mt-0.5 block text-xs text-ink-soft ${
                            expanded ? "" : "line-clamp-2"
                          }`}
                        >
                          {n.message}
                        </span>
                        <span className="mt-1 block text-[0.65rem] text-ink-soft/70">
                          {timeAgo(n.createdAt, t)}
                        </span>
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-2 px-4 pb-3 ps-[1.9rem]">
                        <p className="text-[0.65rem] text-ink-soft">
                          {t("notifications.receivedAt")}{" "}
                          <span className="numeric">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </p>
                        {n.appointmentId && (
                          <Link
                            href={
                              profile.role === "patient"
                                ? "/patient/dashboard"
                                : `/${profile.role}/appointments`
                            }
                            onClick={() => setOpen(false)}
                            className="inline-block text-xs font-semibold text-indigo hover:text-indigo-deep"
                          >
                            {t("notifications.viewAppointment")} →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
