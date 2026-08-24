const points = [
  {
    title: "US-standard protocols",
    body: "Diagnosis and treatment plans modeled on American board-certified practice.",
  },
  {
    title: "One roof, three disciplines",
    body: "Mental health, ketamine therapy and skin care — coordinated by the same clinical team.",
  },
  {
    title: "Telemedicine built in",
    body: "Follow-up and ongoing care without always needing to visit in person.",
  },
  {
    title: "Transparent costs",
    body: "Costs discussed upfront, before any procedure is scheduled.",
  },
];

export default function WhyUs() {
  return (
    <section className="bg-mist/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="eyebrow text-indigo">Why TLC</p>
        <h2 className="mt-3 max-w-xl h1 sm:text-4xl">
          Care that reads your chart, not a script.
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title} className="bg-paper p-6">
              <p className="h4 text-indigo-deep">{p.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
