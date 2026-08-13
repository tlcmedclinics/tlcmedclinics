"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import VitalsLine from "@/components/VitalsLine";
import type { BlogPost } from "@/types";

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "blogs"),
        where("published", "==", true),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => d.data() as BlogPost));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="eyebrow text-indigo">Health & wellness</p>
      <h1 className="mt-3 h1-hero">Blog</h1>
      <VitalsLine className="mt-5 h-3 w-40" />

      {loading ? (
        <p className="mt-10 text-sm text-ink-soft">Loading…</p>
      ) : posts.length === 0 ? (
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
                  <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                )}
              </div>
              <div className="p-5">
                <p className="h4 text-ink">{post.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-2">
                  {post.excerpt}
                </p>
                <p className="mt-3 text-xs text-ink-soft/70">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
