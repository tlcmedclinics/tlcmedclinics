"use client";

import { useRef, useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Appointment } from "@/types";

/** Cloudinary is happy with more, but a prescription doesn't need a gallery. */
const MAX_IMAGES = 6;

/**
 * The doctor's prescription for one appointment: free text plus photos.
 *
 * Photos matter more than they look — in practice a prescription is often a
 * handwritten slip or a lab form, and retyping it is both slow and a chance to
 * introduce an error. `capture="environment"` opens the rear camera directly on
 * a phone, so the doctor can photograph the slip without leaving the page.
 */
export default function PrescriptionEditor({
  appointment,
  onSaved,
}: {
  appointment: Appointment;
  onSaved: (patch: Pick<Appointment, "prescription" | "prescriptionImages">) => void;
}) {
  const t = useT();
  const toast = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState(appointment.prescription ?? "");
  const [images, setImages] = useState<string[]>(appointment.prescriptionImages ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(
    !appointment.prescription && !(appointment.prescriptionImages?.length)
  );

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files: File[] = input.files ? Array.from(input.files) : [];
    if (files.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(t("prescription.maxImages", { max: MAX_IMAGES }));
      input.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.slice(0, room).map(async (file) => {
          const form = new FormData();
          form.append("file", file);
          const res = await authedFetch("/api/upload", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error ?? "upload");
          return data.url as string;
        })
      );
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error(t("prescription.uploadFailed"));
    } finally {
      setUploading(false);
      // Clearing the input means picking the same file again still fires change.
      input.value = "";
    }
  }

  async function save() {
    if (!text.trim() && images.length === 0) {
      toast.error(t("prescription.empty"));
      return;
    }
    setSaving(true);
    try {
      const res = await authedFetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: appointment.id,
          prescription: text.trim(),
          prescriptionImages: images,
        }),
      });
      if (!res.ok) throw new Error();
      onSaved({ prescription: text.trim(), prescriptionImages: images });
      toast.success(t("prescription.saved"));
      setEditing(false);
    } catch {
      toast.error(t("error.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-3 rounded-[var(--radius-sm)] border border-success/20 bg-success-soft p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-success">{t("prescription.title")}</p>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-indigo hover:text-indigo-deep"
          >
            {t("common.edit")}
          </button>
        </div>
        {text && <p className="mt-1.5 whitespace-pre-line text-sm text-ink">{text}</p>}
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={t("prescription.imageAlt")}
                  className="h-20 w-20 rounded-[var(--radius-sm)] border border-line object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-[var(--radius-sm)] border border-line p-4">
      <p className="label">{t("prescription.title")}</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={t("prescription.placeholder")}
        className="input mt-2 resize-none text-sm"
      />

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={t("prescription.imageAlt")}
                className="h-20 w-20 rounded-[var(--radius-sm)] border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                aria-label={t("common.delete")}
                className="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-crimson text-[0.65rem] font-bold text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
          className="btn-outline btn-sm"
        >
          📷 {uploading ? t("settings.uploading") : t("prescription.takePhoto")}
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
          className="btn-outline btn-sm"
        >
          {t("prescription.attachImage")}
        </button>

        {/* `capture` asks the phone for the camera directly; on a desktop the
            browser ignores it and shows the normal file picker. */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFiles}
          className="hidden"
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      <button
        type="button"
        disabled={saving || uploading}
        onClick={save}
        className="btn-indigo btn-sm mt-3"
      >
        {saving ? t("common.saving") : t("prescription.save")}
      </button>
    </div>
  );
}
