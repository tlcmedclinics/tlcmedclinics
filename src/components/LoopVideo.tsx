"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import { useT } from "@/contexts/LanguageContext";
import { videos } from "@/data/images";

/**
 * A short clip of the clinic, looping quietly behind a line of text.
 *
 * ── The rules a background video on a medical site has to follow ──
 *
 * `muted` is not a preference, it is the price of autoplay. Every browser
 * blocks a video that starts with sound, so an unmuted autoplaying clip does
 * not play at all — and on a psychiatry clinic's home page, sound arriving
 * uninvited would be the wrong thing even if it were allowed.
 *
 * `playsInline` stops iOS Safari taking the video fullscreen the moment it
 * starts. Without it a patient tapping anywhere near it loses the page.
 *
 * `preload="none"` means the file is not downloaded until the clip is nearly
 * on screen. This plays on mobile data in Pakistan; a hero video that
 * downloads eagerly is several megabytes spent before the visitor has decided
 * whether to stay.
 *
 * ── Slow playback ──
 * `playbackRate` cannot be set in JSX — it is a property of the DOM element,
 * not an attribute — so it is applied in an effect, and re-applied on `play`.
 * Some browsers reset the rate when a loop restarts or when the tab is
 * restored, and without the second listener the clip creeps back to full speed
 * after a few minutes.
 *
 * 0.5 is half speed and reads as calm. Below about 0.4 it stops looking slow
 * and starts looking broken.
 *
 * ── Reduced motion ──
 * The clip does not play at all for someone who has asked their system for
 * less movement; they get the poster frame. That is a still photograph of the
 * clinic, which is most of the value anyway.
 */
export default function LoopVideo({
  /** 1 is normal. 0.5 is half speed — the default here. */
  speed = 0.5,
}: {
  speed?: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const t = useT();

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setRate = () => {
      el.playbackRate = speed;
    };
    setRate();
    // Re-applied on play: a loop restart or a tab coming back from the
    // background resets the rate in several browsers, and the clip would
    // quietly return to full speed.
    el.addEventListener("play", setRate);
    el.addEventListener("ratechange", setRate);
    return () => {
      el.removeEventListener("play", setRate);
      el.removeEventListener("ratechange", setRate);
    };
  }, [speed, reduced]);

  // No file configured yet — see the note in data/images.ts. Rendering an
  // empty <video> would put a black box with a broken-play icon on the home
  // page, which is worse than the section simply not being there.
  //
  // Read through `?.` rather than as `videos.clinicLoop`, and that is not
  // defensive habit — it is a fix for a crash this component actually caused.
  // Adding the `videos` export while the dev server was running left Next
  // serving a cached copy of this module from before it existed, so `videos`
  // arrived as undefined, and the plain property read threw:
  //
  //   Uncaught TypeError: Cannot read properties of undefined (reading 'clinicLoop')
  //
  // The whole home page went blank. For a decorative clip. Anything optional
  // enough to be absent has to fail by not rendering, never by taking the page
  // with it — a stale bundle, a deleted export or a future refactor of this
  // data file should all cost the same thing: this section, and nothing else.
  const src = videos?.clinicLoop;
  const poster = videos?.clinicLoopPoster;
  if (!src) return null;

  return (
    <section className="relative isolate overflow-hidden bg-indigo-deep text-paper">
      <div className="absolute inset-0">
        {reduced ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={ref}
            src={src}
            poster={poster}
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            // Decorative: the words beside it carry the meaning, and a screen
            // reader announcing a silent looping clip is noise.
            aria-hidden
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* The same gradient the hero uses, so the two read as one site. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(13,61,42,0.92)_0%,rgba(13,61,42,0.78)_45%,rgba(13,61,42,0.42)_100%)]"
      />

      <Reveal className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="max-w-xl">
          <p className="eyebrow text-paper/70">{t("clip.eyebrow")}</p>
          <h2 className="mt-4 h1 text-3xl text-paper sm:text-4xl">{t("clip.title")}</h2>
          <p className="mt-5 text-base leading-relaxed text-paper/85">{t("clip.body")}</p>
        </div>
      </Reveal>
    </section>
  );
}
