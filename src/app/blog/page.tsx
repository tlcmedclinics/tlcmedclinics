import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import VitalsLine from "@/components/VitalsLine";
import JsonLd from "@/components/JsonLd";
import { pageMetadata, breadcrumbSchema, absoluteUrl } from "@/lib/seo";
import type { BlogPost } from "@/types";

/**
 * The blog index.
 *
 * This was a client component that fetched from Firestore in `useEffect`, so
 * the HTML Google received contained the word "Loading…" and nothing else —
 * every article was invisible to search, which is the exact opposite of why a
 * clinic runs a blog. It renders on the server now.
 *
 * Rebuilt every ten minutes rather than per request: posts change when an admin
 * publishes one, not on every visit, and a cached page is both faster for
 * patients and cheaper in Firestore reads.
 */
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Health & Wellness Blog",
  description:
    "Articles on vein health, skin care and mental wellbeing from the clinical team at TLC Med Clinics, Lahore — written for patients, not for other doctors.",
  path: "/blog",
});

async function getPosts(): Promise<BlogPost[]> {
  try {
    // Filtered on one field and sorted here rather than with `orderBy`, which
    // would need the published+createdAt composite index. Sorting a handful of
    // posts in memory costs nothing and stops a public page going blank if that
    // index isn't deployed.
    const snap = await adminDb.collection("blogs").where("published", "==", true).get();
    return snap.docs
      .map((d) => d.data() as BlogPost)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch (err) {
    console.error("[BlogListPage] Failed to load posts:", err);
    return [];
  }
}

/** Fixed locale so the output is deterministic — a bare toLocaleDateString isn't. */
function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BlogListPage() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": `${absoluteUrl("/blog")}#blog`,
            url: absoluteUrl("/blog"),
            name: "TLC Med Clinics — Health & Wellness",
            inLanguage: "en",
            blogPost: posts.slice(0, 20).map((p) => ({
              "@type": "BlogPosting",
              headline: p.title.slice(0, 110),
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.createdAt,
            })),
          },
        ]}
      />

      <p className="eyebrow text-indigo">Health &amp; wellness</p>
      <h1 className="mt-3 h1-hero">Blog</h1>
      <VitalsLine className="mt-5 h-3 w-40" />
      <p className="mt-5 max-w-lg text-ink-soft">
        Plain-language notes on vein health, skin care and mental wellbeing from
        the team at TLC Med Clinics.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">No posts published yet — check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card-hover animate-fade-up overflow-hidden rounded-2xl border border-line/70"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative h-44 w-full bg-mist">
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                {/* h2, not a styled paragraph — the heading outline is how a
                    crawler works out that these are the page's articles. */}
                <h2 className="h4 text-ink">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-2">
                  {post.excerpt}
                </p>
                <time dateTime={post.createdAt} className="mt-3 block text-xs text-ink-soft/70">
                  {formatDate(post.createdAt)}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
