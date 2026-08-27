import type { Locale } from "@/i18n/dictionaries";

/**
 * Content that exists in both languages, stored side by side.
 *
 * The interface translates because every label in it goes through the
 * dictionary. The *content* did not: a service is called "Ketamine Therapy" in
 * Firestore and there is only one field, so switching to Urdu translated the
 * buttons around a list of English treatment names. For a patient who reads
 * Urdu, the words that actually matter — what the treatment is, what it costs,
 * what happens — stayed in a language they came here to avoid.
 *
 * So the fix is in the data, not the interface. Every translatable field gets
 * a second column holding the Urdu, written by the clinic, and this file is
 * the one place that decides which of the two to show.
 *
 * ── Why not translate on the fly ──
 * Because this is medical content and a machine translator is confidently
 * wrong at exactly the wrong moments. "Persistent depressive disorder" has a
 * clinical meaning; a plausible-sounding Urdu rendering of it that means
 * something slightly different is worse than English, because English at least
 * announces that it needs help reading. A wrong translation looks like an
 * answer. The admin panel offers machine translation as a *draft* the clinic
 * then reads and corrects — see /api/translate — and never writes it to the
 * database unread.
 */

/** The suffix convention: `name` is English, `nameUr` is Urdu. */
export const UR_SUFFIX = "Ur";

/**
 * Picks the right language for one field.
 *
 * Falls back to English when the Urdu is missing, deliberately and silently.
 * A half-translated catalogue is the normal state of one being translated, and
 * a patient reading Urdu should see English words rather than blank space
 * where a treatment name ought to be.
 */
export function pick(
  locale: Locale,
  english: string | undefined | null,
  urdu: string | undefined | null
): string {
  if (locale === "ur") {
    const trimmed = urdu?.trim();
    if (trimmed) return trimmed;
  }
  return english?.trim() ?? "";
}

/** The same, for a list — a service's bullet points, say. */
export function pickList(
  locale: Locale,
  english: string[] | undefined | null,
  urdu: string[] | undefined | null
): string[] {
  if (locale === "ur" && urdu && urdu.length > 0) {
    // Only used when the Urdu list is complete. A list that is half Urdu and
    // half English, interleaved by index, reads as a mistake rather than as a
    // translation in progress.
    if (!english || urdu.length >= english.length) return urdu;
  }
  return english ?? [];
}

/**
 * Reads a `<field>`/`<field>Ur` pair off any record.
 *
 * Untyped on purpose. It is called with services, blog posts, doctor profiles
 * and admin-entered settings — objects that share this convention and nothing
 * else. Demanding a common interface would mean threading a type parameter
 * through every caller to buy nothing.
 */
export function field(
  locale: Locale,
  record: Record<string, unknown> | undefined | null,
  key: string
): string {
  if (!record) return "";
  const en = record[key];
  const ur = record[`${key}${UR_SUFFIX}`];
  return pick(
    locale,
    typeof en === "string" ? en : undefined,
    typeof ur === "string" ? ur : undefined
  );
}

/** The list form of `field`. */
export function listField(
  locale: Locale,
  record: Record<string, unknown> | undefined | null,
  key: string
): string[] {
  if (!record) return [];
  const en = record[key];
  const ur = record[`${key}${UR_SUFFIX}`];
  return pickList(
    locale,
    Array.isArray(en) ? (en as string[]) : undefined,
    Array.isArray(ur) ? (ur as string[]) : undefined
  );
}

/**
 * How complete a record's translation is, as a fraction.
 *
 * The admin list uses this to show which services still need Urdu. Without it
 * the only way to find the gaps is to switch the whole site to Urdu and go
 * looking, which is how a catalogue stays half-translated for a year.
 */
export function translationProgress(
  record: Record<string, unknown>,
  keys: string[]
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const key of keys) {
    const en = record[key];
    const hasEnglish = Array.isArray(en) ? en.length > 0 : Boolean(String(en ?? "").trim());
    if (!hasEnglish) continue; // nothing to translate

    total += 1;
    const ur = record[`${key}${UR_SUFFIX}`];
    const hasUrdu = Array.isArray(ur) ? ur.length > 0 : Boolean(String(ur ?? "").trim());
    if (hasUrdu) done += 1;
  }
  return { done, total };
}

/** The fields of a Service that are worth translating. */
export const SERVICE_TRANSLATABLE = ["name", "short", "intro", "points", "treatments"];

/** The fields of a blog post that are worth translating. */
export const BLOG_TRANSLATABLE = ["title", "excerpt", "content"];
