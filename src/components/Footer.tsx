"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { footerColumns, site } from "@/data/site";
import { useT } from "@/contexts/LanguageContext";
import { images } from "@/data/images";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, socialIcons } from "@/components/Icons";

/**
 * One band, not three.
 *
 * The footer used to run to three stacked sections — four link columns, then
 * hours/contact/explore, then the copyright line — and repeated the header's
 * menu inside the last of them. On a phone that was most of a screen of
 * scrolling past links nobody was looking for.
 *
 * What is left is the part a footer is actually for: how to reach the clinic,
 * and the deep links the top bar has no room for. The header already carries
 * the menu, so it is gone from here.
 *
 * Client component so the labels translate — as a server component it printed
 * raw keys like "nav.privacy".
 */
/**
 * A 2.25rem tap target for the social links.
 *
 * Inline rather than utility classes because nothing else in this project is
 * this size, and a Tailwind class that appears in exactly one file has a habit
 * of not being generated here until the dev server restarts — which would show
 * up as three flattened icons in the footer and no error anywhere.
 *
 * 36px is also the floor for something a thumb has to hit on a phone.
 */
const SOCIAL_BUTTON: CSSProperties = { height: "2.25rem", width: "2.25rem" };

export default function Footer() {
  const t = useT();

  return (
    <footer className="mt-24 border-t border-line/70 bg-indigo-deep text-paper/90">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          {/* ---- Who and where ---- */}
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src={images.logoIcon}
                alt={site.name}
                width={36}
                height={35}
                className="h-9 w-auto"
              />
              {/* The same two-line lockup the header uses, set in white.
                  This was one line of `.h3` — the body heading style, dark
                  ink, sentence case — and on the green it read as a smudge
                  rather than as the clinic's name. The mark should look like
                  itself wherever it appears; only its colour changes with
                  the background. */}
              <span className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight text-paper">TLC</span>
                <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-paper/70">
                  Med Clinics
                </span>
              </span>
            </div>

            <p className="mt-3 max-w-xs text-sm text-paper/65">{site.tagline}</p>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-2.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-paper/50" />
                <span className="text-paper/75">{site.address}</span>
              </li>
              <li className="flex gap-2.5">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-paper/50" />
                <a
                  href={`tel:${site.phoneE164}`}
                  className="numeric text-paper/85 transition-colors hover:text-paper"
                >
                  {site.phone}
                </a>
              </li>
              {site.email && (
                <li className="flex gap-2.5">
                  <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-paper/50" />
                  <a
                    href={`mailto:${site.email}`}
                    className="text-paper/85 transition-colors hover:text-paper"
                  >
                    {site.email}
                  </a>
                </li>
              )}
              <li className="flex gap-2.5">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-paper/50" />
                <span className="text-paper/75">
                  {site.hours.map((h) => (
                    <span key={h.label} className="block">
                      {h.label} · <span className="numeric">{h.value}</span>
                    </span>
                  ))}
                </span>
              </li>
            </ul>

            {/* ---- Where else the clinic is ----
                Drawn from site.socials, which is the same list lib/seo.ts
                hands to schema.org `sameAs`. One list: a profile added for
                Google appears here too, and a profile added here is one Google
                is told about.

                The icon is the only label, so each link carries a visible-to-
                screen-readers name of its own. `rel` is not decoration either:
                noopener closes the tab-hijack hole that target="_blank" opens,
                and these all leave the site. */}
            {site.socials.length > 0 && (
              <div className="mt-7 flex items-center gap-3">
                {site.socials.map((profile) => {
                  const Icon = socialIcons[profile.icon];
                  return (
                    <a
                      key={profile.href}
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={profile.label}
                      className="flex items-center justify-center rounded-full border border-paper/20 text-paper/70 transition-colors hover:bg-paper/10 hover:text-paper"
                      style={SOCIAL_BUTTON}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="sr-only">{profile.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* ---- Deep links ----
              A site map, not a copy of the header: fees, forms and individual
              condition pages, which is what people come down here looking for. */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.heading}>
                <p className="eyebrow text-paper/45">{column.heading}</p>
                <ul className="mt-3.5 space-y-2 text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-paper/70 transition-colors hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-paper/55 sm:flex-row">
          <p>
            © <span className="numeric">{new Date().getFullYear()}</span> {site.name}.{" "}
            {t("footer.rights")}
          </p>
          {/* Both, on every page. Payment gateways look for these two links
              during merchant onboarding, and a patient handing over medical
              details should not have to hunt for them either. */}
          <span className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-paper">
              {t("nav.privacy")}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-paper">
              Terms of Service
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
