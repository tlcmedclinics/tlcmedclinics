import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import JsonLd from "@/components/JsonLd";
import { termsDoc } from "@/data/legal";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";

/**
 * The full Terms of Service and Privacy Practices.
 *
 * A server component with no interactivity: the text is the same for everyone,
 * so it is prerendered as static HTML and costs nothing to serve.
 */
export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms governing your use of TLC Med Clinics — appointments, payments, medical records, privacy practices and dispute resolution.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Terms of Service", path: "/terms" },
          ]),
        ]}
      />
      <LegalDocument doc={termsDoc} />
    </>
  );
}
