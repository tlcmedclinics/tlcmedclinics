import type { Metadata } from "next";
import { site } from "@/data/site";

/**
 * Everything the site tells search engines and social networks about itself.
 *
 * Two things live here. First, how a page builds its `<head>`: canonical URL,
 * OpenGraph card, Twitter card. Second, the structured data (JSON-LD) that lets
 * Google understand *what* a page is — a clinic, a treatment, an article —
 * rather than inferring it from the prose.
 *
 * It's one file on purpose. Canonicals and OpenGraph images must be absolute
 * URLs, and the most common SEO bug is one page building that URL slightly
 * differently from another (trailing slash, http vs https, preview domain vs
 * production). Every page calling the same helper makes that impossible.
 */

/**
 * The site's public origin, without a trailing slash.
 *
 * Read from the environment so a preview deployment doesn't publish canonical
 * tags pointing at production — that would tell Google the preview *is*
 * production, and can quietly de-index the real pages.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  "https://tlcmedclinics.com"
).replace(/\/+$/, "");

/** Turns "/services/varicose-veins" into a full https:// URL. */
export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The card shown when a link is pasted into WhatsApp, Facebook or LinkedIn.
 * 1200×630 is the size all of them crop to.
 */
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.tagline}`,
};

const DEFAULT_KEYWORDS = [
  "TLC Med Clinics",
  "clinic in Lahore",
  "vein clinic Lahore",
  "varicose veins treatment Lahore",
  "skin specialist Lahore",
  "dermatologist Johar Town",
  "psychiatrist Lahore",
  "mental health Lahore",
  "online doctor Pakistan",
  "telemedicine Pakistan",
];

type PageMeta = {
  /** Page title WITHOUT the site name — the layout template appends it. */
  title: string;
  description: string;
  /** Route path, e.g. "/services/varicose-veins". Becomes the canonical URL. */
  path: string;
  /** Absolute or root-relative image for the social card. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  /** Keeps a page out of the index — auth screens, thank-you pages. */
  noIndex?: boolean;
};

/**
 * Builds a page's metadata with a canonical URL and matching social cards.
 *
 * The canonical is the important part: services and blog posts are reachable
 * with query strings and from several internal links, and without one Google
 * treats those as separate pages competing with each other.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  keywords,
  noIndex,
}: PageMeta): Metadata {
  const url = absoluteUrl(path);
  const images = image ? [{ url: image, alt: title }] : [OG_IMAGE];

  return {
    title,
    description,
    keywords: keywords ?? undefined,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      url,
      siteName: site.name,
      locale: "en_PK",
      title: `${title} — ${site.name}`,
      description,
      images,
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${site.name}`,
      description,
      images: images.map((i) => i.url),
    },
  };
}

/** The root metadata — title template and the defaults every page inherits. */
export function rootMetadata(): Metadata {
  const title = `${site.name} — Vein, Skin & Mental Health Care in Lahore`;

  return {
    // Without this, relative URLs in metadata (og:image, canonical) stay
    // relative — and crawlers ignore relative social images.
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      // Pages set a short title; the site name is appended once, here.
      template: `%s — ${site.name}`,
    },
    description: site.description,
    applicationName: site.name,
    keywords: DEFAULT_KEYWORDS,
    authors: [{ name: site.name, url: SITE_URL }],
    creator: site.name,
    publisher: site.name,
    category: "health",
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: site.name,
      locale: "en_PK",
      title,
      description: site.description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: site.description,
      images: [OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        // Lets Google show a full-size thumbnail and a long snippet instead of
        // the truncated default — measurably better click-through on health
        // queries, where people read the snippet before deciding.
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    // Only emitted when the value is set, so the tag never renders empty.
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
    // Stops iOS Safari turning every number in a medical page — doses, dates,
    // prices — into a blue phone link.
    formatDetection: { telephone: false, address: false, email: false },
  };
}

/* ------------------------------------------------------------------ *
 * Structured data
 *
 * These return plain objects; <JsonLd> serialises them. The vocabulary is
 * schema.org, and Google's Rich Results test is what to validate against.
 * ------------------------------------------------------------------ */

const CLINIC_ID = `${SITE_URL}/#clinic`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * The clinic itself. `MedicalClinic` is a subtype of LocalBusiness, so this one
 * object feeds both the local pack ("clinic near me") and the knowledge panel.
 * Emitted once, site-wide, from the root layout.
 */
export function clinicSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": CLINIC_ID,
    name: site.name,
    alternateName: site.shortName,
    description: site.description,
    url: SITE_URL,
    telephone: site.phoneE164,
    email: site.email,
    image: absoluteUrl(OG_IMAGE.url),
    logo: absoluteUrl("/images/logo-full.png"),
    priceRange: "PKR",
    currenciesAccepted: "PKR",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.addressParts.street,
      addressLocality: site.addressParts.city,
      addressRegion: site.addressParts.region,
      addressCountry: site.addressParts.country,
    },
    ...(site.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: site.geo.latitude,
            longitude: site.geo.longitude,
          },
        }
      : {}),
    openingHoursSpecification: site.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: [
      { "@type": "City", name: "Lahore" },
      { "@type": "Country", name: "Pakistan" },
    ],
    availableService: [
      { "@type": "MedicalTherapy", name: "Vein care" },
      { "@type": "MedicalTherapy", name: "Skin care" },
      { "@type": "MedicalTherapy", name: "Mental health care" },
    ],
    medicalSpecialty: ["Dermatology", "Psychiatry", "VascularSurgery"],
    employee: {
      "@type": "Physician",
      name: site.doctor.name,
      jobTitle: site.doctor.title,
      description: site.doctor.bio,
    },
    // Telemedicine is a real differentiator and Google surfaces it as an
    // attribute on the listing, so it's worth stating outright.
    availableChannel: {
      "@type": "ServiceChannel",
      name: "Telemedicine",
      serviceUrl: absoluteUrl("/contact"),
    },
    ...(site.socials.length > 0 ? { sameAs: site.socials } : {}),
  };
}

/** The site as a whole — mainly so Google prints the right name in results. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: site.name,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": CLINIC_ID },
  };
}

/**
 * The "Home › Services › Varicose Veins" trail Google prints under a result
 * instead of the bare URL.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * A single treatment page.
 *
 * `MedicalWebPage` rather than `Service`, because these pages describe a
 * condition and how it's treated — which is what Google's health-content
 * handling expects — and it lets the page declare which clinic provides it.
 */
export function serviceSchema(service: {
  name: string;
  slug: string;
  short: string;
  intro?: string;
  category: string;
  price?: number;
  treatments?: string[];
}) {
  const url = absoluteUrl(`/services/${service.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${url}#page`,
    url,
    name: service.name,
    description: service.intro || service.short,
    inLanguage: "en",
    about: {
      "@type": "MedicalCondition",
      name: service.name,
      ...(service.treatments && service.treatments.length > 0
        ? {
            possibleTreatment: service.treatments.map((t) => ({
              "@type": "MedicalTherapy",
              name: t,
            })),
          }
        : {}),
    },
    mainEntity: {
      "@type": "MedicalProcedure",
      name: service.name,
      howPerformed: service.intro || service.short,
      ...(typeof service.price === "number"
        ? {
            offers: {
              "@type": "Offer",
              price: service.price,
              priceCurrency: "PKR",
              availability: "https://schema.org/InStock",
              url: absoluteUrl("/contact"),
            },
          }
        : {}),
    },
    provider: { "@id": CLINIC_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/** One blog post, so it can appear as an article rather than a plain link. */
export function blogPostingSchema(post: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: url,
    headline: post.title.slice(0, 110), // Google truncates past ~110 chars.
    description: post.excerpt,
    image: [absoluteUrl(post.coverImage || OG_IMAGE.url)],
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    inLanguage: "en",
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@id": CLINIC_ID },
  };
}

/** The FAQ block on /about — eligible for an expandable result in Google. */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
