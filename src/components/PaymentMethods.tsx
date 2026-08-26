"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { readApiError } from "@/lib/api-error";
import { InlineSpinner } from "@/components/Loader";

/**
 * The payment buttons on the booking page.
 *
 * Which methods appear is decided by the server — /api/payments/methods lists
 * only the gateways whose credentials are actually set — so the clinic can go
 * live with JazzCash the week it is approved and add cards later without this
 * component changing. A method that is not configured is not a broken button;
 * it simply isn't there.
 *
 * Handing over to a gateway takes one of two shapes. JazzCash and EasyPaisa
 * only accept an HTML form post, so the fields the server signed are written
 * into a hidden form and submitted; Safepay returns a URL. Both leave the site,
 * which is why the whole panel disables itself the moment one is pressed — a
 * second click during the half-second before the browser navigates would start
 * a second payment against a slot that is already being held for the first.
 */

type Method = {
  id: string;
  label: string;
  blurb: string;
  /** Which route starts this payment — see /api/payments/methods. */
  via: "redirect" | "stripe";
};

/** The wallet logos are text — a wordmark we don't have a licence to ship. */
const ICON: Record<string, string> = {
  jazzcash: "JC",
  easypaisa: "EP",
  safepay: "＊",
  stripe: "▮",
};

export default function PaymentMethods({
  /** The booking to pay for, or `{ appointmentId }` for an unpaid follow-up. */
  payload,
  amount,
  disabled = false,
  onBusyChange,
  onError,
}: {
  payload: Record<string, unknown> | null;
  amount: number;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onError?: (message: string) => void;
}) {
  const [methods, setMethods] = useState<Method[] | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payments/methods")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMethods)
      .catch(() => setMethods([]));
  }, []);

  async function pay(method: Method) {
    if (!payload || starting) return;
    setStarting(method.id);
    onBusyChange?.(true);

    try {
      // Stripe answers on its own route with `{ url }` and no `kind`, so it is
      // normalised to the same shape here rather than branching twice further
      // down. Everything after this point treats all methods alike.
      const res = await authedFetch(
        method.via === "stripe" ? "/api/payments/stripe/checkout" : "/api/payments/start",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body:
            method.via === "stripe"
              ? JSON.stringify(payload)
              : JSON.stringify({ ...payload, gateway: method.id }),
        }
      );

      if (!res.ok) {
        throw new Error(await readApiError(res, "Could not start the payment."));
      }

      const raw = await res.json();
      const handover = raw.kind ? raw : { kind: "url" as const, url: raw.url };

      if (handover.kind === "url") {
        window.location.href = handover.url;
        return; // leaving; stay disabled
      }

      if (handover.kind === "form") {
        // Built and submitted rather than rendered into the tree: React would
        // want a re-render before the form exists in the DOM, and there is
        // nothing to gain from showing the patient a flash of hidden inputs.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = handover.action;
        form.style.display = "none";
        for (const [name, value] of Object.entries(handover.fields as Record<string, string>)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value ?? "");
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return; // leaving; stay disabled
      }

      throw new Error("That payment method could not be opened.");
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not start the payment.");
      setStarting(null);
      onBusyChange?.(false);
    }
  }

  if (methods === null) {
    return (
      <div className="mt-5 space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-paper-dim" />
        ))}
      </div>
    );
  }

  if (methods.length === 0) {
    // Said plainly. A booking page with no way to pay and no explanation is
    // read as a broken site rather than as a clinic that takes payment by phone.
    return (
      <p className="mt-4 rounded-xl border border-line bg-paper-dim/50 px-4 py-3 text-sm text-ink-soft">
        Online payment isn&apos;t switched on yet. Use &ldquo;Request a call
        back&rdquo; below and the clinic will confirm your appointment by phone.
      </p>
    );
  }

  const busy = Boolean(starting) || disabled;

  return (
    <div className="mt-5 space-y-2.5">
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={busy}
          onClick={() => pay(m)}
          className="flex w-full items-center gap-3 rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:border-indigo hover:bg-indigo/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            aria-hidden
            className="numeric grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo/10 text-xs font-bold text-indigo"
          >
            {ICON[m.id] ?? "PK"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">{m.label}</span>
            <span className="block text-xs text-ink-soft">{m.blurb}</span>
          </span>
          {starting === m.id ? (
            <InlineSpinner />
          ) : (
            amount > 0 && (
              <span className="numeric shrink-0 text-sm font-semibold text-indigo">
                PKR {amount.toLocaleString()}
              </span>
            )
          )}
        </button>
      ))}

      <p className="pt-1 text-center text-xs text-ink-soft">
        You&apos;ll finish paying on the provider&apos;s own secure page. TLC
        never sees your card or wallet PIN.
      </p>
    </div>
  );
}
