import Reveal from "@/components/Reveal";
import { T } from "@/components/T";
import {
  BrainIcon,
  ClockIcon,
  DropletIcon,
  HeartIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/Icons";

/**
 * Mind-body medicine, and the conditions it helps with.
 *
 * The list is long and stays long. Someone scanning this page is usually
 * looking for one word — their own condition — and a trimmed "selected
 * highlights" version fails exactly the person it was shortened for.
 *
 * That is also the reason every condition name is now a dictionary key rather
 * than an English string: the person scanning for their own condition is
 * exactly the person least able to scan for it in a second language.
 */

/**
 * The elements a mind-body plan is built from. This used to be a single
 * exported diagram; as six labelled icons it stays legible on a phone, reads
 * correctly to a screen reader, and can be translated — none of which a
 * flattened PNG of a wheel could do.
 */
const PILLARS = [
  { Icon: BrainIcon, key: "home.mind.pillar.mindset" },
  { Icon: ClockIcon, key: "home.mind.pillar.sleep" },
  { Icon: DropletIcon, key: "home.mind.pillar.nutrition" },
  { Icon: HeartIcon, key: "home.mind.pillar.movement" },
  { Icon: UsersIcon, key: "home.mind.pillar.relationships" },
  { Icon: ShieldIcon, key: "home.mind.pillar.relaxation" },
];

const CONDITIONS_LEFT = [
  "home.mind.cond.anxiety",
  "home.mind.cond.depression",
  "home.mind.cond.migraines",
  "home.mind.cond.insomnia",
  "home.mind.cond.hypertension",
  "home.mind.cond.psoriasis",
  "home.mind.cond.afib",
  "home.mind.cond.cancer",
];

const CONDITIONS_RIGHT = [
  "home.mind.cond.cad",
  "home.mind.cond.menopause",
  "home.mind.cond.ms",
  "home.mind.cond.chronicPain",
  "home.mind.cond.gi",
  "home.mind.cond.autoimmune",
];

export default function MindBody() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 className="h1 sm:text-4xl">
            <T k="home.mind.title" />
          </h2>

          <p className="mt-6 text-base leading-relaxed text-ink-soft">
            <T k="home.mind.p1" />
          </p>

          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            <T k="home.mind.p2" />
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-paper-dim/50 p-6 sm:p-8">
          <p className="eyebrow text-indigo">
            <T k="home.mind.pillars.title" />
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {PILLARS.map(({ Icon, key }) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-2xl bg-paper p-4 text-sm leading-snug text-ink"
              >
                <Icon className="h-6 w-6 shrink-0 text-indigo" />
                <T k={key} />
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <p className="font-semibold text-ink">
          <T k="home.mind.conditions.title" />
        </p>

        <div className="mt-5 grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {[CONDITIONS_LEFT, CONDITIONS_RIGHT].map((column, i) => (
            <ul key={i} className="space-y-2">
              {column.map((key) => (
                <li
                  key={key}
                  className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
                >
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
                  <T k={key} />
                </li>
              ))}
            </ul>
          ))}
        </div>

        <p className="mt-6 text-sm text-ink-soft">
          <T k="home.mind.note" />
        </p>
      </Reveal>
    </section>
  );
}
