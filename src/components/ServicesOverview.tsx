import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { Service } from "@/types";
import VitalsLine from "./VitalsLine";

const categoryBlurb: Record<string, string> = {
  "Vein Care": "Circulation and vein health, diagnosed and treated in-clinic.",
  "Skin Care": "Conservative, natural-looking aesthetic treatments.",
  "Mental Health": "Confidential, physician-led care — in person or remote.",
};

async function getServices(): Promise<Service[]> {
  try {
    const snap = await adminDb.collection("services").orderBy("order", "asc").get();
    return snap.docs.map((d) => d.data() as Service);
  } catch (err) {
    // If Firestore credentials are missing/misconfigured, or Firestore is
    // briefly unreachable, don't take the whole homepage down with it —
    // just skip this section. Errors show clearly in server logs either way.
    console.error("[ServicesOverview] Failed to load services:", err);
    return [];
  }
}

export default async function ServicesOverview() {
  const services = await getServices();
  if (services.length === 0) return null;

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-indigo">What we treat</p>
          <h2 className="mt-3 h1 sm:text-4xl">Our Services</h2>
        </div>
        <Link
          href="/services"
          className="hidden shrink-0 text-sm font-medium text-indigo hover:text-indigo-deep sm:block"
        >
          View all services →
        </Link>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="h3 text-indigo-deep">{category}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              {categoryBlurb[category] ?? "Personalized, physician-led care."}
            </p>
            <VitalsLine className="mt-4 h-2.5 w-24" color="var(--crimson)" />

            <ul className="mt-5 space-y-3">
              {services
                .filter((s) => s.category === category)
                .map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-line/70 bg-paper-dim/40 px-4 py-3.5 transition-colors hover:border-indigo/40 hover:bg-paper-dim"
                    >
                      <span>
                        <span className="block text-sm font-medium text-ink group-hover:text-indigo-deep">
                          {s.name}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-soft">
                          {s.short}
                        </span>
                      </span>
                      <span className="mt-0.5 shrink-0 text-indigo opacity-0 transition-opacity group-hover:opacity-100">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <Link
        href="/services"
        className="mt-10 inline-block text-sm font-medium text-indigo hover:text-indigo-deep sm:hidden"
      >
        View all services →
      </Link>
    </section>
  );
}
