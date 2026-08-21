"use client";

import Loader from "@/components/Loader";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage, useT } from "@/contexts/LanguageContext";
import { playNotificationChime } from "@/lib/notification-sound";
import { formatPhone } from "@/lib/phone-format";
import { LOCALES, type Locale } from "@/i18n/dictionaries";
import type { DoctorProfile, UserRole } from "@/types";

/**
 * Settings, split into modules the way a messaging app does it: a list of
 * sections, each opening its own panel. One long scrolling form buried the
 * language switch and the sound toggles below the profile fields.
 *
 * Two-pane on desktop, list → panel → back on mobile. Same component for all
 * three roles; a preference added here shows up in every panel at once.
 */

type SectionId = "profile" | "account" | "notifications" | "language" | "privacy";

type Draft = {
  name: string;
  phone: string;
  email: string;
  specialization: string;
  bio: string;
  photoURL: string;
  presenceVisible: boolean;
  notificationSound: boolean;
  messageSound: boolean;
};

const EMPTY: Draft = {
  name: "",
  phone: "",
  email: "",
  specialization: "",
  bio: "",
  photoURL: "",
  presenceVisible: true,
  notificationSound: true,
  messageSound: true,
};

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
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
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-indigo" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
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

  const [section, setSection] = useState<SectionId | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Seed once per account. Keyed on uid rather than the whole profile so the
  // live Firestore listener re-rendering can't wipe out half-typed edits.
  useEffect(() => {
    if (!profile) return;
    const d = profile as DoctorProfile;
    setDraft({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      specialization: d.specialization ?? "",
      bio: d.bio ?? "",
      photoURL: profile.photoURL ?? "",
      presenceVisible: d.presenceVisible !== false,
      notificationSound: profile.notificationSound !== false,
      messageSound: profile.messageSound !== false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const SECTIONS: { id: SectionId; icon: string; roles?: UserRole[] }[] = [
    { id: "profile", icon: "👤" },
    { id: "account", icon: "🔑" },
    { id: "notifications", icon: "🔔" },
    { id: "language", icon: "🌐" },
    { id: "privacy", icon: "🔒", roles: ["doctor"] },
  ];
  const visibleSections = SECTIONS.filter((s) => !s.roles || s.roles.includes(role));

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authedFetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "upload");

      // Persist immediately. A photo that only lives in local state until the
      // user remembers to hit Save is how people end up still seeing their
      // initial after "changing" their picture.
      set("photoURL", data.url);
      await save({ photoURL: data.url });
    } catch {
      toast.error(t("error.saveFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(patch?: Partial<Draft>) {
    const next = { ...draft, ...patch };
    if (!next.name.trim()) {
      toast.error(t("auth.enterName"));
      return;
    }
    setSaving(true);
    try {
      const res = await authedFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: next.name,
          phone: next.phone,
          email: next.email,
          photoURL: next.photoURL,
          locale,
          notificationSound: next.notificationSound,
          messageSound: next.messageSound,
          ...(role === "doctor"
            ? {
                specialization: next.specialization,
                bio: next.bio,
                presenceVisible: next.presenceVisible,
              }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "save");
      toast.success(t("settings.savedProfile"));
    } catch (err) {
      toast.error(err instanceof Error && err.message !== "save" ? err.message : t("error.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <Loader label={t("common.loading")} />;

  /* ------------------------------ sections ------------------------------ */

  // Arrow const, NOT a hoisted `function`. TypeScript treats a hoisted
  // declaration as callable before the `if (!profile) return` guard above, so
  // it refuses to narrow `profile` inside one — which fails the production
  // build with TS18047 even though this can never run with a null profile.
  const renderSection = (id: SectionId) => {
    switch (id) {
      case "profile":
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={draft.name} photoURL={draft.photoURL} size="xl" />
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
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={80}
              />
            </label>

            {role === "doctor" && (
              <>
                <label className="field">
                  <span className="label">{t("settings.specialization")}</span>
                  <input
                    className="input"
                    value={draft.specialization}
                    onChange={(e) => set("specialization", e.target.value)}
                    maxLength={120}
                  />
                </label>
                <label className="field">
                  <span className="label">{t("settings.bio")}</span>
                  <textarea
                    className="input resize-none"
                    rows={4}
                    value={draft.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    maxLength={600}
                  />
                  <span className="field-hint">{t("settings.bioHint")}</span>
                </label>
              </>
            )}
          </div>
        );

      case "account":
        return (
          <div className="space-y-5">
            <label className="field">
              <span className="label">{t("settings.email")}</span>
              <input
                className="input"
                type="email"
                value={draft.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder={t("settings.emailPlaceholder")}
              />
              <span className="field-hint">{t("settings.emailOptionalHint")}</span>
            </label>

            <label className="field">
              <span className="label">{t("settings.phone")}</span>
              <input
                className="input numeric"
                type="tel"
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="03XX-XXXXXXX"
              />
              {profile.phoneVerified && (
                <span className="field-hint text-success">
                  ✓ {t("settings.phoneVerified", { phone: formatPhone(profile.phone) })}
                </span>
              )}
            </label>

            <p className="rounded-[var(--radius-sm)] bg-mist/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              {t("settings.identityHint")}
            </p>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-5">
            <Toggle
              label={t("settings.notificationSound")}
              hint={t("settings.notificationSoundHint")}
              checked={draft.notificationSound}
              onChange={(next) => {
                set("notificationSound", next);
                if (next) playNotificationChime();
              }}
            />
            <Toggle
              label={t("settings.messageSound")}
              hint={t("settings.messageSoundHint")}
              checked={draft.messageSound}
              onChange={(next) => set("messageSound", next)}
            />
            <p className="rounded-[var(--radius-sm)] bg-mist/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              {t("settings.reminderHint")}
            </p>
          </div>
        );

      case "language":
        return (
          <div className="space-y-3">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code as Locale)}
                aria-pressed={locale === l.code}
                className={`flex w-full items-center justify-between rounded-[var(--radius-sm)] border px-4 py-3 text-sm font-semibold transition-colors ${
                  locale === l.code
                    ? "border-indigo bg-indigo/5 text-indigo"
                    : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                }`}
              >
                {l.label}
                {locale === l.code && <span aria-hidden>✓</span>}
              </button>
            ))}
            <p className="field-hint">{t("settings.languageHint")}</p>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-5">
            <Toggle
              label={t("settings.presence")}
              hint={t("settings.presenceHint")}
              checked={draft.presenceVisible}
              onChange={(next) => set("presenceVisible", next)}
            />
            <p className="rounded-[var(--radius-sm)] bg-mist/60 px-3 py-2 text-xs leading-relaxed text-ink-soft">
              {t("presence.autoNote")}
            </p>
          </div>
        );
    }
  };

  const list = (
    <ul className="space-y-1">
      {visibleSections.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => setSection(s.id)}
            data-active={section === s.id}
            className="shell-nav-link w-full text-start"
          >
            <span aria-hidden className="text-base">
              {s.icon}
            </span>
            <span className="min-w-0 flex-1 truncate">{t(`settings.section.${s.id}`)}</span>
            <span aria-hidden className="flip-rtl text-ink-soft">
              ›
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  const panel = section && (
    <div className="card card-pad">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSection(null)}
          aria-label={t("common.back")}
          className="flip-rtl rounded-full p-1 text-ink-soft transition-colors hover:bg-mist hover:text-ink lg:hidden"
        >
          ‹
        </button>
        <h2 className="h3 text-ink">{t(`settings.section.${section}`)}</h2>
      </div>
      <p className="mt-1 text-xs text-ink-soft">{t(`settings.section.${section}.hint`)}</p>

      <div className="mt-5">{renderSection(section)}</div>

      <button
        type="button"
        onClick={() => save()}
        disabled={saving || uploading}
        className="btn-indigo mt-6 w-full sm:w-auto"
      >
        {saving ? t("common.saving") : t("settings.saveChanges")}
      </button>
    </div>
  );

  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("settings.title")}</h1>
      <p className="lede mt-1">{t("settings.subtitle")}</p>

      {/* Mobile: the list, or the open panel — never both. */}
      <div className="mt-6 lg:hidden">{section ? panel : list}</div>

      {/* Desktop: list beside the panel. */}
      <div className="mt-6 hidden gap-6 lg:grid lg:grid-cols-[15rem_1fr]">
        <div>{list}</div>
        <div>
          {panel ?? (
            <div className="card card-pad text-sm text-ink-soft">
              {t("settings.pickSection")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
