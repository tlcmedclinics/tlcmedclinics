"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Appointment } from "@/types";

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState({
    patients: 0,
    appointments: 0,
    callBacks: 0,
    services: 0,
    blogs: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, "users"), where("role", "==", "patient")), (s) =>
        setCounts((c) => ({ ...c, patients: s.size }))
      ),
      onSnapshot(collection(db, "appointments"), (s) => {
        setCounts((c) => ({ ...c, appointments: s.size }));
        setAppointments(s.docs.map((d) => d.data() as Appointment));
      }),
      onSnapshot(
        query(collection(db, "appointments"), where("status", "==", "pending")),
        (s) => setCounts((c) => ({ ...c, callBacks: s.size }))
      ),
      onSnapshot(collection(db, "services"), (s) =>
        setCounts((c) => ({ ...c, services: s.size }))
      ),
      onSnapshot(collection(db, "blogs"), (s) =>
        setCounts((c) => ({ ...c, blogs: s.size }))
      ),
    ];
    return () => unsubs.forEach((u) => u());
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

  const analytics = useMemo(() => {
    const paidRevenue = appointments
      .filter((a) => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    const refunded = appointments
      .filter((a) => a.paymentStatus === "refunded")
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    const completed = appointments.filter((a) => a.status === "completed").length;
    const rated = appointments.filter((a) => a.rating);
    const avgRating = rated.length
      ? rated.reduce((sum, a) => sum + (a.rating || 0), 0) / rated.length
      : null;

    const byDoctor = new Map<string, { name: string; completed: number; ratings: number[] }>();
    for (const a of appointments) {
      if (!a.doctorId) continue;
      const entry = byDoctor.get(a.doctorId) ?? { name: a.doctorName || "Unknown", completed: 0, ratings: [] };
      if (a.status === "completed") entry.completed += 1;
      if (a.rating) entry.ratings.push(a.rating);
      byDoctor.set(a.doctorId, entry);
    }
    const doctorRows = Array.from(byDoctor.values())
      .map((d) => ({
        name: d.name,
        completed: d.completed,
        avgRating: d.ratings.length ? d.ratings.reduce((s, r) => s + r, 0) / d.ratings.length : null,
      }))
      .sort((a, b) => b.completed - a.completed);

    return { paidRevenue, refunded, completed, avgRating, doctorRows };
  }, [appointments]);

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

      <h2 className="mt-10 h3 text-ink">Revenue & outcomes</h2>
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
