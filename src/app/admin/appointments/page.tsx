"use client";

import { useCallback, useEffect, useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { useSessionAction } from "@/lib/use-session-action";
import { useNow } from "@/lib/use-now";
import { canJoinSession, sessionStatusLabel } from "@/lib/session-window";
import VideoCallModal from "@/components/VideoCallModal";
import ChatPanel from "@/components/ChatPanel";
import type { Appointment, AppointmentStatus, DoctorProfile } from "@/types";
import type { Slot } from "@/types/slot";

const PAGE_SIZE = 50;

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-mist text-ink-soft",
  confirmed: "bg-indigo/10 text-indigo",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-crimson/10 text-crimson-deep",
};

const statusLabel: Record<AppointmentStatus, string> = {
  pending: "Call-back needed",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminAppointmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const t = useT();
  const now = useNow();
  const { startSession, endSession, pendingId } = useSessionAction();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // The status filter is applied by Firestore now, not by the browser — this
  // page used to fetch every appointment the clinic had ever taken and filter
  // the array locally. `before` pages backwards through createdAt.
  const load = useCallback(
    async (before?: string) => {
      const isPaging = Boolean(before);
      if (isPaging) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (filter !== "all") params.set("status", filter);
        if (before) params.set("before", before);

        const res = await authedFetch(`/api/appointments?${params}`);
        if (!res.ok) throw new Error("Couldn't load appointments");
        const page: Appointment[] = await res.json();

        setAppointments((prev) => (isPaging ? [...prev, ...page] : page));
        setHasMore(page.length === PAGE_SIZE);
      } catch {
        toast.error("Couldn't load appointments. Please refresh.");
      } finally {
        if (isPaging) setLoadingMore(false);
        else setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter]
  );

  // Refetches whenever the status tab changes.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
      toast.success(doctor ? `Assigned to ${doctor.name}.` : "Unassigned.");
      load();
    } catch {
      toast.error("Couldn't assign a doctor. Please try again.");
    }
  }

  async function issueRefund(id: string) {
    if (!confirm("Issue a real refund through Stripe/PayPal for this booking?")) return;
    try {
      const res = await authedFetch(`/api/appointments/${id}/refund`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      toast.success("Refund issued.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't issue the refund.");
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
      toast.success(`Marked as "${statusLabel[status]}".`);
      load();
    } catch {
      toast.error("Couldn't update the status. Please try again.");
    }
  }

  // Reschedule — opens a picker of the same doctor's other open slots.
  // Free/available slots only, so this can never double-book.
  async function openReschedule(a: Appointment) {
    setReschedulingId(a.id);
    setRescheduleSlots([]);
    if (!a.doctorId) {
      toast.error("Assign a doctor before rescheduling.");
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
      toast.error("Couldn't load that doctor's open slots.");
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
      if (!res.ok) throw new Error(data.error ?? "Couldn't reschedule");
      toast.success("Appointment rescheduled — patient and doctor notified.");
      setReschedulingId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reschedule this appointment.");
    } finally {
      setSavingReschedule(false);
    }
  }

  async function handleStart(a: Appointment) {
    const result = await startSession(a.id);
    if (!result) return;
    const updated = result.appointment;
    setAppointments((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    toast.success(a.sessionStatus === "live" ? "Session ready." : "Session started.");
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


  return (
    <div className="animate-fade-up">
      <h1 className="h1">Appointments</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Every booking on the site lands here — paid bookings are already confirmed;
        call-back requests need you to phone the patient and confirm. Video/chat
        sessions go live at the scheduled time on their own, or you can start one
        early or late from here.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
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
            {f === "pending" ? "Call-back needed" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      ) : appointments.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No appointments here.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((a) => {
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
                            {a.date} {a.time}
                          </span>
                        </>
                      ) : null}
                      {" · "}
                      {a.mode}
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
                        ? `Paid online${a.amount ? ` · PKR ${a.amount.toLocaleString()}` : ""}`
                        : "Requested a call-back"}
                    </p>
                    {a.notes && <p className="mt-1 text-sm text-ink-soft/80">&ldquo;{a.notes}&rdquo;</p>}
                    {a.consultMode && (
                      <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-ink-soft/70">
                        {a.consultMode === "in-clinic" ? "In clinic" : "Online"}
                        {a.patientType ? ` · ${a.patientType === "new" ? "New patient" : "Follow-up"}` : ""}
                      </p>
                    )}
                    {a.rescheduledFrom && (
                      <p className="mt-1 text-[0.65rem] text-ink-soft/70">
                        Rescheduled from {a.rescheduledFrom.date} {a.rescheduledFrom.time}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-[0.65rem] uppercase tracking-wide text-ink-soft/70">
                        Doctor
                      </label>
                      <select
                        className="input w-auto py-1 text-xs"
                        value={a.doctorId ?? ""}
                        onChange={(e) => assignDoctor(a.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
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
                          Reschedule
                        </button>
                      )}
                    </div>

                    {reschedulingId === a.id && (
                      <div className="mt-3 rounded-xl border border-indigo/20 bg-indigo/5 p-3">
                        {loadingRescheduleSlots ? (
                          <p className="text-xs text-ink-soft">Loading open slots…</p>
                        ) : rescheduleSlots.length === 0 ? (
                          <p className="text-xs text-ink-soft">
                            No other open slots for this doctor right now — add one from the Slots
                            page first.
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
                                {s.date} · {s.time} · {(s.mode ?? "online") === "in-clinic" ? "In clinic" : "Online"}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setReschedulingId(null)}
                          className="mt-2 text-xs text-ink-soft hover:text-crimson-deep"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[a.status]}`}
                    >
                      {statusLabel[a.status]}
                    </span>
                    <select
                      className="input w-auto"
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                    >
                      <option value="pending">Call-back needed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {a.status === "cancelled" && a.cancelReason && (
                  <p className="mt-2 text-xs text-ink-soft">
                    Cancelled by {a.cancelledBy}: {a.cancelReason}
                  </p>
                )}

                {a.status === "cancelled" && a.paymentStatus === "refunded" && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3">
                    {a.refundProcessedAt ? (
                      <span className="text-xs font-medium text-amber-800">
                        Refunded on {a.refundProcessedAt.slice(0, 10)}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-amber-800">
                          Awaiting refund — PKR {a.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => issueRefund(a.id)}
                          className="rounded-full bg-amber-700 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-800"
                        >
                          Issue refund
                        </button>
                      </>
                    )}
                  </div>
                )}

                {a.status === "confirmed" && isOnlineMode && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-deep/15 bg-indigo-deep/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-deep/10 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-indigo-deep">
                        Host controls
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
                          {pendingId === a.id ? "Starting…" : "Start session now"}
                        </button>
                      )}
                      <button
                        onClick={() => handleJoinAsHost(a)}
                        disabled={(!joinable && !canStartEarly) || pendingId === a.id}
                        className="rounded-full bg-indigo-deep px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingId === a.id
                          ? "Connecting…"
                          : a.mode === "video"
                          ? "Join as host"
                          : a.mode === "audio"
                          ? "Join audio call"
                          : "Open chat"}
                      </button>
                      {a.sessionStatus === "live" && (
                        <button
                          onClick={() => handleEnd(a)}
                          disabled={pendingId === a.id}
                          className="rounded-full border border-crimson px-4 py-2 text-xs font-medium text-crimson-deep transition-colors hover:bg-crimson hover:text-white disabled:opacity-50"
                        >
                          End session
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
            onClick={() => load(appointments[appointments.length - 1]?.createdAt)}
            disabled={loadingMore}
            className="rounded-full border border-line px-5 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load older appointments"}
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
