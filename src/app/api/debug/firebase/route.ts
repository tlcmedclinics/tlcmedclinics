import { NextRequest, NextResponse } from "next/server";
import { cert, initializeApp, getApps, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

// GET /api/debug/firebase
//
// Reports what THIS server — the deployed one — actually sees in its
// environment, and whether those credentials reach Firestore.
//
// It exists because the same failure looks identical from a browser whatever
// causes it: every API route returns 500 after a ten-second wait. That wait is
// the tell — with no usable credentials the Admin SDK falls back to looking for
// a Google Cloud metadata server, which isn't there, so it times out. But the
// browser can't tell you whether the key is missing, malformed, or fine-but-
// revoked, and hosting-panel logs are awkward to read. This answers it in one
// request.
//
// Call it with the same secret the cron uses:
//   curl -H "Authorization: Bearer <CRON_SECRET>" https://<site>/api/debug/firebase
//
// It never returns key material — only lengths, yes/no answers, and the PEM's
// header line, which is the same public constant in every key on earth.
//
// Its very presence is also the deployment test: if this 404s, the host is
// still serving an older build, and no amount of fixing environment variables
// will change anything until that's sorted.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalise(raw: string): string {
  let key = raw.trim();
  key = key.replace(/^"?private_key"?\s*:\s*/, "").trim();
  key = key.replace(/[,;]+$/, "").trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // No secret configured means no safe way to gate this, so it simply doesn't
  // exist. 404 rather than 401: an unauthenticated caller shouldn't even learn
  // the route is here.
  if (!secret) return new NextResponse("Not found", { status: 404 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Not found", { status: 404 });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const rawB64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  const report: Record<string, unknown> = {
    // Which build is answering. If this doesn't change after a redeploy, the
    // host is serving a cached build and nothing else here matters.
    buildMarker: "key-parse-fix-2",
    nodeEnv: process.env.NODE_ENV,

    FIREBASE_PROJECT_ID: projectId ?? null,
    FIREBASE_CLIENT_EMAIL_set: Boolean(clientEmail),
    FIREBASE_CLIENT_EMAIL_length: clientEmail?.length ?? 0,
  };

  // ---- base64 form, if it's set at all ----
  if (rawB64) {
    const trimmed = rawB64.trim();
    let decoded: string | null = null;
    try {
      decoded = Buffer.from(trimmed, "base64").toString("utf8");
    } catch {
      decoded = null;
    }
    report.FIREBASE_PRIVATE_KEY_BASE64 = {
      set: true,
      length: trimmed.length,
      decodesToPem: Boolean(decoded?.includes("BEGIN PRIVATE KEY")),
      decodedLines: decoded ? decoded.split("\n").filter(Boolean).length : 0,
    };
  } else {
    report.FIREBASE_PRIVATE_KEY_BASE64 = { set: false };
  }

  // ---- plain form: describe its shape without revealing it ----
  if (rawKey) {
    const t = rawKey.trim();
    const normalised = normalise(rawKey);
    report.FIREBASE_PRIVATE_KEY = {
      set: true,
      rawLength: t.length,
      startsWithQuote: t.startsWith('"') || t.startsWith("'"),
      endsWithQuote: t.endsWith('"') || t.endsWith("'"),
      endsWithComma: /[,;]$/.test(t),
      hasEscapedNewlines: t.includes("\\n"),
      hasRealNewlines: t.includes("\n"),
      // After the same clean-up src/lib/firebase/admin.ts does:
      afterNormalising: {
        startsCorrectly: normalised.startsWith("-----BEGIN PRIVATE KEY-----"),
        endsCorrectly: normalised.trimEnd().endsWith("-----END PRIVATE KEY-----"),
        lines: normalised.split("\n").filter(Boolean).length,
      },
    };
  } else {
    report.FIREBASE_PRIVATE_KEY = { set: false };
  }

  // ---- does a fresh credential built from these values actually work? ----
  //
  // Deliberately a throwaway app, not the shared one: the shared app is created
  // once at import time and cached for the life of the process, so if it was
  // built while the key was broken it stays broken until a restart. Testing a
  // new one separates "the key is wrong" from "the key is right but this
  // process started before it was fixed" — two problems with the same symptom
  // and completely different fixes.
  const probeName = `probe-${Date.now()}`;
  const started = Date.now();
  try {
    const key = rawB64
      ? Buffer.from(rawB64.trim(), "base64").toString("utf8")
      : rawKey
        ? normalise(rawKey)
        : undefined;

    if (!projectId || !clientEmail || !key) {
      report.freshCredentialTest = { ok: false, reason: "one or more variables missing" };
    } else {
      const probe = initializeApp(
        { credential: cert({ projectId, clientEmail, privateKey: key }) },
        probeName
      );
      const snap = await getFirestore(probe).collection("services").count().get();
      report.freshCredentialTest = {
        ok: true,
        services: snap.data().count,
        ms: Date.now() - started,
      };
      await deleteApp(probe);
    }
  } catch (err) {
    report.freshCredentialTest = {
      ok: false,
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
    // Clean up a half-created app so a second call doesn't collide.
    const stray = getApps().find((a) => a.name === probeName);
    if (stray) await deleteApp(stray).catch(() => {});
  }

  // ---- and what about the app the rest of the site is actually using? ----
  const liveStarted = Date.now();
  try {
    const snap = await adminDb.collection("services").count().get();
    report.liveAppTest = { ok: true, services: snap.data().count, ms: Date.now() - liveStarted };
  } catch (err) {
    report.liveAppTest = {
      ok: false,
      ms: Date.now() - liveStarted,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store" },
  });
}
