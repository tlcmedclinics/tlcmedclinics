"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { useT } from "@/contexts/LanguageContext";
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
  const t = useT();
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
        toast.error(await readApiError(res, t("contact.form.sendFailed")));
        return;
      }

      setSent(true);
    } catch {
      // Offline, or the request never reached the server.
      toast.error(t("common.offline"));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-paper-dim/50 p-6">
        <p className="font-semibold text-ink">{t("contact.form.sentTitle")}</p>
        {/* The address sits inside the sentence as a placeholder rather than in
            a span of its own: Urdu puts it in a different position, and two
            fragments either side of it only line up in English. */}
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {t("contact.form.sentBody", { email })}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          {t("contact.form.sentUrgent")}{" "}
          <a href={`tel:${site.phoneE164}`} className="numeric font-medium text-indigo hover:underline">
            {site.phone}
          </a>
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
          className="btn-outline btn-sm mt-5"
        >
          {t("contact.form.sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-line bg-paper p-6"
    >
      <p className="font-semibold text-ink">{t("contact.form.title")}</p>
      <p className="mt-1.5 text-sm text-ink-soft">{t("contact.form.lede")}</p>

      {/* Honeypot. Off-screen rather than display:none, which some bots check
          for, and taken out of the tab order so no keyboard user lands in it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">{t("contact.form.honeypot")}</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-5 space-y-4">
        <div className="field">
          <label className="label" htmlFor="contact-email">
            {t("contact.label.email")}
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
            {t("contact.form.name")}{" "}
            <span className="font-normal text-ink-soft/70">
              ({t("common.optional")})
            </span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("contact.form.namePlaceholder")}
            className="input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="contact-message">
            {t("contact.form.message")}
          </label>
          <textarea
            id="contact-message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("contact.form.messagePlaceholder")}
            className="input resize-none"
          />
          <p className="field-hint">{t("contact.form.privacy")}</p>
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-indigo mt-5 w-full !py-3">
        {busy ? t("contact.form.sending") : t("contact.form.submit")}
      </button>

      <p className="mt-3 text-center text-xs text-ink-soft/80">
        {t("contact.form.goesTo", { email: site.email })}
      </p>
    </form>
  );
}
