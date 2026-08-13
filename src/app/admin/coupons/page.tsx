"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import type { Coupon } from "@/types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await authedFetch("/api/coupons");
    if (res.ok) setCoupons(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    await authedFetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setCreating(false);
    (e.target as HTMLFormElement).reset();
    load();
  }

  return (
    <div className="animate-fade-up">
      <h1 className="h1">Coupons</h1>

      <form
        onSubmit={handleCreate}
        className="mt-6 grid gap-4 rounded-2xl border border-line/70 p-5 sm:grid-cols-2"
      >
        <input name="code" required placeholder="Code (e.g. WELCOME10)" className="input" />
        <select name="discountType" required className="input" defaultValue="percent">
          <option value="percent">Percent off</option>
          <option value="flat">Flat amount off</option>
        </select>
        <input name="discountValue" type="number" required placeholder="Discount value" className="input" />
        <input name="maxUses" type="number" placeholder="Max uses (default 1)" className="input" />
        <input
          name="restrictedEmails"
          placeholder="Restrict to emails (comma-separated, optional)"
          className="input sm:col-span-2"
        />
        <input name="expiresAt" type="date" className="input" />
        <button
          type="submit"
          disabled={creating}
          className="rounded-full bg-indigo px-6 py-3 text-sm font-medium text-white hover:bg-indigo-deep disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create Coupon"}
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line/70 p-5"
          >
            <div>
              <p className="font-mono font-medium text-ink">{c.code}</p>
              <p className="text-sm text-ink-soft">
                {c.discountType === "percent" ? `${c.discountValue}% off` : `PKR ${c.discountValue} off`} ·
                {" "}{c.usedCount}/{c.maxUses} used
                {c.restrictedEmails?.length ? ` · restricted to ${c.restrictedEmails.length} email(s)` : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                c.active ? "bg-indigo/10 text-indigo" : "bg-mist text-ink-soft"
              }`}
            >
              {c.active ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
