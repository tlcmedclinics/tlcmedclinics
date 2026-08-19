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

function tone(
  audio: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  peak = 0.18
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  // Quick attack, exponential decay — a soft bell rather than a flat beep. The
  // tiny non-zero floor is because exponential ramps can't reach 0.
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Runs `play` against a live context, swallowing anything that goes wrong. */
function withAudio(play: (audio: AudioContext, now: number) => void) {
  try {
    const audio = getContext();
    if (!audio) return;
    // Autoplay policy parks the context in "suspended" until a gesture.
    if (audio.state === "suspended") void audio.resume();
    play(audio, audio.currentTime);
  } catch {
    // Audio is a nicety — never let it break the surrounding UI.
  }
}

/** A notification arrived: a rising two-note chime. */
export function playNotificationChime() {
  withAudio((audio, now) => {
    tone(audio, 880, now, 0.18); // A5
    tone(audio, 1174.66, now + 0.11, 0.26); // D6
  });
}

/**
 * Your message went out: one short, quiet, rising blip.
 *
 * Deliberately smaller than the notification chime — you already know you
 * pressed send, so this is confirmation, not an alert.
 */
export function playMessageSentTone() {
  withAudio((audio, now) => {
    tone(audio, 660, now, 0.07, 0.1);
    tone(audio, 990, now + 0.05, 0.1, 0.1);
  });
}

/** A message came in while the chat is open: a soft falling pair. */
export function playMessageReceivedTone() {
  withAudio((audio, now) => {
    tone(audio, 990, now, 0.08, 0.13);
    tone(audio, 740, now + 0.07, 0.14, 0.13);
  });
}
