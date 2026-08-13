"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Appointment } from "@/types";

export default function DoctorDashboardPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const t = useT();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineOverride, setOnlineOverride] = useState<boolean | null>(null);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const online = onlineOverride ?? (profile && "online" in profile ? Boolean(profile.online) : false);

  useEffect(() => {
    authedFetch("/api/appointments")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setAppointments)
      .catch(() => toast.error("Couldn't load your schedule. Please refresh."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleOnline() {
    if (!profile) return;
    const next = !online;
    setTogglingOnline(true);
    try {
      const res = await authedFetch("/api/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: profile.uid, online: next }),
      });
      if (!res.ok) throw new Error();
      setOnlineOverride(next);
    } catch {
      toast.error("Couldn't update your status. Please try again.");
    } finally {
      setTogglingOnline(false);
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todays = appointments.filter((a) => a.date === todayIso && a.status !== "cancelled");
    const upcoming = appointments.filter(
      (a) => a.date >= todayIso && a.status === "confirmed"
    );
    const uniquePatients = new Set(appointments.map((a) => a.patientId)).size;
    const completed = appointments.filter((a) => a.status === "completed").length;
    return { todays, upcoming, uniquePatients, completed };
  }, [appointments, todayIso]);

  const cards = [
    { label: "Today's sessions", value: stats.todays.length },
    { label: "Upcoming confirmed", value: stats.upcoming.length },
    { label: "My patients", value: stats.uniquePatients },
    { label: "Completed sessions", value: stats.completed },
  ];

  return (
    <div className="animate-fade-up">
      <p className="eyebrow text-indigo">{t("nav.dashboard")}</p>
      <h1 className="mt-3 h1">
        {t("doctor.dashboard.title")}
        {profile?.name ? `, Dr. ${profile.name.replace(/^Dr\.?\s*/i, "")}` : ""}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">{t("doctor.dashboard.subtitle")}</p>

      <button
        onClick={toggleOnline}
        disabled={togglingOnline}
        className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
          online
            ? "border-teal-600/30 bg-teal-50 text-teal-800"
            : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${online ? "bg-teal-600" : "bg-ink-soft/50"}`} />
        {online ? "You're visible as online to patients" : "You're offline — tap to go online"}
      </button>

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
        <p className="mt-6 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : stats.todays.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line/70 bg-mist/40 p-8 text-center">
          <p className="text-sm text-ink-soft">Nothing on the schedule for today.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {stats.todays.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 p-5"
            >
              <div>
                <p className="font-medium text-ink">{a.patientName}</p>
                <p className="text-sm text-ink-soft">
                  {a.service} · {a.time} · {a.mode}
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
