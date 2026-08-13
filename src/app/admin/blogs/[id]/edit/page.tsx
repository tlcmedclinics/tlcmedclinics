"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authedFetch } from "@/lib/authed-fetch";
import BlogForm from "@/components/BlogForm";
import type { BlogPost } from "@/types";

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch(`/api/blogs/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setPost)
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="animate-fade-up">
      <h1 className="h1">Edit Blog Post</h1>
      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">Loading…</p>
      ) : post ? (
        <BlogForm post={post} />
      ) : (
        <p className="mt-6 text-sm text-ink-soft">Post not found.</p>
      )}
    </div>
  );
}
