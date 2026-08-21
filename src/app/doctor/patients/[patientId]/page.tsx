"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import {
  APPOINTMENT_STATUS_LABELS as statusLabel,
  APPOINTMENT_STATUS_STYLES as statusStyles,
} from "@/lib/appointment-status";
import type { Appointment } from "@/types";


export default function DoctorPatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Scoped to this one patient server-side (the route still enforces that the
  // appointment is assigned to the calling doctor). This used to fetch every
  // appointment the doctor had ever had and filter down to one person here.
  useEffect(() => {
    if (!patientId) return;
    authedFetch(`/api/appointments?patientId=${encodeURIComponent(patientId)}&limit=200`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setAppointments)
      .catch(() => toast.error("Couldn't load this patient. Please refresh."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const history = useMemo(
    () => [...appointments].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    [appointments]
  );

  const patient = history[0];
  const completedCount = history.filter((a) => a.status === "completed").length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = history.find((a) => a.date >= todayIso && a.status === "confirmed");

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading…</p>;
  }

  if (!patient) {
    return (
      <div className="animate-fade-up">
        <Link href="/doctor/patients" className="text-xs font-medium text-indigo hover:text-indigo-deep">
          ← Back to patients
        </Link>
        <p className="mt-6 text-sm text-ink-soft">
          No record found — this patient may not be assigned to you (any more).
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Link href="/doctor/patients" className="text-xs font-medium text-indigo hover:text-indigo-deep">
        ← Back to patients
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="h1">{patient.patientName}</h1>
          {patient.patientPhone && <p className="mt-1 text-sm text-ink-soft">{patient.patientPhone}</p>}
        </div>
        {upcoming && (
          <div className="rounded-2xl border border-indigo/20 bg-indigo/5 px-4 py-3 text-xs text-ink-soft">
            <p className="font-medium text-indigo">Next session</p>
            <p className="mt-0.5">
              {upcoming.service} · {upcoming.date} at {upcoming.time} · {upcoming.mode}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line/70 p-5">
          <p className="stat-number text-indigo">{history.length}</p>
          <p className="mt-1 text-xs text-ink-soft">Total sessions with you</p>
        </div>
        <div className="rounded-2xl border border-line/70 p-5">
          <p className="stat-number text-indigo">{completedCount}</p>
          <p className="mt-1 text-xs text-ink-soft">Completed</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-line/70 p-5 sm:col-span-1">
          <p className="stat-number text-indigo">{history[0]?.date ?? "—"}</p>
          <p className="mt-1 text-xs text-ink-soft">Most recent booking</p>
        </div>
      </div>

      <h2 className="mt-8 h3 text-ink">Appointment history</h2>
      <div className="mt-4 space-y-3">
        {history.map((a) => (
          <div key={a.id} className="rounded-2xl border border-line/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{a.service}</p>
                <p className="text-sm text-ink-soft">
                  {a.date} · {a.time} · {a.mode}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[a.status]}`}>
                {statusLabel[a.status]}
              </span>
            </div>
            {a.notes && <p className="mt-2 text-sm text-ink-soft/80">&ldquo;{a.notes}&rdquo;</p>}
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-ink-soft">
        Want to join a call or open chat for a confirmed session? Head to{" "}
        <Link href="/doctor/appointments" className="font-medium text-indigo hover:text-indigo-deep">
          Appointments
        </Link>{" "}
        — sessions open from there.
      </p>
    </div>
  );
}
