"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authed-fetch";
import type { Service } from "@/types";

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await authedFetch("/api/services");
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this service? It will disappear from the site and booking form.")) return;
    await authedFetch(`/api/services/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="h1">Services</h1>
        <Link
          href="/admin/services/new"
          className="rounded-full bg-indigo px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep"
        >
          + Add Service
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Services you add here appear on the public Services page and in the patient
        booking form automatically.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      ) : services.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line/70 p-8 text-center text-sm text-ink-soft">
          No services yet.{" "}
          <Link href="/admin/services/new" className="font-medium text-indigo hover:text-indigo-deep">
            Add your first one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="card-hover flex flex-col justify-between rounded-2xl border border-line/70 p-5"
            >
              <div>
                <span className="eyebrow text-indigo">{s.category}</span>
                <p className="mt-1.5 h4 text-ink">{s.name}</p>
                <p className="mt-1 text-sm leading-snug text-ink-soft line-clamp-2">{s.short}</p>
                {typeof s.price === "number" && (
                  <p className="mt-2 font-mono text-xs text-ink-soft">
                    From PKR {s.price.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link
                  href={`/admin/services/${s.id}/edit`}
                  className="font-medium text-indigo hover:text-indigo-deep"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="font-medium text-crimson-deep hover:text-crimson"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
