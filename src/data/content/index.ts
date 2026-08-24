import { telemedicinePages } from "./telemedicine";
import { conditionPages } from "./conditions";
import { treatmentPages } from "./treatments";
import { expectPages } from "./expect";
import { aboutPages } from "./about";
import type { ContentGroup, ContentPage } from "./types";

export * from "./types";

/** Every informational page on the public site, in one list. */
export const contentPages: ContentPage[] = [
  ...telemedicinePages,
  ...conditionPages,
  ...treatmentPages,
  ...expectPages,
  ...aboutPages,
];

export function pagesInGroup(group: ContentGroup): ContentPage[] {
  return contentPages.filter((p) => p.group === group);
}

export function findPage(group: ContentGroup, slug: string): ContentPage | undefined {
  return contentPages.find((p) => p.group === group && p.slug === slug);
}

/**
 * A group's pages arranged under their section headings, in the order the
 * sections first appear. Pages with no section come first, unheaded.
 *
 * Insertion order rather than alphabetical: the order in the data files is a
 * deliberate reading order — "Mental Disorders" before the individual
 * conditions it introduces — and sorting would scatter that.
 */
export function groupedPages(group: ContentGroup): { section: string | null; pages: ContentPage[] }[] {
  const out: { section: string | null; pages: ContentPage[] }[] = [];

  for (const page of pagesInGroup(group)) {
    const section = page.section ?? null;
    const existing = out.find((s) => s.section === section);
    if (existing) existing.pages.push(page);
    else out.push({ section, pages: [page] });
  }

  return out;
}
