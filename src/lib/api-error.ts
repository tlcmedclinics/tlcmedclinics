/**
 * Pull the server's own error message off a failed response.
 *
 * Route handlers already return useful, specific errors — a missing Firestore
 * index comes back as a 503 with the exact console link to create it. Several
 * screens were throwing that away and showing "couldn't load, please refresh",
 * which turns a fixable configuration problem into a mystery.
 */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    const message = (data as { error?: unknown })?.error;
    return typeof message === "string" && message.trim() ? message : fallback;
  } catch {
    // Not JSON (a proxy error page, an empty body) — nothing better to say.
    return fallback;
  }
}

/**
 * True when the failure is a Firestore index that hasn't been deployed.
 *
 * Worth distinguishing because it isn't transient: retrying will keep failing
 * until someone runs `firebase deploy --only firestore:indexes`, so the UI
 * should say that rather than suggest a refresh.
 */
export function isIndexError(status: number, message: string): boolean {
  return status === 503 && /index/i.test(message);
}
