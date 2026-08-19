"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Search + pagination for a list already held in memory.
 *
 * This is for the collections that are inherently small — services, blog
 * posts, coupons, doctors. A clinic has tens of them, not thousands, so
 * fetching the set once and filtering here is both cheaper and more accurate
 * than round-tripping every keystroke to Firestore (which has no full-text
 * search anyway).
 *
 * Collections that grow without bound — appointments, slots — page on the
 * server instead, via the `before` cursor on /api/appointments. Don't reach
 * for this hook there: it would need the whole collection in memory, which is
 * exactly the problem the server-side paging was added to fix.
 */

export type PagedList<T> = {
  /** The rows to render for the current page. */
  items: T[];
  /** How many rows matched the query, across all pages. */
  total: number;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  query: string;
  setQuery: (q: string) => void;
  /** True when a query is active but nothing matched. */
  isEmptyResult: boolean;
};

export function usePagedList<T>(
  source: T[],
  /** Fields to match the query against, in priority order. */
  getSearchText: (item: T) => (string | number | undefined | null)[],
  pageSize = 12
): PagedList<T> {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    // Every whitespace-separated term must appear somewhere in the row, so
    // "fizza vein" narrows rather than widening the way a plain OR would.
    const terms = needle.split(/\s+/);
    return source.filter((item) => {
      const haystack = getSearchText(item)
        .filter((v) => v !== undefined && v !== null && v !== "")
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    // getSearchText is defined inline by callers, so a new identity every
    // render — depending on it would recompute constantly for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Searching, or deleting the last row on the final page, can strand the
  // user past the end of the list. Pull them back to the last real page.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const start = (Math.min(page, pageCount) - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page: Math.min(page, pageCount),
    pageCount,
    setPage,
    query,
    setQuery,
    isEmptyResult: filtered.length === 0 && query.trim().length > 0,
  };
}
