"use client";

import { useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { isIndexError, readApiError } from "@/lib/api-error";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Appointment } from "@/types";
import type { Slot } from "@/types/slot";

/**
 * "Book the next visit", offered on a finished appointment.
 *
 * The doctor picks from their own open slots rather than typing a free date and
 * time: the slot is what stops two patients landing on the same hour, and the
 * server claims it in the same transaction that creates the appointment. Typing
 * an arbitrary time would look simpler here and quietly allow double-booking.
 */
export default function FollowUpScheduler({
  appointment,
  onScheduled,
}: {
  appointment: Appointment;
  onScheduled: (followUp: Appointment) => void;
}) {
  const t = useT();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [loadError, setLoadError] = useState<{ message: string; setup: boolean } | null>(null);

  async function openPicker() {
    setOpen(true);
    setLoadError(null);

    if (!appointment.doctorId) {
      // Nothing to look up — an unassigned appointment has no doctor whose
      // calendar we could offer.
      setLoadError({ message: t("followUp.noDoctorOnAppointment"), setup: false });
      return;
    }

    setLoading(true);
    try {
      const res = await authedFetch(
        `/api/slots?onlyAvailable=true&doctorId=${encodeURIComponent(appointment.doctorId)}`
      );
      if (!res.ok) {
        // This used to collapse any failure into an empty array, so a missing
        // Firestore index rendered as "you have no open times" — sending the
        // doctor off to add slots they already had. Show what actually broke.
        const message = await readApiError(res, t("error.loadFailed"));
        setLoadError({ message, setup: isIndexError(res.status, message) });
        setSlots([]);
        return;
      }
      setSlots(await res.json());
    } catch {
      setLoadError({ message: t("error.network"), setup: false });
    } finally {
      setLoading(false);
    }
  }

  async function book(slotId: string) {
    setSaving(true);
    try {
      const res = await authedFetch(`/api/appointments/${appointment.id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("common.somethingWrong"));
      toast.success(t("followUp.booked"));
      setOpen(false);
      onScheduled(data.appointment as Appointment);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
      // Most likely someone took the slot in between — refresh the list so the
      // doctor isn't looking at a time that no longer exists.
      openPicker();
    } finally {
      setSaving(false);
    }
  }

  // Already scheduled from this visit — nothing more to do.
  if (appointment.followUpAppointmentId && !open) {
    return (
      <p className="mt-3 rounded-[var(--radius-sm)] bg-mist/60 px-3 py-2 text-xs text-ink-soft">
        ✓ {t("followUp.alreadyScheduled")}
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={openPicker} className="btn-outline btn-sm mt-3">
        {t("followUp.schedule")}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-[var(--radius-sm)] border border-indigo/20 bg-indigo/5 p-4">
      <p className="text-xs font-semibold text-ink">{t("followUp.title")}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{t("followUp.hint")}</p>

      <label className="field mt-3">
        <span className="label">{t("followUp.note")}</span>
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("followUp.notePlaceholder")}
          maxLength={200}
        />
      </label>

      <div className="mt-3">
        {loading ? (
          <p className="text-xs text-ink-soft">{t("common.loading")}</p>
        ) : loadError ? (
          <div className="rounded-[var(--radius-sm)] border border-crimson/30 bg-danger-soft p-3">
            <p className="text-xs font-semibold text-crimson-deep">
              {t(loadError.setup ? "error.setupNeeded" : "error.loadFailed")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{loadError.message}</p>
            {loadError.setup && (
              <pre className="mt-2 overflow-x-auto rounded bg-ink/90 px-2 py-1.5 font-mono text-[0.65rem] text-paper">
                firebase deploy --only firestore:indexes
              </pre>
            )}
            <button type="button" onClick={openPicker} className="btn-outline btn-sm mt-2">
              {t("common.retry")}
            </button>
          </div>
        ) : slots.length === 0 ? (
          <p className="text-xs text-ink-soft">{t("followUp.noSlots")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={saving}
                onClick={() => book(s.id)}
                className="numeric rounded-[var(--radius-pill)] border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-60"
              >
                {s.date} · {s.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-3 text-xs font-semibold text-ink-soft hover:text-crimson-deep"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}
