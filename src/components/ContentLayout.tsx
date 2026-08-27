import Link from "next/link";
import ContentBlocks from "@/components/ContentBlocks";
import Reveal from "@/components/Reveal";
import SiteImage from "@/components/SiteImage";
import { GROUP_META, groupedPages, type ContentPage } from "@/data/content";
import { pageImages } from "@/data/images";
import { adminDb } from "@/lib/firebase/admin";
import type { Service } from "@/types";
import { site } from "@/data/site";

/**
 * The frame around every informational page: banner, breadcrumb, body, and a
 * sidebar listing the rest of the group.
 *
 * The sidebar is the point. Someone reading about OCD is usually deciding
 * whether this clinic understands their problem, and the fastest way to answer
 * that is to let them see the neighbouring pages without going back to a menu.
 *
 * On a phone it moves below the article — a list of twenty sibling links above
 * the thing you came to read is a wall, not navigation.
 */
/**
 * The live services, read only when the page actually shows prices.
 *
 * Wrapped: a fee table that fails should cost the reader a table, not the whole
 * page. ContentBlocks says so in words when the list comes back empty.
 */
async function getServices(): Promise<Service[]> {
  try {
    const snap = await adminDb.collection("services").get();
    return snap.docs.map((d) => d.data() as Service);
  } catch (err) {
    console.error("[ContentLayout] prices unavailable:", err);
    return [];
  }
}

export default async function ContentLayout({ page }: { page: ContentPage }) {
  const meta = GROUP_META[page.group];
  const sections = groupedPages(page.group);
  // Only some pages have an honest photograph — see pageImages. A page without
  // one keeps the plain indigo banner rather than borrowing a stock image.
  const banner = pageImages[page.slug];

  // Most pages have no fee table and pay nothing for this.
  const needsPrices = page.blocks.some((b) => b.kind === "prices");
  const services = needsPrices ? await getServices() : [];

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-indigo-deep py-14 text-paper">
        {banner && (
          <>
            <div className="absolute inset-0">
              <SiteImage src={banner} alt="" sizes="100vw" />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(100deg,rgba(13,61,42,0.95)_0%,rgba(13,61,42,0.88)_45%,rgba(13,61,42,0.55)_100%)]"
            />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{page.title}</h1>
          <nav aria-label="Breadcrumb" className="mt-3 text-sm text-paper/70">
            <Link href="/" className="hover:text-paper">
              Home
            </Link>
            <span aria-hidden className="px-2">
              »
            </span>
            <Link href={meta.href} className="hover:text-paper">
              {meta.label}
            </Link>
            <span aria-hidden className="px-2">
              »
            </span>
            <span className="text-paper">{page.title}</span>
          </nav>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1fr_18rem] lg:items-start">
        <Reveal as="article">
          <ContentBlocks blocks={page.blocks} services={services} />

          <div className="mt-12 rounded-2xl border border-line bg-paper-dim/50 p-6">
            <p className="text-sm font-semibold text-ink">Ready to talk to someone?</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Book an appointment in the clinic or by telemedicine — or call us on{" "}
              <a href={`tel:${site.phoneE164}`} className="font-medium text-indigo hover:underline">
                {site.phone}
              </a>
              .
            </p>
            <Link href="/patient/book" className="btn-indigo btn-sm mt-4 inline-block">
              Book an appointment
            </Link>
          </div>
        </Reveal>

        <aside className="lg:sticky lg:top-24">
          <p className="eyebrow text-indigo">{meta.label}</p>

          {sections.map(({ section, pages }) => (
            <div key={section ?? "_"} className="mt-5">
              {section && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft/80">
                  {section}
                </p>
              )}
              <ul className="space-y-1">
                {pages.map((p) => {
                  const current = p.slug === page.slug;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`${meta.href}/${p.slug}`}
                        aria-current={current ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          current
                            ? "bg-indigo/10 font-medium text-indigo-deep"
                            : "text-ink-soft hover:bg-paper-dim hover:text-ink"
                        }`}
                      >
                        {p.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="mt-8 rounded-2xl border border-line p-5 text-sm">
            <p className="font-semibold text-ink">Clinic hours</p>
            <ul className="mt-3 space-y-2 text-ink-soft">
              {site.hours.map((h) => (
                <li key={h.label}>
                  <span className="block text-xs uppercase tracking-wide text-ink-soft/70">
                    {h.label}
                  </span>
                  {h.value}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-ink-soft">{site.address}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
