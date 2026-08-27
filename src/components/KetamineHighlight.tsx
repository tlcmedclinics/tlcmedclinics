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

/**
 * The colour of this band is set inline, on purpose.
 *
 * It took three attempts to get any colour onto it at all. First
 * `bg-ketamine`, a Tailwind utility from a new @theme token: the token was
 * correct and the utility was never generated, because the dev server's class
 * list had already been cached. Then `.band-ketamine`, a plain rule in
 * globals.css: correct too, and the browser was still holding the previous
 * stylesheet. Both failures looked identical and both were silent — a white
 * band with white text on it, findable only by selecting the words with a
 * mouse.
 *
 * So the colour travels in the component's own HTML. Nothing has to be
 * compiled, scanned or re-fetched for it to exist, and everything else here
 * uses `white`, `ink` and the existing green tokens, which Tailwind has always
 * generated.
 *
 * ── Why light, and why this solves the original problem ──
 * The section needed to stand apart from the hero above it and the footer
 * below, both of which are deep green. The first answer was a near-black
 * crimson band, which stood apart and read as sombre — wrong for the one
 * treatment this clinic wants people to feel hopeful about.
 *
 * Light green does the same job by the opposite route. Hero dark, this pale,
 * footer dark: the separation comes from weight rather than hue, which is a
 * stronger signal than a colour change and keeps the page one family. It also
 * lets the words be dark on light, which is how the rest of the site reads.
 */
export default function KetamineHighlight() {
  return (
    <section
      style={{ backgroundColor: "#d8ebe1" }}
      className="relative overflow-hidden"
    >
      {/* A hairline of brand red along the top edge — the one mark that ties
          this pale band back to the logo. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-crimson" />

      {/* Faint arcs, drawn rather than photographed. Enough to stop the panel
          reading as a flat wash without competing with the type. Darkened
          rather than lightened now that the ground is pale — white on white
          would be nothing at all. */}
      <div
        aria-hidden
        style={{
          background:
            "radial-gradient(38rem 38rem at 88% 20%, rgba(21,86,59,0.5), transparent 62%), radial-gradient(28rem 28rem at 6% 92%, rgba(21,86,59,0.5), transparent 60%)",
        }}
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
          <Reveal>
            <p className="eyebrow text-indigo-deep">Flagship programme</p>

            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              Ketamine Therapy for Depression
              <span className="block text-indigo-deep">and other Mood Disorders</span>
            </h2>

            <VitalsLine className="mt-6 h-3 w-40" color="var(--crimson)" />

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
              A personalised approach to mental health treatment, with ketamine
              infusion for depression, suicidal thinking, post-traumatic stress
              disorder (PTSD), anxiety disorders, postpartum depression,
              obsessive-compulsive disorder (OCD), chronic pain, substance abuse
              disorders, and other mood disorders.
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              Ours is the first clinic of its kind in Lahore, run and supervised
              by U.S. board certified physicians — safe, effective, world-class
              treatment with the best outcomes.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/patient/book"
                className="rounded-full bg-crimson px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-crimson-deep"
              >
                Book a consultation
              </Link>
              <Link
                href="/treatments/ketamine-therapy"
                className="rounded-full border border-indigo-deep/35 px-7 py-3.5 text-sm font-medium text-indigo-deep transition-colors hover:bg-white"
              >
                Read more
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {FACTS.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={100 + i * 90}>
                {/* Solid white cards on the tint, rather than a tint on a
                    tint. On a pale ground a translucent card is barely a card;
                    white gives each fact its own edge. */}
                <div className="h-full rounded-2xl border border-white bg-white p-6 shadow-[0_10px_28px_-24px_rgba(21,86,59,0.6)] transition-shadow hover:shadow-[0_14px_34px_-22px_rgba(21,86,59,0.7)]">
                  <Icon className="h-8 w-8 text-indigo" />
                  <p className="mt-4 font-semibold text-ink">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
