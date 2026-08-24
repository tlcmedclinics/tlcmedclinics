/**
 * The clinic's written content, as data rather than as pages.
 *
 * Every informational page on the public site — conditions, treatments,
 * telemedicine, what to expect, about — is the same shape: a title, some
 * prose, some lists, sometimes a table. Written as thirty separate .tsx files
 * they drift: one gets a sidebar, another loses its breadcrumb, a third is
 * still using last year's phone number. Written as data they cannot, because
 * there is only one renderer.
 *
 * It also means the clinic can hand a writer this folder instead of a
 * codebase.
 */

export type Block =
  /** A paragraph. */
  | { kind: "p"; text: string }
  /** A sub-heading inside the page. */
  | { kind: "h"; text: string }
  /** A bulleted list. Each item may lead with a **bold** phrase. */
  | { kind: "ul"; items: string[] }
  /** A numbered list, for anything that is genuinely a sequence. */
  | { kind: "ol"; items: string[] }
  /** A highlighted aside — a fee, a caution, a "bring this with you". */
  | { kind: "note"; text: string }
  /** A two-column table: [label, value] rows with an optional caption. */
  | { kind: "table"; caption?: string; rows: [string, string][] };

export type ContentGroup =
  | "telemedicine"
  | "conditions"
  | "treatments"
  | "what-to-expect"
  | "about";

export type ContentPage = {
  /** URL segment. Must stay stable — these are indexed. */
  slug: string;
  title: string;
  /** One sentence, used for the meta description and the card blurb. */
  summary: string;
  group: ContentGroup;
  /** Optional grouping inside a group, e.g. "Common skin conditions". */
  section?: string;
  blocks: Block[];
};

/** Where each group lives, and what its index page is called. */
export const GROUP_META: Record<ContentGroup, { href: string; label: string }> = {
  telemedicine: { href: "/telemedicine", label: "Telemedicine" },
  conditions: { href: "/conditions", label: "Conditions" },
  treatments: { href: "/treatments", label: "Treatments" },
  "what-to-expect": { href: "/what-to-expect", label: "What to Expect" },
  about: { href: "/about", label: "About Us" },
};
