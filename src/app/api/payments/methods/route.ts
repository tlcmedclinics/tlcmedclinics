import { NextResponse } from "next/server";
import { enabledGateways } from "@/lib/gateways";

/**
 * Which payment methods the booking page should offer.
 *
 * The page cannot work this out for itself: the credentials live in
 * server-only environment variables, and they must stay that way — a
 * NEXT_PUBLIC_ prefix on a merchant password puts it in the JavaScript bundle
 * for anyone to read.
 *
 * So the list is computed here and sent as plain metadata. Nothing secret
 * crosses: a gateway either appears or it doesn't.
 */
export async function GET() {
  return NextResponse.json(
    enabledGateways().map(({ id, label, blurb }) => ({ id, label, blurb })),
    {
      // Whether a gateway is switched on changes when someone edits the
      // environment and restarts, which is not something a patient's browser
      // should cache for an hour.
      headers: { "Cache-Control": "no-store" },
    }
  );
}
