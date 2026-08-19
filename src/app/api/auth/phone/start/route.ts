import { NextRequest, NextResponse } from "next/server";
import { consumeOtpAllowance } from "@/lib/otp-throttle";
import { sendVerificationCode, twilioConfig } from "@/lib/twilio-verify";
import { toE164 } from "@/lib/phone-format";

/**
 * POST /api/auth/phone/start  { phone }
 *
 * Sends a sign-in code over Twilio. Deliberately says nothing about whether an
 * account exists for the number: replying "no such user" here would turn this
 * into a way to test which phone numbers are registered patients.
 */
export async function POST(req: NextRequest) {
  const config = twilioConfig();
  if (!config) {
    console.error("[phone/start] TWILIO_* env vars are not set");
    return NextResponse.json({ error: "auth.smsNotConfigured" }, { status: 503 });
  }

  const { phone } = await req.json().catch(() => ({}));
  const e164 = typeof phone === "string" ? toE164(phone) : null;
  if (!e164) {
    return NextResponse.json({ error: "auth.invalidPhone" }, { status: 400 });
  }

  // Throttle first — the check records the attempt, so a burst can't all slip
  // through before the first send completes.
  const allowance = await consumeOtpAllowance(e164);
  if (!allowance.allowed) {
    return NextResponse.json(
      {
        error: allowance.reason === "too-soon" ? "auth.resendTooSoon" : "auth.tooManyRequests",
        retryAfterSeconds: allowance.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const result = await sendVerificationCode(config, e164);
  if (!result.ok) {
    const error =
      result.reason === "invalid-phone"
        ? "auth.invalidPhone"
        : result.reason === "rate-limited"
        ? "auth.tooManyRequests"
        : "auth.smsFailed";
    return NextResponse.json({ error }, { status: result.reason === "invalid-phone" ? 400 : 502 });
  }

  return NextResponse.json({ ok: true });
}
