import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument from "@/components/LegalDocument";
import JsonLd from "@/components/JsonLd";
import { privacyDoc } from "@/data/legal";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";

/**
 * The clinic's privacy practices.
 *
 * This replaces a plain-language summary written from the app's behaviour —
 * "Firebase for accounts, Stripe for payments" — which its own comment marked
 * as not legal advice. It read well, and it was not the document the clinic's
 * lawyer wrote, which is the one that governs. Two descriptions of how a clinic
 * handles medical records, quietly disagreeing, is a worse position than one
 * that is dry.
 *
 * The sections here come from the same source as /terms. The note at the top
 * says so and links to the whole thing, so nobody is left wondering whether
 * this page is all of it.
 */
export const metadata: Metadata = pageMetadata({
  title: "Privacy Practices",
  description:
    "How TLC Med Clinics collects, uses and protects your personal and health information — secure messaging, email containing PHI, and who may access your records.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Privacy Practices", path: "/privacy" },
          ]),
        ]}
      />
      <LegalDocument
        doc={privacyDoc}
        note={
          <p className="rounded-2xl border border-line bg-paper-dim/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
            These practices are part of our{" "}
            <Link href="/terms" className="font-medium text-indigo hover:text-indigo-deep">
              Terms of Service
            </Link>
            , not a separate agreement. The sections below are the ones that
            govern your personal and health information; the full document
            contains them along with everything else you agree to.
          </p>
        }
      />
    </>
  );
}
