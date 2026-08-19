"use client";

import { useT } from "@/contexts/LanguageContext";

/**
 * An inline banner for a load failure that won't fix itself.
 *
 * A toast is the wrong shape for this: it disappears after five seconds, and
 * the thing it was telling you is a setup step you need to act on. A missing
 * Firestore index in particular will fail identically on every retry until
 * someone deploys it, so the message stays on screen with the command to run.
 */
export default function LoadErrorNotice({
  message,
  isSetupIssue,
  onRetry,
}: {
  message: string;
  isSetupIssue?: boolean;
  onRetry?: () => void;
}) {
  const t = useT();

  return (
    <div
      role="alert"
      className="mt-6 rounded-[var(--radius-card)] border border-crimson/30 bg-danger-soft p-5"
    >
      <p className="text-sm font-semibold text-crimson-deep">
        {t(isSetupIssue ? "error.setupNeeded" : "error.loadFailed")}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{message}</p>

      {isSetupIssue && (
        <pre className="mt-3 overflow-x-auto rounded-[var(--radius-sm)] bg-ink/90 px-3 py-2 font-mono text-[0.7rem] text-paper">
          firebase deploy --only firestore:indexes
        </pre>
      )}

      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline btn-sm mt-3">
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
