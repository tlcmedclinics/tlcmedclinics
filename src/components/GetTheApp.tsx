"use client";

import Link from "next/link";
import { site } from "@/data/site";
import { useT } from "@/contexts/LanguageContext";

/**
 * The "get the app" band, above the footer.
 *
 * ── Why the store badges are drawn rather than downloaded ──
 *
 * "Get it on Google Play" and "Download on the App Store" are not pictures of
 * buttons; they are trademarks, supplied under licences with rules about size,
 * clear space and what may sit beside them. A clinic site that pastes in a PNG
 * found on the web is breaking a licence it never read, and it always shows —
 * two badges from two different eras, at two different heights, slightly
 * blurry.
 *
 * So these are the site's own buttons, in the site's own type, naming the
 * platform in words. Naming Android and iPhone is ordinary factual reference
 * and needs no licence. When the apps are live and the clinic wants the real
 * badges, they can be dropped in with the proper assets from each store's
 * press kit.
 *
 * ── Before the apps are published ──
 *
 * `site.apps` starts empty, and an empty link is not rendered as a link. A
 * button that goes nowhere is worse than no button: a patient taps it, lands
 * on a Play Store page that does not exist, and concludes the clinic's app is
 * broken before they have ever seen it. Until a store URL is set, each
 * platform shows a quiet "coming soon" instead — and when both are empty the
 * whole band steps aside rather than advertising nothing.
 */

function AndroidGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-5 w-5 shrink-0"
    >
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 5.5h3" />
      <path d="M12 18.5h.01" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-5 w-5 shrink-0"
    >
      <rect x="6.5" y="2.5" width="11" height="19" rx="3" />
      <path d="M10 19.5h4" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4 shrink-0"
    >
      <path d="M12 3.5v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  );
}

/** One platform. A link when there is somewhere to go, a note when there isn't. */
function StoreButton({
  href,
  glyph,
  eyebrow,
  label,
}: {
  href: string;
  glyph: React.ReactNode;
  eyebrow: string;
  label: string;
}) {
  const shell =
    "flex min-w-[11.5rem] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200";

  if (!href) {
    return (
      <span
        className={`${shell} cursor-default border-line/70 bg-paper/40 text-ink-soft`}
        aria-disabled
      >
        <span className="opacity-60">{glyph}</span>
        <span className="min-w-0">
          <span className="block text-[0.625rem] font-medium uppercase tracking-wide opacity-70">
            {eyebrow}
          </span>
          <span className="block text-sm font-semibold">{label}</span>
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      // The store is somebody else's site. `noopener` is not optional on a
      // target="_blank" link — without it the opened page can reach back
      // through window.opener and navigate this tab wherever it likes.
      target="_blank"
      rel="noopener noreferrer"
      className={`${shell} group border-line bg-paper text-ink hover:border-indigo/50 hover:shadow-[0_8px_22px_-16px_rgba(21,86,59,0.6)]`}
    >
      <span className="text-indigo-deep">{glyph}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.625rem] font-medium uppercase tracking-wide text-ink-soft/80">
          {eyebrow}
        </span>
        <span className="block text-sm font-semibold">{label}</span>
      </span>
      <span className="text-ink-soft/50 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:text-ink-soft">
        <DownloadGlyph />
      </span>
    </Link>
  );
}

export default function GetTheApp() {
  const t = useT();
  const android = site.apps?.android?.trim() ?? "";
  const ios = site.apps?.ios?.trim() ?? "";

  // Neither app is out yet and nothing is being announced — say nothing.
  if (!android && !ios) return null;

  return (
    <section className="border-t border-line/70 bg-mist/40">
      <div className="mx-auto flex max-w-[88rem] flex-col gap-7 px-6 py-12 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:py-14">
        <div className="max-w-xl">
          <p className="eyebrow text-indigo">{t("getApp.eyebrow")}</p>
          <h2 className="mt-2.5 h3 text-ink">{t("getApp.title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {t("getApp.blurb")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <StoreButton
            href={android}
            glyph={<AndroidGlyph />}
            eyebrow={android ? t("getApp.getItOn") : t("getApp.comingSoon")}
            label={t("getApp.android")}
          />
          <StoreButton
            href={ios}
            glyph={<AppleGlyph />}
            eyebrow={ios ? t("getApp.downloadOn") : t("getApp.comingSoon")}
            label={t("getApp.ios")}
          />
        </div>
      </div>
    </section>
  );
}
