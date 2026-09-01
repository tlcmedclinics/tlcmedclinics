"use client";

import { useState, type CSSProperties } from "react";
import { useT } from "@/contexts/LanguageContext";
import {
  RATING_QUESTIONS,
  RATING_QUESTION_KEYS,
  RATING_SCALE,
  RATING_SCALE_EN,
  RATING_SCALE_LABEL_KEYS,
  averageRating,
  starParts,
  type RatingAnswers,
  type RatingQuestionKey,
} from "@/lib/rating";

/**
 * The patient satisfaction survey — five questions, five stars each.
 *
 * ── Why five questions instead of the one that was here ──
 *
 * "How was your session?" produces a number nobody can act on. Four stars
 * means the visit was good; it does not say whether the doctor was rushed,
 * the reception was cold, or the wait was forty minutes. The five questions
 * separate the things the clinic can actually change, which is the difference
 * between a score and a piece of feedback.
 *
 * The cost of asking five questions instead of one is that some patients will
 * abandon the form, so it is built to be finished in five taps: the stars are
 * sized for a thumb, the five rows are the whole form, and the comment box is
 * the only other thing on it and is optional.
 *
 * ── On not submitting a partial survey ──
 *
 * The button stays disabled until all five are answered, and the missing ones
 * are named. The alternative — send what we have, average the rest as neutral
 * — would have the form inventing opinions the patient never gave, and those
 * invented opinions would move a doctor's public score.
 *
 * ── A note on the class names in this file ──
 *
 * They are all classes already used elsewhere in the project. Tailwind only
 * builds the classes it finds in the source, and in this codebase one that
 * appears nowhere else has a habit of not being built until the dev server is
 * restarted — silently, so the component renders unstyled with no error. What
 * this component needs and nothing else does is written as an inline style.
 */

type Props = {
  onSubmit: (answers: RatingAnswers, comment: string) => Promise<void> | void;
};

/** Big enough to hit with a thumb, on a phone, first time. */
const STAR: CSSProperties = { fontSize: "1.6rem", lineHeight: 1 };

const STAR_BUTTON: CSSProperties = {
  padding: "0.15rem 0.1rem",
  // Stops a double-tap on a star zooming the page on iOS, which is what
  // happens when small tap targets sit next to each other.
  touchAction: "manipulation",
};

export default function RatingStars({ onSubmit }: Props) {
  const t = useT();
  const [answers, setAnswers] = useState<Partial<RatingAnswers>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showMissing, setShowMissing] = useState(false);

  /**
   * The dictionary returns the key itself when a string is missing, so this
   * turns that into the English wording rather than printing "rating.q.care"
   * at a patient. It matters on the very first deploy after a new question is
   * added, before the Urdu is written.
   */
  const text = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const scaleWord = (score: number) =>
    text(RATING_SCALE_LABEL_KEYS[score], RATING_SCALE_EN[score]);

  const answered = RATING_QUESTION_KEYS.filter((k) => answers[k]);
  const complete = answered.length === RATING_QUESTION_KEYS.length;

  if (done) {
    return (
      <p className="mt-3 text-xs font-medium text-indigo">{t("rating.thanks")}</p>
    );
  }

  function pick(key: RatingQuestionKey, score: number) {
    setAnswers((prev) => ({ ...prev, [key]: score }));
  }

  async function submit() {
    if (!complete) {
      setShowMissing(true);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(answers as RatingAnswers, comment);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-line/70 bg-mist/30 p-4">
      <p className="text-sm font-medium text-ink">{t("rating.title")}</p>
      <p className="mt-1 text-xs text-ink-soft">
        {t("rating.scaleHint", { low: scaleWord(1), high: scaleWord(5) })}
      </p>

      {RATING_QUESTIONS.map(({ key, labelKey, en }) => {
        const chosen = answers[key] ?? 0;
        return (
          <div key={key} className="mt-4">
            <p className="text-xs text-ink" id={`rating-${key}`}>
              {text(labelKey, en)}
            </p>

            <div
              role="radiogroup"
              aria-labelledby={`rating-${key}`}
              className="mt-1 flex flex-wrap items-center gap-1"
            >
              {RATING_SCALE.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={chosen === n}
                  onClick={() => pick(key, n)}
                  style={STAR_BUTTON}
                  aria-label={`${n} — ${scaleWord(n)}`}
                >
                  <span
                    style={STAR}
                    className={chosen >= n ? "text-crimson" : "text-line"}
                  >
                    ★
                  </span>
                </button>
              ))}

              {/* The word for the score they picked. A row of stars tells you
                  how many; it does not tell you that four means Good, which is
                  the whole reason the scale was written down. */}
              {chosen > 0 && (
                <span className="text-xs text-ink-soft">{scaleWord(chosen)}</span>
              )}
            </div>
          </div>
        );
      })}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={t("rating.commentPlaceholder")}
        className="input mt-4 resize-none text-sm"
      />

      {showMissing && !complete && (
        <p className="mt-2 text-xs text-crimson-deep">
          {t("rating.incomplete", {
            answered: answered.length,
            total: RATING_QUESTION_KEYS.length,
          })}
        </p>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="mt-3 rounded-full bg-crimson px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
      >
        {submitting ? t("rating.submitting") : t("rating.submit")}
      </button>
    </div>
  );
}

/**
 * A score, drawn as stars, read-only.
 *
 * The half star is the same glyph at low opacity rather than a clipped one.
 * A clipped half needs a positioned overlay and a second copy of the row, and
 * at this size — a line of a summary, not a headline — nobody can tell the
 * difference between half-filled and half-faded, but everybody can tell the
 * difference between 4.5 and 4.
 */
export function StarScore({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const { full, half } = starParts(value);
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className={className} title={`${value.toFixed(1)} / 5`}>
      <span className="text-crimson" aria-hidden>
        {"★".repeat(full)}
      </span>
      {half && (
        <span className="text-crimson" aria-hidden style={{ opacity: 0.45 }}>
          ★
        </span>
      )}
      <span className="text-line" aria-hidden>
        {"★".repeat(Math.max(0, empty))}
      </span>
    </span>
  );
}

/**
 * The five answers written out, for the doctor's and the admin's side.
 *
 * Shown as "Good" rather than "4": the number is what gets averaged, the word
 * is what gets read.
 */
export function RatingBreakdown({ answers }: { answers: RatingAnswers }) {
  const t = useT();
  const text = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  return (
    <div className="mt-2">
      {RATING_QUESTIONS.map(({ key, labelKey, en }) => {
        const score = answers[key];
        if (!score) return null;
        const word = text(RATING_SCALE_LABEL_KEYS[score], RATING_SCALE_EN[score]);
        return (
          <div key={key} className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <StarScore value={score} />
            <span>{word}</span>
            <span>{text(labelKey, en)}</span>
          </div>
        );
      })}
      <p className="mt-1 text-xs text-ink-soft">
        {t("rating.average", { value: averageRating(answers).toFixed(1) })}
      </p>
    </div>
  );
}
