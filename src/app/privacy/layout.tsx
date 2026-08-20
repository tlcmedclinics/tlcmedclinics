import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

/**
 * The privacy page itself is a client component — its text comes from the i18n
 * dictionary so it reads in Urdu too — and a client component can't export
 * `metadata`. This thin server layout carries the metadata instead.
 *
 * It stays indexable on purpose: a medical site with a findable privacy policy
 * is part of how Google assesses trustworthiness, and patients look for it.
 */
export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How TLC Med Clinics collects, uses, stores and protects patient information — appointments, medical records, images, payments and chat.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
