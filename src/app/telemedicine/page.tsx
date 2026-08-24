import type { Metadata } from "next";
import ContentIndex from "@/components/ContentIndex";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Telemedicine",
  description: "See a doctor from home. What telemedicine is, why patients use it, and exactly how an online consultation runs.",
  path: "/telemedicine",
});

export default function Page() {
  return <ContentIndex group="telemedicine" intro={"See a doctor from home. What telemedicine is, why patients use it, and exactly how an online consultation runs."} />;
}
