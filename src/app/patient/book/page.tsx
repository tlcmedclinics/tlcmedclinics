"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import PaypalButton from "@/components/PaypalButton";
import type { Service, DoctorProfile } from "@/types";

type Step = "details" | "payment" | "done-paid" | "done-callback";

type Details = {
  service: string;
  amount: number;
  mode: string;
  date: string;
  time: string;
  phone: string;
  notes: string;
  doctorId: string;
  doctorName: string;
};

function BookAppointmentContent() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [step, setStep] = useState<Step>("details");
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

  const selectedService = services.find((s) => s.name === selectedServiceName);

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

  function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const svc = services.find((s) => s.name === form.get("service"));
    const doctorId = String(form.get("doctorId") ?? "");
    const doctor = doctors.find((d) => d.uid === doctorId);

    setDetails({
      service: String(form.get("service")),
      amount: svc?.price ?? 0,
      mode: String(form.get("mode")),
      date: String(form.get("date")),
      time: String(form.get("time")),
      phone: String(form.get("phone")),
      notes: String(form.get("notes") ?? ""),
      doctorId: doctor?.uid ?? "",
      doctorName: doctor?.name ?? "",
    });
    setStep("payment");
  }

  // Call-back bookings skip payment entirely — the appointment is created
  // right away, unpaid, for the clinic to confirm by phone.
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
          doctorId: details.doctorId || undefined,
          doctorName: details.doctorName || undefined,
          service: details.service,
          mode: details.mode,
          date: details.date,
          time: details.time,
          notes: details.notes,
          amount: details.amount,
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
      doctorId: details.doctorId || undefined,
      doctorName: details.doctorName || undefined,
      service: details.service,
      mode: details.mode,
      date: details.date,
      time: details.time,
      notes: details.notes,
      amount: details.amount,
    };
  }

  // Stripe is a full hosted-page redirect — the browser leaves the app and
  // comes back to /patient/book/success once payment is done.
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
            ? "Your payment was received and your slot is confirmed."
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
        <span className={step === "details" ? "text-indigo" : ""}>1. Details</span>
        <span className="h-px w-6 bg-line" />
        <span className={step === "payment" ? "text-indigo" : ""}>2. Confirm</span>
      </div>

      {step === "details" && (
        <form onSubmit={handleDetailsSubmit} className="mt-8 space-y-5">
          <select
            name="service"
            required
            className="input"
            value={selectedServiceName}
            onChange={(e) => setSelectedServiceName(e.target.value)}
            disabled={loadingServices}
          >
            <option value="" disabled>
              {loadingServices ? "Loading services…" : "Select a service"}
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
                {typeof s.price === "number" ? ` — from PKR ${s.price.toLocaleString()}` : ""}
              </option>
            ))}
          </select>

          {selectedServiceName && (
            <div>
              <select name="doctorId" className="input" defaultValue="" disabled={loadingDoctors}>
                <option value="">
                  {loadingDoctors
                    ? "Loading doctors…"
                    : matchingDoctors.length === 0
                    ? "No doctor available yet — the clinic will assign one"
                    : "Any available doctor"}
                </option>
                {matchingDoctors.map((d) => (
                  <option key={d.uid} value={d.uid}>
                    Dr. {d.name.replace(/^Dr\.?\s*/i, "")}
                    {d.specialization ? ` — ${d.specialization}` : ""}
                    {d.online ? " · online now" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-soft">
                Pick a doctor for this service, or leave it on &ldquo;Any available doctor&rdquo; and the clinic
                will assign one.
              </p>
            </div>
          )}

          <div>
            <select name="mode" required className="input" defaultValue="video">
              <option value="video">Video consultation</option>
              <option value="audio">Audio call</option>
              <option value="chat">Chat consultation</option>
              <option value="in-person">In-person visit</option>
            </select>
            <p className="mt-1.5 text-xs text-ink-soft">
              Video/audio/chat sessions open on their own at your scheduled time — no separate app needed.
            </p>
          </div>

          <input
            name="phone"
            type="tel"
            required
            defaultValue={profile?.phone ?? ""}
            placeholder="Phone number (03XX-XXXXXXX)"
            className="input"
          />

          <div className="grid grid-cols-2 gap-4">
            <input name="date" type="date" required className="input" />
            <input name="time" type="time" required className="input" />
          </div>

          <textarea
            name="notes"
            rows={3}
            placeholder="Anything the clinic should know (optional)"
            className="input resize-none"
          />

          <button
            type="submit"
            disabled={loadingServices}
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
