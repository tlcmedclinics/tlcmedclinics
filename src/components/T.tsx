"use client";

import { useT } from "@/contexts/LanguageContext";

/**
 * One dictionary string, translated in the browser.
 *
 * ── Why this exists ──
 *
 * `useT()` is a hook, so only a client component can call it. But most of the
 * marketing pages — the home page and everything under /services, /about,
 * /conditions — are server components on purpose: they are built once and
 * served as static HTML, which is why they are fast and why Google can read
 * them. Their copy was therefore hardcoded in English, and switching the site
 * to Urdu translated the buttons around English paragraphs.
 *
 * The two ways out were to make every one of those pages a client component —
 * giving up the static render and the SEO with it — or to let the server keep
 * rendering the page and have one small client leaf pick the language. This is
 * that leaf. It is the same trade `Bilingual` already makes for content that
 * comes from Firestore; this is its sibling for copy that lives in the
 * dictionary.
 *
 * `suppressHydrationWarning` is deliberate. The server has no localStorage, so
 * it renders English; an Urdu reader's first client render replaces it. That
 * mismatch is the intended behaviour and without this React logs it as a bug on
 * every single string.
 *
 * Direction and font are not set here — `LanguageProvider` puts `lang` and
 * `dir` on <html>, and globals.css keys the Urdu typography off those.
 */
export function T({
  k,
  vars,
  className,
}: {
  k: string;
  vars?: Record<string, string | number>;
  className?: string;
}) {
  const t = useT();
  const text = t(k, vars);

  // A bare string when there is nothing to style, so <T> can sit inside a
  // heading or a paragraph without adding an element to the tree.
  if (!className) return <>{text}</>;

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}

/**
 * A run of dictionary strings as list items.
 *
 * Saves writing the same `.map()` in six components. The keys are passed in
 * rather than derived from a prefix, because a prefix scan would need the
 * dictionary at build time and would silently render nothing the day somebody
 * renames a key.
 */
export function TList({
  keys,
  className,
  itemClassName,
  render,
}: {
  keys: string[];
  className?: string;
  itemClassName?: string;
  /** "plain" — bare <li>. "dot" — a small indigo bullet beside the text. */
  render?: "plain" | "dot";
}) {
  return (
    <ul className={className}>
      {keys.map((key) =>
        render === "dot" ? (
          <li key={key} className={itemClassName}>
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo"
            />
            <T k={key} />
          </li>
        ) : (
          <li key={key} className={itemClassName}>
            <T k={key} />
          </li>
        )
      )}
    </ul>
  );
}
