"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authed-fetch";
import { useLiveAppointments } from "@/lib/use-live-appointments";
import { useToast } from "@/contexts/ToastContext";

type Counts = {
  patients: number;
  appointments: number;
  callBacks: number;
  services: number;
  blogs: number;
};

type Analytics = {
  paidRevenue: number;
  refunded: number;
  completed: number;
  avgRating: number | null;
  doctorRows: { name: string; completed: number; avgRating: number | null }[];
};

const EMPTY_COUNTS: Counts = {
  patients: 0,
  appointments: 0,
  callBacks: 0,
  services: 0,
  blogs: 0,
};

const EMPTY_ANALYTICS: Analytics = {
  paidRevenue: 0,
  refunded: 0,
  completed: 0,
  avgRating: null,
  doctorRows: [],
};

export default function AdminOverviewPage() {
  const toast = useToast();
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY_ANALYTICS);

  // A small live window — 20 rows, not the collection — used purely as a
  // change signal. The original version of this page streamed every
  // appointment the clinic had ever taken just to keep five numbers current;
  // this watches the newest handful and refetches the aggregates when one of
  // them moves.
  const live = useLiveAppointments({ pageSize: 20 });

  // One request, computed server-side with count() aggregations.
  useEffect(() => {
    authedFetch("/api/appointments/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("stats"))))
      .then((data) => {
        setCounts(data.counts);
        setAnalytics(data.analytics);
        // A figure that couldn't be computed comes back as 0 rather than
        // failing the page; this says why, so it isn't mistaken for real data.
        if (data.indexHint) toast.error(data.indexHint);
      })
      .catch(() => toast.error("Couldn't load the overview. Please refresh."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    { label: "Patients", value: counts.patients, href: null },
    { label: "Total appointments", value: counts.appointments, href: "/admin/appointments" },
    {
      label: "Awaiting your call-back",
      value: counts.callBacks,
      href: "/admin/appointments",
      highlight: counts.callBacks > 0,
    },
    { label: "Services listed", value: counts.services, href: "/admin/services" },
    { label: "Blog posts", value: counts.blogs, href: "/admin/blogs" },
  ];

  return (
    <div className="animate-fade-up">
      <h1 className="h1">Overview</h1>
      <p className="mt-2 text-sm text-ink-soft">
        You're managing appointments, services, and content as the clinic&apos;s sole admin account.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const cardClass = `card-hover rounded-2xl border p-6 ${
            c.highlight ? "border-crimson/40 bg-crimson/5" : "border-line/70"
          }`;
          const inner = (
            <>
              <p className="h1">{c.value}</p>
              <p className="mt-1 text-sm text-ink-soft">{c.label}</p>
            </>
          );
          return c.href ? (
            <Link key={c.label} href={c.href} className={cardClass}>
              {inner}
            </Link>
          ) : (
            <div key={c.label} className={cardClass}>
              {inner}
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 h3 text-ink">Revenue &amp; outcomes</h2>
      <p className="mt-1 text-xs text-ink-soft">Last 12 months.</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line/70 p-6">
          <p className="h1">PKR {analytics.paidRevenue.toLocaleString()}</p>
          <p className="mt-1 text-sm text-ink-soft">Collected revenue</p>
        </div>
        <div className="rounded-2xl border border-amber-600/20 bg-amber-50 p-6">
          <p className="h1 text-amber-800">PKR {analytics.refunded.toLocaleString()}</p>
          <p className="mt-1 text-sm text-amber-800/80">Refunded</p>
        </div>
        <div className="rounded-2xl border border-line/70 p-6">
          <p className="h1">{analytics.completed}</p>
          <p className="mt-1 text-sm text-ink-soft">Completed sessions</p>
        </div>
        <div className="rounded-2xl border border-line/70 p-6">
          <p className="h1">{analytics.avgRating ? analytics.avgRating.toFixed(1) : "—"}</p>
          <p className="mt-1 text-sm text-ink-soft">Average patient rating</p>
        </div>
      </div>

      <h2 className="mt-10 h3 text-ink">Doctor performance</h2>
      {analytics.doctorRows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No completed sessions with an assigned doctor yet.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line/70">
          <table className="w-full text-sm">
            <thead className="bg-mist/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Completed sessions</th>
                <th className="px-5 py-3">Average rating</th>
              </tr>
            </thead>
            <tbody>
              {analytics.doctorRows.map((d) => (
                <tr key={d.name} className="border-t border-line/60">
                  <td className="px-5 py-3 font-medium text-ink">{d.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{d.completed}</td>
                  <td className="px-5 py-3 text-ink-soft">{d.avgRating ? d.avgRating.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
