"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage, useT } from "@/contexts/LanguageContext";
import { playNotificationChime } from "@/lib/notification-sound";
import { LOCALES, type Locale } from "@/i18n/dictionaries";
import type { DoctorProfile, UserRole } from "@/types";

/**
 * One settings screen for every role. Patients see profile + preferences;
 * doctors additionally get their public bio and the presence opt-out. Keeping
 * it in one component means a preference added here appears in all three
 * panels at once instead of drifting between three near-identical pages.
 */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card card-pad">
      <h2 className="h3 text-ink">{title}</h2>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-indigo" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] ${
            checked ? "start-[1.375rem]" : "start-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export default function SettingsPanel({ role }: { role: UserRole }) {
  const { profile } = useAuth();
  const toast = useToast();
  const t = useT();
  const { locale, setLocale } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const doctor = profile as DoctorProfile | null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [presenceVisible, setPresenceVisible] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [messageSound, setMessageSound] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Seed the form once the profile arrives. Keyed on uid rather than the whole
  // profile so the live Firestore listener re-rendering doesn't wipe out edits
  // the user is in the middle of typing.
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
    setPhotoURL(profile.photoURL ?? "");
    setNotificationSound(profile.notificationSound !== false);
    setMessageSound(profile.messageSound !== false);
    if (profile.role === "doctor") {
      const d = profile as DoctorProfile;
      setSpecialization(d.specialization ?? "");
      setBio(d.bio ?? "");
      setPresenceVisible(d.presenceVisible !== false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authedFetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setPhotoURL(data.url);
    } catch {
      toast.error(t("error.saveFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("common.required"));
      return;
    }
    setSaving(true);
    try {
      const res = await authedFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          photoURL,
          locale,
          notificationSound,
          messageSound,
          ...(role === "doctor" ? { specialization, bio, presenceVisible } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("settings.savedProfile"));
    } catch {
      toast.error(t("error.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return <p className="text-sm text-ink-soft">{t("common.loading")}</p>;
  }

  return (
    <form onSubmit={save} className="animate-fade-up space-y-6">
      <div>
        <h1 className="h1">{t("settings.title")}</h1>
        <p className="lede mt-1">{t("settings.subtitle")}</p>
      </div>

      <Section title={t("settings.profile")} hint={t("settings.profileHint")}>
        <div className="flex items-center gap-4">
          <Avatar name={name} photoURL={photoURL} size="xl" />
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-outline btn-sm"
            >
              {uploading ? t("settings.uploading") : t("settings.changePhoto")}
            </button>
            <p className="field-hint">{t("settings.photoHint")}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="hidden"
            />
          </div>
        </div>

        <label className="field">
          <span className="label">{t("settings.name")}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
          />
        </label>

        <label className="field">
          <span className="label">{t("settings.email")}</span>
          <input className="input" value={profile.email ?? ""} disabled />
          <span className="field-hint">{t("settings.emailHint")}</span>
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

        {role === "doctor" && (
          <>
            <label className="field">
              <span className="label">{t("settings.specialization")}</span>
              <input
                className="input"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                maxLength={120}
              />
            </label>
            <label className="field">
              <span className="label">{t("settings.bio")}</span>
              <textarea
                className="input resize-none"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={600}
              />
              <span className="field-hint">{t("settings.bioHint")}</span>
            </label>
          </>
        )}
      </Section>

      <Section title={t("settings.preferences")}>
        <div className="field">
          <span className="label">{t("common.language")}</span>
          <div className="mt-1.5 flex gap-2">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code as Locale)}
                aria-pressed={locale === l.code}
                className={`rounded-[var(--radius-pill)] border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  locale === l.code
                    ? "border-indigo bg-indigo text-white"
                    : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <span className="field-hint">{t("settings.languageHint")}</span>
        </div>

        <Toggle
          label={t("settings.notificationSound")}
          hint={t("settings.notificationSoundHint")}
          checked={notificationSound}
          onChange={(next) => {
            setNotificationSound(next);
            // Play it as they switch it on, so "what does this sound like?"
            // doesn't require waiting for a real notification.
            if (next) playNotificationChime();
          }}
        />

        <Toggle
          label={t("settings.messageSound")}
          hint={t("settings.messageSoundHint")}
          checked={messageSound}
          onChange={setMessageSound}
        />

        {role === "doctor" && (
          <>
            <Toggle
              label={t("settings.presence")}
              hint={t("settings.presenceHint")}
              checked={presenceVisible}
              onChange={setPresenceVisible}
            />
            <p className="rounded-[var(--radius-sm)] bg-mist/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              {t("presence.autoNote")}
            </p>
          </>
        )}
      </Section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving || uploading} className="btn-indigo">
          {saving ? t("common.saving") : t("settings.saveChanges")}
        </button>
        {doctor?.role === "doctor" && (
          <span className="text-xs text-ink-soft">
            {presenceVisible ? t("presence.online") : t("presence.hidden")}
          </span>
        )}
      </div>
    </form>
  );
}
