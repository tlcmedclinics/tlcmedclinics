import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";
import VitalsLine from "@/components/VitalsLine";
import ContactForm from "@/components/ContactForm";
import JsonLd from "@/components/JsonLd";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/Icons";
import { pageMetadata, breadcrumbSchema, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact & Directions",
  description: `Find TLC Med Clinics at ${site.addressParts.street}, Lahore. Call ${site.phone}, email ${site.email}, or book an appointment online.`,
  path: "/contact",
});

/**
 * The map embed.
 *
 * Built from the address rather than from coordinates, because the clinic's
 * exact pin isn't recorded anywhere yet and a guessed lat/long would drop a
 * marker on the wrong building — worse than a search-based pin, which lands on
 * whatever Google already knows about this address. Once `site.geo` is filled
 * in from the clinic's own Business Profile, point `q=` at those coordinates.
 *
 * The plain /maps?output=embed form needs no API key, so there is no billing
 * account to keep alive and nothing to break when a key is rotated.
 */
const MAP_QUERY = encodeURIComponent(`${site.name}, ${site.address}`);
const MAP_SRC = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

const DETAILS = [
  {
    Icon: PhoneIcon,
    label: "Phone",
    value: site.phone,
    href: `tel:${site.phoneE164}`,
    numeric: true,
  },
  {
    Icon: MailIcon,
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    numeric: false,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            url: absoluteUrl("/contact"),
            name: `Contact — ${site.name}`,
            inLanguage: "en",
          },
        ]}
      />

      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="eyebrow text-indigo">Get in touch</p>
          <h1 className="mt-3 h1-hero">Contact &amp; Directions</h1>
          <VitalsLine className="mt-5 h-3 w-40" />
          <p className="mt-5 max-w-sm text-ink-soft">
            We are in Johar Town, next to Doctors Hospital. Call us, or book your
            appointment online and pick your own doctor and time.
          </p>

          {/* Booking lives in one place — the booking flow, where a patient can
              see who is free and pay. The form further down this page is a
              different thing: a question, not an appointment. */}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/patient/book" className="btn-indigo !px-7 !py-3.5">
              Book an appointment
            </Link>
            <a href={`tel:${site.phoneE164}`} className="btn-outline !px-7 !py-3.5">
              Call the clinic
            </a>
          </div>

          <div className="mt-12 space-y-7">
            <div className="flex gap-4">
              <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo" />
              <div>
                <p className="eyebrow text-ink-soft/70">Address</p>
                <address className="mt-1.5 not-italic leading-relaxed text-ink">
                  {site.address}
                </address>
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-indigo hover:text-indigo-deep"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>

            {DETAILS.map(({ Icon, label, value, href, numeric }) => (
              <div key={label} className="flex gap-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-indigo" />
                <div>
                  <p className="eyebrow text-ink-soft/70">{label}</p>
                  <a
                    href={href}
                    className={`mt-1.5 block text-ink transition-colors hover:text-indigo ${
                      numeric ? "numeric" : ""
                    }`}
                  >
                    {value}
                  </a>
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo" />
              <div>
                <p className="eyebrow text-ink-soft/70">Hours</p>
                {site.hours.map((h) => (
                  <p key={h.label} className="mt-1.5 text-sm text-ink">
                    <span className="text-ink-soft/70">{h.label}: </span>
                    <span className="numeric">{h.value}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="overflow-hidden rounded-3xl border border-line shadow-[0_24px_60px_-40px_rgba(36,31,102,0.6)]">
            <iframe
              src={MAP_SRC}
              title={`Map showing ${site.name}, ${site.address}`}
              // Lazy, so a third-party frame stays off the critical path. This
              // page is opened for the phone number far more often than for the
              // map, and the map is the heaviest thing on it.
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block h-[26rem] w-full border-0 lg:h-[34rem]"
            />
          </div>

          <p className="mt-4 text-sm text-ink-soft">
            Parking is available on site. If this is your first appointment,
            please arrive 15 minutes early to complete check-in.
          </p>

          {/* The form sits under the map rather than beside the address, so the
              page answers "where are you" and "how do I reach you" before it
              asks the reader for anything. */}
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
