import { NextResponse } from "next/server";
import { STRIPE_METHOD, enabledGateways, isStripeConfigured } from "@/lib/gateways";

/**
 * Which payment methods the booking page should offer.
 *
 * The page cannot work this out for itself: the credentials live in
 * server-only environment variables, and they must stay that way — a
 * NEXT_PUBLIC_ prefix on a merchant password puts it in the JavaScript bundle
 * for anyone to read.
 *
 * So the list is computed here and sent as plain metadata. Nothing secret
 * crosses: a method either appears or it doesn't.
 *
 * `via` tells the client which road to take. "redirect" methods all go through
 * /api/payments/start; Stripe keeps its own route, which already works and is
 * not worth rewriting to match. The client needs to know, so it is said here
 * rather than inferred from the id in three places.
 */
export async function GET() {
  const methods = [
    ...enabledGateways().map(({ id, label, blurb }) => ({
      id,
      label,
      blurb,
      via: "redirect" as const,
    })),
    ...(isStripeConfigured()
      ? [
          {
            id: STRIPE_METHOD.id,
            label: STRIPE_METHOD.label,
            blurb: STRIPE_METHOD.blurb,
            via: "stripe" as const,
          },
        ]
      : []),
  ];

  return NextResponse.json(methods, {
    // Whether a method is switched on changes when someone edits the
    // environment and restarts, which is not something a patient's browser
    // should cache for an hour.
    headers: { "Cache-Control": "no-store" },
  });
}
