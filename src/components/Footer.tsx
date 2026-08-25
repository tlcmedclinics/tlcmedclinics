"use client";

import Image from "next/image";
import Link from "next/link";
import { footerColumns, site } from "@/data/site";
import { useT } from "@/contexts/LanguageContext";
import { images } from "@/data/images";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/Icons";

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
              <p className="h3 text-paper">{site.name}</p>
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
          <Link href="/privacy" className="transition-colors hover:text-paper">
            {t("nav.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
