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

/**
 * How each method looks.
 *
 * The badge is initials rather than a logo: JazzCash and EasyPaisa wordmarks
 * are their trademarks and this project has no licence to redistribute them.
 * Each keeps its own colour, though — JazzCash red, EasyPaisa green — because
 * that is how a patient recognises the one they use, at a glance, without
 * reading. Cards get the clinic's own colour, since no single card brand owns
 * that row.
 */
const STYLE: Record<string, { badge: string; tint: string; ring: string }> = {
  jazzcash: {
    badge: "JC",
    tint: "bg-crimson/10 text-crimson-deep",
    ring: "hover:border-crimson/60 hover:bg-crimson/[0.04]",
  },
  easypaisa: {
    badge: "EP",
    tint: "bg-indigo/10 text-indigo-deep",
    ring: "hover:border-indigo/60 hover:bg-indigo/[0.04]",
  },
  safepay: {
    badge: "SP",
    tint: "bg-indigo/10 text-indigo-deep",
    ring: "hover:border-indigo/60 hover:bg-indigo/[0.04]",
  },
  stripe: {
    badge: "CARD",
    tint: "bg-ink/[0.06] text-ink",
    ring: "hover:border-ink/40 hover:bg-ink/[0.03]",
  },
};

const FALLBACK = { badge: "PAY", tint: "bg-indigo/10 text-indigo-deep", ring: "hover:border-indigo/60" };

/** A small padlock, so "secure" is shown rather than only claimed. */
function LockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

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
      <div className="mt-5 space-y-2.5" aria-busy>
        {[0, 1].map((i) => (
          <div key={i} className="h-[4.25rem] animate-pulse rounded-2xl bg-paper-dim" />
        ))}
      </div>
    );
  }

  if (methods.length === 0) {
    // Said plainly, and pointed somewhere. A booking page with no way to pay
    // and no explanation reads as a broken site rather than as a clinic that
    // happens to take payment by phone.
    return (
      <div className="mt-5 rounded-2xl border border-line bg-paper-dim/40 px-5 py-4">
        <p className="text-sm font-semibold text-ink">Online payment isn&apos;t open yet</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Your slot can still be held. Use{" "}
          <span className="font-medium text-ink">Request a call-back</span> below
          and the clinic will confirm it with you by phone — nothing to pay now.
        </p>
      </div>
    );
  }

  const busy = Boolean(starting) || disabled;

  return (
    <div className="mt-5">
      <ul className="space-y-2.5">
        {methods.map((m) => {
          const style = STYLE[m.id] ?? FALLBACK;
          const isStarting = starting === m.id;

          return (
            <li key={m.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => pay(m)}
                className={`group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-paper px-4 py-3.5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${
                  busy ? "" : `${style.ring} hover:-translate-y-px hover:shadow-[0_10px_24px_-18px_rgba(21,86,59,0.6)]`
                }`}
              >
                <span
                  aria-hidden
                  className={`numeric grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[0.65rem] font-bold tracking-tight ${style.tint}`}
                >
                  {style.badge}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{m.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{m.blurb}</span>
                </span>

                <span className="flex shrink-0 items-center gap-2.5">
                  {amount > 0 && (
                    <span className="numeric text-sm font-semibold text-ink">
                      PKR {amount.toLocaleString()}
                    </span>
                  )}
                  {/* The chevron only moves on hover, so the row reads as
                      "this takes you somewhere" rather than as a static box. */}
                  {isStarting ? (
                    <InlineSpinner />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="h-4 w-4 text-ink-soft/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-soft"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
        <LockIcon />
        You finish paying on the provider&apos;s own page. TLC never sees your
        card number or wallet PIN.
      </p>
    </div>
  );
}
