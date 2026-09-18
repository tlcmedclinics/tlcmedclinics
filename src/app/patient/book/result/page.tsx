import Link from "next/link";
import { T } from "@/components/T";
import { site } from "@/data/site";

/**
 * Where a patient lands after JazzCash, EasyPaisa or a card.
 *
 * A server component with no verification of its own — by the time anyone
 * reaches this page the callback route has already checked the signature,
 * matched the reference and written the appointment. This page's whole job is
 * to say what happened in a sentence.
 *
 * Three outcomes, not two. "Paid but not booked" is rare and it is the one
 * that matters most: telling that patient to try again would charge them a
 * second time, so it gets its own message and a phone number.
 */
export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const { status = "failed", message } = await searchParams;

  // Keys rather than sentences: the page is server-rendered, so the strings
  // themselves are picked in the browser by <T>.
  const view = {
    ok: {
      tone: "indigo" as const,
      titleKey: "book.result.okTitle",
      bodyKey: "book.result.okBody",
      cta: { href: "/patient/dashboard", labelKey: "book.result.goToAppointments" },
    },
    attention: {
      tone: "crimson" as const,
      titleKey: "book.result.attentionTitle",
      bodyKey: "book.result.attentionBody",
      cta: { href: `tel:${site.phoneE164}`, labelKey: "book.result.callPhone" },
    },
    failed: {
      tone: "crimson" as const,
      titleKey: "book.result.failedTitle",
      bodyKey: "book.result.failedBody",
      cta: { href: "/patient/book", labelKey: "common.retry" },
    },
  }[status === "ok" ? "ok" : status === "attention" ? "attention" : "failed"];

  return (
    <div className="mx-auto max-w-lg py-12 text-center animate-fade-up">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          view.tone === "indigo" ? "bg-indigo/10 text-indigo" : "bg-crimson/10 text-crimson"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
          {view.tone === "indigo" ? (
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <path d="M12 8v5" strokeLinecap="round" />
              <path d="M12 16.5h.01" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" />
            </>
          )}
        </svg>
      </div>

      <h1 className="mt-6 h2 text-ink">
        <T k={view.titleKey} />
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        {message || <T k={view.bodyKey} />}
      </p>

      <Link href={view.cta.href} className="btn-indigo mt-7 inline-block">
        <T k={view.cta.labelKey} vars={{ phone: site.phone }} />
      </Link>

      {status !== "ok" && (
        <p className="mt-6 text-xs text-ink-soft">
          <T k="book.result.paymentQuestions" />{" "}
          <a href={`tel:${site.phoneE164}`} className="numeric font-medium text-indigo">
            {site.phone}
          </a>
        </p>
      )}
    </div>
  );
}
