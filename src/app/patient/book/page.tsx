"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import PaymentMethods from "@/components/PaymentMethods";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Coupon, DoctorProfile, PatientType, Service, SessionType } from "@/types";
import type { Slot } from "@/types/slot";
import { formatClinicTime } from "@/lib/clinic-time";
import Loader from "@/components/Loader";

/**
 * Booking runs doctor-first: service → doctor → time → details → pay.
 *
 * The patient chooses a person before a time, because who they see matters
 * more than when. That also means the slot list is always one doctor's real
 * availability rather than a pooled list the patient has to decode.
 *
 * If no doctor covering the chosen service has an open slot, the flow doesn't
 * dead-end — the patient sends a request and the clinic assigns someone.
 */

type Step = "type" | "service" | "doctor" | "time" | "details" | "payment" | "done";
type ConsultMode = "online" | "in-clinic";
type Outcome = "paid" | "callback" | "requested";

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

// Follow-up bookings are regular Service docs tagged under a "Follow-up"
// category from the admin panel — that reuses the existing pricing UI instead
// of a separate config screen.
function isFollowUpService(s: Service) {
  return /follow|session/i.test(s.category) || /follow|session/i.test(s.name);
}

function guessSessionType(s: Service): SessionType {
  if (/60/.test(s.name)) return "session-60";
  if (/30/.test(s.name)) return "session-30";
  return "regular-followup";
}

/**
 * Does this doctor cover this service?
 *
 * The clinic doesn't hard-link doctors to services by id, so this is a
 * best-effort match on the doctor's specialization against the service's name
 * and category. `services` is checked first for when that link does get added.
 */
function coversService(doctor: DoctorProfile, service: Service) {
  const listed = (doctor as DoctorProfile & { services?: string[] }).services;
  if (Array.isArray(listed) && listed.length > 0) {
    return listed.includes(service.id) || listed.includes(service.name);
  }
  const spec = (doctor.specialization ?? "").toLowerCase().trim();
  if (!spec) return false;
  const name = service.name.toLowerCase();
  const category = service.category.toLowerCase();
  return (
    spec.includes(name) ||
    spec.includes(category) ||
    name.includes(spec) ||
    category.includes(spec)
  );
}

function StepBar({ step }: { step: Step }) {
  const t = useT();
  const steps: { key: Step; labelKey: string }[] = [
    { key: "service", labelKey: "book.step.service" },
    { key: "doctor", labelKey: "book.step.doctor" },
    { key: "time", labelKey: "book.step.time" },
    { key: "payment", labelKey: "book.step.confirm" },
  ];
  const order: Step[] = ["type", "service", "doctor", "time", "details", "payment"];
  const currentIndex = order.indexOf(step);

  return (
    <ol className="mt-6 flex items-center gap-1.5 text-[0.7rem] font-medium text-ink-soft">
      {steps.map((s, i) => {
        const reached = currentIndex >= order.indexOf(s.key);
        return (
          <li key={s.key} className="flex items-center gap-1.5">
            {i > 0 && <span className="h-px w-4 bg-line sm:w-6" />}
            <span className={reached ? "text-indigo" : ""}>{t(s.labelKey)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function BookAppointmentContent() {
  const router = useRouter();
  const { profile } = useAuth();
  const toast = useToast();
  const t = useT();

  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [step, setStep] = useState<Step>("type");
  const [outcome, setOutcome] = useState<Outcome>("paid");
  const [patientType, setPatientType] = useState<PatientType>("new");
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [consultMode, setConsultMode] = useState<ConsultMode>("online");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);

  // ---- "Book again" prefill -------------------------------------------
  //
  // A patient arriving from a finished visit already knows what they want:
  // the same treatment, with the same doctor. Landing them on step one to
  // pick both again is the sort of thing that makes people give up and phone
  // the clinic instead — which is the work this page exists to avoid.
  //
  // Read once, then never again: `prefilled` guards against re-running when
  // the services list re-renders, which would drag someone back to the doctor
  // step every time they tried to move past it.
  const params = useSearchParams();
  const prefilled = useRef(false);
  const wantedDoctorId = useRef<string | null>(null);

  useEffect(() => {
    if (prefilled.current || services.length === 0) return;
    prefilled.current = true;

    const wantedService = params.get("service");
    wantedDoctorId.current = params.get("doctorId");
    if (!wantedService) return;

    /**
     * Matched on slug first, then on name.
     *
     * Two kinds of link arrive here. "Book again" on a finished appointment
     * passes the service *name*, because that is what the appointment record
     * stores. A Book button on a treatment page passes the *slug*, because
     * that is what identifies the page — and a slug is stable where a name is
     * not, so a service the clinic renames keeps working from its own page.
     *
     * The name comparison is case- and space-insensitive: an appointment saved
     * before a name was tidied up ("Botox  — up to 50 units") should still find
     * its service rather than silently dropping the patient on step one.
     */
    const wanted = wantedService.trim().toLowerCase().replace(/\s+/g, " ");
    const match =
      services.find((x) => x.slug === wantedService) ??
      services.find(
        (x) => x.name?.trim().toLowerCase().replace(/\s+/g, " ") === wanted
      );
    if (!match) return; // the service was renamed or removed since that visit

    setPatientType(isFollowUpService(match) ? "follow-up" : "new");
    setSelectedServiceName(match.name);
    setStep("doctor");
  }, [services, params]);

  // The doctor is picked in a second pass, once their slots are actually
  // loaded. Choosing the service clears `selectedDoctorId` — and a doctor
  // selected before their availability is known would show an empty time step
  // with no way to tell "fully booked" from "still loading".
  useEffect(() => {
    const wanted = wantedDoctorId.current;
    if (!wanted || slots.length === 0) return;
    if (slots.some((slot) => slot.doctorId === wanted)) {
      setSelectedDoctorId(wanted);
      setStep("time");
    }
    // Cleared either way: if that doctor has nothing open, the patient picks
    // from whoever does rather than being held on a dead end.
    wantedDoctorId.current = null;
  }, [slots]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const [mode, setMode] = useState("video");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredWhen, setPreferredWhen] = useState("");

  const [details, setDetails] = useState<Details | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => (r.ok ? r.json() : [])),
      authedFetch("/api/doctors").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, d]) => {
        setServices(s);
        setDoctors(d);
      })
      .catch(() => toast.error(t("error.loadFailed")))
      .finally(() => setLoadingLists(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPhone((p) => p || profile?.phone || "");
  }, [profile]);

  const visibleServices = useMemo(
    () =>
      patientType === "follow-up"
        ? services.filter(isFollowUpService)
        : services.filter((s) => !isFollowUpService(s)),
    [services, patientType]
  );

  const selectedService = useMemo(
    () => services.find((s) => s.name === selectedServiceName),
    [services, selectedServiceName]
  );

  /** The published fee for the treatment. */
  const fullPrice = selectedService?.price ?? 0;

  /**
   * What is actually charged online now.
   *
   * The clinic takes a PKR 5,000 advance on its longer treatments and settles
   * the balance at the visit, so a service carrying `advancePayment` must be
   * charged that and not its full fee. Billing a patient PKR 18,000 up front
   * for a ketamine session the clinic only asks 5,000 to hold is the kind of
   * mistake that ends in a refund and a lost patient.
   *
   * `??` rather than `||`, so an advance of 0 — "book now, pay at the clinic" —
   * stays 0 instead of falling through to the full price.
   */
  const basePrice = selectedService?.advancePayment ?? fullPrice;

  /** The part settled at the clinic, if any. */
  const balanceDue = Math.max(0, fullPrice - basePrice);

  const discountedAmount = useMemo(() => {
    if (!appliedCoupon || patientType !== "new") return basePrice;
    if (appliedCoupon.discountType === "percent") {
      return Math.max(0, Math.round(basePrice * (1 - appliedCoupon.discountValue / 100)));
    }
    return Math.max(0, basePrice - appliedCoupon.discountValue);
  }, [appliedCoupon, patientType, basePrice]);

  // Every doctor who could take this service, whether or not they have slots.
  // Falls back to all active doctors when specializations don't match anything,
  // so a clinic that hasn't filled them in still works.
  const matchingDoctors = useMemo(() => {
    if (!selectedService) return [];
    const active = doctors.filter((d) => d.active && d.approvalStatus === "approved");
    const matched = active.filter((d) => coversService(d, selectedService));
    return matched.length > 0 ? matched : active;
  }, [doctors, selectedService]);

  // Load open slots once a service is chosen. One request for the service,
  // grouped per doctor below — cheaper than a request per doctor card.
  useEffect(() => {
    setSelectedDoctorId("");
    setSelectedSlot(null);
    if (!selectedServiceName) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    authedFetch(
      `/api/slots?onlyAvailable=true&service=${encodeURIComponent(selectedServiceName)}`
    )
      .then((res) => (res.ok ? res.json() : []))
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedServiceName]);

  /** doctorId → their open slots, in time order. */
  const slotsByDoctor = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const list = map.get(s.doctorId) ?? [];
      list.push(s);
      map.set(s.doctorId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    }
    return map;
  }, [slots]);

  /** Only doctors the patient can actually book right now. */
  const bookableDoctors = useMemo(
    () => matchingDoctors.filter((d) => (slotsByDoctor.get(d.uid)?.length ?? 0) > 0),
    [matchingDoctors, slotsByDoctor]
  );

  const selectedDoctor = doctors.find((d) => d.uid === selectedDoctorId);

  // The chosen doctor's slots for the chosen consultation mode, grouped by day.
  const slotsByDate = useMemo(() => {
    const mine = (slotsByDoctor.get(selectedDoctorId) ?? []).filter(
      (s) => (s.mode ?? "online") === consultMode
    );
    const grouped = new Map<string, Slot[]>();
    for (const s of mine) {
      const list = grouped.get(s.date) ?? [];
      list.push(s);
      grouped.set(s.date, list);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slotsByDoctor, selectedDoctorId, consultMode]);

  /** Which modes this doctor actually offers — don't show an empty toggle. */
  const availableModes = useMemo(() => {
    const mine = slotsByDoctor.get(selectedDoctorId) ?? [];
    return new Set(mine.map((s) => (s.mode ?? "online") as ConsultMode));
  }, [slotsByDoctor, selectedDoctorId]);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await authedFetch(`/api/coupons/${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponError(data.error ?? t("book.couponInvalid"));
        return;
      }
      setAppliedCoupon(data.coupon as Coupon);
      toast.success(t("book.couponApplied"));
    } catch {
      setAppliedCoupon(null);
      setCouponError(t("error.network"));
    } finally {
      setApplyingCoupon(false);
    }
  }

  function pickDoctor(uid: string) {
    setSelectedDoctorId(uid);
    setSelectedSlot(null);
    const modes = new Set(
      (slotsByDoctor.get(uid) ?? []).map((s) => (s.mode ?? "online") as ConsultMode)
    );
    // Land on a mode this doctor actually offers rather than an empty list.
    setConsultMode(modes.has("online") ? "online" : "in-clinic");
    setStep("time");
  }

  function confirmTime() {
    if (!selectedSlot || !selectedDoctor) {
      toast.error(t("book.pickSlotFirst"));
      return;
    }
    setStep("details");
  }

  function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error(t("book.pickSlotFirst"));
      return;
    }
    if (!phone.trim()) {
      toast.error(t("book.addPhone"));
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
      patientType,
      sessionType:
        patientType === "follow-up" && selectedService
          ? guessSessionType(selectedService)
          : undefined,
    });
    setStep("payment");
  }

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
        throw new Error(data.error ?? t("common.somethingWrong"));
      }
      setOutcome("callback");
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
      // Most likely someone took the slot in the meantime — send them back to
      // pick another rather than dead-ending.
      setStep("time");
      setDetails(null);
    } finally {
      setSubmitting(false);
    }
  }

  /** No doctor had availability — ask the clinic to assign one. */
  async function requestDoctor() {
    if (!phone.trim()) {
      toast.error(t("book.addPhone"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await authedFetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: profile?.name,
          patientPhone: phone,
          service: selectedServiceName,
          mode: consultMode === "in-clinic" ? "in-person" : "video",
          notes,
          amount: patientType === "new" ? discountedAmount : basePrice,
          patientType,
          sessionType:
            patientType === "follow-up" && selectedService
              ? guessSessionType(selectedService)
              : undefined,
          preferredWhen,
          bookingType: "doctor-request",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("common.somethingWrong"));
      }
      setOutcome("requested");
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  }

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

  /* ------------------------------- done ------------------------------- */

  if (step === "done") {
    const copy = {
      paid: { title: t("book.booked"), body: t("book.bookedHint") },
      callback: { title: t("book.callBackRequested"), body: t("book.callBackRequestedHint") },
      requested: { title: t("book.requestSent"), body: t("book.requestSentHint") },
    }[outcome];

    return (
      <div className="mx-auto max-w-lg py-10 text-center animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-6 h2 text-ink">{copy.title}</p>
        <p className="mt-2 text-sm text-ink-soft">{copy.body}</p>
        <button onClick={() => router.push("/patient/dashboard")} className="btn-indigo mt-6">
          {t("book.backToDashboard")}
        </button>
      </div>
    );
  }

  /* ------------------------------- flow ------------------------------- */

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="h1">{t("book.title")}</h1>
      <p className="lede mt-1">{t("book.subtitle")}</p>
      {step !== "type" && <StepBar step={step} />}

      {/* 1 — visit type */}
      {step === "type" && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(["new", "follow-up"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPatientType(type);
                setSelectedServiceName("");
                setStep("service");
              }}
              className="card card-pad card-hover text-start"
            >
              <p className="h4 text-ink">
                {t(type === "new" ? "book.newPatient" : "book.followUp")}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                {t(type === "new" ? "book.newPatientHint" : "book.followUpHint")}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* 2 — service */}
      {step === "service" && (
        <div className="mt-6 space-y-4">
          <button type="button" onClick={() => setStep("type")} className="text-xs font-semibold text-indigo">
            ← {t("book.changeVisitType")}
          </button>

          {loadingLists ? (
            <p className="text-sm text-ink-soft">{t("book.loadingServices")}</p>
          ) : visibleServices.length === 0 ? (
            <p className="text-sm text-ink-soft">{t("book.noServices")}</p>
          ) : (
            <div className="grid gap-2.5">
              {visibleServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedServiceName(s.name);
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponError("");
                    setStep("doctor");
                  }}
                  className="card card-pad card-hover flex items-center justify-between gap-4 text-start"
                >
                  <span>
                    <span className="block font-semibold text-ink">{s.name}</span>
                    {s.short && (
                      <span className="mt-0.5 block text-xs text-ink-soft">{s.short}</span>
                    )}
                    {typeof s.durationMinutes === "number" && s.durationMinutes > 0 && (
                      <span className="numeric mt-1 block text-[0.7rem] text-ink-soft/80">
                        {s.durationMinutes} minutes
                      </span>
                    )}
                  </span>

                  {/* The full fee, and under it what is actually taken online.
                      Showing only the advance makes the treatment look cheaper
                      than it is; showing only the total makes the patient think
                      they are about to be charged all of it. */}
                  {typeof s.price === "number" && (
                    <span className="shrink-0 text-end">
                      <span className="numeric block text-sm font-medium text-ink">
                        PKR {s.price.toLocaleString()}
                      </span>
                      {typeof s.advancePayment === "number" &&
                        s.advancePayment < s.price && (
                          <span className="numeric mt-0.5 block text-[0.7rem] text-indigo">
                            PKR {s.advancePayment.toLocaleString()} to book
                          </span>
                        )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3 — doctor */}
      {step === "doctor" && (
        <div className="mt-6 space-y-4">
          <button type="button" onClick={() => setStep("service")} className="text-xs font-semibold text-indigo">
            ← {t("book.changeService")}
          </button>

          <div>
            <h2 className="h3 text-ink">{t("book.chooseDoctor")}</h2>
            <p className="mt-1 text-xs text-ink-soft">
              {t("book.chooseDoctorHint", { service: selectedServiceName })}
            </p>
          </div>

          {patientType === "new" && (
            <div className="card card-pad">
              <span className="label">{t("book.coupon")}</span>
              <div className="mt-1.5 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={t("book.coupon")}
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
                  className="btn-outline btn-sm"
                >
                  {applyingCoupon ? t("book.checking") : t("book.apply")}
                </button>
              </div>
              {couponError && <p className="mt-1.5 text-xs text-crimson-deep">{couponError}</p>}
              {appliedCoupon && (
                <p className="mt-1.5 text-xs text-indigo">
                  {appliedCoupon.code} —{" "}
                  <span className="numeric">PKR {discountedAmount.toLocaleString()}</span>{" "}
                  <span className="numeric text-ink-soft line-through">
                    PKR {basePrice.toLocaleString()}
                  </span>
                </p>
              )}
            </div>
          )}

          {loadingSlots ? (
            <Loader label={t("common.loading")} className="py-8" />
          ) : bookableDoctors.length > 0 ? (
            <div className="grid gap-2.5">
              {bookableDoctors.map((d) => {
                const next = slotsByDoctor.get(d.uid)?.[0];
                const count = slotsByDoctor.get(d.uid)?.length ?? 0;
                return (
                  <button
                    key={d.uid}
                    type="button"
                    onClick={() => pickDoctor(d.uid)}
                    className="card card-pad card-hover flex items-start gap-3.5 text-start"
                  >
                    <Avatar name={d.name} photoURL={d.photoURL} size="lg" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">
                          Dr. {d.name.replace(/^Dr\.?\s*/i, "")}
                        </span>
                        {d.online && (
                          <span className="pill pill-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            {t("presence.online")}
                          </span>
                        )}
                      </span>
                      {d.specialization && (
                        <span className="mt-0.5 block text-xs text-ink-soft">{d.specialization}</span>
                      )}
                      {d.bio && (
                        <span className="mt-1.5 line-clamp-2 block text-xs leading-relaxed text-ink-soft/90">
                          {d.bio}
                        </span>
                      )}
                      {next && (
                        <span className="mt-2 block text-xs font-semibold text-indigo">
                          {t("book.nextAvailable")}{" "}
                          <span className="numeric">
                            {next.date} · {formatClinicTime(next.time)}
                          </span>
                          <span className="ms-1.5 font-normal text-ink-soft">
                            ({t("book.slotsOpen", { count })})
                          </span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="card card-pad border-warning/30 bg-warning-soft/60">
              <p className="h4 text-ink">{t("book.noDoctorTitle")}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                {t("book.noDoctorHint")}
              </p>
              <div className="mt-4 space-y-3">
                <label className="field">
                  <span className="label">{t("book.preferredWhen")}</span>
                  <input
                    className="input"
                    value={preferredWhen}
                    onChange={(e) => setPreferredWhen(e.target.value)}
                    placeholder={t("book.preferredWhenPlaceholder")}
                  />
                </label>
                <label className="field">
                  <span className="label">{t("settings.phone")}</span>
                  <input
                    className="input numeric"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                  />
                </label>
                <label className="field">
                  <span className="label">{t("book.notes")}</span>
                  <textarea
                    className="input resize-none"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("book.notesPlaceholder")}
                  />
                </label>
                <button
                  type="button"
                  onClick={requestDoctor}
                  disabled={submitting}
                  className="btn-indigo w-full"
                >
                  {submitting ? t("book.sending") : t("book.requestDoctor")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4 — time */}
      {step === "time" && selectedDoctor && (
        <div className="mt-6 space-y-5">
          <button type="button" onClick={() => setStep("doctor")} className="text-xs font-semibold text-indigo">
            ← {t("book.changeDoctor")}
          </button>

          <div className="card card-pad flex items-center gap-3.5">
            <Avatar name={selectedDoctor.name} photoURL={selectedDoctor.photoURL} size="lg" />
            <span className="min-w-0">
              <span className="block font-semibold text-ink">
                Dr. {selectedDoctor.name.replace(/^Dr\.?\s*/i, "")}
              </span>
              {selectedDoctor.specialization && (
                <span className="block text-xs text-ink-soft">{selectedDoctor.specialization}</span>
              )}
            </span>
          </div>

          <div>
            <p className="label">{t("book.clinicOrOnline")}</p>
            <div className="mt-2 flex gap-2">
              {(["online", "in-clinic"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={!availableModes.has(m)}
                  onClick={() => {
                    setConsultMode(m);
                    setSelectedSlot(null);
                    setMode(m === "in-clinic" ? "in-person" : "video");
                  }}
                  className={`flex-1 rounded-[var(--radius-pill)] border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
                    consultMode === m
                      ? "border-indigo bg-indigo text-white"
                      : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                  }`}
                >
                  {t(m === "online" ? "mode.online" : "mode.inClinic")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">{t("book.availableSlots")}</p>
            {slotsByDate.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">{t("book.noSlotsThisMode")}</p>
            ) : (
              <div className="mt-2 space-y-3">
                {slotsByDate.map(([date, daySlots]) => (
                  <div key={date}>
                    <p className="numeric text-xs font-semibold text-ink">{date}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {daySlots.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`numeric rounded-[var(--radius-pill)] border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            selectedSlot?.id === s.id
                              ? "border-indigo bg-indigo text-white"
                              : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                          }`}
                        >
                          {formatClinicTime(s.time)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={confirmTime}
            disabled={!selectedSlot}
            className="btn-primary w-full"
          >
            {t("book.continue")}
          </button>
        </div>
      )}

      {/* 5 — details */}
      {step === "details" && selectedSlot && (
        <form onSubmit={handleDetailsSubmit} className="mt-6 space-y-4">
          <button type="button" onClick={() => setStep("time")} className="text-xs font-semibold text-indigo">
            ← {t("book.changeTime")}
          </button>

          {consultMode === "online" && (
            <label className="field">
              <span className="label">{t("book.howToMeet")}</span>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="input">
                <option value="video">{t("mode.video")}</option>
                <option value="audio">{t("mode.audio")}</option>
                <option value="chat">{t("mode.chat")}</option>
              </select>
            </label>
          )}

          <label className="field">
            <span className="label">{t("settings.phone")}</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XX-XXXXXXX"
              className="input numeric"
            />
          </label>

          <label className="field">
            <span className="label">{t("book.notes")}</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("book.notesPlaceholder")}
              className="input resize-none"
            />
          </label>

          <button type="submit" className="btn-primary w-full">
            {t("book.continue")}
          </button>
        </form>
      )}

      {/* 6 — payment */}
      {step === "payment" && details && (
        <div className="mt-6 space-y-5">
          <div className="card card-pad text-sm text-ink-soft">
            <p className="font-semibold text-ink">{details.service}</p>
            {details.doctorName && (
              <p className="mt-1 text-ink">Dr. {details.doctorName.replace(/^Dr\.?\s*/i, "")}</p>
            )}
            <p className="numeric mt-1">
              {details.date} · {formatClinicTime(details.time)}
            </p>
            <p className="mt-0.5">{t(`mode.${details.mode === "in-person" ? "inPerson" : details.mode}`)}</p>
            {details.amount > 0 && (
              <p className="numeric mt-1 font-semibold text-ink">
                PKR {details.amount.toLocaleString()}
              </p>
            )}
            {/* Said before they pay, not after. A patient who is charged 5,000
                and then billed 13,000 at the clinic without warning has been
                surprised by their own doctor. */}
            {balanceDue > 0 && (
              <p className="mt-1 text-xs text-ink-soft">
                Advance payment. The balance of{" "}
                <span className="numeric font-medium text-ink">
                  PKR {balanceDue.toLocaleString()}
                </span>{" "}
                is settled at the clinic.
              </p>
            )}
            <button
              type="button"
              onClick={() => setStep("details")}
              className="mt-2 text-xs font-semibold text-indigo"
            >
              {t("book.editDetails")}
            </button>
          </div>

          {/* JazzCash, EasyPaisa and cards, in whatever combination the clinic
              has credentials for. The Stripe button and the PayPal button that
              used to be here could never have worked from Pakistan — neither
              company onboards a merchant registered here — so they are gone
              rather than left as two options that fail at the last step. */}
          <div className="card card-pad border-indigo/20">
            <p className="h4 text-ink">{t("book.payNow")}</p>
            <p className="mt-1 text-xs text-ink-soft">{t("book.payNowHint")}</p>

            <PaymentMethods
              payload={bookingPayload()}
              amount={details.amount}
              disabled={submitting}
              onBusyChange={setSubmitting}
              onError={(msg) => toast.error(msg)}
            />
          </div>

          <div className="card card-pad">
            <p className="h4 text-ink">{t("book.callBackTitle")}</p>
            <p className="mt-1 text-xs text-ink-soft">{t("book.callBackHint")}</p>
            <button
              type="button"
              disabled={submitting}
              onClick={requestCallback}
              className="btn-outline mt-4 w-full"
            >
              {submitting ? t("book.sending") : t("book.requestCallBack")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookAppointmentPage() {
  // Auth + role gating and page chrome come from app/patient/layout.tsx.
  //
  // The Suspense boundary is required, not decorative: this page reads
  // useSearchParams() for the "book this again" prefill, and Next refuses to
  // build a page that does so outside one — it can't prerender markup that
  // depends on a query string it doesn't have yet. Without it the whole build
  // fails, not just this route.
  return (
    <Suspense fallback={<Loader className="py-16" />}>
      <BookAppointmentContent />
    </Suspense>
  );
}
