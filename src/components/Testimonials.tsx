"use client";

import { useCallback, useEffect, useState } from "react";
import { testimonials } from "@/data/site";

/**
 * Patient reviews, one at a time.
 *
 * There are twelve of them, and twelve stacked quote cards is a wall — the page
 * stops being read at about the third. A slider shows one properly, which is
 * how a review is actually read, and leaves the rest reachable for anyone who
 * wants them.
 *
 * The frame has a minimum height rather than fitting each quote, so the section
 * doesn't jump as a two-line review follows a six-line one. On a phone that
 * jump moves whatever you were reading out from under your thumb.
 */

function Stars() {
  return (
    <div className="flex gap-0.5 text-crimson" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M10 1.5 12.6 7l6 .9-4.3 4.2 1 6-5.3-2.8L4.7 18l1-6L1.4 7.9l6-.9z" />
        </svg>
      ))}
    </div>
  );
}

const INTERVAL_MS = 7000;

export default function Testimonials() {
  const count = testimonials.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // A hidden tab shouldn't keep advancing.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + count) % count),
    [count]
  );

  // `index` is in the deps so an arrow or a dot restarts the countdown —
  // without it a manual choice can be replaced a second later by a tick that
  // was already nearly finished.
  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const id = setInterval(() => go(1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [go, count, paused, reduced, index]);

  if (count === 0) return null;

  const current = testimonials[index];

  return (
    <section className="bg-indigo-deep py-20 text-paper">
      <div
        className="mx-auto max-w-4xl px-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="text-center">
          <p className="eyebrow text-crimson">Patient reviews</p>
          <h2 className="mt-3 h1 sm:text-4xl">What patients say</h2>
        </div>

        {/* aria-live announces the change to a screen reader when it happens on
            its own. "polite" waits for a pause rather than interrupting. */}
        <div
          className="relative mt-12 flex min-h-[16rem] items-center sm:min-h-[13rem]"
          aria-live="polite"
        >
          {/* Keyed on the index so React remounts it, which replays the
              fade-up — the same element with new text would just swap. */}
          <figure key={index} className="animate-fade-up w-full text-center">
            <div className="flex justify-center">
              <Stars />
            </div>

            <blockquote className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-paper/95 sm:text-xl">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            <figcaption className="mt-6 text-sm text-paper/60">
              <span className="font-medium text-paper/85">{current.name}</span>
              {current.role ? ` · ${current.role}` : ""}
            </figcaption>
          </figure>
        </div>

        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous review"
            className="rounded-full border border-paper/25 p-2.5 text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={`${t.name}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Review ${i + 1} of ${count}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-5 bg-paper" : "w-1.5 bg-paper/35 hover:bg-paper/60"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next review"
            className="rounded-full border border-paper/25 p-2.5 text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path d="m10 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
