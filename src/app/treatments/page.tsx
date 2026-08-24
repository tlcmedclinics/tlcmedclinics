import type { Metadata } from "next";
import ContentIndex from "@/components/ContentIndex";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Treatments",
  description: "Every treatment we offer, with what it is for, how long it takes and what it costs.",
  path: "/treatments",
});

export default function Page() {
  return <ContentIndex group="treatments" intro={"Every treatment we offer, with what it is for, how long it takes and what it costs."} />;
}
