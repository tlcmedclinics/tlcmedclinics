"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Appointment } from "@/types";

type PatientSummary = {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  totalSessions: number;
  lastSeen: string; // most recent appointment date
  nextUpcoming?: Appointment;
};

export default function DoctorPatientsPage() {
  const toast = useToast();
  const t = useT();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch("/api/appointments")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setAppointments)
      .catch(() => toast.error("Couldn't load your patients. Please refresh."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patients = useMemo(() => {
    const byPatient = new Map<string, PatientSummary>();
    const todayIso = new Date().toISOString().slice(0, 10);

    for (const a of appointments) {
      const existing = byPatient.get(a.patientId);
      const isUpcoming = a.date >= todayIso && a.status === "confirmed";
      if (!existing) {
        byPatient.set(a.patientId, {
          patientId: a.patientId,
          patientName: a.patientName,
          patientPhone: a.patientPhone,
          totalSessions: 1,
          lastSeen: a.date,
          nextUpcoming: isUpcoming ? a : undefined,
        });
      } else {
        existing.totalSessions += 1;
        if (a.date > existing.lastSeen) existing.lastSeen = a.date;
        if (isUpcoming && (!existing.nextUpcoming || a.date < existing.nextUpcoming.date)) {
          existing.nextUpcoming = a;
        }
      }
    }
    return Array.from(byPatient.values()).sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));
  }, [appointments]);

  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("doctor.patients.title")}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Everyone you&apos;ve been assigned by the clinic, based on their booking history with you.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : patients.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line/70 bg-mist/40 p-8 text-center">
          <p className="text-sm text-ink-soft">No patients assigned to you yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {patients.map((p) => (
            <Link
              key={p.patientId}
              href={`/doctor/patients/${p.patientId}`}
              className="block rounded-2xl border border-line/70 p-5 transition-colors hover:border-indigo"
            >
              <p className="font-medium text-ink">{p.patientName}</p>
              {p.patientPhone && <p className="text-xs text-ink-soft">{p.patientPhone}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
                <span>{p.totalSessions} session{p.totalSessions !== 1 ? "s" : ""}</span>
                <span>Last seen {p.lastSeen}</span>
              </div>
              {p.nextUpcoming && (
                <p className="mt-2 rounded-lg bg-indigo/10 px-3 py-1.5 text-xs font-medium text-indigo">
                  Next: {p.nextUpcoming.date} at {p.nextUpcoming.time}
                </p>
              )}
              <p className="mt-3 text-xs font-medium text-indigo">View patient details →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
