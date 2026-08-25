import Link from "next/link";
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

  const view = {
    ok: {
      tone: "indigo" as const,
      title: "Appointment confirmed",
      body: message || "Your payment was received and your slot is booked.",
      cta: { href: "/patient/dashboard", label: "Go to my appointments" },
    },
    attention: {
      tone: "crimson" as const,
      title: "Please call the clinic",
      body:
        message ||
        "Your payment went through but we could not confirm the appointment. Please do not pay again.",
      cta: { href: `tel:${site.phoneE164}`, label: `Call ${site.phone}` },
    },
    failed: {
      tone: "crimson" as const,
      title: "Payment not completed",
      body: message || "Nothing has been charged. You can pick your time again.",
      cta: { href: "/patient/book", label: "Try again" },
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

      <h1 className="mt-6 h2 text-ink">{view.title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{view.body}</p>

      <Link href={view.cta.href} className="btn-indigo mt-7 inline-block">
        {view.cta.label}
      </Link>

      {status !== "ok" && (
        <p className="mt-6 text-xs text-ink-soft">
          Any questions about a payment — call{" "}
          <a href={`tel:${site.phoneE164}`} className="numeric font-medium text-indigo">
            {site.phone}
          </a>
          .
        </p>
      )}
    </div>
  );
}
