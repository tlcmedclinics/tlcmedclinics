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

/**
 * ── The `Ur` twins ──
 *
 * Every field a patient reads has an optional Urdu sibling. Optional, not
 * required, and that is the whole design: a page whose Urdu has not been
 * written yet renders in English rather than blank, so the site is never broken
 * by a translation being half done. `lib/bilingual.ts` decides which to show
 * and falls back silently.
 *
 * A list is the one place the fallback is all-or-nothing — see `pickList`. A
 * list that is half Urdu and half English, interleaved by index, reads as a
 * mistake rather than as a translation in progress.
 */
export type Block =
  /** A paragraph. */
  | { kind: "p"; text: string; textUr?: string }
  /** A sub-heading inside the page. */
  | { kind: "h"; text: string; textUr?: string }
  /** A bulleted list. Each item may lead with a **bold** phrase. */
  | { kind: "ul"; items: string[]; itemsUr?: string[] }
  /** A numbered list, for anything that is genuinely a sequence. */
  | { kind: "ol"; items: string[]; itemsUr?: string[] }
  /** A highlighted aside — a fee, a caution, a "bring this with you". */
  | { kind: "note"; text: string; textUr?: string }
  /** A two-column table: [label, value] rows with an optional caption. */
  | {
      kind: "table";
      caption?: string;
      captionUr?: string;
      rows: [string, string][];
      rowsUr?: [string, string][];
    }
  /**
   * A fee table built from the live services in Firestore.
   *
   * Never write a price into this folder. Fees used to be typed into these
   * files as plain `table` rows, and they drifted the moment the clinic changed
   * one in the admin panel — at one point the Costs page said an initial
   * evaluation was PKR 4,000 while the Ketamine page said PKR 3,000 for the
   * same appointment, and the booking form charged a third figure. A patient
   * can screenshot the cheapest one.
   *
   * Name the services instead and the price comes from wherever it is edited.
   * A slug that no longer exists is skipped rather than shown as blank.
   */
  | {
      kind: "prices";
      caption?: string;
      captionUr?: string;
      /** Specific services, in the order given. */
      slugs?: string[];
      /** Or every service in a category, in the clinic's own ordering. */
      category?: string;
    };

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
  titleUr?: string;
  /**
   * One sentence, used for the meta description and the card blurb.
   *
   * `summary` stays the meta description in both languages — that is rendered
   * on the server into static HTML before anyone has chosen a language, and it
   * is what Google indexes. `summaryUr` is for the card the patient reads.
   */
  summary: string;
  summaryUr?: string;
  group: ContentGroup;
  /** Optional grouping inside a group, e.g. "Common skin conditions". */
  section?: string;
  sectionUr?: string;
  blocks: Block[];
};

/** Where each group lives, and what its index page is called. */
export const GROUP_META: Record<
  ContentGroup,
  { href: string; label: string; labelUr: string }
> = {
  telemedicine: { href: "/telemedicine", label: "Telemedicine", labelUr: "ٹیلی میڈیسن" },
  conditions: { href: "/conditions", label: "Conditions", labelUr: "امراض" },
  treatments: { href: "/treatments", label: "Treatments", labelUr: "علاج" },
  "what-to-expect": {
    href: "/what-to-expect",
    label: "What to Expect",
    labelUr: "کیا توقع رکھیں",
  },
  about: { href: "/about", label: "About Us", labelUr: "ہمارے بارے میں" },
};
