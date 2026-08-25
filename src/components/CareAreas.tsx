import type { ReactElement } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SiteImage from "@/components/SiteImage";
import { ArrowRightIcon, BrainIcon, SparkleIcon, StethoscopeIcon } from "@/components/Icons";
import type { IconProps } from "@/components/Icons";
import { adminDb } from "@/lib/firebase/admin";
import { images } from "@/data/images";
import type { Service } from "@/types";

/**
 * The clinic's areas of care — one card per category, read from the services
 * the clinic actually offers.
 *
 * This used to be three hard-coded cards sitting above a second, separate
 * "Our Services" section that listed the same treatments out of Firestore. Two
 * sections saying the same thing, one of which went stale the moment a service
 * was added. They are one section now, and this is the one that is true.
 *
 * The photograph comes from the service's own image if the clinic has uploaded
 * one in the admin panel, and falls back to a local file otherwise — so the
 * page looks finished before anyone uploads anything, and improves as they do.
 */

/** What each category looks like. Unknown categories still render, plainly. */
const CATEGORY_META: Record<
  string,
  { blurb: string; Icon: (props: IconProps) => ReactElement; image: string }
> = {
  Diagnosis: {
    blurb: "A proper evaluation first — a treatment plan built on a real diagnosis.",
    Icon: StethoscopeIcon,
    image: images.diagnosis,
  },
  "Health Care": {
    blurb:
      "Psychiatry, therapy and ketamine treatment, led by a U.S. board certified physician.",
    Icon: BrainIcon,
    image: images.mental,
  },
  "Skin & Aesthetics": {
    blurb: "Botox, fillers, PRP and micro-needling — conservative, natural-looking results.",
    Icon: SparkleIcon,
    image: images.skin,
  },
};

/** The order the areas should be read in. Anything else follows them. */
const CATEGORY_ORDER = ["Diagnosis", "Health Care", "Skin & Aesthetics"];

function categoryId(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getServices(): Promise<Service[]> {
  try {
    const snap = await adminDb.collection("services").orderBy("order", "asc").get();
    return snap.docs.map((d) => d.data() as Service);
  } catch (err) {
    // A Firestore hiccup should cost this section, not the whole home page.
    console.error("[CareAreas] services unavailable:", err);
    return [];
  }
}

export default async function CareAreas() {
  const services = await getServices();
  if (services.length === 0) return null;

  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean))).sort(
    (a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    }
  );

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

        <div className="mt-14 grid items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => {
            const inCategory = services.filter((s) => s.category === category);
            const featured = inCategory[0];
            const meta = CATEGORY_META[category];
            const Icon = meta?.Icon ?? StethoscopeIcon;

            // The clinic's own photograph wins; the bundled one is the floor.
            const image =
              inCategory.find((s) => s.image)?.image ?? meta?.image ?? images.care;

            return (
              <Reveal key={category} delay={i * 110}>
                <Link
                  href={`/services#${categoryId(category)}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-indigo/30 hover:shadow-[0_24px_50px_-30px_rgba(36,31,102,0.55)]"
                >
                  <div className="zoom-frame relative aspect-[4/3]">
                    <SiteImage
                      src={image}
                      alt={category}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    />
                    {/* The icon sits half over the photograph's lower edge, so
                        picture and text read as one card rather than two
                        stacked blocks. */}
                    <span className="absolute -bottom-6 start-6 grid h-12 w-12 place-items-center rounded-xl bg-paper text-indigo shadow-[0_10px_24px_-12px_rgba(36,31,102,0.6)]">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6 pt-9">
                    <h3 className="text-lg font-semibold text-ink transition-colors group-hover:text-indigo-deep">
                      {category}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {meta?.blurb ?? featured?.short ?? "Personalised, physician-led care."}
                    </p>

                    {featured && (
                      <span className="mt-5 block rounded-xl border border-line/70 bg-paper-dim/40 px-4 py-3">
                        <span className="block text-sm font-medium text-ink">
                          {featured.name}
                        </span>
                        {typeof featured.price === "number" && (
                          <span className="numeric mt-1 block text-xs text-ink-soft">
                            From PKR {featured.price.toLocaleString()}
                          </span>
                        )}
                      </span>
                    )}

                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-indigo">
                      {inCategory.length > 1 ? (
                        <>
                          <span className="numeric">{inCategory.length}</span> treatments
                        </>
                      ) : (
                        <>See {category}</>
                      )}
                      <ArrowRightIcon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
