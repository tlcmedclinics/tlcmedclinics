"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * What a visitor sees when a page throws on the server.
 *
 * Until this file existed there was nothing here, so a server error fell all
 * the way through to the browser's own screen: a black page, a warning
 * triangle, "This page couldn't load", and an eight-digit error number. That
 * happened on a public treatment page — the kind a patient arrives at from a
 * Google search — and it says, correctly, that nobody is looking after the
 * site. A clinic cannot afford to say that on first contact.
 *
 * Next renders this in place of the page that failed, with the header and
 * footer still around it, so the visitor keeps the navigation and can carry on
 * somewhere else. Three things are on offer, in the order a person actually
 * wants them: try again, go somewhere useful, or phone the clinic — because
 * whatever they came to do, the phone still works.
 *
 * `reset()` re-renders the same route. It is worth a button because most
 * server errors here are transient — a cold Firestore connection, a timed-out
 * query — and one press fixes those without a full reload.
 *
 * A root error.tsx does NOT catch errors thrown by the root layout itself;
 * that needs app/global-error.tsx. The layout does no data fetching, so this
 * is the boundary that matters.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle on the real stack trace, which Next keeps
    // on the server and never sends to the browser. Without it in the console,
    // a report of "it broke" cannot be matched to anything in the logs.
    console.error("[app/error]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow text-crimson">Something went wrong</p>
      <h1 className="mt-3 h1">This page didn&apos;t load.</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
        The problem is at our end, not yours. Trying again usually works — most
        of these clear on their own within a moment.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-indigo px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-indigo-deep"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-indigo/40 hover:text-indigo-deep"
        >
          Go to the home page
        </Link>
      </div>

      <div className="mt-10 rounded-2xl border border-line/70 bg-paper-dim/40 p-6">
        <p className="text-sm font-medium text-ink">Need us now?</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Call the clinic on{" "}
          <a
            href="tel:+923100404444"
            className="numeric font-medium text-indigo hover:text-indigo-deep"
          >
            +92 310 040 4444
          </a>{" "}
          — Monday to Saturday, 11:00 AM – 2:00 PM and 4:00 PM – 8:00 PM.
        </p>
      </div>

      {error.digest && (
        <p className="numeric mt-8 text-xs text-ink-soft">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
