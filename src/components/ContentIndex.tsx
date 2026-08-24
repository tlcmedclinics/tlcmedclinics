import type { ReactElement } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  ArrowRightIcon,
  BrainIcon,
  FileIcon,
  HeartIcon,
  SparkleIcon,
  VideoIcon,
  type IconProps,
} from "@/components/Icons";
import { GROUP_META, groupedPages, type ContentGroup } from "@/data/content";

/**
 * The index page for a content group — every page in it, grouped by section.
 *
 * Cards rather than a plain list: these pages are the answer to "do you treat
 * what I have?", and a summary line under each title answers that without a
 * click.
 */

/** One icon per section, so a banner is recognisable before it is read. */
const GROUP_ICON: Record<ContentGroup, (props: IconProps) => ReactElement> = {
  telemedicine: VideoIcon,
  conditions: BrainIcon,
  treatments: SparkleIcon,
  "what-to-expect": FileIcon,
  about: HeartIcon,
};

export default function ContentIndex({
  group,
  intro,
}: {
  group: ContentGroup;
  intro: string;
}) {
  const meta = GROUP_META[group];
  const sections = groupedPages(group);
  const GroupIcon = GROUP_ICON[group];
  const total = sections.reduce((n, s) => n + s.pages.length, 0);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-indigo-deep py-14 text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(30rem_30rem_at_92%_10%,white,transparent_62%)]"
        />
        <div className="relative mx-auto flex max-w-6xl items-start gap-5 px-6">
          <span className="hidden shrink-0 rounded-2xl border border-paper/20 bg-paper/[0.07] p-3.5 sm:block">
            <GroupIcon className="h-8 w-8 text-paper" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{meta.label}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/80">{intro}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-paper/50">
              <span className="numeric">{total}</span> pages
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14">
        {sections.map(({ section, pages }) => (
          <section key={section ?? "_"} className="mb-12 last:mb-0">
            {section && (
              <h2 className="mb-5 flex items-center gap-2.5 text-lg font-semibold text-ink">
                <GroupIcon className="h-5 w-5 text-indigo" />
                {section}
              </h2>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((p, i) => (
                <Reveal key={p.slug} delay={Math.min(i, 5) * 70}>
                  <Link
                    href={`${meta.href}/${p.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-line/70 bg-paper-dim/40 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo/40 hover:bg-paper-dim hover:shadow-[0_18px_40px_-28px_rgba(36,31,102,0.6)]"
                  >
                    <span className="font-medium text-ink group-hover:text-indigo-deep">
                      {p.title}
                    </span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                      {p.summary}
                    </span>
                    {/* Visible at rest, not revealed on hover. A "read more"
                        that only appears under the cursor tells a touch-screen
                        visitor nothing, and they are most of them. */}
                    <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo">
                      Read more
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
