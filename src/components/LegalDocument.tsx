import Link from "next/link";
import { site } from "@/data/site";
import VitalsLine from "@/components/VitalsLine";
import type { LegalDoc } from "@/data/legal";

/**
 * Renders a legal document: contents down one side, sections down the other.
 *
 * Long legal text is read in two quite different ways. Most people arrive
 * looking for one clause — what happens if I miss an appointment, who can see
 * my notes — and a wall of prose makes that a hunt. A few, and every payment
 * gateway's compliance reviewer, read the whole thing top to bottom. The
 * contents list serves the first without getting in the way of the second.
 *
 * Deliberately plain: generous line height, a real measure, no cards or
 * shadows. This is the one page on the site where decoration would look like
 * an attempt to soften what it says.
 */
export default function LegalDocument({
  doc,
  /** Shown under the title — used to point /privacy at the full terms. */
  note,
}: {
  doc: LegalDoc;
  note?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header className="max-w-3xl">
        <p className="eyebrow text-indigo">Legal</p>
        <h1 className="mt-3 h1-hero">{doc.title}</h1>
        <VitalsLine className="mt-5 h-3 w-40" />
        <p className="lede mt-5">{doc.summary}</p>
        {note && <div className="mt-5">{note}</div>}
        <p className="mt-5 text-xs text-ink-soft">
          Last revised <span className="numeric">{doc.lastRevised}</span>
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[16rem_1fr] lg:items-start">
        {/* Contents. Ordered, because a legal document's order is part of it. */}
        <nav aria-label="Contents" className="lg:sticky lg:top-24">
          <p className="eyebrow text-ink-soft/80">On this page</p>
          <ol className="mt-4 space-y-1.5">
            {doc.sections.map((section, i) => (
              <li key={section.id} className="flex gap-2.5 text-sm leading-snug">
                <span className="numeric shrink-0 text-xs text-ink-soft/50">{i + 1}</span>
                <a
                  href={`#${section.id}`}
                  className="text-ink-soft transition-colors hover:text-indigo"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-3xl">
          {doc.sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              // scroll-mt clears the sticky header when a contents link jumps
              // here; without it the heading lands underneath the navbar.
              className={`scroll-mt-28 ${i > 0 ? "mt-12 border-t border-line/70 pt-12" : ""}`}
            >
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                <span className="numeric mr-2.5 text-base font-normal text-ink-soft/50">
                  {i + 1}
                </span>
                {section.heading}
              </h2>

              <div className="mt-4 space-y-4">
                {section.blocks.map((block, b) => {
                  if (block.kind === "alert") {
                    return (
                      <p
                        key={b}
                        // The emergency notice. Given the loudest treatment on
                        // the page on purpose — someone in crisis scanning this
                        // document should not have to read a paragraph of
                        // contract language to find it.
                        className="rounded-2xl border-l-4 border-crimson bg-crimson/[0.04] px-5 py-4 text-sm font-medium leading-relaxed text-ink"
                      >
                        {block.text}
                      </p>
                    );
                  }

                  if (block.kind === "ul") {
                    return (
                      <ul key={b} className="space-y-2.5">
                        {block.items.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-soft"
                          >
                            <span
                              aria-hidden
                              className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p key={b} className="text-[0.95rem] leading-relaxed text-ink-soft">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </section>
          ))}

          {/* The clinic's real contact details, appended rather than left
              inside the prose — the document's own copy carried a mistyped
              address, and one source of truth for this is site.ts. */}
          <div className="mt-12 rounded-2xl border border-line bg-paper-dim/40 p-6">
            <p className="text-sm font-semibold text-ink">Questions about this document?</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="font-medium text-indigo hover:text-indigo-deep"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${site.phoneE164}`}
                  className="numeric font-medium text-indigo hover:text-indigo-deep"
                >
                  {site.phone}
                </a>
              </li>
              <li>{site.address}</li>
            </ul>
            <Link href="/contact" className="btn-outline btn-sm mt-5 inline-block">
              Contact the clinic
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
