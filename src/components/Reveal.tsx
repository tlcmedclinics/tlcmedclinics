"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades a section in the first time it scrolls into view.
 *
 * IntersectionObserver rather than a scroll listener: the browser does the
 * work off the main thread, so a page with a dozen of these doesn't stutter
 * while someone scrolls. Each one unobserves itself once it has fired — the
 * animation is an arrival, not a state, and re-running it every time a section
 * passes the viewport makes a long page feel restless.
 *
 * Rendered visible when JavaScript hasn't run yet. Starting hidden and waiting
 * for JS would leave the whole page blank for anyone whose script fails, and —
 * more to the point — would hand Google an empty document.
 */
export default function Reveal({
  children,
  className = "",
  /** Stagger, in ms, for items appearing as a group. */
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Someone who has asked their system for less motion gets the content
    // immediately, with no transition at all.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // A little before the edge, so the fade finishes as the section arrives
      // rather than starting once it's already been read.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // `as` makes this a dynamic element, and TypeScript cannot reconcile one ref
  // type against the union of every element it might become — the cast to
  // RefObject<HTMLDivElement> failed the production build as soon as Reveal was
  // used with as="li", because a div ref is not an li ref. ElementType is
  // React's own escape hatch for a component whose tag is chosen at runtime.
  const Component = Tag as React.ElementType;

  return (
    <Component
      ref={ref}
      data-shown={shown}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </Component>
  );
}
