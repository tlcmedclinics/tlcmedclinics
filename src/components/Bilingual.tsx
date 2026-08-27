"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { pick, pickList } from "@/lib/bilingual";

/**
 * Shows one of two languages, chosen at render time in the browser.
 *
 * Needed because of where the locale lives. It is a per-visitor choice kept in
 * localStorage, so the server has no idea which language to render — but the
 * pages that show service names (the home page, /services, a service's own
 * page) are server components, built once and cached.
 *
 * Rather than make those pages dynamic — which would cost every visitor a
 * server round trip to render text that was already known — the server sends
 * both languages and this leaf picks. It is a handful of characters of extra
 * HTML per field, and the page stays static.
 *
 * `suppressHydrationWarning` is on the wrapper on purpose: the server renders
 * English (it has no localStorage), and an Urdu reader's first client render
 * replaces it. That mismatch is the intended behaviour, not a bug, and without
 * this React logs it as one on every field.
 */
export function Bilingual({
  en,
  ur,
  className,
}: {
  en?: string | null;
  ur?: string | null;
  className?: string;
}) {
  const { locale } = useLanguage();
  const text = pick(locale, en, ur);
  const showingUrdu = locale === "ur" && Boolean(ur?.trim());

  return (
    <span
      className={className}
      // Marked per-element rather than on a page wrapper: an Urdu service name
      // inside an English sentence still has to run right-to-left, and a page
      // with a mixed catalogue has both on screen at once.
      dir={showingUrdu ? "rtl" : undefined}
      lang={showingUrdu ? "ur" : undefined}
      suppressHydrationWarning
    >
      {text}
    </span>
  );
}

/** The list form — a service's points or treatments. */
export function BilingualList({
  en,
  ur,
  className,
  itemClassName,
  renderItem,
}: {
  en?: string[] | null;
  ur?: string[] | null;
  className?: string;
  itemClassName?: string;
  /** Lets the caller keep its own bullet markup. */
  renderItem?: (text: string, index: number) => React.ReactNode;
}) {
  const { locale } = useLanguage();
  const items = pickList(locale, en, ur);
  const showingUrdu = locale === "ur" && Boolean(ur && ur.length);

  return (
    <ul
      className={className}
      dir={showingUrdu ? "rtl" : undefined}
      lang={showingUrdu ? "ur" : undefined}
      suppressHydrationWarning
    >
      {items.map((text, i) =>
        renderItem ? (
          renderItem(text, i)
        ) : (
          <li key={`${text}-${i}`} className={itemClassName}>
            {text}
          </li>
        )
      )}
    </ul>
  );
}
