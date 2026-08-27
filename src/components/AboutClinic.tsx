import Reveal from "@/components/Reveal";
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

const POINTS = [
  "The first medical centre of its kind in Pakistan to offer the same level of care and environment as clinics in the U.S.A.",
  "Directly run and supervised by U.S.-trained, American Board Certified specialists with over 38 years of experience in patient care, education and management.",
  "International-level facilities and the U.S.A. standard of care at a competitive cost.",
  "We use the latest and most effective U.S.A. diagnosis and treatment protocols.",
  "An alternative to travelling to the U.S.A. for diagnosis and treatment.",
  "The best trained and most experienced team of doctors under one roof.",
  "An environment that is pristine, safe and inviting to all.",
  "Executive health screenings and physicals, stress-reduction and performance-improvement strategies.",
  "Preventative health screenings and health management.",
];

export default function AboutClinic() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="text-center">
        <p className="eyebrow text-indigo">About us</p>
        <h2 className="mt-3 h1 sm:text-4xl">Who we are</h2>
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
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* ---- Outcome data ---- */}
      <Reveal className="mt-20 rounded-3xl border border-line bg-paper-dim/50 p-8 sm:p-12">
        <p className="eyebrow text-indigo">Outcome data</p>
        <h3 className="mt-3 h1 text-2xl sm:text-3xl">
          Telemedicine, proven effective in symptom reduction
        </h3>
        <VitalsLine className="mt-5 h-3 w-40" color="var(--crimson)" />

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Across 10,000 participants with anxiety and depression, followed over
          twelve weeks.
        </p>

        <div className="mt-9 grid gap-8 sm:grid-cols-2">
          {[
            { figure: "50%", label: "of participants fully recovered" },
            { figure: "70%", label: "of participants saw significant improvement" },
          ].map((row) => (
            <div key={row.figure} className="rounded-2xl bg-paper p-6">
              <p className="stat-number text-4xl text-indigo-deep">{row.figure}</p>
              <p className="mt-2 text-sm leading-snug text-ink-soft">{row.label}</p>
            </div>
          ))}
        </div>

        {/* The source is named rather than implied. A recovery figure with no
            citation beside it is the kind of claim a clinic should not make. */}
        <p className="mt-6 text-xs text-ink-soft/80">
          Source: BMC Psychiatry, June 2020.
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
          <p className="eyebrow text-indigo">{leadDoctor.title}</p>
          <h3 className="mt-3 h1 text-2xl sm:text-3xl">
            <Link
              href={`/doctors/${leadDoctor.slug}`}
              className="transition-colors hover:text-indigo-deep"
            >
              {leadDoctor.name}
            </Link>
          </h3>
          <p className="mt-1.5 font-mono text-xs uppercase tracking-wider text-ink-soft">
            {leadDoctor.credentials}
          </p>

          <ul className="mt-6 space-y-3.5">
            {leadDoctor.highlights.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/doctors/${leadDoctor.slug}`}
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-indigo transition-colors hover:text-indigo-deep"
          >
            Full profile &amp; certifications
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
            Castle Connolly, 2001
          </span>

          <h3 className="mt-5 h1 text-2xl sm:text-3xl">Top Doctor in Chicago</h3>

          <p className="mt-5 text-base leading-relaxed text-ink-soft">
            {site.doctor.name} received the Castle Connolly Medical “Top Doctor”
            award in Chicago, U.S.A. It is given to one physician out of several
            thousand, for dedicated and outstanding work in their area of
            specialisation.
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
          <p className="eyebrow text-indigo">Qualifications</p>
          <h3 className="mt-3 h1 text-2xl sm:text-3xl">Certifications & licences</h3>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
            The framed originals hang in the clinic. They are reproduced here so
            that a patient can check them before booking rather than after
            arriving.
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
