import Link from "next/link";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import VitalsLine from "@/components/VitalsLine";
import JsonLd from "@/components/JsonLd";
import { pageMetadata, breadcrumbSchema, absoluteUrl } from "@/lib/seo";
import type { Service } from "@/types";

export const metadata: Metadata = pageMetadata({
  title: "Services — Vein, Skin & Mental Health Treatment in Lahore",
  description:
    "Vein care, skin care and mental health treatment at TLC Med Clinics, Johar Town, Lahore. Browse the conditions we treat, what each treatment involves, and starting prices.",
  path: "/services",
});

// Was `force-dynamic`, which re-read the whole services collection on every
// visit — including every crawler hit — and meant the page could never be
// served from cache. Services change when an admin edits them, so an hourly
// rebuild is fresh enough and far faster for patients, which Google measures
// directly as a ranking signal.
export const revalidate = 3600;

async function getServices(): Promise<Service[]> {
  try {
    const snap = await adminDb.collection("services").orderBy("order", "asc").get();
    return snap.docs.map((d) => d.data() as Service);
  } catch (err) {
    console.error("[ServicesPage] Failed to load services:", err);
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();
  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
          // An explicit list tells Google these are the clinic's treatments,
          // and often earns sitelinks under the main result.
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Treatments at TLC Med Clinics",
            itemListElement: services.slice(0, 30).map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.name,
              url: absoluteUrl(`/services/${s.slug}`),
            })),
          },
        ]}
      />

      <p className="eyebrow text-indigo">What we treat</p>
      <h1 className="mt-3 h1-hero">Services</h1>
      <VitalsLine className="mt-5 h-3 w-40" />
      <p className="mt-5 max-w-lg text-ink-soft">
        Every plan starts with a proper diagnosis. Choose a category below to see
        conditions we treat and how.
      </p>

      {services.length === 0 ? (
        <p className="mt-14 text-sm text-ink-soft">
          Services are being updated — please check back shortly, or call the clinic.
        </p>
      ) : (
        <div className="mt-14 space-y-16">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="h2 text-indigo-deep">{category}</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {services
                  .filter((s) => s.category === category)
                  .map((s, i) => (
                    <Link
                      key={s.id}
                      href={`/services/${s.slug}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                      className="group card-hover animate-fade-up rounded-2xl border border-line/70 p-6 transition-colors hover:border-indigo/40 hover:bg-paper-dim/40"
                    >
                      {/* h3 under the category's h2 — heading levels are how a
                          crawler reads the page's structure. */}
                      <h3 className="h4 text-ink group-hover:text-indigo-deep">
                        {s.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.short}</p>
                      {typeof s.price === "number" && (
                        <p className="mt-3 font-mono text-xs text-ink-soft">
                          From PKR {s.price.toLocaleString()}
                        </p>
                      )}
                      <span className="mt-4 inline-block text-sm font-medium text-indigo">
                        Learn more →
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
