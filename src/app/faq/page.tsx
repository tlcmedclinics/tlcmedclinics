import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import { breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";
import { faqs } from "@/data/site";

export const metadata: Metadata = pageMetadata({
  title: "FAQ & Answers",
  description:
    "Answers to the questions patients ask most often — booking, telemedicine, first visits, fees and clinic hours.",
  path: "/faq",
});

/**
 * Frequently asked questions.
 *
 * `<details>` rather than a JavaScript accordion: it opens without waiting for
 * a bundle, works with the browser's own find-in-page, and — the reason that
 * matters here — the answers are in the HTML whether or not anything is
 * expanded, so the FAQ structured data below describes text a crawler can
 * actually see.
 */
export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          faqSchema(faqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ & Answers", path: "/faq" },
          ]),
        ]}
      />

      <section className="border-b border-line bg-indigo-deep py-14 text-paper">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            FAQ &amp; Answers
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/80">
            The questions patients ask most often, before a first appointment and after.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={faq.question} delay={Math.min(i, 6) * 60}>
              <details className="group rounded-2xl border border-line/70 bg-paper-dim/40 px-5 py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-ink">
                  {faq.question}
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-indigo transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 rounded-2xl border border-line bg-paper-dim/50 p-6 text-center">
          <p className="font-medium text-ink">Didn&apos;t find your answer?</p>
          <p className="mt-2 text-sm text-ink-soft">
            Call the clinic, or book a consultation and ask the doctor directly.
          </p>
          <Link href="/contact" className="btn-indigo btn-sm mt-4 inline-block">
            Contact us
          </Link>
        </Reveal>
      </div>
    </>
  );
}
