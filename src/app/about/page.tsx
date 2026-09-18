import type { Metadata } from "next";
import Link from "next/link";
import { site, clinicValues, faqs } from "@/data/site";
import VitalsLine from "@/components/VitalsLine";
import { T } from "@/components/T";
import { Bilingual } from "@/components/Bilingual";
import Testimonials from "@/components/Testimonials";
import JsonLd from "@/components/JsonLd";
import { pageMetadata, breadcrumbSchema, faqSchema } from "@/lib/seo";
import { pagesInGroup } from "@/data/content";

export const metadata: Metadata = pageMetadata({
  title: "About the Clinic & Our Doctors",
  description: `About TLC Med Clinics, Lahore — our values, our standard of care, and ${site.doctor.name}, ${site.doctor.credentials}, with over 35 years of clinical experience.`,
  path: "/about",
});

const aboutPages = pagesInGroup("about");

export default function AboutPage() {
  return (
    <>
    <JsonLd
      data={[
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]),
        // The FAQ block is already on the page — declaring it makes it
        // eligible for the expandable answers Google shows under a result.
        faqSchema(faqs),
      ]}
    />
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow text-indigo">
        <T k="home.about.eyebrow" />
      </p>
      <h1 className="mt-3 h1-hero">
        <T k="about.hero.title" />
      </h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
        <T k="about.hero.lede" />
      </p>

      <div className="mt-14">
        <p className="eyebrow text-crimson">
          <T k="about.values.eyebrow" />
        </p>
        <h2 className="mt-2 h2 text-ink sm:text-3xl">
          <T k="about.values.title" />
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clinicValues.map((v) => (
            <div key={v.title} className="card-hover rounded-2xl border border-line/70 p-6">
              <p className="h4 text-indigo-deep">
                <Bilingual en={v.title} ur={v.titleUr} />
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                <Bilingual en={v.body} ur={v.bodyUr} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-6 rounded-2xl border border-line/70 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo/10">
          <span className="h2 text-indigo-deep">
            {site.doctor.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        <div>
          <h2 className="h3 text-ink">
            <Bilingual en={site.doctor.name} ur={site.doctor.nameUr} />
          </h2>
          <p className="text-sm text-indigo">
            <Bilingual en={site.doctor.title} ur={site.doctor.titleUr} />
          </p>
          <p className="mt-1 font-mono text-[0.7rem] text-ink-soft">{site.doctor.credentials}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            <Bilingual en={site.doctor.bio} ur={site.doctor.bioUr} />
          </p>
        </div>
      </div>

      <div className="mt-16 rounded-2xl bg-mist/60 p-6 sm:p-8">
        <h2 className="h3 text-ink">
          <T k="about.visit.title" />
        </h2>
        <address className="mt-2 not-italic text-sm text-ink-soft">
          <Bilingual en={site.address} ur={site.addressUr} />
        </address>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-soft">
          {site.hours.map((h) => (
            <span key={h.label}>
              <span className="text-ink-soft/70">
                <Bilingual en={h.label} ur={h.labelUr} />:{" "}
              </span>
              <Bilingual en={h.value} ur={h.valueUr} className="numeric" />
            </span>
          ))}
        </div>
        <Link
          href="/patient/book"
          className="mt-6 inline-block rounded-full bg-indigo px-6 py-3 text-sm font-medium text-paper hover:bg-indigo-deep"
        >
          <T k="nav.book" />
        </Link>
      </div>
    </div>

    <Testimonials />

    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow text-indigo">
        <T k="about.faq.eyebrow" />
      </p>
      <h2 className="mt-2 h2 text-ink sm:text-3xl">
        <T k="about.faq.title" />
      </h2>
      <div className="mt-8 divide-y divide-line/70 rounded-2xl border border-line/70">
        {faqs.map((f) => (
          <details key={f.question} className="group p-6 open:bg-mist/40">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base text-ink">
              <Bilingual en={f.question} ur={f.questionUr} />
              <span className="ml-4 shrink-0 text-indigo transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              <Bilingual en={f.answer} ur={f.answerUr} />
            </p>
          </details>
        ))}
      </div>

      {/* The About sub-pages, linked from the page they belong to. Without
          this they exist only in the footer and in each other's sidebars —
          reachable, but not from the one place a reader would look. */}
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {aboutPages.map((p) => (
          <Link
            key={p.slug}
            href={`/about/${p.slug}`}
            className="group rounded-2xl border border-line/70 bg-paper-dim/40 p-5 transition-colors hover:border-indigo/40 hover:bg-paper-dim"
          >
            <span className="block font-medium text-ink group-hover:text-indigo-deep">
              <Bilingual en={p.title} ur={p.titleUr} />
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-ink-soft">
              <Bilingual en={p.summary} ur={p.summaryUr} />
            </span>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}
