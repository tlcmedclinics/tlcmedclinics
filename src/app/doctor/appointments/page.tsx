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
import type { Appointment, AppointmentStatus } from "@/types";

const PAGE_SIZE = 50;

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-mist text-ink-soft",
  confirmed: "bg-indigo/10 text-indigo",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-crimson/10 text-crimson-deep",
};

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const t = useT();
  const now = useNow();
  const { startSession, endSession, pendingId } = useSessionAction();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activePanel, setActivePanel] = useState<
    | { kind: "video"; roomUrl: string; joinToken?: string; patientName: string; mode: "video" | "audio" }
    | { kind: "chat"; threadId: string; patientName: string }
    | null
  >(null);

  // Firestore applies the status filter and the page limit; this used to pull
  // the doctor's whole appointment history and filter it in the browser.
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
        if (!res.ok) throw new Error();
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

  async function updateStatus(id: string, status: AppointmentStatus) {
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Updated.");
      load();
    } catch {
      toast.error("Couldn't update. Please try again.");
    }
  }

  async function handleJoinAsHost(a: Appointment) {
    const result = await startSession(a.id);
    if (!result) return;
    const appointment = result.appointment;
    setAppointments((prev) => prev.map((x) => (x.id === a.id ? appointment : x)));

    if ((appointment.mode === "video" || appointment.mode === "audio") && appointment.roomUrl) {
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

  async function savePrescription(id: string, prescription: string) {
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, prescription }),
      });
      if (!res.ok) throw new Error();
      toast.success("Prescription saved.");
      setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, prescription } : x)));
    } catch {
      toast.error("Couldn't save the prescription. Please try again.");
    }
  }


  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("doctor.appointments.title")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t("doctor.appointments.subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "confirmed", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "border-indigo bg-indigo text-white"
                : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : appointments.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No appointments here.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((a) => {
            const isOnlineMode = a.mode === "video" || a.mode === "audio" || a.mode === "chat";
            const joinable = canJoinSession(a, now);
            return (
              <div key={a.id} className="rounded-2xl border border-line/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink">{a.patientName}</p>
                    <p className="text-sm text-ink-soft">
                      {a.service} · {a.date} {a.time} · {a.mode}
                    </p>
                    {a.notes && <p className="mt-1 text-sm text-ink-soft/80">&ldquo;{a.notes}&rdquo;</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[a.status]}`}
                    >
                      {a.status}
                    </span>
                    {a.status !== "cancelled" && (
                      <select
                        className="input w-auto"
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>
                </div>

                {a.status === "confirmed" && isOnlineMode && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-deep/15 bg-indigo-deep/5 px-4 py-3">
                    <span className="text-xs font-medium text-ink-soft">
                      {sessionStatusLabel(a, now)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleJoinAsHost(a)}
                        disabled={!joinable || pendingId === a.id}
                        className="rounded-full bg-indigo-deep px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pendingId === a.id
                          ? "Connecting…"
                          : a.mode === "video"
                          ? "Join as host"
                          : a.mode === "audio"
                          ? "Join audio call"
                          : "Open secure chat"}
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

                {a.status === "cancelled" && a.cancelReason && (
                  <p className="mt-2 text-xs text-ink-soft">
                    Cancelled by {a.cancelledBy}: {a.cancelReason}
                  </p>
                )}

                {a.status === "completed" && (
                  <>
                    {a.rating && (
                      <p className="mt-3 text-xs text-ink-soft">
                        Patient rated this session {"★".repeat(a.rating)}
                        {"☆".repeat(5 - a.rating)}
                        {a.ratingComment && <span> — &ldquo;{a.ratingComment}&rdquo;</span>}
                      </p>
                    )}
                    <PrescriptionEditor
                      appointment={a}
                      onSave={async (text) => {
                        await savePrescription(a.id, text);
                      }}
                    />
                  </>
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
          viewerRole="doctor"
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

function PrescriptionEditor({
  appointment,
  onSave,
}: {
  appointment: Appointment;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(appointment.prescription ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!appointment.prescription);

  if (!editing) {
    return (
      <div className="mt-3 rounded-xl border border-teal-600/20 bg-teal-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-teal-800">Prescription</p>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-indigo hover:text-indigo-deep">
            Edit
          </button>
        </div>
        <p className="mt-1 whitespace-pre-line text-sm text-teal-900">{appointment.prescription}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-line/70 p-4">
      <p className="text-xs font-medium text-ink">Prescription for this patient</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Medicine, dosage, and instructions…"
        className="input mt-2 resize-none text-sm"
      />
      <button
        disabled={saving || !text.trim()}
        onClick={async () => {
          setSaving(true);
          await onSave(text.trim());
          setSaving(false);
          setEditing(false);
        }}
        className="mt-2 rounded-full bg-teal-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save prescription"}
      </button>
    </div>
  );
}
