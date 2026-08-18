"use client";

import { useState } from "react";
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
  // video, and expandable to full screen when someone wants that. On phones it
  // still goes full-bleed, where a windowed call would be unusable.
  const panelSize = expanded
    ? "h-full w-full max-w-none sm:rounded-none"
    : isAudio
    ? "h-full w-full sm:h-[30rem] sm:max-w-sm sm:rounded-2xl"
    : "h-full w-full sm:h-[38rem] sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl";

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 ${
        expanded ? "p-0" : "p-0 sm:p-6"
      }`}
    >
      <div className={`flex flex-col overflow-hidden bg-ink shadow-2xl ${panelSize}`}>
        <div
          className={`flex shrink-0 items-center justify-between gap-2 px-4 py-3 ${
            hostView ? "bg-indigo-deep text-paper" : "bg-ink text-paper"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {hostView && (
              <span className="shrink-0 rounded-full bg-paper/15 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider">
                Host view
              </span>
            )}
            <p className="truncate text-sm font-medium">
              {hostView
                ? `${isAudio ? "Audio call with" : t("video.hostTitle")} ${patientName}`
                : isAudio
                ? "Audio consultation"
                : t("video.title")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isAudio && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                aria-label={expanded ? "Shrink call window" : "Expand call to full screen"}
                title={expanded ? "Shrink" : "Full screen"}
                className="hidden rounded-full border border-paper/30 px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-paper/10 sm:inline-flex"
              >
                {expanded ? "Shrink" : "Full screen"}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full border border-paper/30 px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-paper/10"
            >
              {t("video.leave")}
            </button>
          </div>
        </div>

        {isAudio && (
          <p className="shrink-0 bg-indigo-deep/90 px-4 py-1.5 text-center text-[0.7rem] text-paper/90">
            🎧 Audio only — cameras are disabled for this consultation.
          </p>
        )}

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
          title={isAudio ? "Audio consultation" : "Video consultation"}
        />
      </div>
    </div>
  );
}
