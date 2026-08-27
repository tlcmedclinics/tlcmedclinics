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

/**
 * A list of lines from a textarea, or an array passed straight through.
 *
 * Both shapes reach these routes: the form sends the English as one
 * newline-joined string and the Urdu as an array it has already split. Rather
 * than make the two agree — which would mean the client and the server each
 * knowing the rule, and one of them eventually forgetting — the server accepts
 * either and settles it here, once.
 *
 * Blank lines are dropped. People leave them behind while moving items around,
 * and an empty bullet on the public page is a fault the clinic can see and
 * cannot explain.
 */
export function toLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (value === undefined || value === null) return [];
  return String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * An optional text field: trimmed, or absent when empty.
 *
 * Used for the Urdu columns. An empty string and a missing field read the same
 * through `bilingual.pick`, but storing "" for every untranslated field puts a
 * meaningless key on every document and turns "which of these still needs
 * Urdu?" into a question the data can no longer answer.
 */
export function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
