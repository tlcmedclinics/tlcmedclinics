// Firestore throws FAILED_PRECONDITION when a query needs a composite index
// that doesn't exist yet, and helpfully puts a "create it here" console URL in
// the message. Without this the app just shows "couldn't load" and the real
// cause is buried in the server log — so route handlers use these helpers to
// surface something actionable instead.
//
// The fix is always the same: add the index to firestore.indexes.json and run
//   firebase deploy --only firestore:indexes

export function isMissingIndexError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  const message = String((err as { message?: unknown }).message ?? "");
  // code 9 === FAILED_PRECONDITION in the gRPC status enum.
  return code === 9 || /requires an index|FAILED_PRECONDITION/i.test(message);
}

/** The Firebase console link Firestore embeds in the error, if present. */
export function missingIndexUrl(err: unknown): string | undefined {
  const message = String((err as { message?: unknown })?.message ?? "");
  return message.match(/https:\/\/console\.firebase\.google\.com\/\S+/)?.[0];
}

export function missingIndexMessage(err: unknown): string {
  const url = missingIndexUrl(err);
  return (
    "This view needs a Firestore index that hasn't been created yet. " +
    "Run `firebase deploy --only firestore:indexes` and wait for it to finish building" +
    (url ? `, or create it directly: ${url}` : ".")
  );
}
