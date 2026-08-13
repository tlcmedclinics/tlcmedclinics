import Link from "next/link";
import VitalsLine from "./VitalsLine";
import { site } from "@/data/site";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-24">
      <div>
        <p className="eyebrow text-indigo">Lahore, Pakistan · US-Trained Physicians</p>
        <h1 className="mt-5 h1-hero lg:text-6xl">
          Whole-person care, held to a{" "}
          <span className="text-indigo">higher standard.</span>
        </h1>
        <VitalsLine className="mt-6 h-3 w-40" />
        <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
          Vein care, skin care, and mental health — under one roof, led by
          U.S. board-certified physicians. In person or by telemedicine.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/contact" className="btn-indigo !px-7 !py-3.5">
            Book Appointment
          </Link>
          <Link href="/services" className="btn-outline !px-7 !py-3.5">
            View Services
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="rotate-1 rounded-3xl border border-line bg-paper-dim/60 p-6 shadow-[0_20px_60px_-25px_rgba(27,67,50,0.35)] sm:p-8">
          <p className="eyebrow text-ink-soft">Clinic at a glance</p>
          <div className="mt-5 grid grid-cols-2 gap-5">
            {site.stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-paper p-4">
                <p className="stat-number text-indigo-deep">{stat.value}</p>
                <p className="mt-1 text-xs leading-snug text-ink-soft">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-indigo-deep/5 p-4">
            <VitalsLine className="h-4 w-16 shrink-0" color="var(--crimson)" />
            <p className="text-xs leading-snug text-ink-soft">
              Telemedicine consults available six days a week.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
