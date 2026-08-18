"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VideoCallModal from "@/components/VideoCallModal";
import ChatPanel from "@/components/ChatPanel";
import RatingStars from "@/components/RatingStars";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { useSessionAction } from "@/lib/use-session-action";
import { useNow } from "@/lib/use-now";
import { canJoinSession, sessionStatusLabel } from "@/lib/session-window";
import type { Appointment } from "@/types";

const statusStyles: Record<Appointment["status"], string> = {
  pending: "bg-mist text-ink-soft",
  confirmed: "bg-indigo/10 text-indigo",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-crimson/10 text-crimson-deep",
};

function PatientDashboardContent() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const now = useNow();
  const { startSession, pendingId } = useSessionAction();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<
    | { kind: "video"; roomUrl: string; joinToken?: string; patientName: string; mode: "video" | "audio" }
    | { kind: "chat"; threadId: string; patientName: string }
    | null
  >(null);

  function load() {
    authedFetch("/api/appointments?limit=100")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Couldn't load appointments"))))
      .then(setAppointments)
      .catch(() => toast.error("Couldn't load your appointments. Pull to refresh or try again."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel(a: Appointment) {
    if (!confirm("Cancel this appointment? If you already paid, the clinic will process your refund.")) return;
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Appointment cancelled.");
      load();
    } catch {
      toast.error("Couldn't cancel. Please try again.");
    }
  }

  async function handleRate(a: Appointment, rating: number, comment: string) {
    try {
      const res = await authedFetch(`/api/appointments/${a.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppointments((prev) => prev.map((x) => (x.id === a.id ? data.appointment : x)));
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Couldn't submit your rating. Please try again.");
    }
  }

  async function handleJoin(a: Appointment) {
    const result = await startSession(a.id);
    if (!result) return;
    const updated = result.appointment;
    setAppointments((prev) => prev.map((x) => (x.id === a.id ? updated : x)));

    if ((updated.mode === "video" || updated.mode === "audio") && updated.roomUrl) {
      setActivePanel({
        kind: "video",
        roomUrl: updated.roomUrl,
        joinToken: result.joinToken,
        patientName: updated.patientName,
        mode: updated.mode,
      });
    } else if (updated.mode === "chat") {
      setActivePanel({ kind: "chat", threadId: updated.id, patientName: updated.patientName });
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const upcoming = appointments.filter((a) => a.date >= todayIso && a.status === "confirmed");
    const completed = appointments.filter((a) => a.status === "completed").length;
    const nextUp = [...upcoming].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    return { upcomingCount: upcoming.length, completed, nextUp };
  }, [appointments, todayIso]);

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-indigo">Welcome back</p>
          <h1 className="mt-3 h1">{profile?.name}</h1>
        </div>
      </div>

      {/* Stat cards — makes this actually read as a dashboard */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line/70 bg-paper p-5">
          <p className="stat-number text-indigo">{loading ? "—" : stats.upcomingCount}</p>
          <p className="mt-1 text-xs text-ink-soft">Upcoming appointments</p>
        </div>
        <div className="rounded-2xl border border-line/70 bg-paper p-5">
          <p className="stat-number text-indigo">{loading ? "—" : stats.completed}</p>
          <p className="mt-1 text-xs text-ink-soft">Completed sessions</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-line/70 bg-indigo-deep/5 p-5 sm:col-span-1">
          {stats.nextUp ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-deep">Next up</p>
              <p className="mt-1 text-sm font-medium text-ink">{stats.nextUp.service}</p>
              <p className="text-xs text-ink-soft">
                {stats.nextUp.date} · {stats.nextUp.time}
              </p>
            </>
          ) : (
            <p className="text-xs text-ink-soft">Nothing scheduled — book whenever you&apos;re ready.</p>
          )}
        </div>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-ink-soft">
        🔒 {t("security.badge")}
      </p>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="h3 text-ink">Your Appointments</h2>
        <Link
          href="/patient/book"
          className="rounded-full bg-crimson px-5 py-2.5 text-sm font-medium text-white hover:bg-crimson-deep"
        >
          {t("nav.book")}
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : appointments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line/70 bg-mist/40 p-8 text-center">
          <p className="text-sm text-ink-soft">No appointments yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((a) => {
            const joinable = canJoinSession(a, now);
            const isOnlineMode = a.mode === "video" || a.mode === "audio" || a.mode === "chat";
            return (
              <div key={a.id} className="rounded-2xl border border-line/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{a.service}</p>
                    <p className="text-sm text-ink-soft">
                      {a.date} · {a.time} · {a.mode}
                      {a.doctorName && <span> · Dr. {a.doctorName.replace(/^Dr\.?\s*/i, "")}</span>}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[a.status]}`}
                  >
                    {a.status === "pending" ? "Awaiting call-back" : a.status}
                  </span>
                </div>

                {a.status === "confirmed" && isOnlineMode && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-mist/50 px-4 py-3">
                    <span className="text-xs font-medium text-ink-soft">
                      {sessionStatusLabel(a, now)}
                    </span>
                    <button
                      onClick={() => handleJoin(a)}
                      disabled={!joinable || pendingId === a.id}
                      className="rounded-full bg-indigo px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pendingId === a.id
                        ? "Connecting…"
                        : a.mode === "video"
                        ? "Join video call"
                        : a.mode === "audio"
                        ? "Join audio call"
                        : "Open secure chat"}
                    </button>
                  </div>
                )}

                {(a.status === "confirmed" || a.status === "pending") && a.sessionStatus !== "live" && (
                  <button
                    onClick={() => handleCancel(a)}
                    className="mt-3 text-xs font-medium text-ink-soft hover:text-crimson-deep"
                  >
                    Cancel appointment
                  </button>
                )}

                {a.status === "cancelled" && a.cancelReason && (
                  <p className="mt-2 text-xs text-ink-soft">Reason: {a.cancelReason}</p>
                )}

                {a.status === "completed" && a.prescription && (
                  <div className="mt-3 rounded-xl border border-teal-600/20 bg-teal-50 p-4">
                    <p className="text-xs font-medium text-teal-800">Prescription from your doctor</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-teal-900">{a.prescription}</p>
                  </div>
                )}

                {a.status === "completed" && !a.rating && (
                  <RatingStars onSubmit={(rating, comment) => handleRate(a, rating, comment)} />
                )}
                {a.status === "completed" && a.rating && (
                  <p className="mt-3 text-xs text-ink-soft">
                    You rated this session {"★".repeat(a.rating)}
                    {"☆".repeat(5 - a.rating)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activePanel?.kind === "video" && (
        <VideoCallModal
          roomUrl={activePanel.roomUrl}
          joinToken={activePanel.joinToken}
          patientName={activePanel.patientName}
          mode={activePanel.mode}
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
          viewerRole="patient"
          patientName={activePanel.patientName}
          onClose={() => {
            setActivePanel(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function PatientDashboardPage() {
  // Auth + role gating and page chrome come from app/patient/layout.tsx.
  return <PatientDashboardContent />;
}
