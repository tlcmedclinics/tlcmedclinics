"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authedFetch } from "@/lib/authed-fetch";
import type { Service } from "@/types";

export default function ServiceForm({ service }: { service?: Service }) {
  const router = useRouter();
  const [image, setImage] = useState(service?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await authedFetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setImage(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      category: form.get("category"),
      short: form.get("short"),
      intro: form.get("intro"),
      points: form.get("points"),
      treatments: form.get("treatments"),
      price: form.get("price"),
      advancePayment: form.get("advancePayment"),
      durationMinutes: form.get("durationMinutes"),
      image,
    };

    try {
      const res = service
        ? await authedFetch(`/api/services/${service.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await authedFetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error("Save failed");
      router.push("/admin/services");
      router.refresh();
    } catch {
      setError("Something went wrong saving the service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Service name</span>
          <input name="name" required defaultValue={service?.name} placeholder="e.g. Ketamine Therapy" className="input" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Category</span>
          <input
            name="category"
            required
            defaultValue={service?.category}
            placeholder="e.g. Mental Health"
            className="input"
            list="category-suggestions"
          />
          {/* The clinic's three areas of care, matching the home page. A free
              text field with suggestions rather than a fixed dropdown: a new
              category shouldn't need a developer. */}
          <datalist id="category-suggestions">
            <option value="Diagnosis" />
            <option value="Mental Health" />
            <option value="Skin &amp; Aesthetics" />
          </datalist>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">Short description (shown on cards)</span>
        <textarea name="short" rows={2} defaultValue={service?.short} className="input resize-none" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">Full introduction</span>
        <textarea name="intro" rows={3} defaultValue={service?.intro} className="input resize-none" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">
            Good-to-know points (one per line)
          </span>
          <textarea
            name="points"
            rows={4}
            defaultValue={service?.points?.join("\n")}
            className="input resize-none"
            placeholder={"Common signs...\nDiagnosis method...\nWhat to expect..."}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">
            Treatments offered (one per line)
          </span>
          <textarea
            name="treatments"
            rows={4}
            defaultValue={service?.treatments?.join("\n")}
            className="input resize-none"
            placeholder={"Treatment A\nTreatment B"}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Full price (PKR)</span>
          <input
            name="price"
            type="number"
            min={0}
            defaultValue={service?.price}
            placeholder="18000"
            className="input"
          />
        </label>

        {/* Blank means the full price is charged online. It is not the same as
            0, which would mean nothing is taken — so this field has no default
            and the API only stores it when a number is actually entered. */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">
            Advance to book (PKR)
          </span>
          <input
            name="advancePayment"
            type="number"
            min={0}
            defaultValue={service?.advancePayment}
            placeholder="5000"
            className="input"
          />
          <span className="mt-1 block text-[0.7rem] leading-snug text-ink-soft/80">
            Leave blank to charge the full price online.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Duration (minutes)</span>
          <input
            name="durationMinutes"
            type="number"
            min={0}
            defaultValue={service?.durationMinutes}
            placeholder="60"
            className="input"
          />
        </label>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">Image (optional)</span>
        {image && (
          <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-mist">
            <Image src={image} alt="Service" fill className="object-cover" />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="input" />
        {uploading && <p className="mt-1 text-xs text-ink-soft">Uploading…</p>}
      </div>

      {error && <p className="text-sm text-crimson-deep">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
      >
        {saving ? "Saving…" : service ? "Update Service" : "Create Service"}
      </button>
    </form>
  );
}
