"use client";

import { useEffect, useState } from "react";
import BilingualField from "@/components/BilingualField";
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
  const [form, setForm] = useState({
    name: "",
    nameUr: "",
    email: "",
    password: "",
    specialization: "",
    specializationUr: "",
    bio: "",
    bioUr: "",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch("/api/doctors");
      if (!res.ok) throw new Error();
      setDoctors(await res.json());
    } catch {
      toast.error(t("error.loadFailed"));
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
      if (!res.ok) throw new Error(data.error ?? t("admin.doctors.createFailed"));
      toast.success(t("admin.doctors.created", { name: form.name }));
      setForm({
        name: "",
        nameUr: "",
        email: "",
        password: "",
        specialization: "",
        specializationUr: "",
        bio: "",
        bioUr: "",
      });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.doctors.createFailed"));
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
      toast.success(t(doctor.active ? "admin.doctors.suspended" : "admin.doctors.reactivated"));
      load();
    } catch {
      toast.error(t("admin.doctors.updateFailed"));
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
        approvalStatus === "approved"
          ? t("admin.doctors.approved", { name: doctor.name })
          : t("admin.doctors.declined", { name: doctor.name })
      );
      load();
    } catch {
      toast.error(t("admin.doctors.decisionFailed"));
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
          <h1 className="h1">{t("nav.doctors")}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t("admin.doctors.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-full bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-deep"
        >
          {showForm ? t("common.cancel") : `+ ${t("admin.doctors.add")}`}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-4 rounded-2xl border border-line/70 p-6 sm:grid-cols-2"
        >
          {/* Both languages, side by side, the same way a service is written.
              A doctor's name and speciality are what a patient reads first on
              the booking page, so leaving them English-only meant an Urdu
              reader met English at exactly the moment they were choosing who
              to trust with their care. */}
          <div className="sm:col-span-2">
            <BilingualField
              label={t("settings.name")}
              required
              /* Never machine-translated. "Dr Ayesha Khan" put through a
                 translation API comes back confident and wrong; the Urdu box
                 is for the spelling the doctor uses themselves. */
              translatable={false}
              hint={t("admin.doctors.nameUrHint")}
              value={{ en: form.name, ur: form.nameUr }}
              onChange={(next) => setForm({ ...form, name: next.en, nameUr: next.ur })}
            />
          </div>
          <div className="sm:col-span-2">
            <BilingualField
              label={t("settings.specialization")}
              placeholder={t("admin.doctors.specializationPlaceholder")}
              value={{ en: form.specialization, ur: form.specializationUr }}
              onChange={(next) =>
                setForm({ ...form, specialization: next.en, specializationUr: next.ur })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <BilingualField
              label={t("admin.doctors.bio")}
              multiline
              rows={3}
              hint={t("admin.doctors.bioHint")}
              value={{ en: form.bio, ur: form.bioUr }}
              onChange={(next) => setForm({ ...form, bio: next.en, bioUr: next.ur })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">{t("settings.email")}</label>
            <input
              required
              type="email"
              className="input mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">{t("admin.doctors.tempPassword")}</label>
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
              {submitting ? t("admin.doctors.creating") : t("auth.createAccount")}
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
                {t("admin.doctors.pendingRequests")}{" "}
                <span className="text-ink-soft">({pending.length})</span>
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
                        {t("admin.doctors.approve")}
                      </button>
                      <button
                        onClick={() => decide(d, "rejected")}
                        className="rounded-full border border-crimson px-4 py-2 text-xs font-medium text-crimson-deep hover:bg-crimson hover:text-white"
                      >
                        {t("admin.doctors.decline")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            {pending.length > 0 && <h2 className="text-sm font-semibold text-ink">{t("admin.slots.allDoctors")}</h2>}
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
                          {t("admin.doctors.declinedBadge")}
                        </span>
                      ) : (
                        <>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              d.active ? "bg-green-100 text-green-700" : "bg-crimson/10 text-crimson-deep"
                            }`}
                          >
                            {t(d.active ? "admin.coupons.active" : "admin.doctors.suspendedBadge")}
                          </span>
                          <button
                            onClick={() => toggleActive(d)}
                            className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
                          >
                            {t(d.active ? "admin.doctors.suspend" : "admin.doctors.reactivate")}
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
