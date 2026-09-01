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
 * The home page hero: words on the left, the doctor on the right, on green.
 *
 * ── The one idea the layout is built around ──
 *
 * The picture fills the band from its top edge to its floor. Getting there is
 * not a matter of making the picture bigger — the file is small, and past a
 * point every extra pixel is an upscale that shows. It is a matter of making
 * the BAND the height the picture can honestly fill.
 *
 * So the type and the spacing on the left are kept tight, the band's padding
 * is modest, and the picture's column is 38rem wide — which at the
 * photograph's own 352:307 is about 33rem tall. The negative margins let it
 * reach into the padding at both ends, so it meets the section's top edge and
 * its floor.
 *
 * 38rem is also what closes the hole in the middle. At 35rem the picture was
 * exactly the band's height, which was tidy, but it sat pinned to the right
 * margin with about 86px of bare green between it and the text — a gap you
 * read as a mistake. Widening it walks the doctor left until the two columns
 * meet, and the band grows a little to suit him rather than the other way
 * round.
 *
 * ── Why the layout is written in CSS instead of Tailwind classes ──
 *
 * This section broke twice in the same way: the markup was right, the classes
 * were right, and the browser received a stylesheet in which half of them did
 * not exist. Tailwind builds only the classes it can find written out in the
 * source, and in this project a class that appears in no other file has a
 * habit of not being built until the dev server is restarted. There is no
 * error — the page simply renders as though those attributes were never
 * written.
 *
 * So the rule here: a Tailwind class is used ONLY if it is already used
 * somewhere else in the project. Everything this hero needs that nothing else
 * needs is an inline style, which reaches the browser inside the HTML and
 * cannot go missing.
 *
 * ── Why there are no breakpoints ──
 *
 * clamp() handles the type and the spacing — one declaration that is already
 * right at 360px and at 1920px. The stacking is flex-wrap: when 20rem of text
 * and 38rem of picture no longer fit side by side — around 1050px — the
 * picture drops below the text on its own. Between them they replace every
 * media query this section used to need.
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

/** The brand green, lighter towards the top right so the band has a direction. */
const FIELD: CSSProperties = {
  backgroundImage:
    "radial-gradient(120% 120% at 88% 0%, #2b7d59 0%, #1b6746 38%, #0d3d2a 100%)",
};

/**
 * A soft light behind the doctor.
 *
 * The photograph is being drawn slightly larger than its own pixels, and an
 * upscaled picture sitting hard against a flat colour is exactly the condition
 * under which the eye notices. A little light behind it reads as lighting
 * rather than as resolution, and the figure stops looking pasted on.
 */
const GLOW: CSSProperties = {
  backgroundImage:
    "radial-gradient(38% 78% at 78% 62%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0) 72%)",
};

/**
 * The band's vertical padding, named because the picture's column has to
 * cancel exactly this much of it, twice, to reach both edges.
 */
const PAD_Y = "clamp(2rem, 3.2vw, 2.25rem)";

const SHELL: CSSProperties = {
  margin: "0 auto",
  maxWidth: "88rem",
  paddingInline: "clamp(1.5rem, 4vw, 2.5rem)",
  paddingBlock: PAD_Y,
};

const ROW: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  justifyContent: "space-between",
  // Row gap and column gap are deliberately different numbers.
  //
  // The column gap (2.5rem) is the space between the text and the doctor when
  // they sit side by side. It is small on purpose: the picture is anchored to
  // the right margin, so every pixel of gap is a pixel of bare green in the
  // middle of the band.
  //
  // The row gap (4.5rem) only applies once the row has wrapped, and it has to
  // be much bigger because the picture's column carries a negative top margin
  // of one PAD_Y. Stacked, that margin eats into whatever separates it from
  // the text above — at an equal gap the doctor's shoulder landed on top of
  // the badges.
  gap: "4.5rem 2.5rem",
};

const TEXT_COL: CSSProperties = {
  // The basis only decides when the row gives up and stacks; the width the
  // text actually gets comes from flex-grow and the max below.
  flex: "1 1 20rem",
  minWidth: 0,
  maxWidth: "42rem",
};

const IMG_COL: CSSProperties = {
  position: "relative",
  flex: "0 1 38rem",
  aspectRatio: "352 / 307",
  marginTop: `calc(-1 * ${PAD_Y})`,
  marginBottom: `calc(-1 * ${PAD_Y})`,
};

const IMG_FIT: CSSProperties = {
  objectFit: "contain",
  objectPosition: "right bottom",
};

const H1: CSSProperties = {
  marginTop: "0.85rem",
  fontSize: "clamp(1.7rem, 3vw, 2.35rem)",
  lineHeight: 1.12,
};

const LEDE: CSSProperties = {
  marginTop: "1.25rem",
  fontSize: "clamp(0.88rem, 1vw, 0.97rem)",
  maxWidth: "32rem",
};

const ACTIONS: CSSProperties = { marginTop: "1.5rem" };

const BADGE_ROW: CSSProperties = { marginTop: "1.75rem", paddingTop: "1.5rem" };

/** Lifts the primary action off the green instead of letting it lie flat on it. */
const BOOK: CSSProperties = { boxShadow: "0 10px 26px -10px rgba(216,31,42,0.7)" };

export default function Hero() {
  const t = useT();

  return (
    <section className="relative isolate overflow-hidden text-paper">
      <div aria-hidden className="absolute inset-0" style={FIELD} />
      <div aria-hidden className="absolute inset-0" style={GLOW} />

      <div className="relative" style={SHELL}>
        <div style={ROW}>
          <div style={TEXT_COL}>
            <p className="eyebrow text-paper/70">{t("hero.eyebrow")}</p>

            <h1 className="font-extrabold tracking-tight" style={H1}>
              {t("hero.title.a")}
              <span className="block text-paper/75">{t("hero.title.b")}</span>
            </h1>

            <VitalsLine className="mt-6 h-3 w-40" color="rgba(255,255,255,0.6)" />

            <p className="leading-relaxed text-paper/85" style={LEDE}>
              {t("hero.lede", { doctor: site.doctor.name })}
            </p>

            <div className="flex flex-wrap items-center gap-4" style={ACTIONS}>
              <Link
                href="/patient/book"
                style={BOOK}
                className="rounded-full bg-crimson px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-crimson-deep"
              >
                {t("hero.cta.book")}
              </Link>
              <a
                href={`tel:${site.phoneE164}`}
                className="rounded-full border border-paper/40 px-8 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-paper hover:text-indigo-deep"
              >
                {t("hero.cta.call")} <span className="numeric ms-1">{site.phone}</span>
              </a>
            </div>

            {/* Three claims, each one checkable — the badges a patient uses to
                decide whether the rest of the page is worth reading. */}
            <ul
              className="flex flex-wrap gap-x-8 gap-y-3 border-t border-paper/15"
              style={BADGE_ROW}
            >
              {BADGES.map(({ Icon, key }) => (
                <li key={key} className="flex items-center gap-2 text-sm text-paper/85">
                  <Icon className="h-[1.15rem] w-[1.15rem] shrink-0 text-paper/70" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden style={IMG_COL}>
            <SiteImage
              src={images.heroDoctor}
              alt=""
              sizes="(min-width: 66rem) 38rem, 92vw"
              className=""
              style={IMG_FIT}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
