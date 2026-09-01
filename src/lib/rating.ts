/**
 * The patient satisfaction survey: five questions, each answered one to five.
 *
 * One module, imported by the form, by the API route that validates what the
 * form sends, and by the dashboards that average it. That is the point — a
 * survey whose questions live in the component and whose validation lives in
 * the route drifts the first time a question is added, and drifts silently,
 * because the route accepts an answer to a question nobody was asked.
 *
 * ── Why the five scores are averaged into `rating` ──
 *
 * There was already a single 1-5 rating on every appointment, and the admin
 * dashboard, the doctor's appointment list and the per-doctor rollup all read
 * it. Storing the five answers *and* their mean in the existing field means
 * none of that had to be rewritten to keep working, and every visit rated
 * under the old one-question form still counts in the same averages. The mean
 * is kept to two decimals: enough to tell 4.2 from 4.4, not so much that a
 * rounding difference looks like a real one.
 */

/** 1 = Very Poor, 5 = Excellent. */
export const RATING_SCALE = [1, 2, 3, 4, 5] as const;

export type RatingQuestionKey =
  | "care"
  | "listening"
  | "courtesy"
  | "efficiency"
  | "recommend";

export type RatingAnswers = Record<RatingQuestionKey, number>;

/**
 * The questions, in the order they are asked.
 *
 * `key` is what is stored on the appointment and must never change once
 * answers exist under it — renaming one orphans every answer already given.
 * The wording lives in the dictionary so it can be translated; `en` here is
 * the fallback the dictionary itself falls back to, and is what a reader sees
 * if the key is ever missing.
 */
export const RATING_QUESTIONS: {
  key: RatingQuestionKey;
  labelKey: string;
  en: string;
}[] = [
  {
    key: "care",
    labelKey: "rating.q.care",
    en: "How would you rate the quality of medical care you received?",
  },
  {
    key: "listening",
    labelKey: "rating.q.listening",
    en: "How well did our doctor and medical staff listen to and address your concerns?",
  },
  {
    key: "courtesy",
    labelKey: "rating.q.courtesy",
    en: "How would you rate the courtesy and professionalism of our staff?",
  },
  {
    key: "efficiency",
    labelKey: "rating.q.efficiency",
    en: "How satisfied were you with the waiting time and overall efficiency of your visit?",
  },
  {
    key: "recommend",
    labelKey: "rating.q.recommend",
    en: "How likely are you to recommend our practice to your family or friends?",
  },
];

export const RATING_QUESTION_KEYS: RatingQuestionKey[] = RATING_QUESTIONS.map(
  (q) => q.key
);

/** Dictionary keys for the five points of the scale, 1 → 5. */
export const RATING_SCALE_LABEL_KEYS: Record<number, string> = {
  1: "rating.scale.1",
  2: "rating.scale.2",
  3: "rating.scale.3",
  4: "rating.scale.4",
  5: "rating.scale.5",
};

/** English fallbacks for the same, used where no translator is in scope. */
export const RATING_SCALE_EN: Record<number, string> = {
  1: "Very Poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

function isScore(value: unknown): value is number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

/**
 * Validate whatever arrived over the wire.
 *
 * Returns the five answers, or null. Partial submissions are rejected rather
 * than filled in with a default: a missing answer averaged as 3 would be the
 * survey inventing an opinion the patient did not give, and it would move a
 * doctor's score.
 */
export function parseRatingAnswers(input: unknown): RatingAnswers | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const out = {} as RatingAnswers;
  for (const key of RATING_QUESTION_KEYS) {
    if (!isScore(raw[key])) return null;
    out[key] = Number(raw[key]);
  }
  return out;
}

/** The mean of the five answers, to two decimals. */
export function averageRating(answers: RatingAnswers): number {
  const total = RATING_QUESTION_KEYS.reduce((sum, key) => sum + answers[key], 0);
  return Math.round((total / RATING_QUESTION_KEYS.length) * 100) / 100;
}

/**
 * How many whole stars to fill, and whether the next one is half.
 *
 * 4.4 is four full stars and a half; 4.8 is five. Rounding to the nearest half
 * rather than flooring means a 4.9 does not display the same as a 4.1, which
 * is the complaint people have about star displays that truncate.
 */
export function starParts(value: number): { full: number; half: boolean } {
  const halves = Math.round(Math.max(0, Math.min(5, value)) * 2);
  return { full: Math.floor(halves / 2), half: halves % 2 === 1 };
}
