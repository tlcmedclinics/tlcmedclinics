import { testimonials } from "@/data/site";

function Stars() {
  return (
    <div className="flex gap-0.5 text-crimson" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M10 1.5 12.6 7l6 .9-4.3 4.2 1 6-5.3-2.8L4.7 18l1-6L1.4 7.9l6-.9z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-indigo-deep py-20 text-paper">
      <div className="mx-auto max-w-6xl px-6">
        <p className="eyebrow text-crimson">Patient reviews</p>
        <h2 className="mt-3 h1 sm:text-4xl">What patients say</h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-paper/10 bg-paper/5 p-6"
            >
              <Stars />
              <blockquote className="mt-3 h4 leading-snug text-paper/95">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-4 text-sm text-paper/60">
                {t.name} · {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
