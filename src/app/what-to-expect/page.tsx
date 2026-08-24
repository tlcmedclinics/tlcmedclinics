import type { Metadata } from "next";
import ContentIndex from "@/components/ContentIndex";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "What to Expect",
  description: "Before your first visit — what to bring, how appointments run, and what treatment costs.",
  path: "/what-to-expect",
});

export default function Page() {
  return <ContentIndex group="what-to-expect" intro={"Before your first visit — what to bring, how appointments run, and what treatment costs."} />;
}
