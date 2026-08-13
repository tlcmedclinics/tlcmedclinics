import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import VitalsLine from "@/components/VitalsLine";
import type { Service } from "@/types";

export const dynamic = "force-dynamic";

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
  if (!service) return {};
  return {
    title: `${service.name} — TLC Med Clinics`,
    description: service.short,
  };
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
      <Link href="/services" className="text-sm text-indigo hover:text-indigo-deep">
        ← All services
      </Link>

      <p className="eyebrow mt-6 text-indigo">{service.category}</p>
      <h1 className="mt-3 h1-hero">{service.name}</h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      {service.intro && (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{service.intro}</p>
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
            <ul className="mt-4 space-y-3">
              {service.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-ink-soft">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {service.treatments.length > 0 && (
          <div>
            <h2 className="h4 text-indigo-deep">Treatments offered</h2>
            <ul className="mt-4 space-y-2">
              {service.treatments.map((t) => (
                <li
                  key={t}
                  className="rounded-xl border border-line/70 bg-paper-dim/40 px-4 py-3 text-sm text-ink"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-12 rounded-2xl bg-mist/60 p-6 sm:p-8">
        <p className="h3 text-ink">Have questions about this condition?</p>
        <p className="mt-2 text-sm text-ink-soft">
          Book a consultation and we&apos;ll walk you through what to expect.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block rounded-full bg-indigo px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-indigo-deep"
        >
          Book Appointment
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
