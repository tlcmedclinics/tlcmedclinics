"use client";

import { useEffect } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { useAuth } from "@/contexts/AuthContext";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/presence";

/**
 * Keeps a doctor's presence fresh while they have the app open.
 *
 * Beats immediately on mount, then on an interval, and again whenever the tab
 * becomes visible after being backgrounded. A hidden tab stops beating, so a
 * doctor who switches away drops offline on their own once the window lapses —
 * no explicit "go offline" call to lose on a crash or a closed laptop.
 *
 * Presence is stored as a timestamp rather than a boolean precisely so that
 * missing the goodbye is harmless.
 */
export function usePresence(enabled: boolean) {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    if (!enabled || !uid) return;

    let cancelled = false;

    async function beat() {
      // A backgrounded tab shouldn't keep the doctor looking available.
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        await authedFetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ heartbeat: true }),
        });
      } catch {
        // Presence is best-effort — a dropped beat just means they'll show as
        // offline slightly early, which is the safe direction to fail.
      }
    }

    void beat();
    const id = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", beat);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [enabled, uid]);
}
