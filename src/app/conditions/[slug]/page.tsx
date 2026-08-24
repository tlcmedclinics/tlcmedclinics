import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentLayout from "@/components/ContentLayout";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { findPage, pagesInGroup } from "@/data/content";

// Every page in this group is known at build time, so they are all prerendered
// rather than rendered per request. Static HTML is what a crawler wants, and
// this content changes when someone edits a data file — not per visitor.
export function generateStaticParams() {
  return pagesInGroup("conditions").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = findPage("conditions", slug);
  if (!page) return {};

  return pageMetadata({
    title: page.title,
    description: page.summary,
    path: `/conditions/${page.slug}`,
    type: "article",
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = findPage("conditions", slug);
  if (!page) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Conditions", path: "/conditions" },
          { name: page.title, path: `/conditions/${page.slug}` },
        ])}
      />
      <ContentLayout page={page} />
    </>
  );
}
