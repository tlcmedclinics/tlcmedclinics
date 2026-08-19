"use client";

import { site } from "@/data/site";
import { useT } from "@/contexts/LanguageContext";

/**
 * Privacy policy.
 *
 * Written as i18n keys rather than prose in the component so it reads in Urdu
 * too — a patient consenting to how their medical data is handled should be
 * able to read that in their own language.
 *
 * This is a plain-language description of what the app actually does today:
 * Firebase Auth for accounts, Firestore for records, Cloudinary for images,
 * Stripe/PayPal for payments, Daily.co for video, and per-session encryption
 * on chat. It is not legal advice — have a lawyer review it before launch.
 */

const SECTIONS = [
  "collect",
  "use",
  "share",
  "security",
  "retention",
  "rights",
  "cookies",
  "children",
  "changes",
] as const;

export default function PrivacyPolicyPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14 animate-fade-up">
      <p className="eyebrow text-indigo">{t("privacy.eyebrow")}</p>
      <h1 className="mt-3 h1-hero">{t("privacy.title")}</h1>
      <p className="lede mt-4">{t("privacy.intro")}</p>
      <p className="mt-2 text-xs text-ink-soft">
        {t("privacy.lastUpdated")} <span className="numeric">2026-08-19</span>
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2 className="h3 text-ink">{t(`privacy.${key}.title`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t(`privacy.${key}.body`)}
            </p>
          </section>
        ))}

        <section className="card card-pad">
          <h2 className="h4 text-ink">{t("privacy.contact.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {t("privacy.contact.body")}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <a href={`mailto:${site.email}`} className="font-semibold text-indigo hover:text-indigo-deep">
                {site.email}
              </a>
            </li>
            <li>
              <a href={`tel:${site.phone}`} className="numeric text-ink-soft hover:text-indigo">
                {site.phone}
              </a>
            </li>
            <li className="text-ink-soft">{site.address}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
