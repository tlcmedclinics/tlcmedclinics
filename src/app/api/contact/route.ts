import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendMail } from "@/lib/mailer";
import { site } from "@/data/site";

/**
 * The contact form on /contact.
 *
 * Deliberately not the booking flow and not `/api/inquiries`: this is the
 * "I have a question before I book" route. It asks for an email address and a
 * message and nothing else, because every extra required field on a form like
 * this loses people who would otherwise have written in.
 *
 * The message is written to Firestore *first* and emailed second. SMTP is the
 * part that fails — an expired app password, a provider rate limit, a
 * misconfigured host — and a patient's question must not disappear because the
 * mail server had a bad afternoon. If the email never leaves, the message is
 * still in `contactMessages` where the clinic can find it.
 */

const MAX_MESSAGE = 4000;
const MAX_NAME = 120;

/** Good enough to catch typos; the real test is whether a reply arrives. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * One message per address per minute, held in memory.
 *
 * Not a real rate limiter — a serverless instance recycling forgets everyone,
 * and a determined spammer just changes the address. It exists to stop the
 * ordinary case: someone taps submit four times because nothing looked like it
 * happened. Anything stronger belongs in front of the app, not here.
 */
const lastSeen = new Map<string, number>();
const WINDOW_MS = 60_000;

function tooSoon(key: string): boolean {
  const now = Date.now();

  // Cheap sweep so the map cannot grow without bound on a long-lived instance.
  if (lastSeen.size > 500) {
    for (const [k, t] of lastSeen) if (now - t > WINDOW_MS) lastSeen.delete(k);
  }

  const previous = lastSeen.get(key);
  if (previous && now - previous < WINDOW_MS) return true;
  lastSeen.set(key, now);
  return false;
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const email = clean(raw.email, 200).toLowerCase();
  const message = clean(raw.message, MAX_MESSAGE);
  const name = clean(raw.name, MAX_NAME);

  // A hidden field no person ever sees. A bot fills every input it finds, so
  // anything with a value here is discarded — and answered with 200, because
  // telling a bot it was caught only teaches it to try again differently.
  if (clean(raw.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: "Please enter an email address we can reply to." },
      { status: 400 }
    );
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: "Please tell us a little more — at least a sentence." },
      { status: 400 }
    );
  }

  if (tooSoon(email)) {
    return NextResponse.json(
      { error: "We already have that message — we will reply shortly." },
      { status: 429 }
    );
  }

  const entry = {
    name: name || null,
    email,
    message,
    status: "new" as const,
    source: "contact-page",
    createdAt: new Date().toISOString(),
  };

  try {
    await adminDb.collection("contactMessages").add(entry);
  } catch (err) {
    console.error("[contact] could not store message:", err);
    return NextResponse.json(
      { error: "We could not save your message. Please call the clinic." },
      { status: 503 }
    );
  }

  // Best effort from here. The message is safe; a failed send is logged and
  // the sender is still told it arrived, because as far as they are concerned
  // it has.
  sendMail({
    to: site.email,
    replyTo: email,
    subject: `Website contact — ${name || email}`,
    text: [
      `From: ${name ? `${name} <${email}>` : email}`,
      `Sent: ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`,
      "",
      message,
      "",
      "— Reply directly to this email to answer the sender.",
    ].join("\n"),
  }).catch((err) => console.error("[contact] mail failed:", err));

  return NextResponse.json({ ok: true });
}
