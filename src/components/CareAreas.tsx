import Link from "next/link";
import Reveal from "@/components/Reveal";
import SiteImage from "@/components/SiteImage";
import { ArrowRightIcon, BrainIcon, SparkleIcon, StethoscopeIcon } from "@/components/Icons";
import { images } from "@/data/images";

/**
 * The three areas of care, as pictures.
 *
 * Deliberately separate from ServicesOverview, which lists the individual
 * bookable services out of Firestore. This is the answer to "is this clinic for
 * me?", which someone decides in about two seconds and from an image — not from
 * a list of procedure names.
 *
 * Each card now leads to the section that actually explains it rather than to
 * the booking list. Someone at this point in the page is still deciding; a
 * price list is the wrong next screen.
 *
 * Vein care is absent on purpose: it is no longer offered, so it is gone from
 * the site rather than listed and quietly unbookable.
 */

const AREAS = [
  {
    title: "Mental Health",
    Icon: BrainIcon,
    image: images.mental,
    blurb:
      "Psychiatry, therapy and ketamine treatment, led by a U.S. board certified psychiatrist.",
    href: "/conditions",
    cta: "Conditions we treat",
  },
  {
    title: "Skin & Aesthetics",
    Icon: SparkleIcon,
    image: images.skin,
    blurb:
      "Botox, fillers, PRP and micro-needling — conservative, natural-looking results.",
    href: "/treatments",
    cta: "See treatments",
  },
  {
    title: "Diagnosis",
    Icon: StethoscopeIcon,
    image: images.diagnosis,
    blurb:
      "Careful evaluation first — treatment plans built on a real diagnosis, not a guess.",
    href: "/conditions/diagnosis-and-treatment",
    cta: "How we diagnose",
  },
];

export default function CareAreas() {
  return (
    <section className="bg-paper-dim/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="text-center">
          <p className="eyebrow text-indigo">Patient-centred care</p>
          <h2 className="mt-3 h1 sm:text-4xl">Where we can help</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
            People who come to TLC Med Clinics can expect polite, friendly, helpful
            staff who relate to each person as an individual — recognising their
            history, relationships, culture and needs.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((area, i) => (
            <Reveal key={area.title} delay={i * 110}>
              <Link
                href={area.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-indigo/30 hover:shadow-[0_24px_50px_-30px_rgba(36,31,102,0.55)]"
              >
                <div className="zoom-frame relative aspect-[4/3]">
                  <SiteImage
                    src={area.image}
                    alt={area.title}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  />
                  {/* The icon sits half over the photograph's lower edge, so the
                      picture and the text below read as one card rather than
                      two stacked blocks. */}
                  <span className="absolute -bottom-6 start-6 grid h-12 w-12 place-items-center rounded-xl bg-paper text-indigo shadow-[0_10px_24px_-12px_rgba(36,31,102,0.6)]">
                    <area.Icon className="h-6 w-6" />
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-6 pb-6 pt-9">
                  <h3 className="text-lg font-semibold text-ink transition-colors group-hover:text-indigo-deep">
                    {area.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {area.blurb}
                  </p>
                  <span className="mt-4 flex items-center gap-1.5 pt-1 text-sm font-medium text-indigo">
                    {area.cta}
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
