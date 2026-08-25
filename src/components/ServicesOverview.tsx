import type { ReactElement } from "react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { Service } from "@/types";
import VitalsLine from "./VitalsLine";
import { ArrowRightIcon, BrainIcon, SparkleIcon, StethoscopeIcon } from "@/components/Icons";
import type { IconProps } from "@/components/Icons";

/**
 * One card per area of care, not the whole price list.
 *
 * The home page's job here is to answer "what kind of clinic is this?", which
 * three cards do and fifteen stacked links do not — the full list belongs on
 * /services, where someone who has already decided goes looking for a fee. Each
 * card leads with the category's first treatment and says how many others sit
 * behind it, so the depth is visible without being spelled out.
 */

/** Keyed by the category names on the Service documents in Firestore. */
const CATEGORY_META: Record<
  string,
  { blurb: string; Icon: (props: IconProps) => ReactElement }
> = {
  Diagnosis: {
    blurb: "A proper evaluation first — a treatment plan built on a real diagnosis.",
    Icon: StethoscopeIcon,
  },
  "Health Care": {
    blurb:
      "Psychiatry, therapy and ketamine treatment, led by a U.S. board certified physician.",
    Icon: BrainIcon,
  },
  "Skin & Aesthetics": {
    blurb: "Botox, fillers, PRP and micro-needling — conservative, natural-looking results.",
    Icon: SparkleIcon,
  },
};

/** The order the three areas should be read in. Anything else follows them. */
const CATEGORY_ORDER = ["Diagnosis", "Health Care", "Skin & Aesthetics"];

/** Must match the anchor ids the /services page renders. */
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
    // If Firestore credentials are missing or Firestore is briefly unreachable,
    // don't take the whole home page down with it — skip this section. The
    // error still shows in the server logs.
    console.error("[ServicesOverview] Failed to load services:", err);
    return [];
  }
}

export default async function ServicesOverview() {
  const services = await getServices();
  if (services.length === 0) return null;

  const categories = Array.from(new Set(services.map((s) => s.category))).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-indigo">What we treat</p>
          <h2 className="mt-3 h1 sm:text-4xl">Our Services</h2>
          <VitalsLine className="mt-5 h-3 w-32" color="var(--crimson)" />
        </div>
        <Link
          href="/services"
          className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-indigo hover:text-indigo-deep sm:flex"
        >
          View all services
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* items-stretch, plus h-full on each card, is what keeps the three the
          same height when one blurb runs to two lines and another to one.
          Without it they align at the top and leave ragged bottoms — which is
          what the row looked like before. */}
      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
        {categories.map((category) => {
          const inCategory = services.filter((s) => s.category === category);
          // Lowest `order` wins, which is the ordering the clinic already
          // controls from the admin panel — so choosing what leads a card needs
          // no second setting to keep in sync.
          const featured = inCategory[0];
          const others = inCategory.length - 1;
          const meta = CATEGORY_META[category];
          const Icon = meta?.Icon ?? StethoscopeIcon;

          return (
            <div
              key={category}
              className="flex h-full flex-col rounded-2xl border border-line/70 bg-paper-dim/30 p-7"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo/10 text-indigo">
                <Icon className="h-6 w-6" />
              </span>

              <h3 className="mt-5 h3 text-indigo-deep">{category}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {meta?.blurb ?? "Personalised, physician-led care."}
              </p>

              {featured && (
                <Link
                  href={`/services/${featured.slug}`}
                  className="group mt-6 block rounded-xl border border-line/70 bg-paper px-4 py-4 transition-colors hover:border-indigo/40"
                >
                  <span className="block text-sm font-medium text-ink group-hover:text-indigo-deep">
                    {featured.name}
                  </span>
                  {featured.short && (
                    <span className="mt-1 block text-xs leading-snug text-ink-soft">
                      {featured.short}
                    </span>
                  )}
                  {typeof featured.price === "number" && (
                    <span className="numeric mt-2 block text-xs text-ink-soft">
                      From PKR {featured.price.toLocaleString()}
                    </span>
                  )}
                </Link>
              )}

              {/* mt-auto pins this to the bottom of whichever card it sits in,
                  so the three links line up across the row. */}
              <Link
                href={`/services#${categoryId(category)}`}
                className="group mt-auto flex items-center gap-1.5 pt-6 text-sm font-medium text-indigo hover:text-indigo-deep"
              >
                {others > 0 ? (
                  <span>
                    <span className="numeric">{others}</span> more in {category}
                  </span>
                ) : (
                  <span>See {category}</span>
                )}
                <ArrowRightIcon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>

      <Link
        href="/services"
        className="mt-10 inline-block text-sm font-medium text-indigo hover:text-indigo-deep sm:hidden"
      >
        View all services →
      </Link>
    </section>
  );
}
