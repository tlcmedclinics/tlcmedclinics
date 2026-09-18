"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchInput } from "@/components/ListControls";
import LoadErrorNotice from "@/components/LoadErrorNotice";
import { authedFetch } from "@/lib/authed-fetch";
import { isIndexError, readApiError } from "@/lib/api-error";
import { useLiveAppointments } from "@/lib/use-live-appointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { useSessionAction } from "@/lib/use-session-action";
import { useNow } from "@/lib/use-now";
import { canJoinSession, sessionStatusLabel } from "@/lib/session-window";
import {
  APPOINTMENT_STATUS_LABEL_KEYS as statusLabelKey,
  APPOINTMENT_STATUS_STYLES as statusStyles,
} from "@/lib/appointment-status";
import VideoCallModal from "@/components/VideoCallModal";
import ChatPanel from "@/components/ChatPanel";
import AppointmentHistory from "@/components/AppointmentHistory";
import type { Appointment, AppointmentStatus, DoctorProfile } from "@/types";
import type { Slot } from "@/types/slot";
import { formatClinicTime } from "@/lib/clinic-time";
import { useConfirm } from "@/contexts/ConfirmContext";
import { SkeletonRows, InlineSpinner } from "@/components/Loader";

const PAGE_SIZE = 50;

// Searching swaps paging for a wider single fetch, so a name match isn't
// limited to whichever page happens to be loaded. Still bounded — the route
// caps at 500 — so it can't regress to fetching the whole collection.
const SEARCH_WINDOW = 500;


export default function AdminAppointmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();
  const now = useNow();
  const { startSession, endSession, pendingId } = useSessionAction();

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [activePanel, setActivePanel] = useState<
    | { kind: "video"; roomUrl: string; joinToken?: string; patientName: string; mode: "video" | "audio" }
    | { kind: "chat"; threadId: string; patientName: string }
    | null
  >(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<{ message: string; setup: boolean } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Rows beyond the live window. History doesn't change, so nothing to watch.
  const [older, setOlder] = useState<Appointment[]>([]);

  // The newest page is a live subscription, so a booking, a status change or a
  // doctor finishing a session appears without anyone reloading.
  const searching = search.trim().length > 0;
  const live = useLiveAppointments({
    status: filter,
    pageSize: PAGE_SIZE,
    enabled: !searching,
  });

  // The status filter is applied by Firestore now, not by the browser — this
  // page used to fetch every appointment the clinic had ever taken and filter
  // the array locally. `before` pages backwards through createdAt.
  const load = useCallback(
    async (before?: string) => {
      const isPaging = Boolean(before);
      setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          limit: String(search.trim() ? SEARCH_WINDOW : PAGE_SIZE),
        });
        if (filter !== "all") params.set("status", filter);
        if (before) params.set("before", before);

        const res = await authedFetch(`/api/appointments?${params}`);
        if (!res.ok) {
          // The route says something specific — a missing composite index
          // comes back as a 503 naming the index and linking the console.
          // Surfacing that beats "please refresh", which never helps here.
          const message = await readApiError(res, t("error.loadFailed"));
          setLoadError({ message, setup: isIndexError(res.status, message) });
          if (!isPaging) setOlder([]);
          return;
        }
        const page: Appointment[] = await res.json();

        setLoadError(null);
        // A non-paging load only happens while searching — otherwise the live
        // subscription is already showing the newest rows.
        if (isPaging) setOlder((prev) => [...prev, ...page]);
        else setOlder(page);
        setHasMore(!search.trim() && page.length === PAGE_SIZE);
      } catch {
        setLoadError({ message: t("error.network"), setup: false });
      } finally {
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, search]
  );

  // REST is only needed while searching — the live subscription covers the
  // default view, so changing tabs doesn't refetch anything.
  useEffect(() => {
    if (!searching) {
      setOlder([]);
      setHasMore(false);
      return;
    }
    const id = setTimeout(() => load(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, searching]);

  useEffect(() => {
    authedFetch("/api/doctors")
      .then((res) => (res.ok ? res.json() : []))
      .then(setDoctors)
      .catch(() => {});
  }, []);

  async function assignDoctor(id: string, doctorId: string) {
    const doctor = doctors.find((d) => d.uid === doctorId);
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, doctorId: doctorId || null, doctorName: doctor?.name ?? null }),
      });
      if (!res.ok) throw new Error("Assign failed");
      toast.success(
        doctor
          ? t("admin.appointments.assigned", { name: doctor.name })
          : t("admin.appointments.unassigned")
      );
      load();
    } catch {
      toast.error(t("admin.appointments.assignFailed"));
    }
  }

  async function issueRefund(id: string) {
    if (
      !(await confirm({
        title: t("admin.appointments.refundTitle"),
        message: t("admin.appointments.refundBody"),
        confirmLabel: t("admin.appointments.refundConfirm"),
        destructive: true,
      }))
    )
      return;

    async function send(manual: boolean) {
      const res = await authedFetch(`/api/appointments/${id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manual ? { manual: true } : {}),
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    }

    try {
      const { res, data } = await send(false);

      // 409 with `needsManualRefund` is not a failure — it is the gateway
      // saying "not through an API, through my dashboard". The admin is told
      // where, with the reference and the amount, and can then confirm that
      // they have done it so the record here matches the money.
      if (res.status === 409 && data?.needsManualRefund) {
        toast.error(data.error ?? t("admin.appointments.manualRefundNeeded"));
        const recorded = await confirm({
          title: t("admin.appointments.recordRefundTitle"),
          message: t("admin.appointments.recordRefundBody"),
          confirmLabel: t("admin.appointments.recordRefundConfirm"),
          cancelLabel: t("admin.appointments.notYet"),
        });
        if (!recorded) return;

        const second = await send(true);
        if (!second.res.ok) throw new Error(second.data?.error ?? t("admin.appointments.recordRefundFailed"));
        toast.success(t("admin.appointments.refundRecorded"));
        load();
        return;
      }

      if (!res.ok) throw new Error(data.error ?? t("admin.appointments.refundFailed"));
      toast.success(
        data?.alreadyRefunded
          ? t("admin.appointments.alreadyRefunded")
          : t("admin.appointments.refundIssued")
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.appointments.refundError"));
    }
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(
        t("admin.appointments.statusUpdated", {
          status: t(
            status === "awaiting-payment" ? "status.awaitingPayment" : `status.${status}`
          ),
        })
      );
      load();
    } catch {
      toast.error(t("admin.appointments.statusFailed"));
    }
  }

  // Reschedule — opens a picker of the same doctor's other open slots.
  // Free/available slots only, so this can never double-book.
  async function openReschedule(a: Appointment) {
    setReschedulingId(a.id);
    setRescheduleSlots([]);
    if (!a.doctorId) {
      toast.error(t("admin.appointments.assignFirst"));
      setReschedulingId(null);
      return;
    }
    setLoadingRescheduleSlots(true);
    try {
      const res = await authedFetch(
        `/api/slots?onlyAvailable=true&doctorId=${encodeURIComponent(a.doctorId)}`
      );
      const data: Slot[] = res.ok ? await res.json() : [];
      setRescheduleSlots(data);
    } catch {
      toast.error(t("admin.appointments.slotsFailed"));
    } finally {
      setLoadingRescheduleSlots(false);
    }
  }

  async function confirmReschedule(appointmentId: string, newSlotId: string) {
    setSavingReschedule(true);
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, newSlotId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("admin.appointments.rescheduleFailed"));
      toast.success(t("admin.appointments.rescheduled"));
      setReschedulingId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.appointments.rescheduleFailed"));
    } finally {
      setSavingReschedule(false);
    }
  }

  async function handleStart(a: Appointment) {
    const result = await startSession(a.id);
    if (!result) return;
    const updated = result.appointment;
    setAppointments((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    toast.success(
      a.sessionStatus === "live"
        ? t("admin.appointments.sessionReady")
        : t("admin.appointments.sessionStarted")
    );
  }

  async function handleJoinAsHost(a: Appointment) {
    // "start" is idempotent — safe to call whether the session is already
    // live or needs starting now (covers the admin's early/late override),
    // and it always returns a fresh host token for video.
    const result = await startSession(a.id);
    if (!result) return;
    const appointment = result.appointment;
    setAppointments((prev) => prev.map((x) => (x.id === a.id ? appointment : x)));

    if (
      (appointment.mode === "video" || appointment.mode === "audio") &&
      appointment.roomUrl
    ) {
      setActivePanel({
        kind: "video",
        roomUrl: appointment.roomUrl,
        joinToken: result.joinToken,
        patientName: appointment.patientName,
        mode: appointment.mode,
      });
    } else if (appointment.mode === "chat") {
      setActivePanel({ kind: "chat", threadId: appointment.id, patientName: appointment.patientName });
    }
  }

  async function handleEnd(a: Appointment) {
    const result = await endSession(a.id);
    if (!result) return;
    setAppointments((prev) => prev.map((x) => (x.id === a.id ? result.appointment : x)));
  }


  // Live rows first, then anything paged in below. The map stops a row that
  // appears in both from rendering twice and lets the live copy win.
  const appointments = useMemo(() => {
    const byId = new Map<string, Appointment>();
    for (const a of older) byId.set(a.id, a);
    for (const a of live.appointments) byId.set(a.id, a);
    return Array.from(byId.values()).sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
  }, [live.appointments, older]);

  const loading = searching ? loadingMore : live.loading;

  // Optimistic patches from the row actions still need somewhere to land.
  function setAppointments(update: (prev: Appointment[]) => Appointment[]) {
    setOlder((prev) => update(prev));
    live.setAppointments((prev) => update(prev));
  }

  const needle = search.trim().toLowerCase();
  const visible = needle
    ? appointments.filter((a) =>
        [a.patientName, a.patientPhone, a.service, a.doctorName, a.date]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    : appointments;

  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("admin.appointments.title")}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {t("admin.appointments.subtitle")} {t("admin.appointments.subtitle2")}
      </p>

      <div className="mt-6 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("appointments.search")}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "border-indigo bg-indigo text-white"
                : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
            }`}
          >
            {f === "pending" ? t("status.callBackNeeded") : t(`status.${f}`)}
          </button>
        ))}
      </div>

      {loadError && (
        <LoadErrorNotice
          message={loadError.message}
          isSetupIssue={loadError.setup}
          onRetry={() => load()}
        />
      )}

      {loading ? (
        <SkeletonRows rows={4} className="mt-8" />
      ) : visible.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">{t("admin.appointments.none")}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.map((a) => {
            const isOnlineMode = a.mode === "video" || a.mode === "audio" || a.mode === "chat";
            const joinable = canJoinSession(a, now);
            const canStartEarly = a.status === "confirmed" && isOnlineMode && a.sessionStatus !== "ended" && !joinable;
            return (
              <div
                key={a.id}
                className="rounded-2xl border border-line/70 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink">{a.patientName}</p>
                    <p className="text-sm text-ink-soft">
                      {a.service}
                      {a.date ? (
                        <>
                          {" · "}
                          <span className="numeric">
                            {a.date} {formatClinicTime(a.time)}
                          </span>
                        </>
                      ) : null}
                      {" · "}
                      {t(a.mode === "in-person" ? "mode.inPerson" : `mode.${a.mode}`)}
                    </p>
                    {a.needsDoctor && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="pill pill-warning">{t("admin.appointments.needsDoctor")}</span>
                        {a.preferredWhen && (
                          <span className="text-xs text-ink-soft">
                            {t("admin.appointments.preferred")}: {a.preferredWhen}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-ink-soft/80">
                      {a.patientPhone && <span>{a.patientPhone} · </span>}
                      {a.bookingType === "online-payment"
                        ? `${t("admin.appointments.paidOnline")}${
                            a.amount
                              ? ` · ${t("services.priceAmount", {
                                  price: a.amount.toLocaleString(),
                                })}`
                              : ""
                          }`
                        : t("admin.appointments.requestedCallBack")}
                    </p>
                    {a.notes && <p className="mt-1 text-sm text-ink-soft/80">&ldquo;{a.notes}&rdquo;</p>}
                    {a.consultMode && (
                      <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-ink-soft/70">
                        {t(a.consultMode === "in-clinic" ? "mode.inClinic" : "mode.online")}
                        {a.patientType
                          ? ` · ${t(a.patientType === "new" ? "book.newPatient" : "book.followUp")}`
                          : ""}
                      </p>
                    )}
                    {a.rescheduledFrom && (
                      <p className="mt-1 text-[0.65rem] text-ink-soft/70">
                        {t("admin.appointments.rescheduledFrom", {
                          date: a.rescheduledFrom.date,
                          time: formatClinicTime(a.rescheduledFrom.time),
                        })}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-[0.65rem] uppercase tracking-wide text-ink-soft/70">
                        {t("admin.appointments.assignDoctor")}
                      </label>
                      <select
                        className="input w-auto py-1 text-xs"
                        value={a.doctorId ?? ""}
                        onChange={(e) => assignDoctor(a.id, e.target.value)}
                      >
                        <option value="">{t("admin.appointments.unassigned")}</option>
                        {doctors.map((d) => (
                          <option key={d.uid} value={d.uid}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {a.status !== "completed" && a.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => openReschedule(a)}
                          className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
                        >
                          {t("admin.appointments.reschedule")}
                        </button>
                      )}
                    </div>

                    {reschedulingId === a.id && (
                      <div className="mt-3 rounded-xl border border-indigo/20 bg-indigo/5 p-3">
                        {loadingRescheduleSlots ? (
                          <p className="text-xs text-ink-soft">{t("admin.appointments.loadingSlots")}</p>
                        ) : rescheduleSlots.length === 0 ? (
                          <p className="text-xs text-ink-soft">
                            {t("admin.appointments.noOtherSlots")}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {rescheduleSlots.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                disabled={savingReschedule}
                                onClick={() => confirmReschedule(a.id, s.id)}
                                className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-60"
                              >
                                {s.date} · {formatClinicTime(s.time)} ·{" "}
                                {t(
                                  (s.mode ?? "online") === "in-clinic"
                                    ? "mode.inClinic"
                                    : "mode.online"
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setReschedulingId(null)}
                          className="mt-2 text-xs text-ink-soft hover:text-crimson-deep"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[a.status]}`}
                    >
                      {t(statusLabelKey[a.status])}
                    </span>
                    <select
                      className="input w-auto"
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                    >
                      <option value="pending">{t("status.callBackNeeded")}</option>
                      {/* Listed so an unpaid follow-up shows its own state
                          rather than an empty select. Admin can still confirm
                          it by hand — a patient who paid at the desk shouldn't
                          be stuck behind an online checkout. */}
                      <option value="awaiting-payment">{t("status.awaitingPayment")}</option>
                      <option value="confirmed">{t("status.confirmed")}</option>
                      <option value="completed">{t("status.completed")}</option>
                      <option value="cancelled">{t("status.cancelled")}</option>
                    </select>
                  </div>
                </div>

                <AppointmentHistory appointment={a} showInternal />

                {a.status === "cancelled" && a.cancelReason && (
                  <p className="mt-2 text-xs text-ink-soft">
                    {t("admin.appointments.cancelledBy", {
                      by: a.cancelledBy ?? "",
                      reason: a.cancelReason,
                    })}
                  </p>
                )}

                {a.status === "cancelled" && a.paymentStatus === "refunded" && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3">
                    {a.refundProcessedAt ? (
                      <span className="text-xs font-medium text-amber-800">
                        {t("admin.appointments.refundedOn", {
                          date: a.refundProcessedAt.slice(0, 10),
                        })}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-amber-800">
                          {t("admin.appointments.awaitingRefund")} —{" "}
                          {t("services.priceAmount", { price: a.amount.toLocaleString() })}
                        </span>
                        <button
                          onClick={() => issueRefund(a.id)}
                          className="rounded-full bg-amber-700 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-800"
                        >
                          {t("admin.appointments.issueRefund")}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {a.status === "confirmed" && isOnlineMode && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-deep/15 bg-indigo-deep/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-deep/10 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-indigo-deep">
                        {t("video.hostControls")}
                      </span>
                      <span className="text-xs font-medium text-ink-soft">
                        {sessionStatusLabel(a, now)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {canStartEarly && (
                        <button
                          onClick={() => handleStart(a)}
                          disabled={pendingId === a.id}
                          className="rounded-full border border-indigo px-4 py-2 text-xs font-medium text-indigo transition-colors hover:bg-indigo hover:text-white disabled:opacity-50"
                        >
                          {pendingId === a.id ? t("video.starting") : t("video.startNow")}
                        </button>
                      )}
                      <button
                        onClick={() => handleJoinAsHost(a)}
                        disabled={(!joinable && !canStartEarly) || pendingId === a.id}
                        className="rounded-full bg-indigo-deep px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingId === a.id
                          ? t("video.connecting")
                          : a.mode === "video"
                          ? t("video.joinAsHost")
                          : a.mode === "audio"
                          ? t("video.joinAudio")
                          : t("video.openChat")}
                      </button>
                      {a.sessionStatus === "live" && (
                        <button
                          onClick={() => handleEnd(a)}
                          disabled={pendingId === a.id}
                          className="rounded-full border border-crimson px-4 py-2 text-xs font-medium text-crimson-deep transition-colors hover:bg-crimson hover:text-white disabled:opacity-50"
                        >
                          {t("chat.endSession")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => load(visible[visible.length - 1]?.createdAt)}
            disabled={loadingMore}
            className="rounded-full border border-line px-5 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-60"
          >
            {loadingMore ? <InlineSpinner /> : t("admin.appointments.loadOlder")}
          </button>
        </div>
      )}

      {activePanel?.kind === "video" && (
        <VideoCallModal
          roomUrl={activePanel.roomUrl}
          joinToken={activePanel.joinToken}
          patientName={activePanel.patientName}
          mode={activePanel.mode}
          hostView
          onClose={() => {
            setActivePanel(null);
            load();
          }}
        />
      )}
      {activePanel?.kind === "chat" && user && (
        <ChatPanel
          threadId={activePanel.threadId}
          viewerUid={user.uid}
          viewerRole="admin"
          patientName={activePanel.patientName}
          hostView
          onClose={() => {
            setActivePanel(null);
            load();
          }}
        />
      )}
    </div>
  );
}
