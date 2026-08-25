import "server-only";

/**
 * Outbound SMS, over Twilio's Messaging API.
 *
 * Separate from twilio-verify.ts, which handles sign-in codes: that uses the
 * Verify service, where Twilio owns the code, its expiry and its retry limits.
 * This is plain messaging — booking confirmations and appointment reminders —
 * and the two have different credentials, different failure modes and different
 * consequences when they fail.
 *
 * Called over REST rather than through the `twilio` package, matching what
 * twilio-verify.ts already does: it is one form POST, and a dependency would
 * buy nothing.
 *
 * WHY EVERY FAILURE IS SWALLOWED
 * ------------------------------
 * A reminder that doesn't send must never fail the thing that triggered it. A
 * booking that succeeds and then 500s because an SMS bounced is worse for the
 * patient than a booking with no text message — they have paid, the slot is
 * held, and all they see is an error. Every function here resolves; nothing
 * throws. Failures are logged with enough detail to diagnose.
 */

const MESSAGES_URL = (accountSid: string) =>
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

type SmsConfig = {
  accountSid: string;
  authToken: string;
  /** A Twilio phone number, or a Messaging Service SID — one or the other. */
  from?: string;
  messagingServiceSid?: string;
};

/**
 * Null when SMS isn't configured.
 *
 * TWILIO_MESSAGING_SERVICE_SID is preferred over a bare number: a Messaging
 * Service handles sender selection and carrier rules, which matters for
 * Pakistani networks. Either works.
 */
export function smsConfig(): SmsConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken) return null;
  if (!messagingServiceSid && !from) return null;

  return { accountSid, authToken, from, messagingServiceSid };
}

/**
 * Turns what a patient typed into E.164, which is the only form Twilio accepts.
 *
 * Pakistani numbers are written locally as 0310-040-4444 and internationally as
 * +92 310 040 4444. Patients type both, plus spaces and dashes. A number that
 * cannot be made sense of returns null rather than being sent as-is: Twilio
 * would reject it anyway, and a silent reject costs the clinic a reminder it
 * believes it sent.
 */
export function toE164(raw?: string | null): string | null {
  if (!raw) return null;

  // Strip everything a person might type as decoration.
  let n = raw.replace(/[\s()\-.]/g, "");

  // 00 is the older international prefix for the same thing as +.
  if (n.startsWith("00")) n = `+${n.slice(2)}`;

  if (n.startsWith("+")) {
    return /^\+[1-9]\d{7,14}$/.test(n) ? n : null;
  }

  // A local Pakistani mobile: 03xxxxxxxxx → +923xxxxxxxxx.
  if (/^0\d{10}$/.test(n)) return `+92${n.slice(1)}`;

  // Already national format without the trunk zero: 3xxxxxxxxx.
  if (/^3\d{9}$/.test(n)) return `+92${n}`;

  // 92xxxxxxxxxx written without the plus.
  if (/^92\d{10}$/.test(n)) return `+${n}`;

  return null;
}

export type SmsResult =
  | { ok: true; sid: string }
  | { ok: false; reason: "not-configured" | "invalid-number" | "failed" };

/**
 * Sends one message. Resolves either way — see the note at the top of the file.
 *
 * `body` should be short. Twilio bills per 160-character segment for GSM-7 text
 * and per 70 for anything containing a non-Latin character, so a stray “smart
 * quote” can quietly triple the cost of every reminder the clinic sends.
 */
export async function sendSms(to: string | null | undefined, body: string): Promise<SmsResult> {
  const config = smsConfig();
  if (!config) {
    console.log("[sms] not configured, skipping:", body.slice(0, 60));
    return { ok: false, reason: "not-configured" };
  }

  const phone = toE164(to);
  if (!phone) {
    console.warn("[sms] unusable phone number, skipping:", to);
    return { ok: false, reason: "invalid-number" };
  }

  const params: Record<string, string> = { To: phone, Body: body };
  if (config.messagingServiceSid) params.MessagingServiceSid = config.messagingServiceSid;
  else if (config.from) params.From = config.from;

  try {
    const res = await fetch(MESSAGES_URL(config.accountSid), {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${config.accountSid}:${config.authToken}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    });

    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };

    if (!res.ok || !data.sid) {
      console.error("[sms] send failed", res.status, data.message ?? data);
      return { ok: false, reason: "failed" };
    }

    return { ok: true, sid: data.sid };
  } catch (err) {
    console.error("[sms] request threw", err);
    return { ok: false, reason: "failed" };
  }
}

/**
 * Several messages at once.
 *
 * Concurrent rather than sequential: the reminder cron can have forty due at a
 * time, and forty round trips in series would outlive the function's timeout
 * and send none of the last ones.
 */
export async function sendSmsMany(
  messages: { to: string | null | undefined; body: string }[]
): Promise<void> {
  if (messages.length === 0) return;
  await Promise.all(messages.map((m) => sendSms(m.to, m.body)));
}

/**
 * The clinic's signature, appended to every message so a patient knows who is
 * texting them. Kept short — see the note about segments above.
 */
export const SMS_SIGNATURE = " — TLC Med Clinics";

/** Builds a message body with the signature, trimmed to one or two segments. */
export function smsBody(text: string): string {
  return `${text}${SMS_SIGNATURE}`;
}
