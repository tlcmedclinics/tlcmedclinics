const DAILY_API_BASE = "https://api.daily.co/v1";

/**
 * Creates a private Daily.co room for one appointment's session.
 * The room expires a few hours after creation so stale rooms don't pile up
 * in the Daily.co dashboard.
 *
 * `audioOnly` is for appointments booked as an audio call: everyone joins with
 * the camera off and the video/screenshare controls are hidden, so it behaves
 * as a phone call rather than a video call with the camera muted. The token
 * (below) is what actually enforces it — this just makes the UI match.
 */
export async function createDailyRoom(
  appointmentId: string,
  audioOnly = false
): Promise<string> {
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
        enable_screenshare: !audioOnly,
        eject_at_room_exp: true,
        start_video_off: audioOnly,
        start_audio_off: false,
        // Skip the "check your camera" lobby for audio calls — there's no
        // camera to check, and it's one less step before the two of them are
        // talking.
        enable_prejoin_ui: !audioOnly,
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

/**
 * A short-lived meeting token so a participant can join a private room.
 *
 * For an audio call the token restricts what the participant is allowed to
 * publish to audio only. This is the real guarantee: even if someone digs into
 * the call UI, no camera track can be sent.
 */
export async function createDailyToken(
  roomUrl: string,
  userName: string,
  isOwner: boolean,
  audioOnly = false
) {
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
        ...(audioOnly
          ? {
              start_video_off: true,
              enable_screenshare: false,
              permissions: { canSend: ["audio"] },
            }
          : {}),
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
