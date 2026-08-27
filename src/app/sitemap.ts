import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { absoluteUrl } from "@/lib/seo";
import { contentPages, GROUP_META } from "@/data/content";
import type { BlogPost, Service } from "@/types";

/**
 * Generated at /sitemap.xml.
 *
 * Services and blog posts live in Firestore and are added from the admin panel,
 * so a hand-written list would go stale the first time someone publishes a
 * post. This reads them instead.
 *
 * Rebuilt hourly rather than per-request: crawlers fetch a sitemap repeatedly,
 * and re-reading two collections on every hit would be a standing Firestore
 * bill for no benefit.
 */
export const revalidate = 3600;

/** The pages that exist regardless of what's in the database. */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "weekly", priority: 0.9 },
  { path: "/conditions", changeFrequency: "monthly", priority: 0.9 },
  { path: "/treatments", changeFrequency: "monthly", priority: 0.9 },
  { path: "/telemedicine", changeFrequency: "monthly", priority: 0.8 },
  { path: "/what-to-expect", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Both reads are wrapped. A sitemap that throws is a 500, and a crawler that
 * gets a 500 stops trusting the sitemap; a partial sitemap listing only the
 * static pages is strictly better than none, and the hourly rebuild repairs it
 * as soon as Firestore answers again.
 */
async function getServices(): Promise<Service[]> {
  try {
    const snap = await adminDb.collection("services").get();
    return snap.docs.map((d) => d.data() as Service);
  } catch (err) {
    console.error("[sitemap] services unavailable:", err);
    return [];
  }
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    // Equality on a single field only — no composite index required, so the
    // public sitemap keeps working even if firestore.indexes.json hasn't been
    // deployed. Ordering doesn't matter in a sitemap.
    const snap = await adminDb.collection("blogs").where("published", "==", true).get();
    return snap.docs.map((d) => d.data() as BlogPost);
  } catch (err) {
    console.error("[sitemap] blog posts unavailable:", err);
    return [];
  }
}

/** Firestore stores ISO strings; one bad value shouldn't take the sitemap down. */
function safeDate(value?: string): Date {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, posts] = await Promise.all([getServices(), getPosts()]);
  const now = new Date();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    // The informational pages — conditions, treatments, telemedicine, what to
    // expect, about. These are the pages that answer what people actually type
    // into a search box ("depression treatment Lahore", "PRP hair loss"), so
    // they are listed individually rather than left to be found through their
    // index page.
    ...contentPages.map((p) => ({
      url: absoluteUrl(`${GROUP_META[p.group].href}/${p.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...services
      .filter((s) => s.slug)
      .map((s) => ({
        url: absoluteUrl(`/services/${s.slug}`),
        lastModified: safeDate(s.updatedAt),
        changeFrequency: "monthly" as const,
        // Treatment pages are what people actually search for, so they rank
        // above the listing page they sit under.
        priority: 0.8,
      })),
    ...posts
      .filter((p) => p.slug)
      .map((p) => ({
        url: absoluteUrl(`/blog/${p.slug}`),
        lastModified: safeDate(p.updatedAt || p.createdAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}
