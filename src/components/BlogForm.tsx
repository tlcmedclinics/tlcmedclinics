"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authedFetch } from "@/lib/authed-fetch";
import type { BlogPost } from "@/types";

export default function BlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await authedFetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setCoverImage(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get("title"),
      excerpt: form.get("excerpt"),
      content: form.get("content"),
      authorName: form.get("authorName"),
      published: form.get("published") === "on",
      coverImage,
    };

    try {
      const res = post
        ? await authedFetch(`/api/blogs/${post.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await authedFetch("/api/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error("Save failed");
      router.push("/admin/blogs");
    } catch {
      setError("Something went wrong saving the post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5">
      <div>
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">Cover image</span>
        {coverImage && (
          <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-mist">
            <Image src={coverImage} alt="Cover" fill className="object-cover" />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="input" />
        {uploading && <p className="mt-1 text-xs text-ink-soft">Uploading…</p>}
      </div>

      <input name="title" required defaultValue={post?.title} placeholder="Title" className="input" />
      <input
        name="authorName"
        defaultValue={post?.authorName ?? "TLC Med Clinics"}
        placeholder="Author"
        className="input"
      />
      <textarea
        name="excerpt"
        rows={2}
        defaultValue={post?.excerpt}
        placeholder="Short excerpt (shown on cards)"
        className="input resize-none"
      />
      <textarea
        name="content"
        required
        rows={12}
        defaultValue={post?.content}
        placeholder="Full post content"
        className="input resize-none"
      />

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="published" defaultChecked={post?.published} />
        Publish immediately
      </label>

      {error && <p className="text-sm text-crimson-deep">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="rounded-full bg-indigo px-7 py-3.5 text-sm font-medium text-white hover:bg-indigo-deep disabled:opacity-60"
      >
        {saving ? "Saving…" : post ? "Update Post" : "Publish Post"}
      </button>
    </form>
  );
}
