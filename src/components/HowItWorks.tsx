const steps = [
  {
    n: "1",
    title: "Book & confirm",
    body: "Pick a service and slot, then pay online to confirm instantly — or request a call-back and we'll confirm by phone.",
  },
  {
    n: "2",
    title: "Session opens at your time",
    body: "Your video or chat session unlocks on its own at the scheduled time. Running early or late? The clinic can start it for you either way.",
  },
  {
    n: "3",
    title: "Talk to your provider",
    body: "Meet with the same clinical team from your dashboard — no separate app or download needed.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="eyebrow text-indigo">How it works</p>
      <h2 className="mt-3 max-w-xl h1 sm:text-4xl">
        Three steps, start to finish.
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-deep font-display text-sm text-paper">
              {s.n}
            </span>
            <p className="mt-4 h4 text-ink">{s.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
