"use client";

// A short two-note chime for incoming notifications, synthesised with the Web
// Audio API rather than shipped as an audio file — no extra asset to load, no
// format fallbacks, and it stays crisp at any volume.
//
// Browsers block audio until the user has interacted with the page, so the
// first chime after a cold load may be silently dropped. That's expected: by
// the time a notification arrives the user has almost always clicked
// something, and a dropped chime is never worth surfacing as an error.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

function tone(audio: AudioContext, frequency: number, startAt: number, duration: number) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  // Quick attack, exponential decay — a soft bell rather than a flat beep. The
  // tiny non-zero floor is because exponential ramps can't reach 0.
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Plays the notification chime. Safe to call anywhere; never throws. */
export function playNotificationChime() {
  try {
    const audio = getContext();
    if (!audio) return;
    // Autoplay policy parks the context in "suspended" until a gesture.
    if (audio.state === "suspended") void audio.resume();

    const now = audio.currentTime;
    tone(audio, 880, now, 0.18); // A5
    tone(audio, 1174.66, now + 0.11, 0.26); // D6
  } catch {
    // Audio is a nicety — never let it break the surrounding UI.
  }
}
