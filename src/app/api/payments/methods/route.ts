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
  const gateways = enabledGateways();

  /**
   * Stripe only appears when nothing else can take a card.
   *
   * Safepay and Stripe are both "Debit or credit card" to a patient, and
   * offering both put two rows on the booking page with the same name, the
   * same icon and the same amount — differing only in a line of small print
   * naming a company the patient has no opinion about. Faced with two
   * identical buttons, the honest reaction is to wonder which one is the real
   * site.
   *
   * There is also a right answer, so the page should not be asking. Stripe
   * does not pay out to a merchant registered in Pakistan: on test keys it
   * completes beautifully and on live keys the money has nowhere to land. It
   * stays in the codebase because it is genuinely useful for building and
   * demonstrating the site — which is exactly what "only when no other card
   * gateway is configured" means.
   *
   * `PAYMENTS_DISABLED=stripe` still works and still wins. This is the rule
   * for everyone who has not set it, including a deploy whose environment was
   * copied before that line existed — which is how the live site came to show
   * two card buttons while the laptop showed one.
   */
  const CARD_GATEWAYS = ["safepay"];
  const hasLocalCard = gateways.some((g) => CARD_GATEWAYS.includes(g.id));

  const methods = [
    ...gateways.map(({ id, label, blurb }) => ({
      id,
      label,
      blurb,
      via: "redirect" as const,
    })),
    ...(isStripeConfigured() && !hasLocalCard
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
