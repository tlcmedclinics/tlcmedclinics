import Link from "next/link";
import { Bilingual, BilingualList } from "@/components/Bilingual";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import VitalsLine from "@/components/VitalsLine";
import JsonLd from "@/components/JsonLd";
import { pageMetadata, serviceSchema, breadcrumbSchema } from "@/lib/seo";
import type { Service } from "@/types";

// Treatment pages are the ones patients actually search for ("varicose veins
// treatment Lahore"), so they need to be fast and cacheable rather than
// re-queried on every request. An hour is well inside how often admin edits
// them.
export const revalidate = 3600;

async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const snap = await adminDb.collection("services").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Service;
  } catch (err) {
    console.error("[ServiceDetailPage] Failed to load service:", err);
    return null;
  }
}

async function getRelated(category: string, excludeId: string): Promise<Service[]> {
  try {
    const snap = await adminDb.collection("services").where("category", "==", category).get();
    return snap.docs
      .map((d) => d.data() as Service)
      .filter((s) => s.id !== excludeId);
  } catch (err) {
    console.error("[ServiceDetailPage] Failed to load related services:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return { title: "Service not found", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    // The city is in the title because that's how the search is typed —
    // "laser hair removal Lahore", not "laser hair removal".
    title: `${service.name} in Lahore`,
    description:
      service.short ||
      `${service.name} at TLC Med Clinics, Johar Town, Lahore — assessment, treatment options and what to expect.`,
    path: `/services/${service.slug}`,
    image: service.image,
    keywords: [
      `${service.name} Lahore`,
      `${service.name} treatment`,
      `${service.category} Lahore`,
      "TLC Med Clinics",
    ],
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const related = await getRelated(service.category, service.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 animate-fade-up">
      <JsonLd
        data={[
          serviceSchema(service),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
        ]}
      />

      <Link href="/services" className="text-sm text-indigo hover:text-indigo-deep">
        ← All services
      </Link>

      <p className="eyebrow mt-6 text-indigo">{service.category}</p>
      <h1 className="mt-3 h1-hero">
        <Bilingual en={service.name} ur={service.nameUr} />
      </h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      {service.intro && (
        <Bilingual
          en={service.intro}
          ur={service.introUr}
          className="mt-6 block max-w-2xl text-lg leading-relaxed text-ink-soft"
        />
      )}
      {typeof service.price === "number" && (
        <p className="mt-4 font-mono text-sm text-ink">
          Starting from <span className="text-indigo-deep">PKR {service.price.toLocaleString()}</span>
        </p>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {service.points.length > 0 && (
          <div>
            <h2 className="h4 text-indigo-deep">Good to know</h2>
            <BilingualList
              en={service.points}
              ur={service.pointsUr}
              className="mt-4 space-y-3"
              renderItem={(point, i) => (
                <li key={`${point}-${i}`} className="flex gap-3 text-sm text-ink-soft">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" />
                  {point}
                </li>
              )}
            />
          </div>
        )}

        {service.treatments.length > 0 && (
          <div>
            <h2 className="h4 text-indigo-deep">Treatments offered</h2>
            <BilingualList
              en={service.treatments}
              ur={service.treatmentsUr}
              className="mt-4 space-y-2"
              renderItem={(t, i) => (
                <li
                  key={`${t}-${i}`}
                  className="rounded-xl border border-line/70 bg-paper-dim/40 px-4 py-3 text-sm text-ink"
                >
                  {t}
                </li>
              )}
            />
          </div>
        )}
      </div>

      <div className="mt-12 rounded-2xl bg-mist/60 p-6 sm:p-8">
        <p className="h3 text-ink">Ready to book {service.name}?</p>
        <p className="mt-2 text-sm text-ink-soft">
          {typeof service.price === "number" ? (
            <>
              <span className="numeric font-medium text-ink">
                PKR {service.price.toLocaleString()}
              </span>
              {typeof service.advancePayment === "number" &&
                service.advancePayment < service.price && (
                  <>
                    {" · "}
                    <span className="numeric">
                      PKR {service.advancePayment.toLocaleString()}
                    </span>{" "}
                    to hold the appointment, balance at the clinic
                  </>
                )}
              {typeof service.durationMinutes === "number" && service.durationMinutes > 0 && (
                <>
                  {" · "}
                  <span className="numeric">{service.durationMinutes} minutes</span>
                </>
              )}
            </>
          ) : (
            <>Book a consultation and we&apos;ll walk you through what to expect.</>
          )}
        </p>
        {/* Carries the slug, so the booking page opens with this treatment
            already selected. This used to point at /contact, which dropped the
            patient into a general enquiry form and threw away the one decision
            they had already made. */}
        <Link
          href={`/patient/book?service=${encodeURIComponent(service.slug)}`}
          className="mt-5 inline-block rounded-full bg-indigo px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-indigo-deep"
        >
          Book this appointment
        </Link>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="h4 text-indigo-deep">
            Related in {service.category}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {related.map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.slug}`}
                className="rounded-xl border border-line/70 px-4 py-3.5 text-sm text-ink transition-colors hover:border-indigo/40 hover:text-indigo-deep"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
