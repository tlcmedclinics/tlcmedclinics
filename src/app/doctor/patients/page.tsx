"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { usePagedList } from "@/lib/use-paged-list";
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

  // Bounded to the doctor's 500 most recent bookings. The summary below is
  // ordered by last-seen, so if a doctor ever passes that many the rows that
  // fall off are the least recently seen patients.
  useEffect(() => {
    authedFetch("/api/appointments?limit=500")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setAppointments)
      .catch(() => toast.error(t("error.loadFailed")))
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

  const list = usePagedList(
    patients,
    (p) => [p.patientName, p.patientPhone, p.lastSeen],
    6
  );

  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("doctor.patients.title")}</h1>
      <p className="lede mt-1">{t("doctor.patients.subtitle")}</p>

      <div className="mt-6 max-w-sm">
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder={t("doctor.patients.search")}
        />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : list.isEmptyResult ? (
        <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
      ) : patients.length === 0 ? (
        <EmptyState title={t("doctor.patients.none")} />
      ) : (
        <>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {list.items.map((p) => (
            <Link
              key={p.patientId}
              href={`/doctor/patients/${p.patientId}`}
              className="block rounded-2xl border border-line/70 p-5 transition-colors hover:border-indigo"
            >
              <p className="font-medium text-ink">{p.patientName}</p>
              {p.patientPhone && <p className="text-xs text-ink-soft">{p.patientPhone}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
                <span className="numeric">{p.totalSessions} {t("doctor.patients.sessions")}</span>
                <span>{t("doctor.patients.lastSeen")} <span className="numeric">{p.lastSeen}</span></span>
              </div>
              {p.nextUpcoming && (
                <p className="mt-2 rounded-lg bg-indigo/10 px-3 py-1.5 text-xs font-medium text-indigo">
                  {t("patient.dashboard.nextUp")}: <span className="numeric">{p.nextUpcoming.date} · {p.nextUpcoming.time}</span>
                </p>
              )}
              <p className="mt-3 text-xs font-medium text-indigo">{t("doctor.patients.viewDetails")} →</p>
            </Link>
          ))}
        </div>
        <Pagination
          page={list.page}
          pageCount={list.pageCount}
          total={list.total}
          onChange={list.setPage}
        />
        </>
      )}
    </div>
  );
}
