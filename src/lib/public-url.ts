import type { NextRequest } from "next/server";

/**
 * The origin to send a customer *back* to — for Stripe's `success_url` and
 * `cancel_url`, and anything else that hands a browser a link to follow later.
 *
 * The obvious version of this is `req.nextUrl.origin`, and it's wrong in a way
 * that only shows up after someone has already paid.
 *
 * That origin is whatever host the request arrived with. In dev, opening the
 * app at http://0.0.0.0:3000 makes it `http://0.0.0.0:3000` — 0.0.0.0 means
 * "every interface I can bind to", which is a valid thing for a server to
 * listen on and not an address a browser can visit. Stripe accepts the URL
 * happily; the customer is returned to it after paying and gets
 * ERR_ADDRESS_INVALID. Behind a proxy the same thing happens with an internal
 * hostname or port. The payment succeeds either way, which is the worst shape
 * for this bug: money has moved and the patient is staring at a browser error.
 *
 * So: trust the configured public URL first, and only fall back to the request
 * when there isn't one — repairing the hosts that can't be browsed to.
 */
export function publicOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  // No NEXT_PUBLIC_SITE_URL — normal in local development. Use the request's
  // own origin so a developer testing a payment comes back to their own
  // machine rather than being thrown at the live site, but swap the
  // bind-only hosts for one the browser can actually resolve.
  return req.nextUrl.origin.replace(/:\/\/(0\.0\.0\.0|\[::\]|\[::0\])(?=[:/]|$)/, "://localhost");
}
