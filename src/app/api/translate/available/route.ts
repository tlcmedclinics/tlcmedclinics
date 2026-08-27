import { NextResponse } from "next/server";

/**
 * Whether the machine-translation draft button should appear.
 *
 * A separate, unauthenticated route from /api/translate on purpose. The admin
 * form asks this on load, before anyone has pressed anything, and the answer is
 * one boolean carrying nothing secret — whether an environment variable is set,
 * not what it says.
 *
 * The alternative would be for the form to call the real endpoint and read a
 * 503 as "no". That works and it is worse: it spends an authenticated round
 * trip to learn a setting, and it logs a failure every time an admin opens a
 * form on a site that was never going to have the feature.
 */
export async function GET() {
  return NextResponse.json(
    { available: Boolean(process.env.TRANSLATE_API_KEY?.trim()) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
