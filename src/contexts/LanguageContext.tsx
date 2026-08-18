"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, LOCALES, type Locale } from "@/i18n/dictionaries";

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  /** True once the saved locale has been read — lets callers avoid a flash. */
  ready: boolean;
  t: Translate;
};

const STORAGE_KEY = "tlc-med-locale";

function dirFor(locale: Locale): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
}

function isLocale(value: unknown): value is Locale {
  return LOCALES.some((l) => l.code === value);
}

/** Resolve a key, falling back English → key so the UI never renders blank. */
function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const raw = dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  dir: "ltr",
  ready: false,
  t: (key) => translate("en", key),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) setLocaleState(saved);
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing with storage disabled — the language still applies
      // for this session, it just won't be remembered.
    }
  }, []);

  const dir = dirFor(locale);

  // globals.css keys all its Urdu typography and RTL rules off these two
  // attributes, so setting them here switches the whole app's script.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const t = useCallback<Translate>(
    (key, vars) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, dir, ready, t }),
    [locale, setLocale, dir, ready, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * t("nav.appointments") — or with placeholders:
 * t("patient.dashboard.welcome", { name: profile.name })
 */
export function useT(): Translate {
  return useContext(LanguageContext).t;
}
