"use client";

import { useEffect, useState } from "react";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { usePagedList } from "@/lib/use-paged-list";
import { useT } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import type { DoctorProfile } from "@/types";
import { SkeletonRows } from "@/components/Loader";

export default function AdminDoctorsPage() {
  const t = useT();
  const toast = useToast();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialization: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch("/api/doctors");
      if (!res.ok) throw new Error();
      setDoctors(await res.json());
    } catch {
      toast.error("Couldn't load doctors. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authedFetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create doctor");
      toast.success(`${form.name}'s account is ready. Share the password with them securely.`);
      setForm({ name: "", email: "", password: "", specialization: "" });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create doctor");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(doctor: DoctorProfile) {
    try {
      const res = await authedFetch("/api/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: doctor.uid, active: !doctor.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(doctor.active ? "Doctor suspended." : "Doctor reactivated.");
      load();
    } catch {
      toast.error("Couldn't update this doctor. Please try again.");
    }
  }

  async function decide(doctor: DoctorProfile, approvalStatus: "approved" | "rejected") {
    try {
      const res = await authedFetch("/api/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: doctor.uid, approvalStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        approvalStatus === "approved" ? `${doctor.name} approved.` : `${doctor.name}'s request declined.`
      );
      load();
    } catch {
      toast.error("Couldn't update this request. Please try again.");
    }
  }

  const pending = doctors.filter((d) => d.approvalStatus === "pending");
  const decided = doctors.filter((d) => d.approvalStatus !== "pending");

  // Pending requests are few and need acting on, so they always show in full.
  // The full roster is the list that grows, so search and paging apply there.
  const list = usePagedList(
    decided,
    (d) => [d.name, d.email, d.specialization, d.phone],
    6
  );

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="h1">Doctors</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Create doctor accounts here, or approve doctors who registered themselves — each
            doctor only ever sees the patients you assign to them from the Appointments page.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-full bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-deep"
        >
          {showForm ? "Cancel" : "+ Add doctor"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-4 rounded-2xl border border-line/70 p-6 sm:grid-cols-2"
        >
          <div>
            <label className="text-xs font-medium text-ink-soft">Full name</label>
            <input
              required
              className="input mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Specialization</label>
            <input
              className="input mt-1"
              placeholder="e.g. Psychiatry"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Email</label>
            <input
              required
              type="email"
              className="input mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Temporary password</label>
            <input
              required
              minLength={8}
              type="password"
              className="input mt-1"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-crimson px-5 py-2.5 text-sm font-medium text-white hover:bg-crimson-deep disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <SkeletonRows rows={4} className="mt-8" />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-ink">
                Pending requests <span className="text-ink-soft">({pending.length})</span>
              </h2>
              <div className="mt-3 space-y-3">
                {pending.map((d) => (
                  <div
                    key={d.uid}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-600/25 bg-amber-50 p-5"
                  >
                    <div>
                      <p className="font-medium text-ink">{d.name}</p>
                      <p className="text-sm text-ink-soft">
                        {d.email} {d.phone && `· ${d.phone}`} {d.specialization && `· ${d.specialization}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decide(d, "approved")}
                        className="rounded-full bg-indigo px-4 py-2 text-xs font-medium text-white hover:bg-indigo-deep"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(d, "rejected")}
                        className="rounded-full border border-crimson px-4 py-2 text-xs font-medium text-crimson-deep hover:bg-crimson hover:text-white"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            {pending.length > 0 && <h2 className="text-sm font-semibold text-ink">All doctors</h2>}
            <div className="mt-3 max-w-sm">
              <SearchInput
                value={list.query}
                onChange={list.setQuery}
                placeholder={t("admin.doctors.search")}
              />
            </div>
            {list.isEmptyResult ? (
              <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
            ) : decided.length === 0 ? (
              <EmptyState title={t("admin.doctors.none")} />
            ) : (
              <div className="mt-3 space-y-3">
                {list.items.map((d) => (
                  <div
                    key={d.uid}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 p-5"
                  >
                    <div>
                      <p className="font-medium text-ink">{d.name}</p>
                      <p className="text-sm text-ink-soft">
                        {d.email} {d.specialization && `· ${d.specialization}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.approvalStatus === "rejected" ? (
                        <span className="rounded-full bg-crimson/10 px-3 py-1 text-xs font-medium text-crimson-deep">
                          Declined
                        </span>
                      ) : (
                        <>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              d.active ? "bg-green-100 text-green-700" : "bg-crimson/10 text-crimson-deep"
                            }`}
                          >
                            {d.active ? "Active" : "Suspended"}
                          </span>
                          <button
                            onClick={() => toggleActive(d)}
                            className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
                          >
                            {d.active ? "Suspend" : "Reactivate"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination
              page={list.page}
              pageCount={list.pageCount}
              total={list.total}
              onChange={list.setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
