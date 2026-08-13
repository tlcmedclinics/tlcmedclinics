"use client";

import { useEffect, useState } from "react";

/** Re-renders every `intervalMs` so time-based UI (join windows, countdowns) stays fresh. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
