import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { checkVerificationCode, twilioConfig } from "@/lib/twilio-verify";
import { toE164 } from "@/lib/phone-format";

/**
 * POST /api/auth/phone/verify  { phone, code }  →  { token }
 *
 * Twilio confirms the code, then this mints a Firebase custom token so the
 * client can sign in. Firebase stays the identity system — Twilio only proves
 * the person holds the number.
 *
 * The token is only ever created after Twilio approves, so a client cannot
 * claim a number it doesn't control.
 */
export async function POST(req: NextRequest) {
  const config = twilioConfig();
  if (!config) {
    return NextResponse.json({ error: "auth.smsNotConfigured" }, { status: 503 });
  }

  const { phone, code } = await req.json().catch(() => ({}));
  const e164 = typeof phone === "string" ? toE164(phone) : null;
  const cleanCode = typeof code === "string" ? code.replace(/\D/g, "") : "";

  if (!e164) return NextResponse.json({ error: "auth.invalidPhone" }, { status: 400 });
  if (cleanCode.length < 4) {
    return NextResponse.json({ error: "auth.invalidCode" }, { status: 400 });
  }

  const check = await checkVerificationCode(config, e164, cleanCode);
  if (!check.ok) {
    const error =
      check.reason === "expired"
        ? "auth.codeExpired"
        : check.reason === "rate-limited"
        ? "auth.tooManyRequests"
        : "auth.invalidCode";
    return NextResponse.json({ error }, { status: check.reason === "rate-limited" ? 429 : 400 });
  }

  try {
    // Find the existing account for this number, or create one. The Firestore
    // profile (and the role claim) is created separately by
    // /api/auth/phone-register once we know their name — this only establishes
    // the Firebase Auth identity.
    let uid: string;
    try {
      uid = (await adminAuth.getUserByPhoneNumber(e164)).uid;
    } catch {
      uid = (await adminAuth.createUser({ phoneNumber: e164 })).uid;
    }

    const token = await adminAuth.createCustomToken(uid);
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    console.error("[phone/verify]", err);
    return NextResponse.json({ error: "common.somethingWrong" }, { status: 500 });
  }
}
