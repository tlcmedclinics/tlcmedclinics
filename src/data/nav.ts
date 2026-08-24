import { GROUP_META, groupedPages, type ContentGroup } from "@/data/content";

/**
 * The public header's menu, built from the content files rather than typed out.
 *
 * This is the whole point of the file. A hand-written menu and a folder of
 * pages drift apart in one direction only: the menu keeps a link to a page
 * that was renamed, and the visitor gets a 404 from the navigation bar itself.
 * Deriving the dropdowns from `groupedPages` makes that impossible — every
 * sub-item here exists because a page exists, and a page that is deleted leaves
 * the menu the same day.
 *
 * The order is the order in the data files, which is a deliberate reading
 * order ("Mental Disorders" before the individual conditions it introduces),
 * not alphabetical.
 */

export type NavChild = {
  href: string;
  label: string;
};

/** A labelled block inside a dropdown — "Mental Health", "Skin & Aesthetic". */
export type NavSection = {
  heading: string | null;
  links: NavChild[];
};

export type NavItem = {
  href: string;
  /** i18n key for the top-level label, so the bar still translates. */
  labelKey: string;
  /** Used if the key is missing from the dictionary. */
  label: string;
  /** Present only on items that open a menu. */
  sections?: NavSection[];
  /**
   * How wide the dropdown should be. Conditions has twenty pages in two
   * sections and needs the room; Telemedicine has three and would look
   * abandoned in a panel that size.
   */
  width?: "sm" | "lg";
};

/** A group's pages, as dropdown sections, with an "everything" link on top. */
function sectionsFor(group: ContentGroup, allLabel: string): NavSection[] {
  const meta = GROUP_META[group];
  const sections = groupedPages(group).map((s) => ({
    heading: s.section,
    links: s.pages.map((p) => ({
      href: `${meta.href}/${p.slug}`,
      label: p.title,
    })),
  }));

  // The index page is listed first and by name. Without it the only way to
  // reach /conditions is to guess that the menu label itself is a link — true
  // here, but not something a visitor should have to discover.
  return [{ heading: null, links: [{ href: meta.href, label: allLabel }] }, ...sections];
}

export const navTree: NavItem[] = [
  { href: "/", labelKey: "nav.home", label: "Home" },
  {
    href: GROUP_META.telemedicine.href,
    labelKey: "nav.telemedicine",
    label: "Telemedicine",
    width: "sm",
    sections: sectionsFor("telemedicine", "Telemedicine overview"),
  },
  {
    href: GROUP_META.conditions.href,
    labelKey: "nav.conditions",
    label: "Conditions",
    width: "lg",
    sections: sectionsFor("conditions", "All conditions we treat"),
  },
  {
    href: GROUP_META.treatments.href,
    labelKey: "nav.treatments",
    label: "Treatments",
    width: "lg",
    sections: sectionsFor("treatments", "All treatments"),
  },
  {
    href: GROUP_META["what-to-expect"].href,
    labelKey: "nav.whatToExpect",
    label: "What to Expect",
    width: "sm",
    sections: sectionsFor("what-to-expect", "What to expect, in short"),
  },
  {
    href: GROUP_META.about.href,
    labelKey: "nav.about",
    label: "About Us",
    width: "sm",
    sections: [
      ...sectionsFor("about", "About the clinic"),
      {
        heading: null,
        links: [{ href: "/faq", label: "FAQ & Answers" }],
      },
    ],
  },
  { href: "/contact", labelKey: "nav.contact", label: "Contact Us" },
];
