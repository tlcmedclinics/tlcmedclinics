"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useT } from "@/contexts/LanguageContext";
import { formatClinicTime } from "@/lib/clinic-time";
import Loader, { InlineSpinner, SkeletonRows } from "@/components/Loader";
import SlotBuilder, { type SlotDraft } from "@/components/SlotBuilder";
import type { Service } from "@/types";
import type { Leave, Slot } from "@/types/slot";

/**
 * A doctor's own calendar: the times they're available, and the days they're not.
 *
 * The same two jobs the admin slots page does, scoped to one person. Doctors
 * had no way to open a time without asking an admin, which made the clinic a
 * bottleneck for something only the doctor actually knows — when they're free.
 *
 * The server is what enforces the scoping: `doctorId` comes from the caller's
 * token, so this page never sends one. Nothing here is a permission check; it
 * is only the interface to permissions that already exist.
 */

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function DoctorSlotsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLeave, setSavingLeave] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [slotRes, leaveRes] = await Promise.all([
        authedFetch("/api/slots"),
        authedFetch("/api/leaves"),
      ]);
      if (!slotRes.ok || !leaveRes.ok) throw new Error();
      setSlots(await slotRes.json());
      setLeaves(await leaveRes.json());
    } catch {
      toast.error(t("error.loadFailed"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only used to let a doctor tie a time to one treatment. A failure here
  // costs that dropdown and nothing else, so it is deliberately not part of
  // `load` and never blocks the calendar.
  useEffect(() => {
    fetch("/api/services")
      .then((res) => (res.ok ? res.json() : []))
      .then(setServices)
      .catch(() => {});
  }, []);

  /** Slots grouped by day, each day's times in order. */
  const byDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  async function addSlots(draft: SlotDraft): Promise<boolean> {
    setSaving(true);
    try {
      const res = await authedFetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No doctorId: the server takes it from the token.
        body: JSON.stringify(draft),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error);

      toast.success(t("doctor.slots.opened", { count: draft.times.length }));
      load();
      return true;
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t("error.saveFailed"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeSlot(slot: Slot) {
    const ok = await confirm({
      title: t("doctor.slots.removeTitle"),
      message: t("doctor.slots.removeBody", {
        date: slot.date,
        time: formatClinicTime(slot.time),
      }),
      confirmLabel: t("common.remove"),
      destructive: true,
    });
    if (!ok) return;

    setBusyId(slot.id);
    try {
      const res = await authedFetch("/api/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error);
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t("error.saveFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function addLeave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const from = String(data.get("from") ?? "");
    const to = String(data.get("to") ?? "") || from;

    if (!from) {
      toast.error(t("doctor.slots.pickFirstDay"));
      return;
    }

    setSavingLeave(true);
    try {
      const res = await authedFetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, reason: data.get("reason") || undefined }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error);

      // Booked slots are left standing on purpose — those are real patients,
      // and they need telling rather than deleting. Said plainly here so the
      // doctor knows the leave alone didn't settle it.
      if (out.bookedSlots?.length) {
        toast.error(t("doctor.slots.leaveBooked", { count: out.bookedSlots.length }));
      } else {
        toast.success(
          out.removedSlots
            ? t("doctor.slots.leaveSavedRemoved", { count: out.removedSlots })
            : t("doctor.slots.leaveSaved")
        );
      }

      form.reset();
      load();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t("error.saveFailed"));
    } finally {
      setSavingLeave(false);
    }
  }

  async function removeLeave(leave: Leave) {
    const ok = await confirm({
      title: t("doctor.slots.removeLeaveTitle"),
      message: t("doctor.slots.removeLeaveBody"),
      confirmLabel: t("doctor.slots.removeLeaveCta"),
      destructive: true,
    });
    if (!ok) return;

    setBusyId(leave.id);
    try {
      const res = await authedFetch("/api/leaves", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leave.id }),
      });
      if (!res.ok) throw new Error();
      setLeaves((prev) => prev.filter((l) => l.id !== leave.id));
    } catch {
      toast.error(t("error.saveFailed"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("doctor.slots.title")}</h1>
      <p className="lede mt-1">{t("doctor.slots.lede")}</p>

      {/* ---- Add times ---- */}
      <SlotBuilder
        existingSlots={slots}
        services={services}
        busy={saving}
        onCreate={addSlots}
      />

      {/* ---- Leave ---- */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-ink">{t("doctor.slots.daysAway")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t("doctor.slots.daysAwayHint")}</p>

        <form onSubmit={addLeave} className="card card-pad mt-4 grid gap-4 sm:grid-cols-4">
          <label className="field">
            <span className="label">{t("common.from")}</span>
            <input name="from" type="date" required min={todayIso()} className="input numeric" />
          </label>
          <label className="field">
            <span className="label">{t("common.to")}</span>
            <input name="to" type="date" min={todayIso()} className="input numeric" />
          </label>
          <label className="field">
            <span className="label">{t("doctor.slots.reason")}</span>
            <input name="reason" className="input" placeholder={t("doctor.slots.reasonPlaceholder")} />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={savingLeave} className="btn-indigo w-full">
              {savingLeave ? <InlineSpinner /> : t("doctor.slots.markAway")}
            </button>
          </div>
        </form>

        {loading ? (
          <Loader className="py-8" />
        ) : leaves.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">{t("doctor.slots.noLeave")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {leaves.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 px-4 py-3"
              >
                <span className="text-sm text-ink">
                  <span className="numeric">{l.from}</span>
                  {l.to !== l.from && (
                    <>
                      {" → "}
                      <span className="numeric">{l.to}</span>
                    </>
                  )}
                  {l.reason && <span className="text-ink-soft"> · {l.reason}</span>}
                </span>
                <button
                  onClick={() => removeLeave(l)}
                  disabled={busyId === l.id}
                  className="text-xs font-medium text-ink-soft hover:text-crimson-deep disabled:opacity-50"
                >
                  {t("common.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Existing times ---- */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-ink">{t("doctor.slots.myTimes")}</h2>

        {loading ? (
          <SkeletonRows rows={3} className="mt-4" />
        ) : byDate.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">{t("doctor.slots.noTimes")}</p>
        ) : (
          <div className="mt-4 space-y-6">
            {byDate.map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="numeric text-sm font-semibold text-ink">{date}</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {daySlots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line/70 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{formatClinicTime(s.time)}</p>
                        <p className="text-xs text-ink-soft">
                          {t("slot.minutes", { count: s.durationMinutes })} ·{" "}
                          {t((s.mode ?? "online") === "in-clinic" ? "mode.inClinic" : "mode.online")}
                          {s.service ? ` · ${s.service}` : ""}
                        </p>
                      </div>

                      {s.status === "booked" ? (
                        <span className="pill pill-indigo shrink-0">{t("slot.booked")}</span>
                      ) : (
                        <button
                          onClick={() => removeSlot(s)}
                          disabled={busyId === s.id}
                          className="shrink-0 text-xs font-medium text-ink-soft hover:text-crimson-deep disabled:opacity-50"
                        >
                          {t("common.remove")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
