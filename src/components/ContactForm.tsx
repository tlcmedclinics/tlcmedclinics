"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { readApiError } from "@/lib/api-error";
import { site } from "@/data/site";

/**
 * "Send us a message" — the short form on the contact page.
 *
 * Three fields, one of them optional. This is not the booking flow and must
 * not turn into it: someone who is ready to book has a button four inches up
 * the page, and someone who is not ready is asking a question they do not yet
 * want to attach a date and a payment to.
 *
 * On success the form is replaced by a confirmation rather than cleared. A
 * cleared form looks identical to a form that failed silently, and the one
 * thing this component owes the sender is certainty that the message left.
 */
export default function ContactForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    // Read off the form now. React clears `currentTarget` once the handler
    // returns, and everything below this line is inside an await.
    const honeypot =
      (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          message,
          // Left empty by anyone with eyes; see the route.
          website: honeypot,
        }),
      });

      if (!res.ok) {
        toast.error(await readApiError(res, "Your message could not be sent."));
        return;
      }

      setSent(true);
    } catch {
      // Offline, or the request never reached the server.
      toast.error("No connection — please check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-paper-dim/50 p-6">
        <p className="font-semibold text-ink">Thank you — your message is with us.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          We reply to{" "}
          <span className="font-medium text-ink">{email}</span> within one
          business day. If it is urgent, please call us on{" "}
          <a href={`tel:${site.phoneE164}`} className="numeric font-medium text-indigo hover:underline">
            {site.phone}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
          className="btn-outline btn-sm mt-5"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-line bg-paper p-6"
    >
      <p className="font-semibold text-ink">Send us a message</p>
      <p className="mt-1.5 text-sm text-ink-soft">
        Ask us anything — fees, timings, whether a treatment is right for you.
      </p>

      {/* Honeypot. Off-screen rather than display:none, which some bots check
          for, and taken out of the tab order so no keyboard user lands in it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-5 space-y-4">
        <div className="field">
          <label className="label" htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="contact-name">
            Name <span className="font-normal text-ink-soft/70">(optional)</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How should we address you?"
            className="input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you would like to know."
            className="input resize-none"
          />
          <p className="field-hint">
            Please do not include medical details you would not want in an
            email — we will take those in the consultation.
          </p>
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-indigo mt-5 w-full !py-3">
        {busy ? "Sending…" : "Send message"}
      </button>

      <p className="mt-3 text-center text-xs text-ink-soft/80">
        Goes straight to{" "}
        <span className="font-medium text-ink-soft">{site.email}</span>.
      </p>
    </form>
  );
}
