"use client";

import { useState } from "react";
import Overlay from "@/components/Overlay";
import { useT } from "@/contexts/LanguageContext";

type Props = {
  roomUrl: string;
  joinToken?: string;
  hostView?: boolean;
  patientName: string;
  mode?: "video" | "audio";
  onClose: () => void;
};

export default function VideoCallModal({
  roomUrl,
  joinToken,
  hostView,
  patientName,
  mode = "video",
  onClose,
}: Props) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const src = joinToken ? `${roomUrl}?t=${joinToken}` : roomUrl;
  const isAudio = mode === "audio";

  // A call shouldn't swallow the whole screen — the clinic side in particular
  // needs the patient's notes visible behind it. So this is a floating panel
  // by default: compact for audio (there's nothing to look at), roomier for
  // video, and expandable when someone wants that. On phones it goes
  // full-bleed, where a windowed call would be unusable.
  //
  // Heights are in `dvh`, not `vh`: on mobile `vh` measures the tallest
  // possible viewport, so a `100vh` panel hides its own controls behind the
  // browser's address bar.
  const panelSize = expanded
    ? "h-full w-full max-w-none"
    : isAudio
    ? "h-full w-full sm:h-[min(30rem,88dvh)] sm:max-w-sm sm:rounded-[var(--radius-lg)]"
    : "h-full w-full sm:h-[min(38rem,88dvh)] sm:max-w-3xl sm:rounded-[var(--radius-lg)]";

  return (
    <Overlay
      onClose={onClose}
      className={`items-center justify-center bg-ink/60 ${expanded ? "p-0" : "p-0 sm:p-6"}`}
    >
      {/* Fixed-height flex column: the header stays put and the call fills the
          rest, so the controls inside the iframe are always on screen. */}
      <div className={`flex flex-col overflow-hidden bg-ink shadow-[var(--shadow-pop)] ${panelSize}`}>
        <header
          className={`flex shrink-0 items-center justify-between gap-2 px-4 py-3 ${
            hostView ? "bg-indigo-deep text-paper" : "bg-ink text-paper"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {hostView && (
              <span className="shrink-0 rounded-full bg-paper/15 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider">
                {t("chat.hostView")}
              </span>
            )}
            <p className="truncate text-sm font-semibold">
              {hostView
                ? `${t(isAudio ? "video.audioHostTitle" : "video.hostTitle")} ${patientName}`
                : t(isAudio ? "video.audioTitle" : "video.title")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isAudio && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="hidden rounded-full border border-paper/30 px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-paper/10 sm:inline-flex"
              >
                {t(expanded ? "video.shrink" : "video.fullScreen")}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full border border-paper/30 px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-paper/10"
            >
              {t("video.leave")}
            </button>
          </div>
        </header>

        {isAudio && (
          <p className="shrink-0 bg-indigo-deep/90 px-4 py-1.5 text-center text-[0.7rem] text-paper/90">
            🎧 {t("video.audioOnlyNote")}
          </p>
        )}

        {/* `min-h-0` lets this shrink inside the flex column instead of pushing
            the call's own controls past the bottom of the panel. */}
        <iframe
          src={src}
          // No camera permission at all on an audio call, so the browser never
          // prompts for one and nothing can turn it on.
          allow={
            isAudio
              ? "microphone; autoplay"
              : "camera; microphone; fullscreen; display-capture; autoplay"
          }
          className="min-h-0 w-full flex-1 border-0"
          title={t(isAudio ? "video.audioTitle" : "video.title")}
        />
      </div>
    </Overlay>
  );
}
