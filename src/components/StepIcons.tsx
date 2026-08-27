"use client";

/**
 * The four "how it works" icons, each drawn so that its own animation says
 * what the step does.
 *
 * Motion here is doing a job, not decorating. A patient scanning three panels
 * reads the pictures before the paragraphs, and a calendar with a tick landing
 * on it says "booked and confirmed" faster than the sentence underneath. The
 * rule each icon follows: one idea, one movement, and the movement is the verb.
 *
 * ── Two constraints these are built around ──
 *
 * 1. `prefers-reduced-motion`. Some people set it because motion makes them
 *    ill, and this is a psychiatry clinic — a page that ignores it is a page
 *    that hurts a fraction of exactly the audience it is for. Every animation
 *    below sits inside that media query and the icons are drawn correctly in
 *    their finished state without it. Nothing is only visible while moving.
 *
 * 2. CSS, not a library. A Lottie player is ~250KB to move four small shapes,
 *    and it renders nothing at all until its JSON has downloaded — so on the
 *    connection this clinic's patients actually have, the animated version of
 *    the page is the one with three blank squares on it.
 *
 * The animations are slow on purpose: 2.5–4s cycles with long pauses. A quick
 * loop reads as a loading spinner and pulls the eye away from the words.
 */

const svg = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-7 w-7",
};

/** Step 1 — a calendar, with a date filling in and a tick landing on it. */
export function BookIcon() {
  return (
    <svg {...svg}>
      <rect x="7" y="11" width="34" height="30" rx="4" />
      <path d="M7 19h34M17 7v8M31 7v8" />
      {/* The chosen day. Fills, then the tick draws over it. */}
      <rect className="step-book-day" x="19" y="24" width="10" height="8" rx="2" />
      <path className="step-book-tick" d="m20.5 28.2 2.6 2.6 5-5.4" />
    </svg>
  );
}

/** Step 2 — a clock whose hand sweeps to the hour, then the session opens. */
export function SessionIcon() {
  return (
    <svg {...svg}>
      <circle cx="24" cy="25" r="15" />
      <path d="M24 6.5v3" />
      {/* Minute hand, sweeping. The transform origin is the dial's centre. */}
      <path className="step-clock-hand" d="M24 25v-8.5" />
      <path d="M24 25h6" opacity="0.55" />
      {/* The pulse that says the door has opened. */}
      <circle className="step-clock-ring" cx="24" cy="25" r="15" />
    </svg>
  );
}

/** Step 3 — a screen with a face on it, and a call connecting. */
export function ConsultIcon() {
  return (
    <svg {...svg}>
      <rect x="5" y="10" width="27" height="21" rx="3.5" />
      <path d="M13 39h11M18.5 31v8" />
      {/* The person on the call. */}
      <circle cx="18.5" cy="17.5" r="3.2" />
      <path d="M12.8 26a5.9 5.9 0 0 1 11.4 0" />
      {/* Signal arcs, rippling outward — the call going through. */}
      <path className="step-wave step-wave-1" d="M35 16.5a9 9 0 0 1 0 12" />
      <path className="step-wave step-wave-2" d="M39.5 12.5a15 15 0 0 1 0 20" />
    </svg>
  );
}

/**
 * Step 4 — a prescription pad with a heart resting on its corner.
 *
 * The heart was drawn at five units across on the first pass and rendered as a
 * blob: at the size this icon is actually used, the notch at the top of a heart
 * is a fraction of a pixel and simply fills in. It is nearly twice that now,
 * sitting over the pad's lower corner where there is room for it.
 */
export function AftercareIcon() {
  return (
    <svg {...svg}>
      <rect x="7" y="5" width="25" height="33" rx="3.5" />
      <path d="M13 14h13M13 20h13M13 26h7" />
      {/* Beats twice, then rests — a pulse, not a throb. */}
      <path
        className="step-heart"
        d="M33 41c-6.2-4.2-5.4-9.6-1.6-9.6 1.1 0 1.6 1 1.6 1s.5-1 1.6-1c3.8 0 4.6 5.4-1.6 9.6Z"
      />
    </svg>
  );
}
