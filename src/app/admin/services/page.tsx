"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { usePagedList } from "@/lib/use-paged-list";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Service } from "@/types";

export default function AdminServicesPage() {
  const t = useT();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const list = usePagedList(
    services,
    (s) => [s.name, s.category, s.short, s.price],
    6
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/services");
      if (!res.ok) throw new Error();
      setServices(await res.json());
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
    if (!confirm(t("admin.services.deleteConfirm"))) return;
    try {
      const res = await authedFetch(`/api/services/${id}`, { method: "DELETE" });
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
          <h1 className="h1">{t("nav.services")}</h1>
          <p className="lede mt-1">{t("admin.services.subtitle")}</p>
        </div>
        <Link href="/admin/services/new" className="btn-indigo btn-sm shrink-0">
          + {t("admin.services.add")}
        </Link>
      </div>

      <div className="mt-6 max-w-sm">
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder={t("admin.services.search")}
        />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : list.isEmptyResult ? (
        <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
      ) : services.length === 0 ? (
        <EmptyState
          title={t("admin.services.none")}
          action={
            <Link href="/admin/services/new" className="btn-indigo btn-sm">
              + {t("admin.services.add")}
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.items.map((s) => (
              <div key={s.id} className="card card-pad card-hover flex flex-col justify-between">
                <div>
                  <span className="eyebrow text-indigo">{s.category}</span>
                  <p className="mt-1.5 h4 text-ink">{s.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-soft">{s.short}</p>
                  {typeof s.price === "number" && (
                    <p className="numeric mt-2 text-xs text-ink-soft">
                      PKR {s.price.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <Link
                    href={`/admin/services/${s.id}/edit`}
                    className="font-semibold text-indigo hover:text-indigo-deep"
                  >
                    {t("common.edit")}
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="font-semibold text-crimson-deep hover:text-crimson"
                  >
                    {t("common.delete")}
                  </button>
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
