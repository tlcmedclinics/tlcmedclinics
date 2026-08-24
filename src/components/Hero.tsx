import Link from "next/link";
import SiteImage from "@/components/SiteImage";
import VitalsLine from "@/components/VitalsLine";
import { AwardIcon, ShieldIcon, VideoIcon } from "@/components/Icons";
import { images } from "@/data/images";
import { site } from "@/data/site";

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

const BADGES = [
  { Icon: AwardIcon, label: "U.S. board certified" },
  { Icon: VideoIcon, label: "Telemedicine, 6 days a week" },
  { Icon: ShieldIcon, label: "Confidential by design" },
];

export default function Hero() {
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

      {/* Ink behind the type, transparent over the picture. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(100deg,rgba(20,17,52,0.94)_0%,rgba(20,17,52,0.86)_38%,rgba(20,17,52,0.45)_70%,rgba(20,17,52,0.30)_100%)]"
      />

      <div className="relative mx-auto max-w-[88rem] px-6 py-20 sm:px-10 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow text-paper/70">
            Lahore, Pakistan · U.S.-Trained Physicians
          </p>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            A personalised approach to mental health
            <span className="block text-paper/75">and skin care.</span>
          </h1>

          <VitalsLine className="mt-7 h-3 w-40" color="rgba(255,255,255,0.6)" />

          <p className="mt-7 max-w-xl text-base leading-relaxed text-paper/85">
            Psychiatry, ketamine therapy and aesthetic medicine under one roof,
            led by {site.doctor.name} — American Board Certified, with over 35
            years in practice. In the clinic, or by telemedicine.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/patient/book"
              className="rounded-full bg-crimson px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-crimson-deep"
            >
              Schedule Appointment
            </Link>
            <a
              href={`tel:${site.phoneE164}`}
              className="rounded-full border border-paper/40 px-8 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-paper hover:text-indigo-deep"
            >
              Call <span className="numeric ms-1">{site.phone}</span>
            </a>
          </div>

          {/* Three claims, each one checkable — the badges a patient uses to
              decide whether the rest of the page is worth reading. */}
          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-paper/15 pt-7">
            {BADGES.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-paper/85">
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0 text-paper/70" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
