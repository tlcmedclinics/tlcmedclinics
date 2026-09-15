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
 * ── Why icons and not logos ──
 *
 * JazzCash and EasyPaisa wordmarks are their trademarks and this project has
 * no licence to redistribute them. The first version of this used two-letter
 * initials instead — "JC", "EP", "SP" — which is safe and also looks like a
 * placeholder somebody forgot to finish. A patient about to type a card number
 * reads that as an unfinished site, and an unfinished site is not one you hand
 * your card to.
 *
 * So: a drawn icon of the *kind* of payment, not the brand. A card looks like
 * a card and a wallet looks like a wallet in any country, and neither belongs
 * to anyone. Each method keeps its own colour, because that is how a patient
 * picks out the one they use at a glance, without reading.
 *
 * The provider is still named — in words, under the label, where the server
 * put it ("secured by Safepay"). Naming a company is not the same as
 * reproducing its mark.
 */
type Glyph = "card" | "wallet" | "bank";

const STYLE: Record<string, { glyph: Glyph; tint: string; ring: string }> = {
  jazzcash: {
    glyph: "wallet",
    tint: "bg-crimson/[0.08] text-crimson-deep",
    ring: "hover:border-crimson/50 hover:bg-crimson/[0.03]",
  },
  easypaisa: {
    glyph: "wallet",
    tint: "bg-indigo/[0.08] text-indigo-deep",
    ring: "hover:border-indigo/50 hover:bg-indigo/[0.03]",
  },
  safepay: {
    glyph: "card",
    tint: "bg-indigo/[0.08] text-indigo-deep",
    ring: "hover:border-indigo/50 hover:bg-indigo/[0.03]",
  },
  stripe: {
    glyph: "card",
    tint: "bg-ink/[0.06] text-ink",
    ring: "hover:border-ink/40 hover:bg-ink/[0.03]",
  },
};

function MethodGlyph({ glyph }: { glyph: Glyph }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-[1.15rem] w-[1.15rem]",
  };
  if (glyph === "wallet") {
    return (
      <svg {...common}>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a1 1 0 0 1 1 1v1.5" />
        <rect x="3" y="7.5" width="18" height="11.5" rx="2.5" />
        <path d="M21 11.5h-4a2.25 2.25 0 0 0 0 4.5h4" />
      </svg>
    );
  }
  if (glyph === "bank") {
    return (
      <svg {...common}>
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M5 10v8M10 10v8M14 10v8M19 10v8" />
        <path d="M3 20.5h18" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 14.5h3.5" />
    </svg>
  );
}

const FALLBACK: { glyph: Glyph; tint: string; ring: string } = {
  glyph: "bank",
  tint: "bg-indigo/[0.08] text-indigo-deep",
  ring: "hover:border-indigo/50",
};

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
                  busy ? "" : `${style.ring} hover:shadow-[0_6px_18px_-14px_rgba(21,86,59,0.55)]`
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${style.tint}`}
                >
                  <MethodGlyph glyph={style.glyph} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{m.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{m.blurb}</span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  {amount > 0 && (
                    <span className="text-right leading-tight">
                      {/* Labelled, because an unexplained figure beside a
                          chevron is the one number a patient will squint at.
                          This is the advance, not the whole price, and the
                          difference is worth one small word. */}
                      <span className="block text-[0.625rem] font-medium uppercase tracking-wide text-ink-soft/70">
                        Due now
                      </span>
                      <span className="numeric block text-sm font-semibold text-ink">
                        PKR {amount.toLocaleString()}
                      </span>
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

      <div className="mt-4 flex items-start justify-center gap-2 rounded-xl bg-paper-dim/60 px-4 py-3">
        <span className="mt-px text-ink-soft/70">
          <LockIcon />
        </span>
        <p className="text-center text-xs leading-relaxed text-ink-soft">
          Payment is completed on the provider&apos;s own secure page. TLC Med
          Clinics never sees or stores your card number or wallet PIN.
        </p>
      </div>
    </div>
  );
}
