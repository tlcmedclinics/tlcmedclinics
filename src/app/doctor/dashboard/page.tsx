"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authed-fetch";
import { useLiveAppointments } from "@/lib/use-live-appointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { formatClinicTime } from "@/lib/clinic-time";
import { SkeletonRows } from "@/components/Loader";

export default function DoctorDashboardPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const t = useT();
  const [counts, setCounts] = useState({ upcoming: 0, uniquePatients: 0, completed: 0 });

  // Presence is automatic now (lib/use-presence.ts, wired up in AppShell).
  // This screen only reports whether the doctor chose to show it.
  const presenceVisible =
    !profile || !("presenceVisible" in profile) || profile.presenceVisible !== false;

  const todayIso = new Date().toISOString().slice(0, 10);

  // Today's schedule is a live query, so a booking or a completed session shows
  // up without reloading.
  const live = useLiveAppointments({ date: todayIso, pageSize: 100 });
  const appointments = live.appointments;
  const loading = live.loading;

  // The tiles are aggregates (count() on the server), which a snapshot can't
  // give us. Refetch them whenever the live query reports a change — that's
  // one cheap request per actual change, rather than streaming the collection
  // just to keep four numbers current.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch("/api/appointments/stats");
        if (!res.ok || cancelled) return;
        const stats = await res.json();
        setCounts(stats.counts);
        if (stats.indexHint) toast.error(stats.indexHint);
      } catch {
        // The tiles keep their last value; the schedule below is the part that
        // actually matters and it has its own error state.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.version]);

  // `appointments` now only ever holds today's rows; cancelled ones are still
  // hidden from the schedule.
  const todays = useMemo(
    () => appointments.filter((a) => a.status !== "cancelled"),
    [appointments]
  );

  const cards = [
    { label: "Today's sessions", value: todays.length },
    { label: "Upcoming confirmed", value: counts.upcoming },
    { label: "My patients", value: counts.uniquePatients },
    { label: "Completed sessions", value: counts.completed },
  ];

  return (
    <div className="animate-fade-up">
      <p className="eyebrow text-indigo">{t("nav.dashboard")}</p>
      <h1 className="mt-3 h1">
        {t("doctor.dashboard.title")}
        {profile?.name ? `, Dr. ${profile.name.replace(/^Dr\.?\s*/i, "")}` : ""}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">{t("doctor.dashboard.subtitle")}</p>

      <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-[var(--radius-pill)] border border-line px-4 py-2 text-xs font-medium text-ink-soft">
        <span
          className={`h-2 w-2 rounded-full ${
            presenceVisible ? "animate-pulse-dot bg-success" : "bg-ink-soft/40"
          }`}
        />
        {presenceVisible ? t("presence.online") : t("presence.hidden")}
        <Link href="/doctor/settings" className="font-semibold text-indigo hover:text-indigo-deep">
          {t("common.settings")}
        </Link>
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line/70 bg-paper p-5">
            <p className="stat-number text-indigo">{loading ? "—" : c.value}</p>
            <p className="mt-1 text-xs text-ink-soft">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="h3 text-ink">Today&apos;s schedule</h2>
        <Link
          href="/doctor/appointments"
          className="text-sm font-medium text-indigo hover:text-indigo-deep"
        >
          View all appointments →
        </Link>
      </div>

      {loading ? (
        <SkeletonRows rows={3} className="mt-6" />
      ) : todays.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line/70 bg-mist/40 p-8 text-center">
          <p className="text-sm text-ink-soft">Nothing on the schedule for today.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {todays.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 p-5"
            >
              <div>
                <p className="font-medium text-ink">{a.patientName}</p>
                <p className="text-sm text-ink-soft">
                  {a.service} · {formatClinicTime(a.time)} · {a.mode}
                </p>
              </div>
              <span className="rounded-full bg-indigo/10 px-3 py-1 text-xs font-medium capitalize text-indigo">
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
