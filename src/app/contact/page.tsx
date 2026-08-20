import type { Metadata } from "next";
import { site } from "@/data/site";
import AppointmentForm from "@/components/AppointmentForm";
import VitalsLine from "@/components/VitalsLine";
import JsonLd from "@/components/JsonLd";
import { pageMetadata, breadcrumbSchema, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Book an Appointment — Contact the Clinic",
  description: `Book an appointment at TLC Med Clinics, ${site.addressParts.street}, Lahore. Call ${site.phone}, or request an in-clinic or online consultation and our team will confirm your slot.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-16 lg:grid-cols-[1fr_1.2fr]">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Book an Appointment", path: "/contact" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            url: absoluteUrl("/contact"),
            name: `Book an appointment — ${site.name}`,
            inLanguage: "en",
          },
        ]}
      />
      <div>
        <p className="eyebrow text-indigo">Get in touch</p>
        <h1 className="mt-3 h1-hero">
          Book an Appointment
        </h1>
        <VitalsLine className="mt-5 h-3 w-40" />
        <p className="mt-5 max-w-sm text-ink-soft">
          Share a few details and our team will call to confirm your slot.
        </p>
        <p className="mt-3 max-w-sm text-sm text-ink-soft">
          Already a patient?{" "}
          <a href="/login" className="font-medium text-indigo hover:text-indigo-deep">
            Log in
          </a>{" "}
          to pick your doctor and time directly.
        </p>

        <div className="mt-10 space-y-6 text-sm text-ink-soft">
          <div>
            <p className="eyebrow text-ink-soft/70">Phone</p>
            <a href={`tel:${site.phone}`} className="mt-1 block text-ink hover:text-indigo">
              {site.phone}
            </a>
          </div>
          <div>
            <p className="eyebrow text-ink-soft/70">Email</p>
            <a href={`mailto:${site.email}`} className="mt-1 block text-ink hover:text-indigo">
              {site.email}
            </a>
          </div>
          <div>
            <p className="eyebrow text-ink-soft/70">Address</p>
            <address className="mt-1 not-italic text-ink">{site.address}</address>
          </div>
          <div>
            <p className="eyebrow text-ink-soft/70">Hours</p>
            {site.hours.map((h) => (
              <p key={h.label} className="mt-1 text-ink">
                <span className="text-ink-soft/70">{h.label}: </span>
                {h.value}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line/70 bg-paper-dim/30 p-6 sm:p-8">
        <AppointmentForm />
      </div>
    </div>
  );
}
