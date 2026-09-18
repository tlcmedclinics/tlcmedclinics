"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authedFetch } from "@/lib/authed-fetch";
import BilingualField, { type BilingualValue } from "@/components/BilingualField";
import { useT } from "@/contexts/LanguageContext";
import type { Service } from "@/types";

/** English and Urdu together, so one piece of state holds one field. */
const pair = (en?: string, ur?: string): BilingualValue => ({ en: en ?? "", ur: ur ?? "" });
const listPair = (en?: string[], ur?: string[]): BilingualValue => ({
  en: (en ?? []).join("\n"),
  ur: (ur ?? []).join("\n"),
});
/** "a\nb\n\nc" -> ["a","b","c"]. Blank lines are typing, not content. */
const lines = (value: string) =>
  value.split("\n").map((l) => l.trim()).filter(Boolean);

export default function ServiceForm({ service }: { service?: Service }) {
  const router = useRouter();
  const t = useT();
  const [image, setImage] = useState(service?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The translatable fields are controlled state rather than form inputs read
  // at submit: each holds two values that have to travel together, and the
  // "draft the Urdu" button writes into one of them from outside the form.
  const [name, setName] = useState(pair(service?.name, service?.nameUr));
  const [short, setShort] = useState(pair(service?.short, service?.shortUr));
  const [intro, setIntro] = useState(pair(service?.intro, service?.introUr));
  const [points, setPoints] = useState(listPair(service?.points, service?.pointsUr));
  const [treatments, setTreatments] = useState(
    listPair(service?.treatments, service?.treatmentsUr)
  );

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
      name: name.en,
      nameUr: name.ur,
      category: form.get("category"),
      short: short.en,
      shortUr: short.ur,
      intro: intro.en,
      introUr: intro.ur,
      points: points.en,
      pointsUr: lines(points.ur),
      treatments: treatments.en,
      treatmentsUr: lines(treatments.ur),
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
      setError(t("serviceForm.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5">
      <BilingualField
        label={t("serviceForm.name")}
        required
        value={name}
        onChange={setName}
        placeholder={t("serviceForm.namePlaceholder")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">{t("serviceForm.category")}</span>
          <input
            name="category"
            required
            defaultValue={service?.category}
            placeholder={t("serviceForm.categoryPlaceholder")}
            className="input"
            list="category-suggestions"
          />
          {/* The clinic's three areas of care, matching the home page. A free
              text field with suggestions rather than a fixed dropdown: a new
              category shouldn't need a developer. */}
          <datalist id="category-suggestions">
            <option value="Diagnosis" />
            <option value="Health Care" />
            <option value="Skin &amp; Aesthetics" />
          </datalist>
        </label>
      </div>

      <BilingualField
        label={t("serviceForm.short")}
        multiline
        rows={2}
        value={short}
        onChange={setShort}
      />

      <BilingualField
        label={t("serviceForm.intro")}
        multiline
        rows={4}
        value={intro}
        onChange={setIntro}
      />

      <BilingualField
        label={t("serviceForm.points")}
        multiline
        rows={4}
        value={points}
        onChange={setPoints}
        placeholder={t("serviceForm.pointsPlaceholder")}
        hint={t("serviceForm.pointsHint")}
      />

      <BilingualField
        label={t("serviceForm.treatments")}
        multiline
        rows={4}
        value={treatments}
        onChange={setTreatments}
        placeholder={t("serviceForm.treatmentsPlaceholder")}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">{t("serviceForm.price")}</span>
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
            {t("serviceForm.advance")}
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
            {t("serviceForm.advanceHint")}
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">{t("serviceForm.duration")}</span>
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
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">{t("serviceForm.image")}</span>
        {image && (
          <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-mist">
            <Image src={image} alt="Service" fill className="object-cover" />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="input" />
        {uploading && <p className="mt-1 text-xs text-ink-soft">{t("settings.uploading")}</p>}
      </div>

      {error && <p className="text-sm text-crimson-deep">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-deep disabled:opacity-60"
      >
        {saving ? t("common.saving") : t(service ? "serviceForm.update" : "serviceForm.create")}
      </button>
    </form>
  );
}
