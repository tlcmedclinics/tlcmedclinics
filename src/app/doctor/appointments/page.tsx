"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RatingBreakdown, StarScore } from "@/components/RatingStars";
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
import VideoCallModal from "@/components/VideoCallModal";
import ChatPanel from "@/components/ChatPanel";
import PrescriptionEditor from "@/components/PrescriptionEditor";
import FollowUpScheduler from "@/components/FollowUpScheduler";
import AppointmentHistory from "@/components/AppointmentHistory";
import {
  APPOINTMENT_STATUS_LABELS as statusLabel,
  APPOINTMENT_STATUS_STYLES as statusStyles,
} from "@/lib/appointment-status";
import type { Appointment, AppointmentStatus } from "@/types";
import { formatClinicTime } from "@/lib/clinic-time";
import { SkeletonRows, InlineSpinner } from "@/components/Loader";

const PAGE_SIZE = 50;

// Searching swaps paging for a wider single fetch, so a name match isn't
// limited to whichever page happens to be loaded. Still bounded — the route
// caps at 500 — so it can't regress to fetching the whole collection.
const SEARCH_WINDOW = 500;


export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const t = useT();
  const now = useNow();
  const { startSession, endSession, pendingId } = useSessionAction();

  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<{ message: string; setup: boolean } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Rows beyond the live window, pulled on demand. History doesn't change, so
  // there's nothing to subscribe to down there.
  const [older, setOlder] = useState<Appointment[]>([]);

  // The newest page is a live subscription, so a booking or a status change
  // shows up without the doctor reloading. Searching widens the window, and
  // that wider set comes over REST instead.
  const searching = search.trim().length > 0;
  const live = useLiveAppointments({
    status: filter,
    pageSize: PAGE_SIZE,
    enabled: !searching,
  });
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



  // Live rows first, then anything paged in below them. The map keeps a row
  // that appears in both (a live update to something already paged) from
  // rendering twice, and lets the live copy win.
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
      <h1 className="h1">{t("doctor.appointments.title")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t("doctor.appointments.subtitle")}</p>

      <div className="mt-6 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("appointments.search")}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
        <p className="mt-8 text-sm text-ink-soft">No appointments here.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.map((a) => {
            const isOnlineMode = a.mode === "video" || a.mode === "audio" || a.mode === "chat";
            const joinable = canJoinSession(a, now);
            // The doctor is a host, and the server has always let a host start
            // early — only the admin screen offered a button for it. So a
            // patient sitting in the waiting room ten minutes early meant the
            // doctor had to ask an admin to open the room. They can now do it
            // themselves; admin keeps the same ability, it just isn't required.
            const canStartEarly =
              a.status === "confirmed" && isOnlineMode && a.sessionStatus !== "ended" && !joinable;
            return (
              <div key={a.id} className="rounded-2xl border border-line/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink">{a.patientName}</p>
                    <p className="text-sm text-ink-soft">
                      {a.service} · {a.date} {formatClinicTime(a.time)} · {a.mode}
                    </p>
                    {a.notes && <p className="mt-1 text-sm text-ink-soft/80">&ldquo;{a.notes}&rdquo;</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[a.status]}`}
                    >
                      {statusLabel[a.status]}
                    </span>
                    {/* No status dropdown while the patient still has to pay:
                        its options are confirmed/completed/cancelled, so an
                        awaiting-payment row would render a select matching none
                        of them — a blank control that silently confirms an
                        unpaid visit the moment anyone touches it. */}
                    {a.status !== "cancelled" && a.status !== "awaiting-payment" && (
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
                      {canStartEarly && (
                        <button
                          onClick={() => handleJoinAsHost(a)}
                          disabled={pendingId === a.id}
                          className="rounded-full border border-indigo-deep px-4 py-2 text-xs font-medium text-indigo-deep transition-colors hover:bg-indigo-deep hover:text-white disabled:opacity-50"
                        >
                          Start early
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

                <AppointmentHistory appointment={a} showInternal />

                {a.status === "cancelled" && a.cancelReason && (
                  <p className="mt-2 text-xs text-ink-soft">
                    Cancelled by {a.cancelledBy}: {a.cancelReason}
                  </p>
                )}

                {a.status === "completed" && (
                  <>
                    {a.rating ? (
                      <div className="mt-3">
                        <p className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                          <StarScore value={a.rating} />
                          <span>{a.rating.toFixed(1)} / 5</span>
                          {a.ratingComment && (
                            <span>&ldquo;{a.ratingComment}&rdquo;</span>
                          )}
                        </p>
                        {/* Which part of the visit earned which score. A mean
                            of 3.6 tells a doctor nothing; "waiting time: Poor,
                            quality of care: Excellent" tells them what to fix
                            and what not to change. */}
                        {a.ratings && <RatingBreakdown answers={a.ratings} />}
                      </div>
                    ) : null}
                    <PrescriptionEditor
                      appointment={a}
                      onSaved={(patch) =>
                        setAppointments((prev) =>
                          prev.map((x) => (x.id === a.id ? { ...x, ...patch } : x))
                        )
                      }
                    />
                    <FollowUpScheduler
                      appointment={a}
                      onScheduled={(followUp) =>
                        setAppointments((prev) =>
                          prev.map((x) =>
                            x.id === a.id ? { ...x, followUpAppointmentId: followUp.id } : x
                          )
                        )
                      }
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
            onClick={() => load(visible[visible.length - 1]?.createdAt)}
            disabled={loadingMore}
            className="rounded-full border border-line px-5 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-60"
          >
            {loadingMore ? <InlineSpinner /> : "Load older appointments"}
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

