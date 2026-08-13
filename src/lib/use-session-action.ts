"use client";

import { useState } from "react";
import { authedFetch } from "@/lib/authed-fetch";
import { useToast } from "@/contexts/ToastContext";
import type { Appointment } from "@/types";

export function useSessionAction() {
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function startSession(appointmentId: string) {
    setPendingId(appointmentId);
    try {
      const res = await authedFetch(`/api/appointments/${appointmentId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start the session");
      return data as { appointment: Appointment; joinToken?: string };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the session");
      return null;
    } finally {
      setPendingId(null);
    }
  }

  async function endSession(appointmentId: string) {
    setPendingId(appointmentId);
    try {
      const res = await authedFetch(`/api/appointments/${appointmentId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't end the session");
      toast.success("Session ended and marked completed.");
      return data as { appointment: Appointment };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't end the session");
      return null;
    } finally {
      setPendingId(null);
    }
  }

  return { startSession, endSession, pendingId };
}
