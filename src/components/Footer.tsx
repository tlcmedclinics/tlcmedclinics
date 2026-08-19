"use client";

import Image from "next/image";
import Link from "next/link";
import { navLinks, site } from "@/data/site";
import { useT } from "@/contexts/LanguageContext";

// Client component so the nav labels translate. It used to be a server
// component printing `link.labelKey` verbatim, which rendered raw keys like
// "nav.home" in the footer once the links moved to i18n.
export default function Footer() {
  const t = useT();

  return (
    <footer className="mt-24 border-t border-line/70 bg-indigo-deep text-paper/90">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo-icon.png"
              alt="TLC Med Clinics"
              width={36}
              height={35}
              className="h-9 w-auto"
            />
            <p className="h3 text-paper">TLC Med Clinics</p>
          </div>
          <p className="mt-3 max-w-xs text-sm text-paper/70">{site.tagline}</p>
        </div>

        <div>
          <p className="eyebrow text-paper/50">{t("footer.explore")}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-paper/80 transition-colors hover:text-paper">
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacy" className="text-paper/80 transition-colors hover:text-paper">
                {t("nav.privacy")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-paper/50">{t("footer.hours")}</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            {site.hours.map((h) => (
              <li key={h.label} className="flex justify-between gap-3">
                <span>{h.label}</span>
                <span className="numeric text-paper/70">{h.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-paper/50">{t("footer.contact")}</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            <li>
              <a href={`tel:${site.phone}`} className="numeric transition-colors hover:text-paper">
                {site.phone}
              </a>
            </li>
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="transition-colors hover:text-paper">
                  {site.email}
                </a>
              </li>
            )}
            {site.address && <li className="text-paper/70">{site.address}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-paper/60 sm:flex-row">
          <p>
            © <span className="numeric">{new Date().getFullYear()}</span> TLC Med Clinics.{" "}
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
