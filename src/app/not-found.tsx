import type { Metadata } from "next";
import Link from "next/link";
import VitalsLine from "@/components/VitalsLine";
import { ArrowRightIcon, PhoneIcon } from "@/components/Icons";
import { site } from "@/data/site";

/**
 * The 404 page.
 *
 * IT ALSO FIXES THE BUILD, which is the less obvious half of why this file
 * exists. Without a not-found.tsx of its own, Next generates an internal
 * /_not-found route, and that generated route's client reference manifest came
 * out incomplete — every build died on it with:
 *
 *   Error occurred prerendering page "/_not-found"
 *   Could not find the module ".../SiteChrome.tsx#default" in the React
 *   Client Manifest.
 *
 * SiteChrome was named because it is the outermost client component in the root
 * layout, and /_not-found renders inside that layout like every other page — so
 * the error pointed at a component that was never the problem. Authoring the
 * route here makes it a real page, built and tracked like the rest.
 *
 * So: don't delete this file to "tidy up". A missing 404 page is not a cosmetic
 * gap in this project; it stops the site deploying.
 *
 * Kept a server component deliberately — no hooks, nothing to hydrate. It is
 * rendered inside SiteChrome, so the header, footer and WhatsApp button are
 * already there and someone who lands here has a way onward.
 */

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 must never be indexed: it would compete in search results with the
  // real page whose URL was mistyped.
  robots: { index: false, follow: true },
};

/** Where someone who hits a dead URL most likely meant to go. */
const ROUTES = [
  { href: "/", label: "Home", hint: "Start again from the beginning" },
  { href: "/conditions", label: "Conditions", hint: "What we treat, and how" },
  { href: "/treatments", label: "Treatments", hint: "Every treatment, with prices" },
  { href: "/patient/book", label: "Book an appointment", hint: "Pick a doctor and a time" },
  { href: "/contact", label: "Contact & directions", hint: "Find us in Johar Town" },
  { href: "/faq", label: "FAQ", hint: "Answers to the common questions" },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
      <p className="eyebrow text-indigo">Error 404</p>
      <h1 className="mt-3 h1-hero">This page doesn&apos;t exist</h1>
      <VitalsLine className="mt-5 h-3 w-40" color="var(--crimson)" />

      <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft">
        The link may be out of date, or the address may have a typo in it.
        Nothing is wrong with your appointment or your account — this is just a
        page that isn&apos;t here.
      </p>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {ROUTES.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-line/70 bg-paper-dim/40 px-5 py-4 transition-colors hover:border-indigo/40 hover:bg-paper-dim"
          >
            <span>
              <span className="block font-medium text-ink group-hover:text-indigo-deep">
                {route.label}
              </span>
              <span className="mt-0.5 block text-sm text-ink-soft">{route.hint}</span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-indigo transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <p className="mt-12 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <PhoneIcon className="h-4 w-4 text-indigo" />
        Or call the clinic on
        <a
          href={`tel:${site.phoneE164}`}
          className="numeric font-medium text-indigo transition-colors hover:text-indigo-deep"
        >
          {site.phone}
        </a>
      </p>
    </div>
  );
}
