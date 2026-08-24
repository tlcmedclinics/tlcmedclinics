import Link from "next/link";
import Reveal from "@/components/Reveal";
import VitalsLine from "@/components/VitalsLine";
import { BrainIcon, DropletIcon, ShieldIcon, StethoscopeIcon } from "@/components/Icons";

/**
 * Ketamine therapy — the clinic's flagship programme, placed directly under the
 * hero.
 *
 * It sits above every other service on purpose. It is the one treatment here
 * that a patient cannot get in most of the country, and the claim that carries
 * it — the first clinic of its kind in Lahore, supervised by U.S. board
 * certified physicians — only means anything if it is read before the visitor
 * has started skimming.
 *
 * There is no photograph, which is the deliberate choice and matches the
 * clinic's previous site. Stock imagery of an infusion line reads as clinical
 * marketing on a page about depression, and the honest alternative — a picture
 * of a patient receiving it — is not something to stage. Four icons carry the
 * structure instead, and the section keeps the deep indigo ground: sections
 * that all look alike get scrolled past at the same speed, and a change of
 * colour is what makes someone slow down.
 */

const FACTS = [
  {
    Icon: BrainIcon,
    title: "What it treats",
    body: "Depression, suicidal thinking, PTSD, anxiety disorders, postpartum depression, OCD and chronic pain.",
  },
  {
    Icon: StethoscopeIcon,
    title: "Who supervises it",
    body: "U.S. board certified physicians, present for the session — not a technician working from a protocol.",
  },
  {
    Icon: DropletIcon,
    title: "What a session is",
    body: "A monitored infusion of about 180 minutes, with observation before you leave and a plan for the next one.",
  },
  {
    Icon: ShieldIcon,
    title: "Why here",
    body: "The first clinic of its kind in Lahore, running the same protocols used in the United States.",
  },
];

export default function KetamineHighlight() {
  return (
    <section className="relative overflow-hidden bg-indigo-deep text-paper">
      {/* Faint arcs, drawn rather than photographed. Enough to stop the panel
          reading as a flat block of colour without competing with the type. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(38rem_38rem_at_88%_20%,white,transparent_62%),radial-gradient(28rem_28rem_at_6%_92%,white,transparent_60%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
          <Reveal>
            <p className="eyebrow text-paper/70">Flagship programme</p>

            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Ketamine Therapy for Depression
              <span className="block text-paper/80">and other Mood Disorders</span>
            </h2>

            <VitalsLine className="mt-6 h-3 w-40" color="rgba(255,255,255,0.55)" />

            <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/85">
              A personalised approach to mental health treatment, with ketamine
              infusion for depression, suicidal thinking, post-traumatic stress
              disorder (PTSD), anxiety disorders, postpartum depression,
              obsessive-compulsive disorder (OCD), chronic pain, substance abuse
              disorders, and other mood disorders.
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-paper/85">
              Ours is the first clinic of its kind in Lahore, run and supervised
              by U.S. board certified physicians — safe, effective, world-class
              treatment with the best outcomes.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/patient/book"
                className="rounded-full bg-crimson px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-crimson-deep"
              >
                Book a consultation
              </Link>
              <Link
                href="/treatments/ketamine-therapy"
                className="rounded-full border border-paper/40 px-7 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-paper hover:text-indigo-deep"
              >
                Read more
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {FACTS.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={100 + i * 90}>
                <div className="h-full rounded-2xl border border-paper/15 bg-paper/[0.06] p-6 transition-colors hover:border-paper/30 hover:bg-paper/10">
                  <Icon className="h-8 w-8 text-paper/90" />
                  <p className="mt-4 font-semibold text-paper">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-paper/75">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
