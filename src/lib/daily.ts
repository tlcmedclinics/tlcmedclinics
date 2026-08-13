const DAILY_API_BASE = "https://api.daily.co/v1";

/**
 * Creates a private Daily.co room for one appointment's video session.
 * The room expires a few hours after creation so stale rooms don't pile up
 * in the Daily.co dashboard.
 */
export async function createDailyRoom(appointmentId: string): Promise<string> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error("DAILY_API_KEY is not configured");
  }

  const exp = Math.floor(Date.now() / 1000) + 4 * 60 * 60; // 4 hours from now

  const res = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `appt-${appointmentId}-${Date.now()}`,
      privacy: "private",
      properties: {
        exp,
        enable_chat: true,
        enable_screenshare: true,
        eject_at_room_exp: true,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Daily.co room creation failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  return data.url as string;
}

/** A short-lived meeting token so a participant can join a private room. */
export async function createDailyToken(roomUrl: string, userName: string, isOwner: boolean) {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) throw new Error("DAILY_API_KEY is not configured");

  const roomName = roomUrl.split("/").pop();

  const res = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Daily.co token creation failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  return data.token as string;
}
