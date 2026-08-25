"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { usePagedList } from "@/lib/use-paged-list";
import { useT } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import SlotBuilder, { type SlotDraft } from "@/components/SlotBuilder";
import type { DoctorProfile, Service } from "@/types";
import type { Slot } from "@/types/slot";
import { formatClinicTime } from "@/lib/clinic-time";
import { useConfirm } from "@/contexts/ConfirmContext";
import { SkeletonRows } from "@/components/Loader";

export default function AdminSlotsPage() {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [doctorFilter, setDoctorFilter] = useState("");

  /** Whose calendar the builder is writing to — separate from the list filter. */
  const [createDoctorId, setCreateDoctorId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch("/api/slots");
      if (!res.ok) throw new Error();
      const data: Slot[] = await res.json();
      setSlots(data);
    } catch {
      toast.error("Couldn't load slots. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    authedFetch("/api/doctors")
      .then((res) => (res.ok ? res.json() : []))
      .then(setDoctors)
      .catch(() => {});
    fetch("/api/services")
      .then((res) => res.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  async function handleCreate(draft: SlotDraft): Promise<boolean> {
    const doctor = doctors.find((d) => d.uid === createDoctorId);
    if (!doctor) {
      toast.error("Pick a doctor first.");
      return false;
    }

    setSubmitting(true);
    try {
      const res = await authedFetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, doctorId: doctor.uid, doctorName: doctor.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create slot(s)");
      const n = draft.times.length;
      toast.success(`${n} slot${n > 1 ? "s" : ""} added for ${doctor.name}.`);
      load();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create slot(s)");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSlot(slot: Slot) {
    if (
      !(await confirm({
        title: "Delete this slot?",
        message: `${slot.date} at ${formatClinicTime(slot.time)} with ${slot.doctorName}. Patients will no longer see it.`,
        confirmLabel: "Delete slot",
        destructive: true,
      }))
    )
      return;
    setDeletingId(slot.id);
    try {
      const res = await authedFetch("/api/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't delete this slot");
      toast.success("Slot deleted.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this slot");
    } finally {
      setDeletingId(null);
    }
  }

  async function freeUp(slot: Slot) {
    if (
      !(await confirm({
        title: "Mark this slot available again?",
        message: `${slot.date} at ${formatClinicTime(slot.time)} with ${slot.doctorName}. Only do this if the appointment on it was already cancelled outside the system — otherwise the time can be double-booked.`,
        confirmLabel: "Free it up",
        destructive: true,
      }))
    )
      return;
    try {
      const res = await authedFetch("/api/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, status: "available" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Slot freed up.");
      load();
    } catch {
      toast.error("Couldn't update this slot.");
    }
  }

  /**
   * The chosen doctor's own slots, so the builder can grey out times that are
   * already taken. Empty until a doctor is picked — which is right: with nobody
   * selected there is no calendar to clash with.
   */
  const forDoctor = useMemo(
    () => (createDoctorId ? slots.filter((s) => s.doctorId === createDoctorId) : []),
    [slots, createDoctorId]
  );

  const visible = useMemo(() => {
    const list = doctorFilter ? slots.filter((s) => s.doctorId === doctorFilter) : slots;
    const grouped = new Map<string, Slot[]>();
    for (const s of list) {
      const arr = grouped.get(s.date) ?? [];
      arr.push(s);
      grouped.set(s.date, arr);
    }
    // Days ascending — the route already returns today onwards.
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots, doctorFilter]);

  // Paged a day at a time: a day is the unit an admin actually works with,
  // and it keeps each page a predictable height.
  const list = usePagedList(
    visible,
    ([date, daySlots]) => [date, ...daySlots.map((s) => `${s.doctorName} ${s.time} ${formatClinicTime(s.time)} ${s.service ?? ""}`)],
    3
  );

  return (
    <div className="animate-fade-up">
      <h1 className="h1">Slots</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Patients can only book the slots you add here — they no longer pick a date/time
        themselves. A slot disappears from booking the moment it&apos;s taken.
      </p>

      {/* The same builder the doctors use, with a doctor picker on top. Two
          copies of this form is how the admin one ended up still asking for a
          comma-separated list months after the doctor one stopped. */}
      <SlotBuilder
        existingSlots={forDoctor}
        services={services}
        busy={submitting}
        onCreate={handleCreate}
        header={
          <label className="field">
            <span className="label">Doctor</span>
            <select
              required
              className="input"
              value={createDoctorId}
              onChange={(e) => setCreateDoctorId(e.target.value)}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.uid} value={d.uid}>
                  {d.name}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Times below are checked against this doctor&apos;s calendar only.
            </span>
          </label>
        }
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder={t("admin.slots.search")}
          className="w-full max-w-xs"
        />
        <select
          className="input w-auto py-1.5 text-xs"
          aria-label={t("admin.slots.filterByDoctor")}
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
        >
          <option value="">{t("admin.slots.allDoctors")}</option>
          {doctors.map((d) => (
            <option key={d.uid} value={d.uid}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonRows rows={4} className="mt-8" />
      ) : list.isEmptyResult ? (
        <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
      ) : visible.length === 0 ? (
        <EmptyState title={t("admin.slots.none")} hint={t("admin.slots.noneHint")} />
      ) : (
        <>
        <div className="mt-6 space-y-6">
          {list.items.map(([date, daySlots]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-ink">{date}</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[...daySlots]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {formatClinicTime(s.time)} · {s.doctorName}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {s.service ? s.service : "Any service"} · {s.durationMinutes} min ·{" "}
                          {(s.mode ?? "online") === "in-clinic" ? "In clinic" : "Online"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${
                            s.status === "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-indigo/10 text-indigo"
                          }`}
                        >
                          {s.status === "available" ? "Available" : "Booked"}
                        </span>
                        {s.status === "booked" ? (
                          <button
                            onClick={() => freeUp(s)}
                            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
                          >
                            Free up
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteSlot(s)}
                            disabled={deletingId === s.id}
                            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-crimson hover:text-crimson-deep disabled:opacity-50"
                          >
                            {deletingId === s.id ? "Deleting…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
