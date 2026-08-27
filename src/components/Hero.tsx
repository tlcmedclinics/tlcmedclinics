"use client";

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
 * A full-bleed cover photograph with the headline over it, which is the shape
 * the clinic's previous site used. It works here for a reason beyond
 * familiarity: the first thing a patient wants to know is whether there is a
 * real clinic and a real doctor behind the site, and a photograph the width of
 * the screen answers that before a word is read.
 *
 * The overlay is two layers, not one. A flat scrim dims the whole picture
 * evenly and makes it muddy; a horizontal gradient keeps the right side of the
 * image visible while putting enough ink behind the text on the left for it to
 * pass contrast at every window width.
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

export default function Hero() {
  const t = useT();

  return (
    <section className="relative isolate overflow-hidden bg-indigo-deep text-paper">
      <div className="absolute inset-0">
        <SiteImage
          src={images.heroCover}
          alt={`${site.name}, Johar Town, Lahore`}
          sizes="100vw"
          priority
        />
      </div>

      {/* Deep behind the type, transparent over the picture.
          rgb(13,61,42) is the brand green at its darkest. This was
          rgba(20,17,52) — navy — left over from the indigo palette. Once the
          rest of the site turned green, that navy was the only blue thing on
          the page, and it covered the largest area of it. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(13,61,42,0.95)_0%,rgba(13,61,42,0.88)_38%,rgba(13,61,42,0.48)_70%,rgba(13,61,42,0.28)_100%)]"
      />

      <div className="relative mx-auto max-w-[88rem] px-6 py-20 sm:px-10 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow text-paper/70">{t("hero.eyebrow")}</p>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            {t("hero.title.a")}
            <span className="block text-paper/75">{t("hero.title.b")}</span>
          </h1>

          <VitalsLine className="mt-7 h-3 w-40" color="rgba(255,255,255,0.6)" />

          <p className="mt-7 max-w-xl text-base leading-relaxed text-paper/85">
            {t("hero.lede", { doctor: site.doctor.name })}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/patient/book"
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
          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-paper/15 pt-7">
            {BADGES.map(({ Icon, key }) => (
              <li key={key} className="flex items-center gap-2 text-sm text-paper/85">
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0 text-paper/70" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
