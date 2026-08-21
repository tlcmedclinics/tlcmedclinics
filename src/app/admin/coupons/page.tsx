"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, Pagination, SearchInput } from "@/components/ListControls";
import { authedFetch } from "@/lib/authed-fetch";
import { usePagedList } from "@/lib/use-paged-list";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
import type { Coupon } from "@/types";
import { InlineSpinner, SkeletonRows } from "@/components/Loader";
import { useConfirm } from "@/contexts/ConfirmContext";

export default function AdminCouponsPage() {
  const t = useT();
  const toast = useToast();
  const confirm = useConfirm();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);

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

  /** Switch a coupon on or off. Nothing is lost either way — usedCount stays. */
  async function toggleActive(c: Coupon) {
    setBusyCode(c.code);
    try {
      const res = await authedFetch(`/api/coupons/${encodeURIComponent(c.code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      if (!res.ok) throw new Error();
      // Flipped in place rather than refetching the list — the row the admin
      // just clicked shouldn't jump while the page reloads around it.
      setCoupons((prev) =>
        prev.map((x) => (x.code === c.code ? { ...x, active: !c.active } : x))
      );
      toast.success(c.active ? `${c.code} deactivated.` : `${c.code} is live again.`);
    } catch {
      toast.error(t("error.saveFailed"));
    } finally {
      setBusyCode(null);
    }
  }

  /**
   * Delete a coupon.
   *
   * The server refuses when the coupon has been used, and says so; that turns
   * into a second, blunter question here rather than a dead end. Deactivating
   * is almost always what's wanted for a coupon with history — the bookings
   * that used it still refer to it.
   */
  async function remove(c: Coupon, force = false) {
    if (!force) {
      const ok = await confirm({
        title: `Delete ${c.code}?`,
        message: "Patients will no longer be able to use this code.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (!ok) return;
    }

    setBusyCode(c.code);
    try {
      const res = await authedFetch(
        `/api/coupons/${encodeURIComponent(c.code)}${force ? "?force=1" : ""}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.needsForce) {
        setBusyCode(null);
        const anyway = await confirm({
          title: `${c.code} has already been used`,
          message: `${data.usedCount} booking(s) used this code. Deleting it leaves those bookings pointing at a discount with no record. Deactivating keeps the history and still stops new use.`,
          confirmLabel: "Delete anyway",
          cancelLabel: "Keep it",
          destructive: true,
        });
        if (anyway) await remove(c, true);
        return;
      }

      if (!res.ok) throw new Error(data.error);
      setCoupons((prev) => prev.filter((x) => x.code !== c.code));
      toast.success(`${c.code} deleted.`);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t("error.saveFailed"));
    } finally {
      setBusyCode(null);
    }
  }

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
        <SkeletonRows rows={4} className="mt-8" />
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`pill ${c.active ? "pill-indigo" : "pill-neutral"}`}>
                    {t(c.active ? "admin.coupons.active" : "admin.coupons.inactive")}
                  </span>

                  <button
                    onClick={() => toggleActive(c)}
                    disabled={busyCode === c.code}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
                  >
                    {busyCode === c.code ? (
                      <InlineSpinner />
                    ) : c.active ? (
                      "Deactivate"
                    ) : (
                      "Activate"
                    )}
                  </button>

                  <button
                    onClick={() => remove(c)}
                    disabled={busyCode === c.code}
                    className="rounded-full border border-crimson/40 px-3 py-1.5 text-xs font-medium text-crimson-deep transition-colors hover:bg-crimson hover:text-white disabled:opacity-50"
                  >
                    Delete
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
