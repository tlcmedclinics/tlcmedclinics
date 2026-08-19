"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { usePagedList } from "@/lib/use-paged-list";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Coupon } from "@/types";

export default function AdminCouponsPage() {
  const t = useT();
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const list = usePagedList(coupons, (c) => [c.code, c.discountType, c.discountValue], 6);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/coupons");
      if (!res.ok) throw new Error();
      setCoupons(await res.json());
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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setCreating(true);
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const res = await authedFetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success(t("admin.coupons.created"));
      form.reset();
      setShowForm(false);
      load();
    } catch {
      toast.error(t("error.saveFailed"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{t("nav.coupons")}</h1>
          <p className="lede mt-1">{t("admin.coupons.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-indigo btn-sm shrink-0"
        >
          {showForm ? t("common.cancel") : `+ ${t("admin.coupons.add")}`}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card card-pad mt-6 grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span className="label">{t("admin.coupons.code")}</span>
            <input name="code" required placeholder="WELCOME10" className="input" />
          </label>
          <label className="field">
            <span className="label">{t("admin.coupons.type")}</span>
            <select name="discountType" required className="input" defaultValue="percent">
              <option value="percent">{t("admin.coupons.percent")}</option>
              <option value="flat">{t("admin.coupons.flat")}</option>
            </select>
          </label>
          <label className="field">
            <span className="label">{t("admin.coupons.value")}</span>
            <input name="discountValue" type="number" required min={1} className="input numeric" />
          </label>
          <label className="field">
            <span className="label">{t("admin.coupons.maxUses")}</span>
            <input name="maxUses" type="number" min={1} placeholder="1" className="input numeric" />
          </label>
          <label className="field sm:col-span-2">
            <span className="label">{t("admin.coupons.restrict")}</span>
            <input name="restrictedEmails" className="input" placeholder="a@b.com, c@d.com" />
            <span className="field-hint">{t("admin.coupons.restrictHint")}</span>
          </label>
          <label className="field">
            <span className="label">{t("admin.coupons.expires")}</span>
            <input name="expiresAt" type="date" className="input numeric" />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={creating} className="btn-indigo w-full">
              {creating ? t("common.saving") : t("admin.coupons.add")}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 max-w-sm">
        <SearchInput
          value={list.query}
          onChange={list.setQuery}
          placeholder={t("admin.coupons.search")}
        />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-soft">{t("common.loading")}</p>
      ) : list.isEmptyResult ? (
        <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
      ) : coupons.length === 0 ? (
        <EmptyState title={t("admin.coupons.none")} hint={t("admin.coupons.noneHint")} />
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {list.items.map((c) => (
              <div
                key={c.code}
                className="card card-pad flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="numeric font-semibold text-ink">{c.code}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {c.discountType === "percent"
                      ? t("admin.coupons.percentOff", { value: c.discountValue })
                      : t("admin.coupons.flatOff", { value: c.discountValue })}
                    {" · "}
                    <span className="numeric">
                      {c.usedCount}/{c.maxUses}
                    </span>{" "}
                    {t("admin.coupons.used")}
                    {c.restrictedEmails?.length
                      ? ` · ${t("admin.coupons.restrictedTo", { count: c.restrictedEmails.length })}`
                      : ""}
                  </p>
                </div>
                <span className={`pill ${c.active ? "pill-indigo" : "pill-neutral"}`}>
                  {t(c.active ? "admin.coupons.active" : "admin.coupons.inactive")}
                </span>
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
