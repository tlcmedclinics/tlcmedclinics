"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import PaypalButton from "@/components/PaypalButton";
import type { Coupon, DoctorProfile, PatientType, Service, SessionType } from "@/types";
import type { Slot } from "@/types/slot";

type Step = "type" | "details" | "payment" | "done-paid" | "done-callback";
type ConsultMode = "online" | "in-clinic";

type Details = {
  service: string;
  amount: number;
  mode: string;
  phone: string;
  notes: string;
  slotId: string;
  date: string;
  time: string;
  doctorId: string;
  doctorName: string;
  couponCode?: string;
  patientType: PatientType;
  sessionType?: SessionType;
};

// Follow-up bookings are just regular Service docs tagged under a
// "Follow-up" category from the admin panel — that reuses the existing
// service pricing UI instead of a separate config screen. This just
// recognizes which services belong in which branch of the flow.
function isFollowUpService(s: Service) {
  return /follow|session/i.test(s.category) || /follow|session/i.test(s.name);
}

function guessSessionType(s: Service): SessionType {
  if (/60/.test(s.name)) return "session-60";
  if (/30/.test(s.name)) return "session-30";
  return "regular-followup";
}

function BookAppointmentContent() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedServiceName, setSelectedServiceName] = useState("");

  const [patientType, setPatientType] = useState<PatientType | null>(null);
  const [consultMode, setConsultMode] = useState<ConsultMode>("online");

  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [mode, setMode] = useState("video");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [step, setStep] = useState<Step>("type");
  const [details, setDetails] = useState<Details | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then(setServices)
      .finally(() => setLoadingServices(false));

    authedFetch("/api/doctors")
      .then((res) => (res.ok ? res.json() : []))
      .then(setDoctors)
      .finally(() => setLoadingDoctors(false));
  }, []);

  useEffect(() => {
    setPhone((p) => p || profile?.phone || "");
  }, [profile]);

  const newPatientServices = services.filter((s) => !isFollowUpService(s));
  const followUpServices = services.filter(isFollowUpService);
  const visibleServices = patientType === "follow-up" ? followUpServices : newPatientServices;

  const selectedService = services.find((s) => s.name === selectedServiceName);

  const basePrice = selectedService?.price ?? 0;
  const discountedAmount = (() => {
    if (!appliedCoupon || patientType !== "new") return basePrice;
    if (appliedCoupon.discountType === "percent") {
      return Math.max(0, Math.round(basePrice * (1 - appliedCoupon.discountValue / 100)));
    }
    return Math.max(0, basePrice - appliedCoupon.discountValue);
  })();

  // Doctors whose specialization mentions this service's name or category —
  // the clinic doesn't hard-link doctors to services by id, so this is a
  // best-effort text match. Falls back to every active doctor when nothing
  // matches yet, so booking never dead-ends on an empty list.
  const matchingDoctors = (() => {
    if (!selectedService) return [];
    const needle1 = selectedService.name.toLowerCase();
    const needle2 = selectedService.category.toLowerCase();
    const matched = doctors.filter((d) => {
      const spec = (d.specialization ?? "").toLowerCase();
      return spec.includes(needle1) || spec.includes(needle2) || needle1.includes(spec) || needle2.includes(spec);
    });
    return matched.length > 0 ? matched : doctors;
  })();

  // Load available slots for whichever doctors match this service, filtered
  // by whether the patient wants an in-clinic or online (telemedicine)
  // consultation — each doctor's own availability/mode is set from the
  // admin/doctor slots panel, so patients only ever see real openings.
  useEffect(() => {
    setSelectedSlot(null);
    if (!selectedServiceName || loadingDoctors) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    authedFetch(
      `/api/slots?onlyAvailable=true&service=${encodeURIComponent(selectedServiceName)}&mode=${consultMode}`
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((all: Slot[]) => {
        const matchingIds = new Set(matchingDoctors.map((d) => d.uid));
        setSlots(all.filter((s) => matchingIds.has(s.doctorId)));
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceName, loadingDoctors, doctors, consultMode]);

  const slotsByDate = (() => {
    const grouped = new Map<string, Slot[]>();
    for (const s of slots) {
      const arr = grouped.get(s.date) ?? [];
      arr.push(s);
      grouped.set(s.date, arr);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  })();

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await authedFetch(`/api/coupons/${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponError(data.error ?? "This coupon isn't valid right now.");
        return;
      }
      setAppliedCoupon(data.coupon as Coupon);
      toast.success("Coupon applied.");
    } catch {
      setAppliedCoupon(null);
      setCouponError("Couldn't check that coupon. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Pick an available slot first.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Add a phone number.");
      return;
    }
    setDetails({
      service: selectedServiceName,
      amount: patientType === "new" ? discountedAmount : basePrice,
      mode,
      phone,
      notes,
      slotId: selectedSlot.id,
      date: selectedSlot.date,
      time: selectedSlot.time,
      doctorId: selectedSlot.doctorId,
      doctorName: selectedSlot.doctorName,
      couponCode: patientType === "new" && appliedCoupon ? appliedCoupon.code : undefined,
      patientType: patientType ?? "new",
      sessionType: patientType === "follow-up" && selectedService ? guessSessionType(selectedService) : undefined,
    });
    setStep("payment");
  }

  // Call-back bookings skip payment entirely — the appointment is created
  // right away, unpaid, for the clinic to confirm by phone. It still holds
  // the chosen slot immediately so nobody else can take it.
  async function requestCallback() {
    if (!details) return;
    setSubmitting(true);
    try {
      const res = await authedFetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: profile?.name,
          patientPhone: details.phone,
          service: details.service,
          mode: details.mode,
          notes: details.notes,
          amount: details.amount,
          slotId: details.slotId,
          couponCode: details.couponCode,
          patientType: details.patientType,
          sessionType: details.sessionType,
          bookingType: "call-back",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not book appointment");
      }

      toast.success("Call-back requested.");
      setStep("done-callback");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      // Most likely someone else took the slot in the meantime — send the
      // patient back to pick another one instead of dead-ending.
      setStep("details");
      setDetails(null);
    } finally {
      setSubmitting(false);
    }
  }

  // Booking payload shared by both the Stripe and PayPal endpoints — the
  // server stashes it in a pendingBookings doc and only creates the real
  // appointment once payment actually clears.
  function bookingPayload() {
    if (!details) return null;

    return {
      patientName: profile?.name,
      patientPhone: details.phone,
      service: details.service,
      mode: details.mode,
      date: details.date,
      time: details.time,
      notes: details.notes,
      amount: details.amount,
      slotId: details.slotId,
      couponCode: details.couponCode,
      patientType: details.patientType,
      sessionType: details.sessionType,
    };
  }

  async function handleStripeCheckout() {
    const payload = bookingPayload();
    if (!payload) return;
    setSubmitting(true);
    try {
      const res = await authedFetch("/api/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start checkout");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      setSubmitting(false);
    }
  }

  if (step === "done-paid" || step === "done-callback") {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-6 h2 text-ink">
          {step === "done-paid" ? "Appointment booked!" : "Call-back requested"}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {step === "done-paid"
            ? "Your payment was received and your slot is confirmed. You'll get a notification here and by email — the clinic and your doctor have been notified too."
            : "Our team will call you shortly to confirm your appointment."}
        </p>
        <button
          onClick={() => router.push("/patient/dashboard")}
          className="mt-6 rounded-full bg-indigo px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-deep"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-14 animate-fade-up">
      <h1 className="h1">Book an Appointment</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Pick your slot, then either pay online to confirm instantly, or ask us to call
        you back.
      </p>

      <div className="mt-6 flex items-center gap-2 text-xs font-medium text-ink-soft">
        <span className={step === "type" ? "text-indigo" : ""}>1. Visit type</span>
        <span className="h-px w-6 bg-line" />
        <span className={step === "details" ? "text-indigo" : ""}>2. Details</span>
        <span className="h-px w-6 bg-line" />
        <span className={step === "payment" ? "text-indigo" : ""}>3. Confirm</span>
      </div>

      {step === "type" && (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => {
              setPatientType("new");
              setSelectedServiceName("");
              setStep("details");
            }}
            className="w-full rounded-2xl border border-line/70 p-5 text-left transition-colors hover:border-indigo"
          >
            <p className="font-medium text-ink">New patient</p>
            <p className="mt-1 text-xs text-ink-soft">
              First visit — choose a service, apply a coupon if you have one, then pick your doctor.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setPatientType("follow-up");
              setSelectedServiceName("");
              setStep("details");
            }}
            className="w-full rounded-2xl border border-line/70 p-5 text-left transition-colors hover:border-indigo"
          >
            <p className="font-medium text-ink">Follow-up</p>
            <p className="mt-1 text-xs text-ink-soft">
              Already a patient — book a regular follow-up (15 min) or a longer session (30/60 min).
            </p>
          </button>
        </div>
      )}

      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="mt-8 space-y-5">
          <button
            type="button"
            onClick={() => setStep("type")}
            className="text-xs font-medium text-indigo hover:text-indigo-deep"
          >
            ← Change visit type
          </button>

          <select
            required
            className="input"
            value={selectedServiceName}
            onChange={(e) => {
              setSelectedServiceName(e.target.value);
              setAppliedCoupon(null);
              setCouponCode("");
              setCouponError("");
            }}
            disabled={loadingServices}
          >
            <option value="" disabled>
              {loadingServices
                ? "Loading services…"
                : patientType === "follow-up"
                ? "Select follow-up type"
                : "Select a service"}
            </option>
            {visibleServices.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
                {typeof s.price === "number" ? ` — PKR ${s.price.toLocaleString()}` : ""}
              </option>
            ))}
          </select>

          {patientType === "new" && selectedServiceName && (
            <div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Coupon code (optional)"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setAppliedCoupon(null);
                    setCouponError("");
                  }}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="rounded-full border border-line px-4 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-60"
                >
                  {applyingCoupon ? "Checking…" : "Apply"}
                </button>
              </div>
              {couponError && <p className="mt-1.5 text-xs text-crimson-deep">{couponError}</p>}
              {appliedCoupon && (
                <p className="mt-1.5 text-xs text-indigo">
                  {appliedCoupon.code} applied — PKR {discountedAmount.toLocaleString()}{" "}
                  <span className="text-ink-soft line-through">PKR {basePrice.toLocaleString()}</span>
                </p>
              )}
            </div>
          )}

          {selectedServiceName && (
            <div>
              <p className="text-xs font-medium text-ink-soft">In clinic or online?</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConsultMode("online")}
                  className={`flex-1 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                    consultMode === "online"
                      ? "border-indigo bg-indigo text-white"
                      : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                  }`}
                >
                  Online (telemedicine)
                </button>
                <button
                  type="button"
                  onClick={() => setConsultMode("in-clinic")}
                  className={`flex-1 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                    consultMode === "in-clinic"
                      ? "border-indigo bg-indigo text-white"
                      : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                  }`}
                >
                  In clinic
                </button>
              </div>
            </div>
          )}

          {selectedServiceName && (
            <div>
              <p className="text-xs font-medium text-ink-soft">Available slots</p>
              {loadingSlots ? (
                <p className="mt-2 text-sm text-ink-soft">Loading slots…</p>
              ) : slotsByDate.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">
                  No open {consultMode === "in-clinic" ? "in-clinic" : "online"} slots for this right now —
                  please check back soon or request a call-back once you continue.
                </p>
              ) : (
                <div className="mt-2 space-y-3">
                  {slotsByDate.map(([date, daySlots]) => (
                    <div key={date}>
                      <p className="text-xs font-semibold text-ink">{date}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {daySlots
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedSlot(s)}
                              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                selectedSlot?.id === s.id
                                  ? "border-indigo bg-indigo text-white"
                                  : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                              }`}
                            >
                              {s.time} · Dr. {s.doctorName.replace(/^Dr\.?\s*/i, "")}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <>
              <div>
                <select value={mode} onChange={(e) => setMode(e.target.value)} required className="input">
                  {consultMode === "in-clinic" ? (
                    <option value="in-person">In-person visit</option>
                  ) : (
                    <>
                      <option value="video">Video consultation</option>
                      <option value="audio">Audio call</option>
                      <option value="chat">Chat consultation</option>
                    </>
                  )}
                </select>
                <p className="mt-1.5 text-xs text-ink-soft">
                  {consultMode === "in-clinic"
                    ? "Visit the clinic at your scheduled time."
                    : "Video/audio/chat sessions open on their own at your scheduled time — no separate app needed."}
                </p>
              </div>

              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (03XX-XXXXXXX)"
                className="input"
              />

              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the clinic should know (optional)"
                className="input resize-none"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loadingServices || !selectedSlot}
            className="w-full rounded-full bg-crimson px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
          >
            Continue
          </button>
        </form>
      )}

      {step === "payment" && details && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-line/70 bg-paper-dim/40 p-5 text-sm text-ink-soft">
            <p className="font-medium text-ink">{details.service}</p>
            {details.doctorName && (
              <p className="mt-1 text-ink">Dr. {details.doctorName.replace(/^Dr\.?\s*/i, "")}</p>
            )}
            <p className="mt-1">
              {details.date} · {details.time} · {details.mode}
            </p>
            {details.amount > 0 && (
              <p className="mt-1 font-mono text-ink">PKR {details.amount.toLocaleString()}</p>
            )}
            <button
              type="button"
              onClick={() => setStep("details")}
              className="mt-2 text-xs font-medium text-indigo hover:text-indigo-deep"
            >
              Edit details
            </button>
          </div>

          <div className="rounded-2xl border border-indigo/20 p-5 sm:p-6">
            <p className="h4 text-ink">Pay online now</p>
            <p className="mt-1 text-xs text-ink-soft">
              Your slot is confirmed instantly once payment goes through.
            </p>

            <button
              type="button"
              disabled={submitting}
              onClick={handleStripeCheckout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
            >
              {submitting
                ? "Redirecting…"
                : `Pay${details.amount > 0 ? ` PKR ${details.amount.toLocaleString()}` : ""} with card`}
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-ink-soft">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>

            <PaypalButton
              amount={details.amount}
              booking={bookingPayload()}
              disabled={submitting}
              onBusy={setSubmitting}
              onSuccess={() => {
                toast.success("Appointment booked!");
                setStep("done-paid");
              }}
              onError={(msg) => toast.error(msg)}
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="rounded-2xl border border-line/70 p-5 sm:p-6">
            <p className="h4 text-ink">Prefer to discuss on a call?</p>
            <p className="mt-1 text-xs text-ink-soft">
              We&apos;ll hold your requested slot and call you back to confirm — no payment needed now.
            </p>
            <button
              type="button"
              disabled={submitting}
              onClick={requestCallback}
              className="mt-4 w-full rounded-full border border-line px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:border-indigo hover:text-indigo disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Request a Call-back"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <RequireRole role="patient">
      <BookAppointmentContent />
    </RequireRole>
  );
}
