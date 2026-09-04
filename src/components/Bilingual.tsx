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

/**
 * The list form — a service's points or treatments.
 *
 * ── Why `variant` and not a `renderItem` callback ──
 *
 * This had a `renderItem?: (text, index) => ReactNode` prop, and the one page
 * that used it — /services/[slug] — is a SERVER component. Passing a function
 * from a server component to a client component is not allowed; React throws
 *
 *   Functions cannot be passed directly to Client Components unless you
 *   explicitly expose it by marking it with "use server"
 *
 * and because that happens while the page is rendering on the server, the
 * whole page comes back as a 500. It only fired when the list had something in
 * it — `{service.points.length > 0 && <BilingualList …/>}` — so a service with
 * no points rendered perfectly and one with points was a black error screen.
 * That is why it looked like bad data rather than bad code.
 *
 * A `variant` string crosses the server/client boundary because it is just a
 * string. The markup that used to live in the caller now lives here, where it
 * is allowed to be a function of the item. If a third shape is ever needed,
 * add a variant — do not add the callback back.
 */
export function BilingualList({
  en,
  ur,
  className,
  itemClassName,
  variant = "plain",
}: {
  en?: string[] | null;
  ur?: string[] | null;
  className?: string;
  itemClassName?: string;
  /**
   * plain  — bare <li>, styled by itemClassName
   * bullet — a small crimson dot and the text beside it
   * card   — each item in its own bordered panel
   */
  variant?: "plain" | "bullet" | "card";
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
      {items.map((text, i) => {
        const key = `${text}-${i}`;

        if (variant === "bullet") {
          return (
            <li key={key} className="flex gap-3 text-sm text-ink-soft">
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson"
              />
              <span>{text}</span>
            </li>
          );
        }

        if (variant === "card") {
          return (
            <li
              key={key}
              className="rounded-xl border border-line/70 bg-paper-dim/40 px-4 py-3 text-sm text-ink"
            >
              {text}
            </li>
          );
        }

        return (
          <li key={key} className={itemClassName}>
            {text}
          </li>
        );
      })}
    </ul>
  );
}
