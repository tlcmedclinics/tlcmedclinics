"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { readApiError } from "@/lib/api-error";

/**
 * One field, twice: English on the left, Urdu on the right.
 *
 * Side by side rather than in separate tabs or a second form, because the two
 * are only ever written by looking at each other. Someone translating a
 * service's intro needs the English in front of them, and a tab that hides it
 * turns a two-minute job into copying between screens.
 *
 * The Urdu box is right-to-left and set in Nastaliq, so what the clinic types
 * looks like what the patient will see. A left-aligned Urdu box in a Latin
 * font is technically the same string and reads as broken.
 *
 * The draft button appears only when the server has a translation key. What it
 * writes is a suggestion sitting in an editable box — it is never saved by
 * itself, and the hint under it says so, because "the computer wrote it" is
 * not a defence for a wrong treatment name on a medical site.
 */

export type BilingualValue = { en: string; ur: string };

export default function BilingualField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline = false,
  rows = 3,
  required = false,
  /** Set false on fields where a machine draft is a bad idea (names, codes). */
  translatable = true,
}: {
  label: string;
  value: BilingualValue;
  onChange: (next: BilingualValue) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  translatable?: boolean;
}) {
  const [canTranslate, setCanTranslate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Asked once per mount rather than per field: the answer is the same for
  // every field on the page, and the endpoint is cheap when it is going to
  // say no. A form with eight fields still only asks once because each
  // instance's request is served from the browser's own cache.
  useEffect(() => {
    if (!translatable) return;
    fetch("/api/translate/available")
      .then((res) => (res.ok ? res.json() : { available: false }))
      .then((d) => setCanTranslate(Boolean(d.available)))
      .catch(() => setCanTranslate(false));
  }, [translatable]);

  async function draft() {
    if (!value.en.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await authedFetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [value.en] }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Could not translate that."));
      const data = await res.json();
      const first = data.translations?.[0];
      if (typeof first === "string" && first.trim()) {
        onChange({ ...value, ur: first });
      } else {
        setError("Nothing came back — please type the Urdu by hand.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not translate that.");
    } finally {
      setBusy(false);
    }
  }

  const common =
    "input" + (multiline ? " resize-none" : "");

  return (
    <div className="field">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label !mb-0">
          {label}
          {required && <span className="ml-1 text-crimson">*</span>}
        </span>
        {canTranslate && (
          <button
            type="button"
            onClick={draft}
            disabled={busy || !value.en.trim()}
            className="text-xs font-medium text-indigo transition-colors hover:text-indigo-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Translating…" : "Draft the Urdu →"}
          </button>
        )}
      </div>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-wide text-ink-soft/70">
            English
          </span>
          {multiline ? (
            <textarea
              rows={rows}
              required={required}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
              placeholder={placeholder}
              className={common}
            />
          ) : (
            <input
              required={required}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
              placeholder={placeholder}
              className={common}
            />
          )}
        </div>

        <div>
          <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-wide text-ink-soft/70">
            اردو <span className="normal-case tracking-normal text-ink-soft/50">(optional)</span>
          </span>
          {multiline ? (
            <textarea
              rows={rows}
              dir="rtl"
              lang="ur"
              value={value.ur}
              onChange={(e) => onChange({ ...value, ur: e.target.value })}
              className={`${common} font-nastaliq leading-loose`}
            />
          ) : (
            <input
              dir="rtl"
              lang="ur"
              value={value.ur}
              onChange={(e) => onChange({ ...value, ur: e.target.value })}
              className={`${common} font-nastaliq leading-loose`}
            />
          )}
        </div>
      </div>

      {error && <span className="field-hint text-crimson-deep">{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {canTranslate && !hint && !error && (
        <span className="field-hint">
          A drafted translation is a starting point — read it before saving.
          Clinical terms are where machines get it wrong.
        </span>
      )}
    </div>
  );
}
