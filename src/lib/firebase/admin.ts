import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Uses a service account JSON stored as a single env var (escaped),
// so this works on Vercel without a mounted file. See .env.example.
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
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
adminDb.settings({ ignoreUndefinedProperties: true });
