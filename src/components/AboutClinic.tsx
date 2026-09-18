import Reveal from "@/components/Reveal";
import { T } from "@/components/T";
import { Bilingual, BilingualList } from "@/components/Bilingual";
import Link from "next/link";
import SiteImage from "@/components/SiteImage";
import VitalsLine from "@/components/VitalsLine";
import { AwardIcon, CheckIcon } from "@/components/Icons";
import Slideshow from "@/components/Slideshow";
import { certificates, clinicGallery, images } from "@/data/images";
import { site } from "@/data/site";
import { leadDoctor } from "@/data/doctors";

/**
 * Who the clinic is, and the outcome figures behind the telemedicine claim.
 *
 * The two sit together because the first is what the clinic says about itself
 * and the second is the evidence. Separated by half a page, the claims read as
 * marketing; next to the numbers, they read as a record.
 */

/**
 * Nine claims the clinic makes about itself.
 *
 * Keys rather than sentences: every one of these is a reason somebody might
 * choose this clinic over another, and a reason you cannot read is not a reason.
 */
const POINTS = [
  "home.about.point1",
  "home.about.point2",
  "home.about.point3",
  "home.about.point4",
  "home.about.point5",
  "home.about.point6",
  "home.about.point7",
  "home.about.point8",
  "home.about.point9",
];

export default function AboutClinic() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="text-center">
        <p className="eyebrow text-indigo">
          <T k="home.about.eyebrow" />
        </p>
        <h2 className="mt-3 h1 sm:text-4xl">
          <T k="home.about.title" />
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:items-start">
        <Reveal>
          {/* A loop rather than one photograph: a clinic is judged on whether
              it looks like somewhere you would sit down, and one angle of one
              room does not answer that. */}
          <Slideshow
            images={clinicGallery}
            alt={`Inside ${site.name}`}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="zoom-frame aspect-[4/3] rounded-3xl"
          />
        </Reveal>

        <Reveal delay={100}>
          {/* Ticks rather than bullets. Every line here is a claim the clinic is
              making about itself, and a tick says that; a dot says nothing. */}
          <ul className="space-y-3.5">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                <T k={point} />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* ---- Outcome data ---- */}
      <Reveal className="mt-20 rounded-3xl border border-line bg-paper-dim/50 p-8 sm:p-12">
        <p className="eyebrow text-indigo">
          <T k="home.outcome.eyebrow" />
        </p>
        <h3 className="mt-3 h1 text-2xl sm:text-3xl">
          <T k="home.outcome.title" />
        </h3>
        <VitalsLine className="mt-5 h-3 w-40" color="var(--crimson)" />

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
          <T k="home.outcome.lede" />
        </p>

        <div className="mt-9 grid gap-8 sm:grid-cols-2">
          {[
            { figure: "50%", labelKey: "home.outcome.recovered" },
            { figure: "70%", labelKey: "home.outcome.improved" },
          ].map((row) => (
            <div key={row.figure} className="rounded-2xl bg-paper p-6">
              <p className="stat-number text-4xl text-indigo-deep">{row.figure}</p>
              <p className="mt-2 text-sm leading-snug text-ink-soft">
                <T k={row.labelKey} />
              </p>
            </div>
          ))}
        </div>

        {/* The source is named rather than implied. A recovery figure with no
            citation beside it is the kind of claim a clinic should not make. */}
        <p className="mt-6 text-xs text-ink-soft/80">
          <T k="home.outcome.source" />
        </p>
      </Reveal>

      {/* ---- Medical director ---- */}
      {/* The portrait was half the width and the text the other half, which
          left a very large photograph beside a short list. Capped at 13rem
          and squared off to 4:5, it reads as a profile photograph rather than
          as an image the section is built around — which is what it is. The
          first attempt at this used 16rem and 3:4; 341px tall still dominated
          the row it sat in.

          The column width is `13rem`, not `minmax(0,13rem)`. Tailwind cannot
          build a class from an arbitrary value containing a comma, so the
          second version generated no rule at all — the grid silently fell back
          to one column, the portrait stacked above the text, and the section
          looked as though the image had failed to load. A layout that
          disappears is a worse failure than one that is the wrong size,
          because there is nothing on screen to point at.

          The name links to the full profile. Someone deciding whether to book
          with a psychiatrist wants the training and the certifications, and
          that is more than belongs on a home page. */}
      <Reveal className="mt-20 grid gap-10 lg:grid-cols-[13rem_1fr] lg:items-start">
        <div className="mx-auto w-full max-w-[13rem] lg:mx-0">
          <Link
            href={`/doctors/${leadDoctor.slug}`}
            className="zoom-frame relative block aspect-[4/5] rounded-2xl"
          >
            <SiteImage
              src={images.doctor}
              alt={leadDoctor.name}
              sizes="(min-width: 1024px) 13rem, 45vw"
            />
          </Link>

          <div className="mt-4 space-y-1.5 text-sm">
            <a
              href={`tel:${site.phoneE164}`}
              className="numeric block font-medium text-indigo hover:text-indigo-deep"
            >
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="block text-ink-soft transition-colors hover:text-indigo"
            >
              {site.email}
            </a>
          </div>
        </div>

        <div>
          <p className="eyebrow text-indigo">
            <Bilingual en={leadDoctor.title} ur={leadDoctor.titleUr} />
          </p>
          <h3 className="mt-3 h1 text-2xl sm:text-3xl">
            <Link
              href={`/doctors/${leadDoctor.slug}`}
              className="transition-colors hover:text-indigo-deep"
            >
              <Bilingual en={leadDoctor.name} ur={leadDoctor.nameUr} />
            </Link>
          </h3>
          <p className="mt-1.5 font-mono text-xs uppercase tracking-wider text-ink-soft">
            {leadDoctor.credentials}
          </p>

          <BilingualList
            en={leadDoctor.highlights}
            ur={leadDoctor.highlightsUr}
            className="mt-6 space-y-3.5"
            variant="bullet"
          />

          <Link
            href={`/doctors/${leadDoctor.slug}`}
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-indigo transition-colors hover:text-indigo-deep"
          >
            <T k="home.doctor.fullProfile" />
            <span aria-hidden>→</span>
          </Link>
        </div>
      </Reveal>

      {/* ---- The award ----

          Its own band, with the plaque beside the claim rather than stacked
          under the portrait. The plaque is the evidence for the sentence next
          to it, and evidence a reader has to scroll away from to find is doing
          none of its work. */}
      <Reveal className="mt-20 grid gap-10 rounded-3xl border border-line bg-paper-dim/40 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-crimson/10 px-3 py-1.5 text-xs font-medium text-crimson">
            <AwardIcon className="h-4 w-4" />
            <T k="home.award.badge" />
          </span>

          <h3 className="mt-5 h1 text-2xl sm:text-3xl">
            <T k="home.award.title" />
          </h3>

          <p className="mt-5 text-base leading-relaxed text-ink-soft">
            <T k="home.award.body" vars={{ doctor: site.doctor.name }} />
          </p>
        </div>

        <div className="zoom-frame relative aspect-[3/4] rounded-2xl bg-paper">
          <SiteImage
            src={images.award}
            alt="The Castle Connolly Top Doctor plaque awarded to Dr. Naseem Chaudhry"
            sizes="(min-width: 1024px) 32vw, 100vw"
            className="object-contain p-4"
          />
        </div>
      </Reveal>

      {/* ---- Qualifications ---- */}
      {certificates.length > 0 && (
        <Reveal className="mt-20">
          <p className="eyebrow text-indigo">
            <T k="home.certs.eyebrow" />
          </p>
          <h3 className="mt-3 h1 text-2xl sm:text-3xl">
            <T k="home.certs.title" />
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
            <T k="home.certs.lede" />
          </p>

          {/* Scrolls horizontally on a phone instead of shrinking ten
              certificates to the point where none of them is readable. */}
          <ul className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4 shell-scroll">
            {certificates.map((src, i) => (
              <li
                key={src}
                className="zoom-frame relative aspect-[3/4] w-40 shrink-0 snap-start rounded-xl border border-line bg-paper-dim/40 sm:w-48"
              >
                <SiteImage
                  src={src}
                  alt={`Certificate ${i + 1}`}
                  sizes="12rem"
                  className="object-contain p-2"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </section>
  );
}
