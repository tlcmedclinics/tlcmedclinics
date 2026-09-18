"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { InlineSpinner } from "@/components/Loader";
import { useT } from "@/contexts/LanguageContext";
import { formatClinicTime } from "@/lib/clinic-time";
import {
  SESSION_LENGTHS,
  TELEMEDICINE_WINDOW,
  buildTimeGrid,
  clashingTimes,
  clinicWindowsFor,
  toMinutes,
  toHHmm,
  weekdayOf,
  weekdayKeyOf,
  type SessionLength,
} from "@/lib/slot-grid";
import type { Service } from "@/types";
import type { Slot } from "@/types/slot";

/**
 * Opening availability: pick how long a session is, then tap the times.
 *
 * This replaces a text box that asked the doctor to type
 * "11:00 AM, 11:30 AM, 12:00 PM, …" by hand every morning. Two things were
 * wrong with that. The obvious one is the typing. The quiet one is that a typed
 * list has no idea how long a session lasts, so nothing stopped a doctor
 * opening 11:00 and 11:15 as two 30-minute sessions — a double-booking that
 * only shows up when two patients arrive for the same half hour.
 *
 * Here the session length comes first and everything else follows from it. In
 * clinic, the times are the clinic's own opening hours cut into sessions of
 * that length: the doctor is not asked when the building is open, because that
 * is not their decision. Online, they set their own range — telemedicine runs
 * past closing time, which is most of why it exists.
 *
 * Times that clash with something already on the calendar are shown, greyed,
 * rather than hidden. "11:00 is already taken" and "11:00 doesn't exist" look
 * identical when the chip is missing, and the doctor needs to tell them apart.
 */

export type SlotDraft = {
  date: string;
  times: string[];
  durationMinutes: number;
  mode: "in-clinic" | "online";
  service?: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function SlotBuilder({
  existingSlots,
  services = [],
  busy = false,
  onCreate,
  header,
}: {
  /** Everything already on this calendar. Filtered to the chosen date here. */
  existingSlots: Slot[];
  services?: Service[];
  busy?: boolean;
  onCreate: (draft: SlotDraft) => Promise<boolean>;
  /** Rendered above the grid — the admin page puts its doctor picker here. */
  header?: ReactNode;
}) {
  const t = useT();
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState<SessionLength>(30);
  const [mode, setMode] = useState<"in-clinic" | "online">("in-clinic");
  const [from, setFrom] = useState(TELEMEDICINE_WINDOW.opens);
  const [to, setTo] = useState(TELEMEDICINE_WINDOW.closes);
  const [service, setService] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const windows = useMemo(() => {
    if (mode === "online") return [{ opens: from, closes: to }];
    return date ? clinicWindowsFor(date) : [];
  }, [mode, from, to, date]);

  const grid = useMemo(() => buildTimeGrid(windows, duration), [windows, duration]);

  /** Only this day's slots can clash, and mode is irrelevant — see the lib. */
  const takenOnDay = useMemo(
    () => existingSlots.filter((s) => s.date === date),
    [existingSlots, date]
  );

  const clashes = useMemo(
    () => clashingTimes(grid, duration, takenOnDay),
    [grid, duration, takenOnDay]
  );

  const openable = useMemo(() => grid.filter((t) => !clashes.has(t)), [grid, clashes]);

  // Changing the length, the day or the range rebuilds the grid, and a time
  // selected under the old one may no longer exist. Dropping what is gone
  // rather than clearing everything keeps a re-pick cheap.
  useEffect(() => {
    setSelected((prev) => prev.filter((t) => openable.includes(t)));
  }, [openable]);

  const toggle = (time: string) =>
    setSelected((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );

  const rangeValid = useMemo(() => {
    if (mode !== "online") return true;
    const a = toMinutes(from);
    const b = toMinutes(to);
    return a !== null && b !== null && b > a;
  }, [mode, from, to]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return;
    const ok = await onCreate({
      date,
      times: [...selected].sort(),
      durationMinutes: duration,
      mode,
      service: service || undefined,
    });
    if (ok) setSelected([]);
  }

  // The English name is still what decides whether the clinic is open (see
  // weekdayOf in lib/slot-grid.ts); this is only what the sentence shows.
  const weekday = date ? weekdayOf(date) : null;
  const weekdayKey = date ? weekdayKeyOf(date) : null;
  const weekdayLabel = weekdayKey ? t(weekdayKey) : "";
  const closedToday = mode === "in-clinic" && Boolean(date) && windows.length === 0;

  return (
    <form onSubmit={submit} className="card card-pad mt-6">
      {header}

      {/* ---- 1. How long is a session ---- */}
      <div className="field">
        <span className="label">{t("slotBuilder.length")}</span>
        <div className="flex flex-wrap gap-2">
          {SESSION_LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDuration(n)}
              aria-pressed={duration === n}
              className={`numeric rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                duration === n
                  ? "border-indigo bg-indigo text-paper"
                  : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
              }`}
            >
              {t("slot.minutes", { count: n })}
            </button>
          ))}
        </div>
        <span className="field-hint">{t("slotBuilder.lengthHint", { duration })}</span>
      </div>

      {/* ---- 2. Day and place ---- */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span className="label">{t("slotBuilder.date")}</span>
          <input
            type="date"
            required
            min={todayIso()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input numeric"
          />
          {weekdayLabel && <span className="field-hint">{weekdayLabel}</span>}
        </label>

        <div className="field">
          <span className="label">{t("slotBuilder.where")}</span>
          <div className="flex gap-2">
            {(
              [
                ["in-clinic", "mode.inClinic"],
                ["online", "mode.online"],
              ] as const
            ).map(([value, labelKey]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  mode === value
                    ? "border-indigo bg-indigo text-paper"
                    : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- 3. The window ---- */}
      {mode === "online" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span className="label">{t("slotBuilder.onlineFrom")}</span>
            <input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input numeric"
            />
          </label>
          <label className="field">
            <span className="label">{t("slotBuilder.until")}</span>
            <input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input numeric"
            />
            {!rangeValid && (
              <span className="field-hint text-crimson-deep">
                {t("slotBuilder.endAfterStart")}
              </span>
            )}
          </label>
          <p className="text-xs text-ink-soft sm:col-span-2">{t("slotBuilder.onlineNote")}</p>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-line/70 bg-paper-dim/40 px-4 py-3 text-xs text-ink-soft">
          {date ? (
            windows.length > 0 ? (
              <>
                {t("slotBuilder.clinicHours", { weekday: weekdayLabel ?? "" })}{" "}
                <span className="numeric font-medium text-ink">
                  {windows
                    .map((w) => `${formatClinicTime(w.opens)} – ${formatClinicTime(w.closes)}`)
                    .join("  ·  ")}
                </span>
              </>
            ) : (
              <>{t("slotBuilder.closedOn", { weekday: weekdayLabel ?? "" })}</>
            )
          ) : (
            <>{t("slotBuilder.pickDateForHours")}</>
          )}
        </p>
      )}

      {/* ---- 4. The times ---- */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="label !mb-0">
            {t("slotBuilder.tapTimes")}
            {selected.length > 0 && (
              <span className="ml-2 font-normal text-indigo">
                {t("slotBuilder.selectedCount", { count: selected.length })}
              </span>
            )}
          </span>
          {openable.length > 0 && (
            <div className="flex gap-3 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSelected(openable)}
                className="text-indigo hover:text-indigo-deep"
              >
                {t("slotBuilder.selectAll")}
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-ink-soft hover:text-ink"
              >
                {t("common.clear")}
              </button>
            </div>
          )}
        </div>

        {!date ? (
          <p className="mt-3 text-sm text-ink-soft">{t("slotBuilder.pickDateFirst")}</p>
        ) : closedToday ? (
          <p className="mt-3 text-sm text-ink-soft">{t("slotBuilder.closedThatDay")}</p>
        ) : grid.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">{t("slotBuilder.noFit", { duration })}</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {grid.map((time) => {
                const taken = clashes.has(time);
                const on = selected.includes(time);
                const end = toHHmm((toMinutes(time) ?? 0) + duration);
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={taken}
                    onClick={() => toggle(time)}
                    aria-pressed={on}
                    title={
                      taken
                        ? t("slotBuilder.alreadyOnCalendar")
                        : `${formatClinicTime(time)} – ${formatClinicTime(end)}`
                    }
                    className={`numeric rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors ${
                      taken
                        ? "cursor-not-allowed border-line/60 bg-paper-dim/60 text-ink-soft/40 line-through"
                        : on
                          ? "border-indigo bg-indigo text-paper"
                          : "border-line text-ink hover:border-indigo hover:text-indigo"
                    }`}
                  >
                    {formatClinicTime(time)}
                  </button>
                );
              })}
            </div>
            {clashes.size > 0 && (
              <p className="mt-2 text-xs text-ink-soft">{t("slotBuilder.crossedOut")}</p>
            )}
          </>
        )}
      </div>

      {/* ---- 5. Optional service, and go ---- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.length > 0 && (
          <label className="field">
            <span className="label">{t("slotBuilder.forOneService")}</span>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="input"
            >
              <option value="">{t("slot.anyService")}</option>
              {services.map((s) => (
                <option key={s.id ?? s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className={`flex items-end ${services.length > 0 ? "" : "sm:col-span-2"}`}>
          <button
            type="submit"
            disabled={busy || selected.length === 0 || !rangeValid}
            className="btn-indigo w-full"
          >
            {busy ? (
              <InlineSpinner />
            ) : selected.length === 0 ? (
              t("slotBuilder.pickSomeTimes")
            ) : (
              t("slotBuilder.openN", { count: selected.length, duration })
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
