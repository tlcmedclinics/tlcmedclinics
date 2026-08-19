import "server-only";

/**
 * Twilio Verify — sends and checks the phone sign-in code.
 *
 * Verify rather than raw SMS on purpose: Twilio generates the code, enforces
 * its expiry, counts failed attempts and handles carrier delivery quirks. The
 * alternative is storing hashed codes ourselves and re-implementing all of
 * that, which is a lot of security-sensitive code to get subtly wrong.
 *
 * Called over REST rather than through the `twilio` npm package — the two
 * endpoints we need are a form POST each, so a dependency would buy nothing.
 *
 * Nothing here trusts the client: the code is checked against Twilio on the
 * server, and only then does the caller mint a Firebase token.
 */

const VERIFY_BASE = "https://verify.twilio.com/v2/Services";

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

/** Null when Twilio isn't configured, so callers can fail with a clear message. */
export function twilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) return null;
  return { accountSid, authToken, serviceSid };
}

function authHeader({ accountSid, authToken }: TwilioConfig) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

async function twilioPost(
  config: TwilioConfig,
  path: string,
  body: Record<string, string>
) {
  const res = await fetch(`${VERIFY_BASE}/${config.serviceSid}/${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(config),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "invalid-phone" | "rate-limited" | "failed" };

/** Sends a fresh code to `phone` (E.164). */
export async function sendVerificationCode(
  config: TwilioConfig,
  phone: string
): Promise<SendResult> {
  const { ok, status, data } = await twilioPost(config, "Verifications", {
    To: phone,
    Channel: "sms",
  });

  if (ok) return { ok: true };

  // 60200 = invalid parameter (usually a malformed number),
  // 60203 = max send attempts reached for this number.
  const code = (data as { code?: number }).code;
  if (code === 60200) return { ok: false, reason: "invalid-phone" };
  if (code === 60203 || status === 429) return { ok: false, reason: "rate-limited" };

  console.error("[twilio] send failed", status, data);
  return { ok: false, reason: "failed" };
}

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: "invalid-code" | "expired" | "rate-limited" | "failed" };

/** Checks a code the user typed. Approval is decided by Twilio, not by us. */
export async function checkVerificationCode(
  config: TwilioConfig,
  phone: string,
  code: string
): Promise<CheckResult> {
  const { ok, status, data } = await twilioPost(config, "VerificationCheck", {
    To: phone,
    Code: code,
  });

  if (ok && (data as { status?: string }).status === "approved") return { ok: true };
  if (ok) return { ok: false, reason: "invalid-code" };

  // 20404 = the verification no longer exists, i.e. it expired or was already
  // consumed. 60202 = too many check attempts on this verification.
  const twilioCode = (data as { code?: number }).code;
  if (twilioCode === 20404 || status === 404) return { ok: false, reason: "expired" };
  if (twilioCode === 60202 || status === 429) return { ok: false, reason: "rate-limited" };

  console.error("[twilio] check failed", status, data);
  return { ok: false, reason: "failed" };
}
