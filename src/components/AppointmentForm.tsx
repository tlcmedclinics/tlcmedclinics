"use client";

import { useEffect, useState } from "react";
import type { Service } from "@/types";
import { useToast } from "@/contexts/ToastContext";

type Status = "idle" | "submitting" | "success";

export default function AppointmentForm() {
  const toast = useToast();
  const [status, setStatus] = useState<Status>("idle");
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      toast.success("Request received — our team will call you shortly.");
      form.reset();
    } catch {
      setStatus("idle");
      toast.error("Something went wrong. Please call the clinic directly or try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-indigo/20 bg-mist/60 p-8 text-center">
        <p className="h3 text-indigo-deep">Request received</p>
        <p className="mt-2 text-sm text-ink-soft">
          Our team will call you shortly to confirm your appointment.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-medium text-indigo hover:text-indigo-deep"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name">
          <input name="name" type="text" required className="input" placeholder="Your name" />
        </Field>
        <Field label="Phone number">
          <input name="phone" type="tel" required className="input" placeholder="03XX-XXXXXXX" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email (optional)">
          <input name="email" type="email" className="input" placeholder="you@example.com" />
        </Field>
        <Field label="Service">
          <select name="service" required defaultValue="" className="input">
            <option value="" disabled>
              Select a service
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
            <option value="Not sure yet">Not sure yet — help me choose</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred date">
          <input name="preferredDate" type="date" className="input" />
        </Field>
        <Field label="Preferred time">
          <select name="preferredTime" defaultValue="" className="input">
            <option value="" disabled>
              Select a slot
            </option>
            <option value="Morning (11:00 AM – 2:00 PM)">Morning (11:00 AM – 2:00 PM)</option>
            <option value="Evening (4:00 PM – 8:00 PM)">Evening (4:00 PM – 8:00 PM)</option>
          </select>
        </Field>
      </div>

      <Field label="Message (optional)">
        <textarea
          name="message"
          rows={4}
          className="input resize-none"
          placeholder="Anything the clinic should know before your visit"
        />
      </Field>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-indigo-deep disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Request a Call-back"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
