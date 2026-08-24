import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import VitalsLine from "@/components/VitalsLine";
import JsonLd from "@/components/JsonLd";
import { pageMetadata, blogPostingSchema, breadcrumbSchema } from "@/lib/seo";
import type { BlogPost } from "@/types";

/**
 * A single article.
 *
 * Server-rendered for the same reason as the index: the article body *is* the
 * SEO value of this page, and fetching it in the browser meant Google indexed
 * an empty shell. It also makes the title and excerpt available to
 * `generateMetadata`, so a link shared on WhatsApp shows the real headline
 * instead of the generic site card.
 */
export const revalidate = 600;

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const snap = await adminDb.collection("blogs").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const post = snap.docs[0].data() as BlogPost;
    // A draft is reachable by URL but shouldn't be — treat it as missing so
    // unfinished copy never gets indexed.
    return post.published ? post : null;
  } catch (err) {
    console.error("[BlogDetailPage] Failed to load post:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post not found", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    title: post.title,
    description: post.excerpt || `${post.title} — TLC Med Clinics, Lahore.`,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    type: "article",
    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt || post.createdAt,
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  // A real 404 rather than a soft "Post not found" body: a 200 response
  // carrying an error message is a soft-404, and Google penalises those.
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd
        data={[
          blogPostingSchema(post),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <Link href="/blog" className="text-sm text-indigo hover:text-indigo-deep">
        ← Back to blog
      </Link>

      <p className="eyebrow mt-6 text-indigo">{post.authorName}</p>
      <h1 className="mt-3 h1-hero">{post.title}</h1>
      <VitalsLine className="mt-5 h-3 w-40" />
      <time dateTime={post.createdAt} className="mt-4 block text-sm text-ink-soft">
        {formatDate(post.createdAt)}
      </time>

      {post.coverImage && (
        <div className="relative mt-8 h-72 w-full overflow-hidden rounded-2xl bg-mist">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            // The cover is the largest element above the fold, so it's almost
            // always the Largest Contentful Paint — a Core Web Vital Google
            // measures directly. Priority stops it queueing behind other work.
            priority
            className="object-cover"
          />
        </div>
      )}

      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-ink-soft">
        {post.content}
      </div>

      <aside className="mt-14 rounded-2xl bg-mist/60 p-6 sm:p-8">
        <p className="h3 text-ink">Have a question about this?</p>
        <p className="mt-2 text-sm text-ink-soft">
          Book a consultation with our team — in the clinic in Lahore, or online.
        </p>
        <Link
          href="/patient/book"
          className="mt-5 inline-block rounded-full bg-indigo px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-indigo-deep"
        >
          Book Appointment
        </Link>
      </aside>
    </article>
  );
}
