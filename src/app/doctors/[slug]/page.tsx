import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteImage from "@/components/SiteImage";
import VitalsLine from "@/components/VitalsLine";
import JsonLd from "@/components/JsonLd";
import { T } from "@/components/T";
import { Bilingual } from "@/components/Bilingual";
import { AwardIcon, ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/Icons";
import { doctorBySlug, doctorContact, doctors } from "@/data/doctors";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { pageMetadata, breadcrumbSchema, absoluteUrl } from "@/lib/seo";

/**
 * A physician's own page.
 *
 * Every doctor is prerendered — there is a small, fixed list of them and the
 * content changes about once a year, so making a visitor wait on a server
 * render buys nothing.
 *
 * The structured data matters more here than on most pages. `Physician` with a
 * medical speciality and an address is what puts a doctor in Google's local
 * results, and for a clinic in Johar Town that panel is a larger share of new
 * patients than the rest of the site put together.
 */

export function generateStaticParams() {
  return doctors.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doctor = doctorBySlug(slug);
  if (!doctor) return {};

  return pageMetadata({
    title: `${doctor.name} — ${doctor.speciality}`,
    description: doctor.summary,
    path: `/doctors/${doctor.slug}`,
  });
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = doctorBySlug(slug);
  if (!doctor) notFound();

  // `labelKey` is resolved by <T> at render time, and `valueUr` by <Bilingual>:
  // this is a server component, so neither can be picked here. A row with no
  // `valueUr` — the phone number, the email address — reads the same in both
  // languages and is rendered as it stands.
  const details: {
    Icon: typeof PhoneIcon;
    labelKey: string;
    value: string;
    valueUr?: string;
    href?: string;
  }[] = [
    {
      Icon: AwardIcon,
      labelKey: "doctorProfile.speciality",
      value: doctor.speciality,
      valueUr: doctor.specialityUr,
    },
    {
      Icon: ClockIcon,
      labelKey: "doctorProfile.degree",
      value: doctor.degree,
      valueUr: doctor.degreeUr,
    },
    {
      Icon: MapPinIcon,
      labelKey: "contact.label.address",
      value: doctorContact.address,
      valueUr: doctorContact.addressUr,
    },
    {
      Icon: PhoneIcon,
      labelKey: "contact.label.phone",
      value: doctorContact.phone,
      href: `tel:${doctorContact.phoneE164}`,
    },
    {
      Icon: MailIcon,
      labelKey: "contact.label.email",
      value: doctorContact.email,
      href: `mailto:${doctorContact.email}`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Our doctors", path: "/about/our-doctors" },
            { name: doctor.name, path: `/doctors/${doctor.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Physician",
            name: doctor.name,
            url: absoluteUrl(`/doctors/${doctor.slug}`),
            medicalSpecialty: ["Psychiatric", "Dermatology"],
            telephone: doctorContact.phoneE164,
            email: doctorContact.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: site.addressParts.street,
              addressLocality: site.addressParts.city,
              addressRegion: site.addressParts.region,
              addressCountry: site.addressParts.country,
            },
            worksFor: { "@type": "MedicalClinic", name: site.name },
          },
        ]}
      />

      <Link
        href="/about/our-doctors"
        className="text-sm font-medium text-indigo transition-colors hover:text-indigo-deep"
      >
        ← <T k="doctorProfile.back" />
      </Link>

      {/* 14rem, at 4:5. A profile is read for what it says; the photograph is
          there to confirm there is a person behind the words, and that takes a
          headshot, not a poster. The first version of this page used 17rem at
          3:4 — 272 by 363 — which put a picture the size of a paperback beside
          the text and pushed the certifications below the fold. */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_1fr] lg:items-start">
        <div className="mx-auto w-full max-w-[14rem] lg:mx-0">
          <div className="zoom-frame relative aspect-[4/5] rounded-2xl">
            <SiteImage
              src={images[doctor.imageKey]}
              alt={doctor.name}
              sizes="(min-width: 1024px) 14rem, 45vw"
              priority
            />
          </div>

          {/* The name goes in as it is written, in both languages — the same
              way the home page passes the doctor's name into its Urdu copy. A
              physician's name is not translated. */}
          <Link href="/patient/book" className="btn-indigo mt-5 block w-full text-center">
            <T
              k="doctorProfile.bookWith"
              vars={{ name: doctor.name.split(" ").slice(0, 2).join(" ") }}
            />
          </Link>
        </div>

        <div>
          <p className="eyebrow text-indigo">
            <Bilingual en={doctor.title} ur={doctor.titleUr} />
          </p>
          <h1 className="mt-3 h1-hero">
            <Bilingual en={doctor.name} ur={doctor.nameUr} />
          </h1>
          {/* Credentials stay as written — see the note on the field. */}
          <p className="numeric mt-2 text-sm uppercase tracking-wider text-ink-soft">
            {doctor.credentials}
          </p>
          <VitalsLine className="mt-5 h-3 w-40" />

          <Bilingual
            en={doctor.summary}
            ur={doctor.summaryUr}
            className="mt-6 block max-w-2xl text-base leading-relaxed text-ink-soft"
          />

          {/* Mapped over the English list with the Urdu line beside it, rather
              than BilingualList, so the clinic's own bullet and award-icon
              styling is kept. The two arrays are written as a pair in
              data/doctors.ts and stay the same length. */}
          <ul className="mt-8 space-y-3.5">
            {doctor.highlights.map((line, i) => (
              <li key={line} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
                <Bilingual en={line} ur={doctor.highlightsUr[i]} />
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-line bg-paper-dim/40 p-6">
            <p className="text-sm font-semibold text-ink">
              <T k="doctorProfile.certifications" />
            </p>
            <ul className="mt-3 space-y-2.5">
              {doctor.certifications.map((line, i) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <AwardIcon className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                  <Bilingual en={line} ur={doctor.certificationsUr[i]} />
                </li>
              ))}
            </ul>
          </div>

          {/* The detail table. Plain rows rather than a card each: this is
              reference information someone scans for one line of, and five
              cards would make the scan longer than the content. */}
          <div className="mt-10">
            <p className="eyebrow text-ink-soft/80">
              <T k="doctorProfile.details" />
            </p>
            <dl className="mt-4 overflow-hidden rounded-2xl border border-line">
              {details.map(({ Icon, labelKey, value, valueUr, href }, i) => (
                <div
                  key={labelKey}
                  className={`flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3.5 ${
                    i > 0 ? "border-t border-line/70" : ""
                  }`}
                >
                  <dt className="flex min-w-[7.5rem] items-center gap-2 text-sm text-ink-soft">
                    <Icon className="h-4 w-4 shrink-0 text-indigo" />
                    <T k={labelKey} />
                  </dt>
                  <dd className="flex-1 text-sm text-ink">
                    {href ? (
                      <a href={href} className="font-medium text-indigo hover:text-indigo-deep">
                        {value}
                      </a>
                    ) : (
                      <Bilingual en={value} ur={valueUr} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/patient/book" className="btn-indigo !px-7 !py-3.5">
              <T k="content.bookCta" />
            </Link>
            <a href={`tel:${doctorContact.phoneE164}`} className="btn-outline !px-7 !py-3.5">
              <T k="contact.call" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
