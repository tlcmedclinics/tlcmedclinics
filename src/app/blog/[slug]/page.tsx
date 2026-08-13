"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import VitalsLine from "@/components/VitalsLine";
import type { BlogPost } from "@/types";

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "blogs"), where("slug", "==", params.slug));
      const snap = await getDocs(q);
      setPost(snap.empty ? null : (snap.docs[0].data() as BlogPost));
      setLoading(false);
    }
    load();
  }, [params.slug]);

  if (loading) {
    return <p className="mx-auto max-w-3xl px-6 py-16 text-sm text-ink-soft">Loading…</p>;
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-ink-soft">Post not found.</p>
        <Link href="/blog" className="mt-4 inline-block text-sm text-indigo hover:text-indigo-deep">
          ← Back to blog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/blog" className="text-sm text-indigo hover:text-indigo-deep">
        ← Back to blog
      </Link>

      <p className="eyebrow mt-6 text-indigo">{post.authorName}</p>
      <h1 className="mt-3 h1-hero">{post.title}</h1>
      <VitalsLine className="mt-5 h-3 w-40" />
      <p className="mt-4 text-sm text-ink-soft">
        {new Date(post.createdAt).toLocaleDateString()}
      </p>

      {post.coverImage && (
        <div className="relative mt-8 h-72 w-full overflow-hidden rounded-2xl bg-mist">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>
      )}

      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-ink-soft">
        {post.content}
      </div>
    </div>
  );
}
