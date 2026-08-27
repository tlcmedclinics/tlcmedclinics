"use client";

import Reveal from "@/components/Reveal";
import { useT } from "@/contexts/LanguageContext";
import {
  AftercareIcon,
  BookIcon,
  ConsultIcon,
  SessionIcon,
} from "@/components/StepIcons";

/**
 * How a booking actually goes, in four steps.
 *
 * It was three numbered circles. The numbers told a reader there was an order
 * and nothing else — every step looked identical, so the section had to be read
 * word by word to be understood at all, which on a home page means it was not
 * read.
 *
 * Each step now has an icon that performs its own verb: a date is picked and
 * ticked, a clock reaches the hour, a call connects, a plan is written. Someone
 * scanning gets the sequence from the pictures and reads the words only if they
 * want the detail. The animations are in globals.css and stop entirely for a
 * reader who has asked their system for reduced motion.
 *
 * A fourth step was added because the old three ended at "talk to your
 * provider", which is not where a patient's experience ends. What happens
 * afterwards — the notes, the prescription, the follow-up — is the part people
 * are least sure about before a first appointment, and leaving it out did not
 * make the uncertainty go away.
 */

const STEPS = [
  { key: "book", Icon: BookIcon },
  { key: "session", Icon: SessionIcon },
  { key: "consult", Icon: ConsultIcon },
  { key: "aftercare", Icon: AftercareIcon },
] as const;

export default function HowItWorks() {
  const t = useT();

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <p className="eyebrow text-indigo">{t("how.eyebrow")}</p>
        <h2 className="mt-3 max-w-xl h1 sm:text-4xl">{t("how.title")}</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
          {t("how.lede")}
        </p>
      </Reveal>

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ key, Icon }, i) => (
          <Reveal key={key} delay={i * 110}>
            <div className="group flex h-full flex-col rounded-2xl border border-line/70 bg-paper p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo/30 hover:shadow-[0_18px_40px_-30px_rgba(21,86,59,0.55)]">
              {/* Icon left, step number right, on one flex row.
                  This was an absolutely-positioned number behind the icon,
                  which on a card this narrow landed directly on top of it —
                  a "1" printed across the calendar. Watermarks need room to be
                  watermarks; there isn't any here, so the number takes its own
                  place in the layout and cannot collide with anything. */}
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-indigo/[0.07] text-indigo">
                  <Icon />
                </span>
                <span
                  aria-hidden
                  className="numeric text-sm font-semibold text-ink-soft/40"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <p className="mt-5 h4 text-ink">{t(`how.${key}.title`)}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {t(`how.${key}.body`)}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
