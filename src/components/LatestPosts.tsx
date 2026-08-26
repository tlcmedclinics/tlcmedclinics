import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import Reveal from "@/components/Reveal";
import VitalsLine from "@/components/VitalsLine";
import { ArrowRightIcon } from "@/components/Icons";
import type { BlogPost } from "@/types";

/**
 * The three most recent posts, on the home page.
 *
 * Three because that is one row and one row is the point — the home page is
 * showing that the clinic writes, not asking anyone to read the archive. The
 * rest is a click away.
 *
 * Renders nothing at all when there are no published posts, rather than an
 * empty heading over a "no posts yet" line. A clinic that has not started
 * blogging should not have a section on its home page announcing that.
 */

const COUNT = 3;

async function getPosts(): Promise<BlogPost[]> {
  try {
    // Filtered on one field and sorted in memory, matching /blog: an orderBy
    // here would need the published+createdAt composite index, and a missing
    // index would blank a section of the home page.
    const snap = await adminDb.collection("blogs").where("published", "==", true).get();
    return snap.docs
      .map((d) => d.data() as BlogPost)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, COUNT);
  } catch (err) {
    console.error("[LatestPosts] Failed to load posts:", err);
    return [];
  }
}

/** Fixed locale so the output is the same on the server and in the browser. */
function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function LatestPosts() {
  const posts = await getPosts();
  if (posts.length === 0) return null;

  return (
    <section className="bg-paper-dim/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-indigo">Health &amp; wellness</p>
            <h2 className="mt-3 h1 sm:text-4xl">From the clinic</h2>
            <VitalsLine className="mt-5 h-3 w-32" color="var(--crimson)" />
          </div>
          <Link
            href="/blog"
            className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-indigo hover:text-indigo-deep sm:flex"
          >
            View all posts
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 90}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-indigo/30 hover:shadow-[0_24px_50px_-30px_rgba(21,86,59,0.55)]"
              >
                <div className="relative h-44 w-full shrink-0 overflow-hidden bg-mist">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    // A post with no cover gets the clinic's own colours rather
                    // than a grey rectangle that reads as a broken image.
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-[linear-gradient(135deg,var(--indigo-deep)_0%,var(--indigo)_60%,var(--crimson)_150%)] opacity-[0.12]"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="h4 text-ink transition-colors group-hover:text-indigo-deep">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">
                    {post.excerpt}
                  </p>
                  <time
                    dateTime={post.createdAt}
                    className="mt-4 block text-xs text-ink-soft/70"
                  >
                    {formatDate(post.createdAt)}
                  </time>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Link
          href="/blog"
          className="mt-10 inline-block text-sm font-medium text-indigo hover:text-indigo-deep sm:hidden"
        >
          View all posts →
        </Link>
      </div>
    </section>
  );
}
