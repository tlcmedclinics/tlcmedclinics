import Reveal from "@/components/Reveal";
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
 */

/**
 * The elements a mind-body plan is built from. This used to be a single
 * exported diagram; as six labelled icons it stays legible on a phone, reads
 * correctly to a screen reader, and can be translated — none of which a
 * flattened PNG of a wheel could do.
 */
const PILLARS = [
  { Icon: BrainIcon, label: "Mindset & stress response" },
  { Icon: ClockIcon, label: "Sleep" },
  { Icon: DropletIcon, label: "Nutrition" },
  { Icon: HeartIcon, label: "Movement" },
  { Icon: UsersIcon, label: "Relationships" },
  { Icon: ShieldIcon, label: "Relaxation & breathing" },
];

const CONDITIONS_LEFT = [
  "Anxiety",
  "Depression",
  "Migraines",
  "Insomnia / sleep disorders",
  "Hypertension",
  "Psoriasis",
  "Atrial fibrillation / heart arrhythmias",
  "Cancer",
];

const CONDITIONS_RIGHT = [
  "Coronary artery disease",
  "Menopause symptoms",
  "Multiple sclerosis",
  "Chronic pain conditions — back and neck pain, fibromyalgia, headaches, osteoarthritis and TMJ",
  "Gastrointestinal conditions — GERD, irritable bowel syndrome (IBS), Crohn's disease and ulcerative colitis",
  "Rheumatoid arthritis and other autoimmune conditions",
];

export default function MindBody() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 className="h1 sm:text-4xl">Mind-Body Medicine at TLC Med Clinics</h2>

          <p className="mt-6 text-base leading-relaxed text-ink-soft">
            Mind-body medicine uses a range of practices to reduce the effects of
            stress, anxiety and depression on immune, endocrine and autonomic
            function. Our doctors carry out a detailed examination and start an
            individualised treatment plan. These interventions can reverse the
            negative health effects of chronic stress by lowering the level of
            stress hormones in the body.
          </p>

          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            Many studies have shown that these practices improve both physical
            and mental health.
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-paper-dim/50 p-6 sm:p-8">
          <p className="eyebrow text-indigo">What a plan is built from</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {PILLARS.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-paper p-4 text-sm leading-snug text-ink"
              >
                <Icon className="h-6 w-6 shrink-0 text-indigo" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <p className="font-semibold text-ink">
          Mind-body approaches can help with many medical and psychiatric
          conditions, including:
        </p>

        <div className="mt-5 grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {[CONDITIONS_LEFT, CONDITIONS_RIGHT].map((column, i) => (
            <ul key={i} className="space-y-2">
              {column.map((condition) => (
                <li
                  key={condition}
                  className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
                >
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
                  {condition}
                </li>
              ))}
            </ul>
          ))}
        </div>

        <p className="mt-6 text-sm text-ink-soft">
          There are several ways to learn mind-body skills. We offer individual
          skills-building during office visits — talk with your doctor about
          which approaches suit you best.
        </p>
      </Reveal>
    </section>
  );
}
