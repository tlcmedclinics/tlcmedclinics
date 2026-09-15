import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument from "@/components/LegalDocument";
import JsonLd from "@/components/JsonLd";
import { refundDoc } from "@/data/legal";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";

/**
 * The cancellation and refund policy, on a URL of its own.
 *
 * Two audiences, and they want opposite things from the same text. A patient
 * wants one answer — can I get my money back, and when — without reading a
 * contract to find it. A payment provider's onboarding review wants a single
 * public link it can file against the merchant account; "it's in clause 14 of
 * the Terms" is not one.
 *
 * Same text in both places, from one source in data/legal.ts, so the two can
 * never drift into being two different policies.
 */
export const metadata: Metadata = pageMetadata({
  title: "Cancellation and Refund Policy",
  description:
    "When a TLC Med Clinics appointment can be cancelled, what is refunded, how the refund is returned and how long it takes to arrive.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Cancellation and Refund Policy", path: "/refund-policy" },
          ]),
        ]}
      />
      <LegalDocument
        doc={refundDoc}
        note={
          <p className="rounded-2xl border border-line bg-paper-dim/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
            This policy is part of our{" "}
            <Link href="/terms" className="font-medium text-indigo hover:text-indigo-deep">
              Terms of Service
            </Link>
            , not a separate agreement. It is repeated here on its own page so
            you can find it without reading the whole document.
          </p>
        }
      />
    </>
  );
}
