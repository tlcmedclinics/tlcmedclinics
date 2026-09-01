import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import { isMissingIndexError, missingIndexMessage } from "@/lib/firestore-errors";
import { RATING_QUESTION_KEYS, type RatingQuestionKey } from "@/lib/rating";

// GET /api/appointments/stats
//
// Dashboard numbers, computed server-side. The admin overview used to open
// live onSnapshot listeners on the whole `appointments`, `users`, `services`
// and `blogs` collections just to render a handful of counters — every
// document crossed the wire on every page load. Plain counters now use
// Firestore's count() aggregation (1 read regardless of collection size), and
// the revenue/rating rollup reads a projected subset over a bounded window
// instead of whole documents over all time.
//
// Each figure resolves independently: if one of them needs a composite index
// that hasn't been deployed yet, that tile comes back 0 and the page still
// renders, rather than the whole dashboard erroring out. `indexHint` tells the
// caller what to do about it.

// How far back the revenue / rating / per-doctor rollup looks. The counters
// are all-time; only the analytics scan is windowed, so this stays cheap as
// the clinic's history grows.
const ANALYTICS_WINDOW_DAYS = 365;

type AnalyticsRow = {
  amount?: number;
  paymentStatus?: string;
  status?: string;
  rating?: number;
  ratings?: Partial<Record<RatingQuestionKey, number>>;
  doctorId?: string;
  doctorName?: string;
};

/**
 * Running mean per survey question.
 *
 * Counted per question rather than per response, because the two are not the
 * same number: every visit rated before the five-question survey existed has
 * a `rating` and no `ratings`, and dividing those questions by the total
 * number of ratings would quietly drag every average down. Each question is
 * only ever divided by the answers it actually received.
 */
function makeQuestionAverages() {
  const sum = new Map<RatingQuestionKey, number>();
  const n = new Map<RatingQuestionKey, number>();

  function add(answers: AnalyticsRow["ratings"]) {
    if (!answers) return;
    for (const key of RATING_QUESTION_KEYS) {
      const score = answers[key];
      if (typeof score !== "number" || score < 1 || score > 5) continue;
      sum.set(key, (sum.get(key) ?? 0) + score);
      n.set(key, (n.get(key) ?? 0) + 1);
    }
  }

  function result() {
    return RATING_QUESTION_KEYS.map((key) => {
      const count = n.get(key) ?? 0;
      return {
        key,
        responses: count,
        average: count ? Math.round(((sum.get(key) ?? 0) / count) * 100) / 100 : null,
      };
    });
  }

  return { add, result };
}

// Runs each figure independently and remembers the first missing-index error,
// so one undeployed index degrades one number instead of the whole response.
function makeCollector() {
  const problems: string[] = [];

  function record(label: string, err: unknown) {
    console.error(`[GET /api/appointments/stats] ${label}`, err);
    if (isMissingIndexError(err) && problems.length === 0) {
      problems.push(missingIndexMessage(err));
    }
  }

  /** Aggregation count, or 0 if the query can't run. */
  async function count(label: string, q: FirebaseFirestore.Query): Promise<number> {
    try {
      return (await q.count().get()).data().count;
    } catch (err) {
      record(label, err);
      return 0;
    }
  }

  /** Projected documents, or an empty list if the query can't run. */
  async function rows<T>(label: string, q: FirebaseFirestore.Query): Promise<T[]> {
    try {
      const snap = await q.get();
      return snap.docs.map((d) => d.data() as T);
    } catch (err) {
      record(label, err);
      return [];
    }
  }

  return { count, rows, indexHint: () => problems[0] ?? null };
}

async function adminStats() {
  const { count, rows, indexHint } = makeCollector();
  const cutoff = new Date(
    Date.now() - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const appointments = adminDb.collection("appointments");

  const [
    appointmentsCount,
    callBacksCount,
    patientsCount,
    servicesCount,
    blogsCount,
    analyticsRows,
  ] = await Promise.all([
    count("appointments count", appointments),
    count("call-backs count", appointments.where("status", "==", "pending")),
    count("patients count", adminDb.collection("users").where("role", "==", "patient")),
    count("services count", adminDb.collection("services")),
    count("blogs count", adminDb.collection("blogs")),
    rows<AnalyticsRow>(
      "analytics rollup",
      appointments
        .where("createdAt", ">=", cutoff)
        // Projection — we only need six fields, not the whole appointment
        // (notes, prescription, room URLs and the rest stay on the server).
        .select(
          "amount",
          "paymentStatus",
          "status",
          "rating",
          "ratings",
          "doctorId",
          "doctorName"
        )
    ),
  ]);

  let paidRevenue = 0;
  let refunded = 0;
  let completed = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  const questions = makeQuestionAverages();
  const byDoctor = new Map<
    string,
    { name: string; completed: number; ratingSum: number; ratingCount: number }
  >();

  for (const a of analyticsRows) {
    if (a.paymentStatus === "paid") paidRevenue += a.amount || 0;
    if (a.paymentStatus === "refunded") refunded += a.amount || 0;
    if (a.status === "completed") completed += 1;
    if (a.rating) {
      ratingSum += a.rating;
      ratingCount += 1;
      questions.add(a.ratings);
    }
    if (!a.doctorId) continue;
    const entry =
      byDoctor.get(a.doctorId) ?? {
        name: a.doctorName || "Unknown",
        completed: 0,
        ratingSum: 0,
        ratingCount: 0,
      };
    if (a.status === "completed") entry.completed += 1;
    if (a.rating) {
      entry.ratingSum += a.rating;
      entry.ratingCount += 1;
    }
    byDoctor.set(a.doctorId, entry);
  }

  return {
    counts: {
      patients: patientsCount,
      appointments: appointmentsCount,
      callBacks: callBacksCount,
      services: servicesCount,
      blogs: blogsCount,
    },
    analytics: {
      paidRevenue,
      refunded,
      completed,
      avgRating: ratingCount ? ratingSum / ratingCount : null,
      ratingCount,
      // Per-question breakdown — which part of a visit the clinic is actually
      // being marked down on. The overall average cannot answer that, and it
      // is the only number the dashboard had.
      ratingQuestions: questions.result(),
      doctorRows: Array.from(byDoctor.values())
        .map((d) => ({
          name: d.name,
          completed: d.completed,
          avgRating: d.ratingCount ? d.ratingSum / d.ratingCount : null,
        }))
        .sort((a, b) => b.completed - a.completed),
    },
    windowDays: ANALYTICS_WINDOW_DAYS,
    indexHint: indexHint(),
  };
}

async function doctorStats(uid: string) {
  const { count, rows, indexHint } = makeCollector();
  const todayIso = new Date().toISOString().slice(0, 10);
  const mine = adminDb.collection("appointments").where("doctorId", "==", uid);

  const [todaysCount, upcomingCount, completedCount, patientRows] = await Promise.all([
    count("today count", mine.where("date", "==", todayIso)),
    count(
      "upcoming count",
      mine.where("status", "==", "confirmed").where("date", ">=", todayIso)
    ),
    count("completed count", mine.where("status", "==", "completed")),
    // Unique patients genuinely needs the rows, but one projected field per
    // appointment is a fraction of the payload a full fetch moved.
    rows<{ patientId?: string }>("unique patients", mine.select("patientId")),
  ]);

  return {
    counts: {
      todays: todaysCount,
      upcoming: upcomingCount,
      completed: completedCount,
      uniquePatients: new Set(patientRows.map((r) => r.patientId)).size,
    },
    indexHint: indexHint(),
  };
}

export async function GET(req: NextRequest) {
  const auth = await verifyRequest(req, ["admin", "doctor"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    return NextResponse.json(
      auth.role === "admin" ? await adminStats() : await doctorStats(auth.uid)
    );
  } catch (err) {
    console.error("[GET /api/appointments/stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
