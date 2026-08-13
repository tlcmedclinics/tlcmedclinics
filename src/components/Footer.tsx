import Image from "next/image";
import Link from "next/link";
import { navLinks, site } from "@/data/site";

export default function Footer() {
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
          <p className="eyebrow text-paper/50">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-paper/80 hover:text-paper">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-paper/50">Hours</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            {site.hours.map((h) => (
              <li key={h.label}>
                <span className="block text-paper/50">{h.label}</span>
                {h.value}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-paper/50">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            <li>{site.address}</li>
            <li>
              <a href={`tel:${site.phone}`} className="hover:text-paper">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-paper">
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-paper/50">
          © {new Date().getFullYear()} TLC Med Clinics. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
