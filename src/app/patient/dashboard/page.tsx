"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VideoCallModal from "@/components/VideoCallModal";
import Overlay from "@/components/Overlay";
import PaymentMethods from "@/components/PaymentMethods";
import ChatPanel from "@/components/ChatPanel";
import RatingStars, { RatingBreakdown, StarScore } from "@/components/RatingStars";
import AppointmentHistory from "@/components/AppointmentHistory";
import { authedFetch } from "@/lib/authed-fetch";
import { useLiveAppointments } from "@/lib/use-live-appointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import { useSessionAction } from "@/lib/use-session-action";
import { useNow } from "@/lib/use-now";
import { canJoinSession, sessionStatusLabel } from "@/lib/session-window";
import type { Appointment } from "@/types";
import type { RatingAnswers } from "@/lib/rating";
import { formatClinicTime } from "@/lib/clinic-time";
import { useConfirm } from "@/contexts/ConfirmContext";
import { SkeletonRows } from "@/components/Loader";

const statusStyles: Record<Appointment["status"], string> = {
  pending: "bg-mist text-ink-soft",
  // Amber, not grey: this is the one status where the patient has to do
  // something, and it should not sit quietly beside the ones where they don't.
  "awaiting-payment": "bg-amber-100 text-amber-800",
  confirmed: "bg-indigo/10 text-indigo",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-crimson/10 text-crimson-deep",
};

/** How much of the hold is left, in words. */
function holdRemaining(dueAt?: string): string | null {
  if (!dueAt) return null;
  const ms = Date.parse(dueAt) - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const mins = Math.max(1, Math.round(ms / 60_000));
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

function PatientDashboardContent() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();
  const now = useNow();
  const { startSession, pendingId } = useSessionAction();

  /** The follow-up the patient is choosing a payment method for, if any. */
  const [payFor, setPayFor] = useState<Appointment | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [activePanel, setActivePanel] = useState<
    | { kind: "video"; roomUrl: string; joinToken?: string; patientName: string; mode: "video" | "audio" }
    | { kind: "chat"; threadId: string; patientName: string }
    | null
  >(null);

  // Live, so a status change, a prescription, or a follow-up the doctor just
  // booked appears without the patient reloading the page.
  const { appointments, loading, setAppointments } = useLiveAppointments({ pageSize: 100 });

  // Kept for the places that still act on a single row optimistically.
  function load() {
    /* no-op: the snapshot listener keeps this list current */
  }

  /**
   * Opens the payment methods for a follow-up the doctor already booked.
   *
   * ── Why this is no longer a straight jump to Stripe ──
   *
   * It used to POST to /api/payments/stripe/checkout and send the patient to
   * Stripe, which was wrong in two separate ways. Stripe does not pay out to a
   * merchant registered in Pakistan, so that checkout could never take real
   * money for this clinic; and it ignored `PAYMENTS_DISABLED`, so a gateway the
   * clinic had deliberately switched off still appeared here. The booking page
   * had long since moved to the server's own list of enabled gateways. This
   * page had simply been left behind, which is why a patient paying for a
   * follow-up saw a Stripe page while a patient booking a new appointment saw
   * Safepay.
   *
   * Nothing about the price is passed — the server reads it off the
   * appointment — so this only has to say which one.
   */

  /** Turning down a held follow-up — frees the slot straight away. */
  async function handleDecline(a: Appointment) {
    if (
      !(await confirm({
        title: "Release this time?",
        message: "The slot goes back to other patients. You can always book again later.",
        confirmLabel: "Release it",
        destructive: true,
      }))
    )
      return;
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Time released. You can book whenever suits you.");
    } catch {
      toast.error("Couldn't release that time.");
    }
  }

  async function handleCancel(a: Appointment) {
    if (
      !(await confirm({
        title: "Cancel this appointment?",
        message: "If you have already paid, the clinic will process your refund.",
        confirmLabel: "Cancel appointment",
        cancelLabel: "Keep it",
        destructive: true,
      }))
    )
      return;
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

  async function handleRate(a: Appointment, answers: RatingAnswers, comment: string) {
    try {
      const res = await authedFetch(`/api/appointments/${a.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, comment }),
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
                {stats.nextUp.date} · {formatClinicTime(stats.nextUp.time)}
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
        <SkeletonRows rows={3} className="mt-6" />
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
                      {a.date} · {formatClinicTime(a.time)} · {a.mode}
                      {a.doctorName && <span> · Dr. {a.doctorName.replace(/^Dr\.?\s*/i, "")}</span>}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[a.status]}`}
                  >
                    {a.status === "pending"
                      ? "Awaiting call-back"
                      : a.status === "awaiting-payment"
                      ? "Confirm to book"
                      : a.status}
                  </span>
                </div>

                {a.status === "awaiting-payment" && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-900">
                      Dr. {(a.doctorName ?? "").replace(/^Dr\.?\s*/i, "")} has held this
                      time for you — PKR {a.amount}
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      {holdRemaining(a.paymentDueAt)
                        ? `Confirm within ${holdRemaining(a.paymentDueAt)} or the time is released to other patients.`
                        : "This hold has expired. Please book a new time."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setPayError(null);
                          setPayFor(a);
                        }}
                        disabled={!holdRemaining(a.paymentDueAt)}
                        className="rounded-full bg-indigo px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirm and pay
                      </button>
                      <button
                        onClick={() => handleDecline(a)}
                        className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:text-crimson-deep"
                      >
                        Not this time
                      </button>
                    </div>
                  </div>
                )}

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

                {/* Straight back into booking with the treatment and doctor
                    already chosen — the two things a returning patient
                    otherwise has to find again from a list. */}
                {a.status === "completed" && (
                  <Link
                    href={{
                      pathname: "/patient/book",
                      query: {
                        service: a.service,
                        ...(a.doctorId ? { doctorId: a.doctorId } : {}),
                      },
                    }}
                    className="mt-3 inline-block rounded-full border border-indigo px-4 py-2 text-xs font-medium text-indigo transition-colors hover:bg-indigo hover:text-white"
                  >
                    Book this again
                    {a.doctorName ? ` with Dr. ${a.doctorName.replace(/^Dr\.?\s*/i, "")}` : ""}
                  </Link>
                )}

                {a.status === "cancelled" && a.cancelReason && (
                  <p className="mt-2 text-xs text-ink-soft">Reason: {a.cancelReason}</p>
                )}

                <AppointmentHistory appointment={a} />

                {a.status === "completed" && (a.prescription || a.prescriptionImages?.length) && (
                  <div className="mt-3 rounded-[var(--radius-sm)] border border-success/20 bg-success-soft p-4">
                    <p className="text-xs font-semibold text-success">
                      {t("patient.dashboard.prescription")}
                    </p>
                    {a.prescription && (
                      <p className="mt-1 whitespace-pre-line text-sm text-ink">{a.prescription}</p>
                    )}
                    {a.prescriptionImages?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {a.prescriptionImages.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={t("prescription.imageAlt")}
                              className="h-24 w-24 rounded-[var(--radius-sm)] border border-line object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {a.status === "completed" && !a.rating && (
                  <RatingStars
                    onSubmit={(answers, comment) => handleRate(a, answers, comment)}
                  />
                )}
                {a.status === "completed" && a.rating ? (
                  <div className="mt-3">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                      <StarScore value={a.rating} />
                      <span>{t("rating.youRated", { value: a.rating.toFixed(1) })}</span>
                    </p>
                    {/* The five answers, for a visit rated on the current
                        survey. A visit rated before it existed has the mean
                        above and nothing to break down, which is why this is
                        guarded rather than assumed. */}
                    {a.ratings && <RatingBreakdown answers={a.ratings} />}
                  </div>
                ) : null}
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

      {/* The same payment methods the booking page offers, on the same server
          list, for a follow-up the doctor already held a time for. One place
          decides which gateways exist; this sheet just shows them. */}
      {payFor && (
        <Overlay
          labelledBy="pay-followup-title"
          className="items-end justify-center sm:items-center"
          onClose={payBusy ? undefined : () => setPayFor(null)}
        >
          <button
            type="button"
            aria-label="Close"
            // Behind the sheet, not over it. Disabled while a gateway is
            // opening, because dismissing the sheet mid-handover leaves the
            // patient watching a page they can no longer cancel from.
            disabled={payBusy}
            onClick={() => setPayFor(null)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] disabled:cursor-wait"
          />

          <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
            <h2 id="pay-followup-title" className="text-lg font-semibold text-ink">
              Confirm your appointment
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {payFor.service}
              {payFor.date ? ` · ${payFor.date}` : ""}
              {payFor.time ? ` at ${formatClinicTime(payFor.time)}` : ""}
            </p>

            {payError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-crimson/25 bg-crimson/[0.06] px-4 py-3 text-sm text-crimson-deep"
              >
                {payError}
              </p>
            )}

            <PaymentMethods
              payload={{ appointmentId: payFor.id }}
              amount={payFor.amount}
              onBusyChange={setPayBusy}
              onError={setPayError}
            />

            <button
              type="button"
              disabled={payBusy}
              onClick={() => setPayFor(null)}
              className="mt-4 w-full rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

export default function PatientDashboardPage() {
  // Auth + role gating and page chrome come from app/patient/layout.tsx.
  return <PatientDashboardContent />;
}
