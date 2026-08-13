"use client";

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
  const src = joinToken ? `${roomUrl}?t=${joinToken}` : roomUrl;
  const isAudio = mode === "audio";

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-ink">
      <div
        className={`flex items-center justify-between px-4 py-3 sm:px-6 ${
          hostView ? "bg-indigo-deep text-paper" : "bg-ink text-paper"
        }`}
      >
        <div className="flex items-center gap-2">
          {hostView && (
            <span className="rounded-full bg-paper/15 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider">
              Host view
            </span>
          )}
          <p className="text-sm font-medium">
            {hostView
              ? `${isAudio ? "Audio call with" : t("video.hostTitle")} ${patientName}`
              : isAudio
              ? "Audio consultation"
              : t("video.title")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-paper/30 px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-paper/10"
        >
          {t("video.leave")}
        </button>
      </div>
      {isAudio && (
        <p className="bg-indigo-deep/90 px-4 py-1.5 text-center text-xs text-paper/90 sm:px-6">
          This is an audio call — tap the camera icon inside the call to keep your video off.
        </p>
      )}
      <iframe
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="h-full w-full flex-1 border-0"
        title={isAudio ? "Audio consultation" : "Video consultation"}
      />
    </div>
  );
}
