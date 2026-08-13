"use client";

import { useState } from "react";

type Props = {
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
};

export default function RatingStars({ onSubmit }: Props) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-xs font-medium text-indigo">Thanks for your feedback!</p>;
  }

  return (
    <div className="mt-3 rounded-xl border border-line/70 bg-mist/30 p-4">
      <p className="text-xs font-medium text-ink">How was your session?</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-xl leading-none"
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          >
            <span className={(hover || value) >= n ? "text-crimson" : "text-line"}>★</span>
          </button>
        ))}
      </div>
      {value > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Anything you'd like to add (optional)"
            className="input mt-3 resize-none text-sm"
          />
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              await onSubmit(value, comment);
              setSubmitting(false);
              setDone(true);
            }}
            className="mt-2 rounded-full bg-crimson px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit rating"}
          </button>
        </>
      )}
    </div>
  );
}
