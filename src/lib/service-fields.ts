/**
 * Helpers for the numeric fields on a Service.
 *
 * This lives in lib rather than beside the route that uses it because a Next.js
 * route file may only export the HTTP handlers and a short list of config
 * values. Exporting anything else — as this function briefly was, from
 * app/api/services/route.ts — fails the production build with a message that
 * names a generated file nobody wrote:
 *
 *   .next/types/app/api/services/route.ts: error TS2344:
 *   Type 'OmitWithTag' does not satisfy the constraint '{ [x: string]: never }'.
 *   Property 'optionalNumber' is incompatible with index signature.
 *
 * `next dev` never checks this, so the mistake only appears at deploy time.
 */

/**
 * A number from a form field, or undefined.
 *
 * An empty input arrives as "" and has to stay absent rather than becoming 0.
 * For `advancePayment` those mean opposite things — absent is "charge the full
 * price online", zero is "charge nothing at all" — and Number("") is 0, which
 * is exactly the trap.
 */
export function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
