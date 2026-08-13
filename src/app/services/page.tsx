import Link from "next/link";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import VitalsLine from "@/components/VitalsLine";
import type { Service } from "@/types";

export const metadata: Metadata = {
  title: "Services — TLC Med Clinics",
  description: "Vein care, skin care, and mental health services at TLC Med Clinics, Lahore.",
};

export const dynamic = "force-dynamic";

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
                      <p className="h4 text-ink group-hover:text-indigo-deep">
                        {s.name}
                      </p>
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
