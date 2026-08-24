import type { Metadata } from "next";
import ContentIndex from "@/components/ContentIndex";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Conditions",
  description: "The mental health and skin conditions we treat — what they are, how they are diagnosed, and what can be done about them.",
  path: "/conditions",
});

export default function Page() {
  return <ContentIndex group="conditions" intro={"The mental health and skin conditions we treat — what they are, how they are diagnosed, and what can be done about them."} />;
}
