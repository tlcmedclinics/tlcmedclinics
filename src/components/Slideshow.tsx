"use client";

import { useCallback, useEffect, useState } from "react";
import SiteImage from "@/components/SiteImage";

/**
 * A stack of photographs that cross-fades on a loop.
 *
 * Every image is mounted from the start and stacked on top of the others, with
 * only opacity changing. Swapping one `src` on a single element would make the
 * browser fetch the next photograph at the moment it is needed, so the first
 * pass through the loop shows a blank frame each time; mounting them together
 * costs the extra requests once and every transition after that is instant.
 *
 * It pauses on hover and on keyboard focus, so someone reading the caption
 * beside it isn't fighting a photograph that keeps changing, and it pauses when
 * the tab is hidden — a background tab that keeps cycling burns battery to
 * animate something nobody is looking at.
 *
 * With `prefers-reduced-motion` set it does not advance by itself at all. The
 * dots still work, so the other photographs remain reachable rather than being
 * hidden from the people most likely to need a static page.
 */
export default function Slideshow({
  images,
  alt,
  intervalMs = 4500,
  sizes,
  className = "",
  priority,
}: {
  /** Two or more image paths. One renders as a plain image, with no controls. */
  images: string[];
  /** Describes the subject, not the slide — the same for every frame. */
  alt: string;
  intervalMs?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  const count = images.length;

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;

    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // A hidden tab shouldn't keep cycling.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  // Keyed on `index` as well as the flags, so choosing a dot restarts the
  // countdown — otherwise a manual pick could be replaced a moment later by a
  // tick that was already most of the way through.
  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const id = setInterval(advance, intervalMs);
    return () => clearInterval(id);
  }, [advance, count, paused, reduced, intervalMs, index]);

  if (count === 0) return null;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {images.map((src, i) => (
        <div
          key={src}
          // aria-hidden on everything but the current frame, so a screen reader
          // is told about one image rather than four identical ones.
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <SiteImage
            src={src}
            alt={i === index ? alt : ""}
            sizes={sizes}
            priority={priority && i === 0}
          />
        </div>
      ))}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-4">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-6 bg-paper"
                  : "w-1.5 bg-paper/50 hover:bg-paper/80"
              }`}
              // A dot on a light photograph needs its own shadow to stay
              // visible; the images behind it are not a controlled background.
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
