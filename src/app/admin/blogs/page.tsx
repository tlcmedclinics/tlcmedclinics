"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { usePagedList } from "@/lib/use-paged-list";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { BlogPost } from "@/types";

type Filter = "all" | "published" | "draft";

export default function AdminBlogsPage() {
  const t = useT();
  const toast = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const visible = posts.filter((p) =>
    filter === "all" ? true : filter === "published" ? p.published : !p.published
  );

  const list = usePagedList(visible, (p) => [p.title, p.excerpt, p.authorName], 6);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/blogs?all=true");
      if (!res.ok) throw new Error();
      setPosts(await res.json());
    } catch {
      toast.error(t("error.loadFailed"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm(t("admin.blogs.deleteConfirm"))) return;
    try {
      const res = await authedFetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("common.deleted"));
      load();
    } catch {
      toast.error(t("error.saveFailed"));
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{t("nav.blogs")}</h1>
          <p className="lede mt-1">{t("admin.blogs.subtitle")}</p>
        </div>
        <Link href="/admin/blogs/new" className="btn-indigo btn-sm shrink-0">
          + {t("admin.blogs.add")}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder={t("admin.blogs.search")}
          className="w-full max-w-sm"
        />
        <div className="flex gap-2">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-[var(--radius-pill)] border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f
                  ? "border-indigo bg-indigo text-white"
                  : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
              }`}
            >
              {t(`admin.blogs.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : list.isEmptyResult ? (
        <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={t("admin.blogs.none")}
          action={
            <Link href="/admin/blogs/new" className="btn-indigo btn-sm">
              + {t("admin.blogs.add")}
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.items.map((post) => (
              <div key={post.id} className="card card-hover overflow-hidden">
                <div className="relative h-36 w-full bg-mist">
                  {post.coverImage && (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                  )}
                  <span
                    className={`absolute end-3 top-3 pill ${
                      post.published ? "pill-indigo" : "pill-neutral"
                    }`}
                  >
                    {t(post.published ? "admin.blogs.published" : "admin.blogs.draft")}
                  </span>
                </div>
                <div className="p-5">
                  <p className="h4 line-clamp-1 text-ink">{post.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <Link
                      href={`/admin/blogs/${post.id}/edit`}
                      className="font-semibold text-indigo hover:text-indigo-deep"
                    >
                      {t("common.edit")}
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="font-semibold text-crimson-deep hover:text-crimson"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={list.page}
            pageCount={list.pageCount}
            total={list.total}
            onChange={list.setPage}
          />
        </>
      )}
    </div>
  );
}
