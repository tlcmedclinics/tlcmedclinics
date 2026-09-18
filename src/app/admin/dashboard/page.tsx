"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { StarScore } from "@/components/RatingStars";
import { RATING_QUESTIONS } from "@/lib/rating";
import Link from "next/link";
import { authedFetch } from "@/lib/authed-fetch";
import { useLiveAppointments } from "@/lib/use-live-appointments";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";

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
  ratingCount: number;
  /** One row per survey question — see src/lib/rating.ts. */
  ratingQuestions: { key: string; responses: number; average: number | null }[];
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
  ratingCount: 0,
  ratingQuestions: [],
  doctorRows: [],
};

/**
 * The satisfaction bars.
 *
 * Written as inline styles rather than utility classes on purpose: a bar needs
 * a width computed from a number, and the rest of it is two rules. Tailwind in
 * this project does not reliably build a class that appears in no other file,
 * and a bar chart whose track never got a background is a page with nothing on
 * it and no error to explain why.
 */
const BAR_TRACK: CSSProperties = {
  height: 6,
  borderRadius: 999,
  background: "var(--mist)",
  overflow: "hidden",
};

function barFill(average: number): CSSProperties {
  return {
    width: `${(average / 5) * 100}%`,
    height: "100%",
    borderRadius: 999,
    background: "var(--crimson)",
  };
}

export default function AdminOverviewPage() {
  const toast = useToast();
  const t = useT();
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY_ANALYTICS);

  // A small live window — 20 rows, not the collection — used purely as a
  // change signal. The original version of this page streamed every
  // appointment the clinic had ever taken just to keep five numbers current;
  // this watches the newest handful and refetches the aggregates when one of
  // them moves.
  const live = useLiveAppointments({ pageSize: 20 });

  // One request, computed server-side with count() aggregations — re-run
  // whenever the live window above moves.
  //
  // That dependency is the whole point of the listener and it used to be
  // missing: the page held `live`, the comment above described refetching on
  // change, and the effect ran once with an empty dependency array. Every
  // number on this screen — patients, revenue, refunds, ratings, the
  // doctor-performance table — froze at page load, so the clinic's overview was
  // quietly showing whatever had been true when the tab was opened.
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
      .catch(() => toast.error(t("error.loadFailed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.version]);

  const cards = [
    { labelKey: "admin.overview.patients", value: counts.patients, href: null },
    {
      labelKey: "admin.overview.totalAppointments",
      value: counts.appointments,
      href: "/admin/appointments",
    },
    {
      labelKey: "admin.overview.awaitingCallBack",
      value: counts.callBacks,
      href: "/admin/appointments",
      highlight: counts.callBacks > 0,
    },
    { labelKey: "admin.overview.servicesListed", value: counts.services, href: "/admin/services" },
    { labelKey: "admin.overview.blogPosts", value: counts.blogs, href: "/admin/blogs" },
  ];

  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("admin.overview.title")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t("admin.overview.subtitle")}</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const cardClass = `card-hover rounded-2xl border p-6 ${
            c.highlight ? "border-crimson/40 bg-crimson/5" : "border-line/70"
          }`;
          const inner = (
            <>
              <p className="h1">{c.value}</p>
              <p className="mt-1 text-sm text-ink-soft">{t(c.labelKey)}</p>
            </>
          );
          return c.href ? (
            <Link key={c.labelKey} href={c.href} className={cardClass}>
              {inner}
            </Link>
          ) : (
            <div key={c.labelKey} className={cardClass}>
              {inner}
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 h3 text-ink">{t("admin.overview.revenue")}</h2>
      <p className="mt-1 text-xs text-ink-soft">{t("admin.overview.revenueWindow")}</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line/70 p-6">
          <p className="h1">
            {t("services.priceAmount", { price: analytics.paidRevenue.toLocaleString() })}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{t("admin.overview.collected")}</p>
        </div>
        <div className="rounded-2xl border border-amber-600/20 bg-amber-50 p-6">
          <p className="h1 text-amber-800">
            {t("services.priceAmount", { price: analytics.refunded.toLocaleString() })}
          </p>
          <p className="mt-1 text-sm text-amber-800/80">{t("admin.overview.refunded")}</p>
        </div>
        <div className="rounded-2xl border border-line/70 p-6">
          <p className="h1">{analytics.completed}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("doctor.dashboard.completedSessions")}</p>
        </div>
        <div className="rounded-2xl border border-line/70 p-6">
          <p className="h1">{analytics.avgRating ? analytics.avgRating.toFixed(1) : "—"}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("admin.overview.avgRating")}</p>
        </div>
      </div>

      <h2 className="mt-10 h3 text-ink">{t("admin.overview.satisfaction")}</h2>
      <p className="mt-1 text-xs text-ink-soft">
        {analytics.ratingCount === 0
          ? t("admin.overview.noRatings")
          : t("admin.overview.ratingSummary", { count: analytics.ratingCount })}
      </p>
      {analytics.ratingQuestions.some((q) => q.responses > 0) && (
        <div className="mt-4 rounded-2xl border border-line/70 p-6">
          {analytics.ratingQuestions.map((q, i) => {
            const question = RATING_QUESTIONS.find((r) => r.key === q.key);
            return (
              <div key={q.key} className={i === 0 ? "" : "mt-4"}>
                <p className="text-sm text-ink">{question ? t(`rating.q.${q.key}`) : q.key}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-ink">
                    {q.average === null ? "—" : q.average.toFixed(1)}
                  </span>
                  {q.average !== null && <StarScore value={q.average} />}
                  <span className="text-xs text-ink-soft">
                    {t("admin.overview.answers", { count: q.responses })}
                  </span>
                </div>
                {q.average !== null && (
                  <div className="mt-2" style={BAR_TRACK}>
                    <div style={barFill(q.average)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mt-10 h3 text-ink">{t("admin.overview.doctorPerformance")}</h2>
      {analytics.doctorRows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">{t("admin.overview.noCompleted")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line/70">
          {/* Scrolls sideways rather than squashing.
              `overflow-hidden` on a table is fine at desk width and wrong on a
              phone: the columns compress until the headings wrap letter by
              letter and the numbers stop lining up. A table is the one thing
              on a page that is allowed its own horizontal scroll. */}
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-mist/50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">{t("role.doctor")}</th>
                <th className="px-5 py-3">{t("doctor.dashboard.completedSessions")}</th>
                <th className="px-5 py-3">{t("admin.overview.avgRating")}</th>
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
