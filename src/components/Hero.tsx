"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import SiteImage from "@/components/SiteImage";
import VitalsLine from "@/components/VitalsLine";
import { AwardIcon, ShieldIcon, VideoIcon } from "@/components/Icons";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { useT } from "@/contexts/LanguageContext";

/**
 * The home page hero.
 *
 * ── Why this is no longer a full-bleed photograph ──
 *
 * It used to stretch images.heroCover across the whole section and lay a dark
 * green scrim over it. That only works if the file is a photograph. The file
 * the clinic supplied is a cut-out: a doctor with folded arms and a
 * stethoscope, 813×307, of which the left 388 columns are fully transparent.
 * Stretched to the width of a monitor it became a 2.4× upscale of a small PNG,
 * anchored so that the empty half sat behind the headline and the doctor was
 * pushed off the edge — and then the scrim went over the top of him.
 *
 * So the picture is now what it actually is: a person standing at the right of
 * a green band, at roughly his own size. The green is the background in its
 * own right rather than a filter over a photograph, which is also why the type
 * passes contrast at every width without a scrim fighting the image for it.
 *
 * ── The layer order, and why it is this way round ──
 *
 * 1. The green field.
 * 2. The doctor.
 * 3. A gradient that is opaque on the left and clears by the middle.
 * 4. The words.
 *
 * The gradient sits above the doctor, not below him. On a wide screen the two
 * never meet, so it does nothing; on a phone the text runs the full width and
 * the picture would otherwise be behind the paragraph. Above him, the gradient
 * simply dissolves whatever part of the picture reaches the text — a phone
 * shows a shoulder at the right edge and nothing behind the words.
 *
 * Vein care is deliberately absent from the copy. The clinic no longer offers
 * it, and a hero that promises a service the booking form cannot fulfil is
 * worse than one that promises less.
 */

/**
 * The three claims under the hero.
 *
 * Keys, not sentences. This component became a client component to reach the
 * translation dictionary — it is static markup with no data fetching, so the
 * only cost is a few kilobytes of bundle, against a hero that was in English
 * for an Urdu reader no matter which toggle they pressed.
 */
const BADGES = [
  { Icon: AwardIcon, key: "hero.badge.certified" },
  { Icon: VideoIcon, key: "hero.badge.telemedicine" },
  { Icon: ShieldIcon, key: "hero.badge.confidential" },
];

/**
 * The cut-out's geometry, as a style object rather than utility classes.
 *
 * Three things have to be true at once and only CSS can say all three:
 *
 *   · the box is exactly the picture's own aspect ratio, 352:307. Without
 *     that, object-contain leaves transparent margin inside the box, and the
 *     mask below fades empty space instead of the doctor's shoulders.
 *   · the width follows the viewport — clamp() does it in one declaration and
 *     needs no breakpoints, which is also why it cannot go out of step with
 *     the `sizes` attribute the way three Tailwind breakpoints could.
 *   · the top 15% fades out. The photograph is cropped straight across the
 *     shoulders, and a hard horizontal edge in mid-air reads as a mistake.
 *     Faded, he simply emerges from the green.
 *
 * 26rem is the ceiling on purpose: the file is 352px wide, and past about
 * 420px on screen it stops looking like a photograph and starts looking like
 * a photocopy.
 */
const FADE_TOP = "linear-gradient(to bottom, transparent 0%, #000 15%)";

const DOCTOR_BOX: CSSProperties = {
  width: "clamp(14rem, 30vw, 26rem)",
  aspectRatio: "352 / 307",
  maskImage: FADE_TOP,
  WebkitMaskImage: FADE_TOP,
};

const DOCTOR_BOX_SMALL: CSSProperties = {
  width: "clamp(11rem, 48vw, 18rem)",
  aspectRatio: "352 / 307",
  maskImage: FADE_TOP,
  WebkitMaskImage: FADE_TOP,
};

export default function Hero() {
  const t = useT();

  return (
    <section className="relative isolate overflow-hidden bg-indigo-deep text-paper">
      {/* 1. The green field. Two stops of the brand green, lighter towards the
             top right so the section has a direction and the cut-out has
             something to stand against instead of a flat wall. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 120% at 88% 0%, #2b7d59 0%, #1b6746 38%, #0d3d2a 100%)",
        }}
      />

      {/* 2. The doctor.
             Anchored inside a centred 88rem box rather than to the window, so
             on a very wide monitor he stays beside the text instead of drifting
             to the far edge of the screen with a metre of green between them.
             object-contain, bottom-aligned: he is standing on the floor of the
             section, and object-cover would crop his arms to fill the box. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="relative mx-auto h-full max-w-[88rem]">
          <div className="absolute bottom-0 right-10" style={DOCTOR_BOX}>
            <SiteImage
              src={images.heroDoctor}
              alt=""
              sizes="26rem"
              className="object-contain object-bottom"
            />
          </div>
        </div>
      </div>

      {/* 3. The wash. Solid green behind the text column, clearing to nothing
             by 74% — the width at which the doctor begins on a large screen, so
             he is never washed out and the type is never over him. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(100deg, rgba(13,61,42,0.96) 0%, rgba(13,61,42,0.92) 34%, rgba(13,61,42,0.55) 52%, rgba(13,61,42,0) 74%)",
        }}
      />

      {/* 4. The words. max-w-xl on large screens rather than 2xl: the column has
             to stop before the doctor starts. */}
      <div className="relative mx-auto max-w-[88rem] px-6 py-16 sm:px-10 sm:py-20 lg:py-28">
        <div className="max-w-lg xl:max-w-xl">
          <p className="eyebrow text-paper/70">{t("hero.eyebrow")}</p>

          {/* text-3xl on a phone. The old floor was text-4xl, and at 360px a
              four-word Urdu headline at that size wrapped to four lines and
              pushed the buttons under the fold. */}
          <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] tracking-tight sm:mt-5 sm:text-5xl sm:leading-[1.08] lg:text-[3.5rem]">
            {t("hero.title.a")}
            <span className="block text-paper/75">{t("hero.title.b")}</span>
          </h1>

          <VitalsLine className="mt-6 h-3 w-32 sm:mt-7 sm:w-40" color="rgba(255,255,255,0.6)" />

          <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-paper/85 sm:mt-7 sm:text-base">
            {t("hero.lede", { doctor: site.doctor.name })}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9 sm:gap-4">
            <Link
              href="/patient/book"
              className="rounded-full bg-crimson px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-crimson-deep sm:px-8 sm:py-3.5"
            >
              {t("hero.cta.book")}
            </Link>
            <a
              href={`tel:${site.phoneE164}`}
              className="rounded-full border border-paper/40 px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-paper hover:text-indigo-deep sm:px-8 sm:py-3.5"
            >
              {t("hero.cta.call")} <span className="numeric ms-1">{site.phone}</span>
            </a>
          </div>

          {/* Three claims, each one checkable — the badges a patient uses to
              decide whether the rest of the page is worth reading. */}
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-paper/15 pt-6 sm:mt-12 sm:gap-x-8 sm:pt-7">
            {BADGES.map(({ Icon, key }) => (
              <li
                key={key}
                className="flex items-center gap-2 text-[0.8rem] text-paper/85 sm:text-sm"
              >
                <Icon className="h-[1.05rem] w-[1.05rem] shrink-0 text-paper/70 sm:h-[1.15rem] sm:w-[1.15rem]" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {/* The same picture, below the words instead of beside them, for every
            width narrower than lg.
            Putting him at the right of a phone screen was the obvious thing and
            it does not work: the text column is the full width of the viewport
            there, so the headline and the badges run straight across his coat —
            white type on white cloth with nothing behind it. Fading him back far
            enough to fix that left no picture worth showing. He does not fit
            beside the text at that width, so he goes underneath it, at his own
            size, over nothing. */}
        <div aria-hidden className="relative ms-auto mt-10 lg:hidden" style={DOCTOR_BOX_SMALL}>
          <SiteImage
            src={images.heroDoctor}
            alt=""
            sizes="(min-width: 640px) 18rem, 48vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </section>
  );
}
