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
        // Turns recording on for the room. Without this the record button
        // simply doesn't exist in Daily's call UI — not greyed out, not
        // permission-denied, just absent — no matter what the joining token
        // says. Who is actually allowed to press it is decided separately, on
        // the token (see createDailyToken): the clinic side gets the streaming
        // permission, the patient does not.
        //
        // "cloud" means Daily records server-side and the file appears in the
        // Daily dashboard, so nothing depends on the doctor's own machine or
        // connection holding up for the length of the consultation.
        enable_recording: "cloud",
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
 *
 * The token is also what decides who may record. The room enables recording;
 * this grants the clinic side (`isOwner`) the `canAdmin: ["streaming"]`
 * permission that actually starts one, and never grants it to the patient. That
 * distinction has to live on the token rather than in the UI — a control that is
 * merely hidden is still reachable, and a patient recording a consultation
 * without the doctor knowing is not a cosmetic problem.
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

  // Built up rather than written inline because two independent rules both
  // land in `permissions`, and Daily takes one object — writing it in two
  // places would mean the second spread silently discarding the first.
  const permissions: { canSend?: string[]; canAdmin?: string[] } = {};
  if (audioOnly) permissions.canSend = ["audio"];
  if (isOwner) permissions.canAdmin = ["streaming"]; // the right to record

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
        ...(audioOnly ? { start_video_off: true, enable_screenshare: false } : {}),
        ...(Object.keys(permissions).length ? { permissions } : {}),
        // Said outright for the patient rather than left to the absence of a
        // permission. The room has recording switched on, so silence here would
        // mean relying on Daily's default staying what it is today.
        ...(isOwner ? {} : { enable_recording: false }),
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
