"use client";

import { useT } from "@/contexts/LanguageContext";

/**
 * The search box and pager shared by every list screen, so search sits in the
 * same place and behaves the same way in all of them.
 */

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = useT();

  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-ink-soft"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("common.search")}
        aria-label={placeholder ?? t("common.search")}
        className="input ps-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("common.clear")}
          className="absolute inset-y-0 end-2.5 flex items-center text-ink-soft transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const t = useT();

  // The count line always renders. Previously the whole control disappeared
  // below one page, which made it look like paging had never been wired up at
  // all when a list happened to be short.
  const showControls = pageCount > 1;

  // Keep the control compact on a phone: a window of pages around the current
  // one rather than every page number.
  const windowSize = 2;
  const pages: (number | "gap")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= windowSize) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  return (
    <nav
      aria-label={t("common.pagination")}
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-xs text-ink-soft">
        {t("common.showingCount", { count: total })}
        {showControls && (
          <span className="ms-2 text-ink-soft/70">
            {t("common.pageOf", { page, pageCount })}
          </span>
        )}
      </p>

      {showControls && (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("common.previous")}
          className="flip-rtl rounded-[var(--radius-sm)] border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-ink-soft">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`numeric min-w-8 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                p === page
                  ? "border-indigo bg-indigo text-white"
                  : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={t("common.next")}
          className="flip-rtl rounded-[var(--radius-sm)] border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-indigo hover:text-indigo disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
        >
          ›
        </button>
      </div>
      )}
    </nav>
  );
}

/** Consistent "nothing here" / "nothing matched" block for list screens. */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
