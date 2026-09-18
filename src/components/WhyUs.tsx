import { T } from "@/components/T";

/**
 * Four reasons, in whichever language the visitor chose.
 *
 * The copy used to live in a `points` array here, in English only, which meant
 * an Urdu reader got Urdu navigation wrapped around four English paragraphs.
 * It is in the dictionary now; this file holds the layout and the key names.
 */
const POINTS = [
  { title: "home.why.p1.title", body: "home.why.p1.body" },
  { title: "home.why.p2.title", body: "home.why.p2.body" },
  { title: "home.why.p3.title", body: "home.why.p3.body" },
  { title: "home.why.p4.title", body: "home.why.p4.body" },
];

export default function WhyUs() {
  return (
    <section className="bg-mist/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="eyebrow text-indigo">
          <T k="home.why.eyebrow" />
        </p>
        <h2 className="mt-3 max-w-xl h1 sm:text-4xl">
          <T k="home.why.title" />
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p) => (
            <div key={p.title} className="bg-paper p-6">
              <p className="h4 text-indigo-deep">
                <T k={p.title} />
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                <T k={p.body} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
