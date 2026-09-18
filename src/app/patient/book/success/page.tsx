"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/contexts/LanguageContext";

type State = "verifying" | "done" | "error";

function StripeReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const [state, setState] = useState<State>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setState("error");
      setMessage(t("book.missingSession"));
      return;
    }

    authedFetch("/api/payments/stripe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("book.verifyFailed"));
        setState("done");
      })
      .catch((err) => {
        setState("error");
        setMessage(err instanceof Error ? err.message : t("book.verifyFailed"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-lg py-10 text-center animate-fade-up">
      {state === "verifying" && (
        <>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo/30 border-t-indigo" />
          <p className="mt-6 lede">{t("book.verifyingPayment")}</p>
        </>
      )}

      {state === "done" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-6 h2 text-ink">{t("book.booked")}</p>
          <p className="mt-2 lede">{t("book.paymentConfirmed")}</p>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="mt-6 rounded-full bg-indigo px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-deep"
          >
            {t("book.backToDashboard")}
          </button>
        </>
      )}

      {state === "error" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-crimson/10">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-crimson" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v5M12 16h.01M12 3 2 20h20L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-6 h2 text-ink">{t("book.paymentUnconfirmed")}</p>
          <p className="mt-2 lede">{message}</p>
          <button
            onClick={() => router.push("/patient/book")}
            className="mt-6 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-indigo hover:text-indigo"
          >
            {t("book.backToBooking")}
          </button>
        </>
      )}
    </div>
  );
}

export default function StripeReturnPage() {
  return (
    <Suspense fallback={null}>
      <StripeReturnContent />
    </Suspense>
  );
}
