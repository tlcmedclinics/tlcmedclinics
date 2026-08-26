"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { usePagedList } from "@/lib/use-paged-list";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Service } from "@/types";
import { useConfirm } from "@/contexts/ConfirmContext";
import { SkeletonRows } from "@/components/Loader";

/** The clinic's three areas of care, in the order they should be offered. */
const CATEGORY_ORDER = ["Diagnosis", "Mental Health", "Skin & Aesthetics"];

export default function AdminServicesPage() {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  /**
   * The categories actually present, with the clinic's three first and
   * anything else after them.
   *
   * Read from the data rather than hard-coded: a category typed into the Add
   * Service form still gets a tab instead of quietly becoming unreachable.
   */
  const categories = useMemo(() => {
    // The type guard is doing real work: `.filter(Boolean)` alone leaves the
    // element type as `string | undefined` under most TS settings, and the
    // comparator below would then be sorting possibly-undefined values.
    const present = Array.from(
      new Set(services.map((s) => s.category).filter((c): c is string => Boolean(c)))
    );
    return present.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [services]);

  const inCategory = useMemo(
    () => (category === "all" ? services : services.filter((s) => s.category === category)),
    [services, category]
  );

  const list = usePagedList(
    inCategory,
    // The advance and the duration are searchable too: typing "5000" finds
    // every service that takes an advance, which is a question the clinic
    // actually asks of this screen.
    (s) => [s.name, s.category, s.short, s.price, s.advancePayment, s.durationMinutes],
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

  // Switching category starts a new list, so start it at the top. usePagedList
  // resets the page only when the *query* changes; without this, moving from
  // page 2 of one category to another that also has two pages would open on
  // its second page for no reason the reader can see.
  const setPage = list.setPage;
  useEffect(() => {
    setPage(1);
  }, [category, setPage]);

  async function handleDelete(id: string) {
    if (
      !(await confirm({
        title: t("admin.services.deleteConfirm"),
        confirmLabel: "Delete",
        destructive: true,
      }))
    )
      return;
    try {
      const res = await authedFetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("common.deleted"));
      load();
    } catch {
      toast.error(t("error.saveFailed"));
    }
  }

  /** Services exist, but none in the category currently selected. */
  const categoryEmpty = services.length > 0 && inCategory.length === 0;

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

      {/* Category tabs, hidden while there is only one category — three words
          of chrome that filter nothing. */}
      {!loading && categories.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {["all", ...categories].map((c) => {
            const active = category === c;
            const count =
              c === "all" ? services.length : services.filter((s) => s.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`rounded-[var(--radius-pill)] border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-indigo bg-indigo text-white"
                    : "border-line text-ink-soft hover:border-indigo hover:text-indigo"
                }`}
              >
                {c === "all" ? t("common.all") : c}
                <span
                  className={`numeric ms-1.5 ${active ? "text-white/70" : "text-ink-soft/60"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <SkeletonRows rows={4} className="mt-8" />
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
      ) : categoryEmpty ? (
        // Without this branch an empty category renders an empty grid with a
        // "1 of 1" pager underneath it, which reads as a broken page.
        <EmptyState
          title={`Nothing in ${category} yet`}
          hint="Add a service to this category, or choose another above."
          action={
            <Link href="/admin/services/new" className="btn-indigo btn-sm">
              + {t("admin.services.add")}
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.items.map((s) => {
              const takesAdvance =
                typeof s.advancePayment === "number" &&
                typeof s.price === "number" &&
                s.advancePayment < s.price;

              return (
                <div key={s.id} className="card card-pad card-hover flex flex-col justify-between">
                  <div>
                    <span className="eyebrow text-indigo">{s.category}</span>
                    <p className="mt-1.5 h4 text-ink">{s.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-soft">{s.short}</p>

                    {/* Price, what is taken online, and how long the session
                        runs — the three things that decide whether a service is
                        bookable at all. A missing price is called out rather
                        than left blank: a service without one cannot be paid
                        for, and a card that simply shows nothing hides that. */}
                    <div className="mt-3 space-y-1 text-xs">
                      {typeof s.price === "number" ? (
                        <p className="numeric text-ink">
                          PKR {s.price.toLocaleString()}
                          {typeof s.durationMinutes === "number" && s.durationMinutes > 0 && (
                            <span className="text-ink-soft"> · {s.durationMinutes} min</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-crimson-deep">No price set — cannot be booked</p>
                      )}

                      {takesAdvance && (
                        <p className="numeric text-indigo">
                          PKR {s.advancePayment!.toLocaleString()} advance to book
                        </p>
                      )}
                    </div>
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
              );
            })}
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
