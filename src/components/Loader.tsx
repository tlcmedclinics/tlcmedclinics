"use client";

/**
 * The app's loading states, in one place.
 *
 * Every screen printed its own "Loading…" as a line of grey text, which reads
 * as a message rather than as activity: nothing moves, so a slow request and a
 * stuck one look identical, and the layout jumps when the real content lands.
 *
 * Two shapes, because two different things are being waited on:
 *
 *   <Loader />        — a spinner, for a whole screen or a section with no
 *                       predictable shape yet.
 *   <SkeletonRows />  — grey placeholder cards, for a list that is about to
 *                       arrive. Holding the space stops the page shifting under
 *                       the reader's eyes when it does.
 *
 * `label` is read by screen readers and shown under the spinner, so this
 * announces itself rather than being a silently spinning shape.
 */

export default function Loader({
  label = "Loading",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}
    >
      <span
        aria-hidden
        // Two rings: a faint full circle and a solid arc spinning over it, so
        // the motion is visible without needing an image or a library.
        className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-indigo"
      />
      <span className="text-xs font-medium text-ink-soft">{label}</span>
    </div>
  );
}

/** A small inline spinner for inside a button that's mid-action. */
export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current align-[-2px] ${className}`}
    />
  );
}

/**
 * Placeholder cards roughly the size of the rows that are coming.
 *
 * `rows` should match what the list usually shows — close is enough. The point
 * is that the page is already the right height when the data arrives.
 */
export function SkeletonRows({
  rows = 3,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={`space-y-3 ${className}`}>
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="animate-pulse rounded-2xl border border-line/70 p-5"
        >
          <div className="h-4 w-1/3 rounded bg-mist" />
          <div className="mt-3 h-3 w-2/3 rounded bg-mist/70" />
        </div>
      ))}
    </div>
  );
}
