"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authed-fetch";
import { readApiError } from "@/lib/api-error";
import { useToast } from "@/contexts/ToastContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { InlineSpinner, SkeletonRows } from "@/components/Loader";
import { useT } from "@/contexts/LanguageContext";

/**
 * Urdu coverage across the catalogue, and a button to fill the gaps.
 *
 * The forms translate a service while someone is editing it. This page exists
 * for the ones nobody is editing — the services and posts written before the
 * Urdu columns existed, which would otherwise stay English until each was
 * opened by hand.
 *
 * It shows two numbers per collection and they say different things. "18 of 40
 * fields translated" is coverage. "6 need a read" is trust: those are fields a
 * machine wrote, and until a person opens that service and saves it, nobody has
 * confirmed the Urdu says what the English says. On a medical site the second
 * number is the one that matters, so it is the one in red.
 */

type Row = {
  label: string;
  documents: number;
  fieldsTranslated: number;
  fieldsTotal: number;
  fieldsPending: number;
  charactersPending: number;
  needsReview: number;
  error?: string;
};

type Report = { configured: boolean } & Record<string, Row | boolean>;

const COLLECTIONS = [
  { key: "services", href: "/admin/services" },
  { key: "blogs", href: "/admin/blogs" },
] as const;

export default function TranslationsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authedFetch("/api/translate/backfill");
      if (!res.ok) throw new Error(await readApiError(res, t("admin.translations.reportFailed")));
      setReport(await res.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.translations.reportFailed"));
      setReport({ configured: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(key: string, row: Row) {
    const ok = await confirm({
      title: t("admin.translations.confirmTitle", { count: row.fieldsPending }),
      message: t("admin.translations.confirmBody", {
        chars: row.charactersPending.toLocaleString(),
      }),
      confirmLabel: t("admin.translations.confirmCta"),
    });
    if (!ok) return;

    setBusy(key);
    try {
      const res = await authedFetch("/api/translate/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: key }),
      });
      if (!res.ok) throw new Error(await readApiError(res, t("admin.translations.failed")));
      const data = await res.json();
      toast.success(
        t("admin.translations.done", { fields: data.translated, items: data.documents })
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.translations.failed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-up">
      <h1 className="h1">{t("admin.translations.title")}</h1>
      <p className="lede mt-1">{t("admin.translations.lede")}</p>

      {report && !report.configured && (
        <div className="card card-pad mt-6 border-l-4 border-crimson">
          <p className="text-sm font-semibold text-ink">{t("admin.translations.notConfigured")}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {t("admin.translations.notConfiguredA")}{" "}
            <span className="numeric font-medium text-ink">TRANSLATE_API_KEY</span>{" "}
            {t("admin.translations.notConfiguredB")}
          </p>
        </div>
      )}

      {!report ? (
        <SkeletonRows rows={2} className="mt-6" />
      ) : (
        <div className="mt-6 space-y-4">
          {COLLECTIONS.map(({ key, href }) => {
            const row = report[key] as Row | undefined;
            if (!row) return null;

            if (row.error) {
              return (
                <div key={key} className="card card-pad">
                  <p className="text-sm font-semibold text-ink">{row.label}</p>
                  <p className="mt-1 text-sm text-crimson-deep">{row.error}</p>
                </div>
              );
            }

            const pct =
              row.fieldsTotal > 0
                ? Math.round((row.fieldsTranslated / row.fieldsTotal) * 100)
                : 100;

            return (
              <div key={key} className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink">{row.label}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {t("admin.translations.coverage", {
                        documents: row.documents,
                        translated: row.fieldsTranslated,
                        total: row.fieldsTotal,
                      })}
                    </p>
                  </div>
                  <span className="numeric shrink-0 text-2xl font-bold text-indigo">{pct}%</span>
                </div>

                {/* A bar rather than only a number: "72%" is a fact, a bar that
                    is clearly not full is a prompt. */}
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-dim">
                  <div
                    className="h-full rounded-full bg-indigo transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {row.fieldsPending > 0 ? (
                    <button
                      type="button"
                      disabled={busy !== null || !report.configured}
                      onClick={() => run(key, row)}
                      className="btn-indigo btn-sm"
                    >
                      {busy === key ? (
                        <InlineSpinner />
                      ) : (
                        t("admin.translations.draftMissing", { count: row.fieldsPending })
                      )}
                    </button>
                  ) : (
                    <span className="pill pill-indigo">{t("admin.translations.nothingMissing")}</span>
                  )}

                  <Link href={href} className="btn-outline btn-sm">
                    {t("admin.translations.openCollection", { name: row.label.toLowerCase() })}
                  </Link>

                  {row.needsReview > 0 && (
                    <span className="text-sm text-crimson-deep">
                      {t("admin.translations.needsRead", { count: row.needsReview })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card card-pad mt-8">
        <p className="text-sm font-semibold text-ink">{t("admin.translations.trustTitle")}</p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-soft">
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" />
            <span>{t("admin.translations.trust1")}</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
            <span>{t("admin.translations.trust2")}</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />
            <span>{t("admin.translations.trust3")}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
