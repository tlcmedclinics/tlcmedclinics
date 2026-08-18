"use client";

import { useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import type { DoctorProfile, Service } from "@/types";
import type { Slot } from "@/types/slot";

export default function AdminSlotsPage() {
  const toast = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [doctorFilter, setDoctorFilter] = useState("");

  const [form, setForm] = useState({
    doctorId: "",
    service: "",
    date: "",
    times: "",
    durationMinutes: "30",
    mode: "online" as "online" | "in-clinic",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch("/api/slots");
      if (!res.ok) throw new Error();
      const data: Slot[] = await res.json();
      setSlots(data);
    } catch {
      toast.error("Couldn't load slots. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    authedFetch("/api/doctors")
      .then((res) => (res.ok ? res.json() : []))
      .then(setDoctors)
      .catch(() => {});
    fetch("/api/services")
      .then((res) => res.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const doctor = doctors.find((d) => d.uid === form.doctorId);
    if (!doctor) {
      toast.error("Pick a doctor first.");
      return;
    }
    const times = form.times
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!form.date || times.length === 0) {
      toast.error("Add a date and at least one time (e.g. 09:00, 09:30, 10:00).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authedFetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.uid,
          doctorName: doctor.name,
          service: form.service || undefined,
          date: form.date,
          times,
          durationMinutes: Number(form.durationMinutes) || 30,
          mode: form.mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create slot(s)");
      toast.success(`${times.length} slot${times.length > 1 ? "s" : ""} added for ${doctor.name}.`);
      setForm({ ...form, times: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create slot(s)");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSlot(slot: Slot) {
    if (!confirm(`Delete the ${slot.date} ${slot.time} slot for ${slot.doctorName}?`)) return;
    setDeletingId(slot.id);
    try {
      const res = await authedFetch("/api/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't delete this slot");
      toast.success("Slot deleted.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this slot");
    } finally {
      setDeletingId(null);
    }
  }

  async function freeUp(slot: Slot) {
    if (
      !confirm(
        `Mark ${slot.date} ${slot.time} (${slot.doctorName}) as available again? Only do this if the linked appointment was already cancelled outside the system.`
      )
    )
      return;
    try {
      const res = await authedFetch("/api/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, status: "available" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Slot freed up.");
      load();
    } catch {
      toast.error("Couldn't update this slot.");
    }
  }

  const visible = useMemo(() => {
    const list = doctorFilter ? slots.filter((s) => s.doctorId === doctorFilter) : slots;
    const grouped = new Map<string, Slot[]>();
    for (const s of list) {
      const arr = grouped.get(s.date) ?? [];
      arr.push(s);
      grouped.set(s.date, arr);
    }
    return Array.from(grouped.entries());
  }, [slots, doctorFilter]);

  return (
    <div className="animate-fade-up">
      <h1 className="h1">Slots</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Patients can only book the slots you add here — they no longer pick a date/time
        themselves. A slot disappears from booking the moment it&apos;s taken.
      </p>

      <form
        onSubmit={handleCreate}
        className="mt-6 grid gap-4 rounded-2xl border border-line/70 p-6 sm:grid-cols-2"
      >
        <div>
          <label className="text-xs font-medium text-ink-soft">Doctor</label>
          <select
            required
            className="input mt-1"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
          >
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d.uid} value={d.uid}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">Service (optional)</label>
          <select
            className="input mt-1"
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          >
            <option value="">Any service</option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">Date</label>
          <input
            required
            type="date"
            className="input mt-1"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">Duration (minutes)</label>
          <input
            type="number"
            min={5}
            step={5}
            className="input mt-1"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">In-clinic or online</label>
          <select
            className="input mt-1"
            value={form.mode}
            onChange={(e) => setForm({ ...form, mode: e.target.value as "online" | "in-clinic" })}
          >
            <option value="online">Online (telemedicine)</option>
            <option value="in-clinic">In clinic</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-ink-soft">
            Times — comma-separated (e.g. 09:00, 09:30, 10:00, 14:00)
          </label>
          <input
            required
            className="input mt-1"
            placeholder="09:00, 09:30, 10:00"
            value={form.times}
            onChange={(e) => setForm({ ...form, times: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-crimson px-5 py-2.5 text-sm font-medium text-white hover:bg-crimson-deep disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add slot(s)"}
          </button>
        </div>
      </form>

      <div className="mt-8 flex items-center gap-2">
        <label className="text-xs font-medium text-ink-soft">Filter by doctor</label>
        <select
          className="input w-auto py-1.5 text-xs"
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
        >
          <option value="">All doctors</option>
          {doctors.map((d) => (
            <option key={d.uid} value={d.uid}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No slots yet — add some above.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {visible.map(([date, daySlots]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-ink">{date}</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {daySlots
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {s.time} · {s.doctorName}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {s.service ? s.service : "Any service"} · {s.durationMinutes} min ·{" "}
                          {(s.mode ?? "online") === "in-clinic" ? "In clinic" : "Online"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${
                            s.status === "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-indigo/10 text-indigo"
                          }`}
                        >
                          {s.status === "available" ? "Available" : "Booked"}
                        </span>
                        {s.status === "booked" ? (
                          <button
                            onClick={() => freeUp(s)}
                            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-indigo hover:text-indigo"
                          >
                            Free up
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteSlot(s)}
                            disabled={deletingId === s.id}
                            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-crimson hover:text-crimson-deep disabled:opacity-50"
                          >
                            {deletingId === s.id ? "Deleting…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
