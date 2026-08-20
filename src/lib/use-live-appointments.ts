"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Appointment, AppointmentStatus } from "@/types";

/**
 * Live view of the most recent appointments for whoever is signed in.
 *
 * Everything used to load over REST and only change on a manual refresh, so a
 * doctor completing a session, or a patient booking one, was invisible to the
 * other side until someone reloaded the page.
 *
 * This subscribes instead — but only to a bounded window. The earlier problem
 * with realtime here was an unbounded `onSnapshot` on the whole collection;
 * the fix is the constraints, not dropping realtime. The query mirrors
 * `GET /api/appointments` exactly (same filters, same order, same indexes), so
 * cost stays proportional to what's on screen.
 *
 * Older pages still load over REST — history doesn't change, so there's
 * nothing to watch.
 *
 * The filters are also what make this readable at all: firestore.rules only
 * lets a patient read rows where `patientId` is theirs and a doctor rows where
 * `doctorId` is theirs. Rules filter nothing themselves — an unscoped query
 * is simply rejected — so these `where` clauses are load-bearing for
 * permissions, not just for cost.
 */
export function useLiveAppointments({
  status,
  date,
  pageSize = 50,
  enabled = true,
}: {
  status?: AppointmentStatus | "all";
  /** Exact day (YYYY-MM-DD) — used by the doctor's "today" list. */
  date?: string;
  pageSize?: number;
  enabled?: boolean;
} = {}) {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const role = profile?.role;
  const uid = user?.uid;

  useEffect(() => {
    if (!enabled || !uid || !role) return;

    setLoading(true);
    setError(null);

    let q: Query = collection(db, "appointments");
    if (role === "patient") q = query(q, where("patientId", "==", uid));
    else if (role === "doctor") q = query(q, where("doctorId", "==", uid));
    if (status && status !== "all") q = query(q, where("status", "==", status));
    if (date) q = query(q, where("date", "==", date));
    q = query(q, orderBy("createdAt", "desc"), fsLimit(pageSize));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => d.data() as Appointment));
        // Bumped on every snapshot so screens showing *aggregates* (the
        // dashboards) can use this as a "something changed, refetch the
        // totals" signal instead of streaming the whole collection.
        setVersion((v) => v + 1);
        setLoading(false);
      },
      (err) => {
        // A missing composite index surfaces here as failed-precondition, the
        // same as it does server-side. Say so rather than showing an empty list
        // that looks like "no appointments".
        console.error("[useLiveAppointments]", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [enabled, uid, role, status, date, pageSize]);

  return useMemo(
    () => ({ appointments, loading, error, version, setAppointments }),
    [appointments, loading, error, version]
  );
}
