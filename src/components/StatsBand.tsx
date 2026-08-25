"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";

/**
 * The clinic's headline numbers, counting up as they come into view.
 *
 * The count is the whole point: a number that arrives at rest is read as
 * decoration, while one that moves is read as a claim. It runs once, on the
 * first scroll past, and never again.
 *
 * Numbers are parsed out of the display strings in site.ts ("259,200+" → 259200
 * plus a "+" suffix) so the copy stays in one place and this component doesn't
 * become a second, drifting source of truth for what the clinic says about
 * itself.
 */

const DURATION_MS = 1600;

/**
 * Splits "259,200+" into the number to count to and the text around it.
 *
 * One regex with three groups, rather than stripping the digits out and
 * splitting the original string on them. That earlier approach only worked for
 * figures with no thousands separator: for "259,200+" it stripped the comma to
 * get "259200", then split "259,200+" on a substring that string does not
 * contain — so the whole thing came back as the prefix and the band rendered
 * "259,200+259,200" on the live site.
 */
function parse(value: string) {
  const match = value.match(/^([^\d]*)([\d.,]+)([^\d]*)$/);
  if (!match) return null;

  const [, prefix, numeric, suffix] = match;
  const target = Number(numeric.replace(/,/g, ""));
  if (!Number.isFinite(target) || target === 0) return null;

  return { target, prefix, suffix };
}

function useCountUp(target: number | null, start: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start || target === null) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    let frame = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / DURATION_MS);
      // Ease-out: fast at first, settling at the end, so the final figure is
      // legible rather than whipping past.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start]);

  return value;
}

function Stat({ value, label, start }: { value: string; label: string; start: boolean }) {
  const parsed = parse(value);
  const counted = useCountUp(parsed?.target ?? null, start);

  return (
    <div className="text-center">
      <p className="stat-number text-3xl text-paper sm:text-4xl">
        {parsed ? (
          <>
            {parsed.prefix}
            {counted.toLocaleString()}
            {parsed.suffix}
          </>
        ) : (
          value
        )}
      </p>
      <p className="mt-2 text-xs leading-snug text-paper/70">{label}</p>
    </div>
  );
}

export default function StatsBand() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStart(true);
        observer.disconnect();
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-indigo">
      <div
        ref={ref}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-14 sm:grid-cols-4"
      >
        {site.stats.map((stat) => (
          <Stat key={stat.label} value={stat.value} label={stat.label} start={start} />
        ))}
      </div>
    </section>
  );
}
