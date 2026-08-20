import type { Metadata } from "next";
import Link from "next/link";
import { site, clinicValues, faqs } from "@/data/site";
import VitalsLine from "@/components/VitalsLine";
import Testimonials from "@/components/Testimonials";
import JsonLd from "@/components/JsonLd";
import { pageMetadata, breadcrumbSchema, faqSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About the Clinic & Our Doctors",
  description: `About TLC Med Clinics, Lahore — our values, our standard of care, and ${site.doctor.name}, ${site.doctor.credentials}, with over 35 years of clinical experience.`,
  path: "/about",
});

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
      <p className="eyebrow text-indigo">About us</p>
      <h1 className="mt-3 h1-hero">
        A US standard of care, built for Lahore.
      </h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
        TLC Med Clinics brings together vein care, skin care, and mental health
        under one clinical team, so patients aren't shuffled between disconnected
        specialists.
      </p>

      <div className="mt-14">
        <p className="eyebrow text-crimson">Our values</p>
        <h2 className="mt-2 h2 text-ink sm:text-3xl">
          How we work, with patients and with each other.
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clinicValues.map((v) => (
            <div key={v.title} className="card-hover rounded-2xl border border-line/70 p-6">
              <p className="h4 text-indigo-deep">{v.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v.body}</p>
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
          <h2 className="h3 text-ink">{site.doctor.name}</h2>
          <p className="text-sm text-indigo">{site.doctor.title}</p>
          <p className="mt-1 font-mono text-[0.7rem] text-ink-soft">{site.doctor.credentials}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{site.doctor.bio}</p>
        </div>
      </div>

      <div className="mt-16 rounded-2xl bg-mist/60 p-6 sm:p-8">
        <h2 className="h3 text-ink">Visit us</h2>
        <address className="mt-2 not-italic text-sm text-ink-soft">{site.address}</address>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-soft">
          {site.hours.map((h) => (
            <span key={h.label}>
              <span className="text-ink-soft/70">{h.label}: </span>
              {h.value}
            </span>
          ))}
        </div>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full bg-indigo px-6 py-3 text-sm font-medium text-paper hover:bg-indigo-deep"
        >
          Book Appointment
        </Link>
      </div>
    </div>

    <Testimonials />

    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow text-indigo">FAQs</p>
      <h2 className="mt-2 h2 text-ink sm:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-8 divide-y divide-line/70 rounded-2xl border border-line/70">
        {faqs.map((f) => (
          <details key={f.question} className="group p-6 open:bg-mist/40">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base text-ink">
              {f.question}
              <span className="ml-4 shrink-0 text-indigo transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
    </>
  );
}
