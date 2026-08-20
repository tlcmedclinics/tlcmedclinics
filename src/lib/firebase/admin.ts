import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Reads the service account's private key out of the environment.
 *
 * A PEM key is multi-line, and every hosting panel mangles multi-line values
 * differently. This normalises the three forms that actually turn up, because
 * getting it wrong takes down every Firestore read on the site and the only
 * symptom is "Failed to parse private key" buried in a server log:
 *
 *   1. `\n` escapes — how it's written in .env, and what Vercel stores.
 *   2. Wrapped in quotes — pasting the .env line into a panel's value box
 *      brings the surrounding `"` along, and those quotes become part of the
 *      PEM, which then no longer parses. (This is what broke production.)
 *   3. Base64 — set FIREBASE_PRIVATE_KEY_BASE64 instead and newlines can't be
 *      mangled at all. The most reliable option on a panel that reformats
 *      whatever you paste.
 */
function readPrivateKey(): string | undefined {
  const base64 = process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();
  if (base64) {
    try {
      const decoded = Buffer.from(base64, "base64").toString("utf8");
      if (decoded.includes("BEGIN")) return decoded;
      console.error(
        "[firebase-admin] FIREBASE_PRIVATE_KEY_BASE64 did not decode to a PEM key — ignoring it."
      );
    } catch {
      console.error("[firebase-admin] FIREBASE_PRIVATE_KEY_BASE64 is not valid base64 — ignoring it.");
    }
  }

  let key = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!key) return undefined;

  // Strip a wrapping pair of quotes if the panel kept them.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, "\n");
}

// Uses a service account JSON stored as a single env var (escaped),
// so this works on Vercel without a mounted file. See .env.example.
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = readPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    // Don't throw at import time — this file is imported by every API route,
    // so a missing .env.local would break the whole build. Requests will
    // fail clearly at call time instead, once someone actually hits an API
    // route without credentials configured.
    console.warn(
      "[firebase-admin] Missing FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY — set these in .env.local before using any /api route."
    );
    return initializeApp({ projectId: projectId || "placeholder-project" });
  }

  try {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } catch (err) {
    // `cert()` throws on a malformed key — "Failed to parse private key" —
    // and because this module runs at import time, that single throw takes
    // down EVERY route that imports it: all of /api, plus any server-rendered
    // page that reads Firestore. Static pages keep serving, so the site looks
    // half-alive while the real cause never appears anywhere obvious.
    //
    // The usual culprit is FIREBASE_PRIVATE_KEY losing its line breaks in a
    // hosting panel's environment-variable box. The value has to keep its
    // literal \n escapes (or real newlines) and must not be wrapped in
    // quotes, or the PEM stops parsing.
    //
    // Failing the same way as "missing credentials" keeps the app up and puts
    // one clear line in the server log instead of an unexplained 500.
    console.error(
      "[firebase-admin] FIREBASE_PRIVATE_KEY could not be parsed. Check that the key kept its \\n line breaks and has no surrounding quotes. Firestore will be unavailable until this is fixed.",
      err
    );
    return initializeApp({ projectId });
  }
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

// Route handlers across this app (appointments, payments, etc.) build
// documents with optional fields left as `undefined` (e.g. doctorId,
// couponCode, notes) when they don't apply. The Admin SDK throws on
// `undefined` values by default ("Cannot use 'undefined' as a Firestore
// value"), which was crashing those routes with an uncaught 500 before this
// setting existed. This makes Firestore silently drop undefined fields
// instead, matching how they're already treated everywhere else in the app.
//
// Each API route is bundled separately by Next.js, so this module can be
// evaluated more than once per process even though they all resolve to the
// same underlying Firestore instance (via the reused `adminApp`). Firestore
// only allows settings() to be called once ever on a given instance, so a
// second evaluation throws "Firestore has already been initialized" — that's
// expected here, not a real error, so it's safe to swallow.
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Already configured by an earlier module evaluation — fine, ignore.
}
