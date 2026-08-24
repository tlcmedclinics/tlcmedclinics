import type { Block } from "@/data/content";

/**
 * Renders one page's worth of content blocks.
 *
 * `**bold**` is supported inside paragraphs and list items, and nothing else.
 * A full markdown parser would be a dependency and an injection surface for a
 * page whose text is written by the clinic, not by a patient — and the only
 * emphasis this content actually uses is a lead-in phrase on a bullet.
 */

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

export default function ContentBlocks({ blocks }: { blocks: Block[] }) {
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
        }
      })}
    </div>
  );
}
