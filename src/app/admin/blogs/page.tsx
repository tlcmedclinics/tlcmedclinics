"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authedFetch } from "@/lib/authed-fetch";
import type { BlogPost } from "@/types";

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await authedFetch("/api/blogs?all=true");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await authedFetch(`/api/blogs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="h1">Blogs</h1>
        <Link
          href="/admin/blogs/new"
          className="rounded-full bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-deep"
        >
          + New Post
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No blog posts yet — create your first one.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="card-hover overflow-hidden rounded-2xl border border-line/70"
            >
              <div className="relative h-36 w-full bg-mist">
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                )}
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.65rem] font-medium ${
                    post.published ? "bg-indigo text-white" : "bg-white/90 text-ink-soft"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="p-5">
                <p className="h4 text-ink line-clamp-1">{post.title}</p>
                <p className="mt-1.5 text-sm text-ink-soft line-clamp-2">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <Link
                    href={`/admin/blogs/${post.id}/edit`}
                    className="font-medium text-indigo hover:text-indigo-deep"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="font-medium text-crimson-deep hover:text-crimson"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
