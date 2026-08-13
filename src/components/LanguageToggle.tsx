"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-line/80 bg-mist/60 p-0.5 text-xs font-medium">
      {(["en", "ur"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === l ? "bg-indigo text-white" : "text-ink-soft hover:text-indigo"
          }`}
          aria-pressed={locale === l}
        >
          {l === "en" ? "EN" : "اردو"}
        </button>
      ))}
    </div>
  );
}
