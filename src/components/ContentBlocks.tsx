import type { Block } from "@/data/content";
import type { Service } from "@/types";

/**
 * Renders one page's worth of content blocks.
 *
 * `**bold**` is supported inside paragraphs and list items, and nothing else.
 * A full markdown parser would be a dependency and an injection surface for a
 * page whose text is written by the clinic, not by a patient — and the only
 * emphasis this content actually uses is a lead-in phrase on a bullet.
 *
 * `services` is the live list from Firestore, passed in by ContentLayout. Only
 * the `prices` block needs it; a page without one is handed nothing and costs
 * no database read.
 */

const money = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

/** Lowercase, letters and digits only — for comparing names to slugs. */
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Finds the service a content page is asking for.
 *
 * Three attempts, and the second two exist because services reach Firestore by
 * two different routes. The seed script writes a clean slug — "botox-50-units".
 * The admin panel builds its own from the name and appends six characters of
 * the document id, so the same service added by hand is "botox-up-to-50-units-
 * a1b2c3". An exact match would find the first and miss the second, and the fee
 * table would come up empty on a page whose price is sitting right there in the
 * database.
 *
 *   1. the slug, exactly
 *   2. a slug that starts with it, which catches the admin panel's suffix
 *   3. every word of the slug appearing in the service's name
 *
 * Third is the loose one, and it is last for that reason.
 */
function findService(slug: string, services: Service[]): Service | undefined {
  const exact = services.find((s) => s.slug === slug);
  if (exact) return exact;

  const prefixed = services.find((s) => s.slug?.startsWith(`${slug}-`));
  if (prefixed) return prefixed;

  const words = normalise(slug.replace(/-/g, " ")).split(" ").filter(Boolean);
  return services.find((s) => {
    const name = normalise(s.name ?? "");
    return words.every((w) => name.includes(w));
  });
}

/** The services a `prices` block asks for, in the order it asked for them. */
function pickServices(
  block: Extract<Block, { kind: "prices" }>,
  services: Service[]
): Service[] {
  if (block.slugs) {
    // Mapped over the slugs rather than filtered over the services, so the
    // content file controls the order. One that matches nothing drops out
    // instead of leaving a blank row.
    return block.slugs
      .map((slug) => findService(slug, services))
      .filter((s): s is Service => Boolean(s));
  }
  if (block.category) {
    return services
      .filter((s) => s.category === block.category)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return services;
}

/** "60 minutes · PKR 5,000 to book" — whichever of the two the service has. */
function detailFor(service: Service): string | null {
  const parts: string[] = [];
  if (typeof service.durationMinutes === "number" && service.durationMinutes > 0) {
    parts.push(`${service.durationMinutes} minutes`);
  }
  if (
    typeof service.advancePayment === "number" &&
    typeof service.price === "number" &&
    service.advancePayment < service.price
  ) {
    parts.push(`${money(service.advancePayment)} to book`);
  }
  return parts.length ? parts.join(" · ") : null;
}

function Emphasised({ text }: { text: string }) {
  // Split on the delimiter and bold the odd-numbered pieces, which is what
  // sits between each pair of `**`.
  const parts = text.split("**");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function ContentBlocks({
  blocks,
  services = [],
}: {
  blocks: Block[];
  services?: Service[];
}) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h":
            return (
              <h2 key={i} className="pt-4 text-xl font-semibold text-ink sm:text-2xl">
                {block.text}
              </h2>
            );

          case "p":
            return (
              <p key={i} className="text-base leading-relaxed text-ink-soft">
                <Emphasised text={block.text} />
              </p>
            );

          case "ul":
            return (
              <ul key={i} className="space-y-2.5">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-relaxed text-ink-soft">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
                    <span>
                      <Emphasised text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={i} className="space-y-2.5">
                {block.items.map((item, n) => (
                  <li key={item} className="flex gap-3 text-base leading-relaxed text-ink-soft">
                    <span
                      aria-hidden
                      className="numeric mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo/10 text-xs font-semibold text-indigo"
                    >
                      {n + 1}
                    </span>
                    <span>
                      <Emphasised text={item} />
                    </span>
                  </li>
                ))}
              </ol>
            );

          case "note":
            return (
              <p
                key={i}
                className="rounded-2xl border-l-4 border-crimson bg-paper-dim/60 px-5 py-4 text-sm leading-relaxed text-ink-soft"
              >
                <Emphasised text={block.text} />
              </p>
            );

          case "table":
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-line">
                {block.caption && (
                  <p className="border-b border-line bg-paper-dim/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    {block.caption}
                  </p>
                )}
                <dl>
                  {block.rows.map(([label, value], row) => (
                    <div
                      key={label}
                      className={`flex flex-wrap items-baseline justify-between gap-3 px-5 py-3.5 ${
                        row > 0 ? "border-t border-line/70" : ""
                      }`}
                    >
                      <dt className="text-sm text-ink-soft">{label}</dt>
                      <dd className="numeric text-sm font-semibold text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );

          case "prices": {
            const rows = pickServices(block, services);

            // Firestore was unreachable, or the clinic hasn't added these
            // services yet. Saying so beats an empty bordered box, and beats
            // any figure this file could invent.
            if (rows.length === 0) {
              return (
                <p
                  key={i}
                  className="rounded-2xl border border-line bg-paper-dim/50 px-5 py-4 text-sm text-ink-soft"
                >
                  Current fees are on the booking page — please call the clinic
                  if you would like them confirmed first.
                </p>
              );
            }

            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-line">
                {block.caption && (
                  <p className="border-b border-line bg-paper-dim/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    {block.caption}
                  </p>
                )}
                <dl>
                  {rows.map((service, row) => {
                    const detail = detailFor(service);
                    return (
                      <div
                        key={service.id ?? service.slug}
                        className={`flex flex-wrap items-baseline justify-between gap-3 px-5 py-3.5 ${
                          row > 0 ? "border-t border-line/70" : ""
                        }`}
                      >
                        <dt className="text-sm text-ink-soft">
                          {service.name}
                          {detail && (
                            <span className="numeric mt-0.5 block text-xs text-ink-soft/70">
                              {detail}
                            </span>
                          )}
                        </dt>
                        <dd className="numeric text-sm font-semibold text-ink">
                          {typeof service.price === "number" ? money(service.price) : "—"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            );
          }
        }
      })}
    </div>
  );
}
