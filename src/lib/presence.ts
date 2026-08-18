/**
 * Doctor presence.
 *
 * A doctor is "online" when they've been active in the app recently — not
 * because they remembered to flip a switch. The client sends a heartbeat while
 * the tab is visible; the server stores `lastSeenAt` and everything else is
 * derived from it, so a doctor who closes their laptop goes offline on their
 * own instead of being shown as available all night.
 *
 * Shared by the client hook and the API routes so both sides agree on the
 * window.
 */

/** How often the client re-stamps `lastSeenAt` while the tab is open. */
export const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * How long after the last heartbeat a doctor still counts as online. Comfortably
 * more than one interval so a single missed beat (a sleeping tab, a slow
 * request) doesn't flicker them offline.
 */
export const PRESENCE_WINDOW_MS = 150_000;

/**
 * Whether a doctor should be shown as online.
 *
 * `presenceVisible === false` means they've opted out in Settings — they can be
 * fully active and still appear offline, which is the point of the setting.
 * Undefined means opted in, so accounts created before the setting existed
 * behave sensibly.
 */
export function isOnline(
  input: { lastSeenAt?: string; presenceVisible?: boolean },
  now: number = Date.now()
): boolean {
  if (input.presenceVisible === false) return false;
  if (!input.lastSeenAt) return false;
  const lastSeen = Date.parse(input.lastSeenAt);
  if (Number.isNaN(lastSeen)) return false;
  return now - lastSeen < PRESENCE_WINDOW_MS;
}
