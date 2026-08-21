import type { NextRequest } from "next/server";

/**
 * The origin to send a customer *back* to — Stripe's `success_url` and
 * `cancel_url`, and anything else that hands a browser a link to follow later.
 *
 * The obvious version of this is `req.nextUrl.origin`, and it is wrong in a way
 * that only surfaces after someone has already paid.
 *
 * That origin comes from the host the request arrived with, which is the host
 * the *server* is listening on, not the one the customer typed. On this setup
 * Next.js is bound to 0.0.0.0:3000 with a reverse proxy in front, so a request
 * to https://tlcmedclinics.com reaches the app looking like http://0.0.0.0:3000.
 * 0.0.0.0 means "every interface I can bind to" — fine to listen on, impossible
 * to browse to. Stripe accepts the URL without complaint and returns the
 * customer to it after payment, where they get ERR_ADDRESS_INVALID. The money
 * has already moved. That is the worst shape a bug like this can take.
 *
 * So the order below is deliberate: what the site is configured to be, then
 * what the proxy says the customer asked for, and only then the raw socket —
 * repaired, because a bind address is never a usable answer.
 */
export function publicOrigin(req: NextRequest): string {
  // 1. The configured public URL. Always correct, never guessed. Set
  //    NEXT_PUBLIC_SITE_URL in production and nothing below this ever runs.
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  // 2. What the reverse proxy recorded before it forwarded the request. This
  //    is the host the customer actually visited, which is exactly what's
  //    needed — but it arrives in a header, and headers can be set by whoever
  //    is calling. An attacker who reaches the app directly could point a
  //    payment's return URL at their own domain. Only a fallback for that
  //    reason: set NEXT_PUBLIC_SITE_URL and this stays unused.
  const forwardedHost = firstValue(req.headers.get("x-forwarded-host"));
  if (forwardedHost && isBrowsable(forwardedHost)) {
    const proto = firstValue(req.headers.get("x-forwarded-proto")) ?? "https";
    warnOnce(
      `[public-url] NEXT_PUBLIC_SITE_URL is not set — falling back to the x-forwarded-host header (${forwardedHost}). Set NEXT_PUBLIC_SITE_URL to the site's public URL.`
    );
    return `${proto}://${forwardedHost}`;
  }

  // 3. The request's own origin. Normal in local development. Swap the
  //    listen-only hosts for one a browser can resolve, so a developer testing
  //    a payment lands back on their own machine instead of a dead address.
  const origin = req.nextUrl.origin.replace(
    /:\/\/(0\.0\.0\.0|\[::\]|\[::0\])(?=[:/]|$)/,
    "://localhost"
  );

  if (process.env.NODE_ENV === "production") {
    warnOnce(
      `[public-url] NEXT_PUBLIC_SITE_URL is not set and no x-forwarded-host was present. Returning ${origin}, which is almost certainly not reachable by a customer. Set NEXT_PUBLIC_SITE_URL.`
    );
  }

  return origin;
}

function firstValue(value: string | null): string | undefined {
  // A request through several proxies gives "a.example, b.internal" — the
  // first entry is the one the customer actually asked for.
  const first = value?.split(",")[0]?.trim();
  return first || undefined;
}

/** Rejects hosts that exist only from the server's point of view. */
function isBrowsable(host: string): boolean {
  const name = host.replace(/:\d+$/, "").toLowerCase();
  return name !== "0.0.0.0" && name !== "localhost" && name !== "127.0.0.1" && name !== "[::]";
}

// One line per process, not one per checkout — a misconfiguration should be
// visible in the log, not drown it.
let warned = false;
function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(message);
}
