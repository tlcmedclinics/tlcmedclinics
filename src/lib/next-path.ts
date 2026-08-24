"use client";

import { useEffect, useState } from "react";

/**
 * Where to send someone after they sign in or register.
 *
 * RequireRole appends `?next=…` when it turns an unauthenticated visitor away,
 * so a patient who clicked "Book this appointment" on a treatment page comes
 * back to that booking page — with the treatment still chosen — instead of
 * landing on a dashboard and having to find it again.
 *
 * SECURITY: only same-site paths are honoured.
 *
 * An absolute URL ("https://elsewhere.example") or a protocol-relative one
 * ("//elsewhere.example") is discarded. Without that check `next` is an open
 * redirect: an attacker sends a patient a link to the clinic's own login page
 * that forwards to a copy of it after a genuine sign-in, and the address bar
 * says tlcmedclinics.com the whole way. A backslash variant is rejected too,
 * because some browsers normalise "/\" to "//".
 *
 * Reads from `window` at call time rather than through useSearchParams(), which
 * would force every page using it into a <Suspense> boundary or fail the build.
 * Returns null during SSR, where there is no location to read.
 */
export function safeNext(): string | null {
  if (typeof window === "undefined") return null;

  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return null;

  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;

  return raw;
}

/**
 * The `?next=…` suffix to hang on a link, or "" when there is nothing to carry.
 *
 * For the "create an account" link on the login page and the "sign in" link on
 * the register page: a patient who is bounced to login, decides they need an
 * account, and registers should still land back on the booking page. Without
 * this the destination survives login but is lost the moment they cross to the
 * other form.
 *
 * Filled in after mount rather than during render. `window` doesn't exist on
 * the server, so computing it inline would make the server and the first client
 * render disagree — a hydration mismatch, for a link nobody clicks in the first
 * paint anyway.
 */
export function useNextQuery(): string {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const next = safeNext();
    setQuery(next ? `?next=${encodeURIComponent(next)}` : "");
  }, []);

  return query;
}
