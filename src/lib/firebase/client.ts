import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * The Firebase app and Auth — and deliberately nothing else.
 *
 * ── Why Firestore and Storage are not here any more ──
 *
 * This module used to end with three lines:
 *
 *   export const auth = getAuth(firebaseApp);
 *   export const db = getFirestore(firebaseApp);
 *   export const storage = getStorage(firebaseApp);
 *
 * and the two imports those needed. That looks harmless. It was not: an
 * `import` is not a request, it is an instruction to the bundler, and it does
 * not care whether the code runs. AuthContext imports `auth` from here, and
 * AuthContext lives in Providers, which wraps every page — so every page in
 * the site, including the home page a stranger lands on, shipped the whole
 * Firestore SDK and the whole Storage SDK to the browser and parsed them on
 * the main thread.
 *
 * Firestore is the largest piece of the Firebase client by a wide margin. On
 * the home page nothing signs in, nothing reads a document and nothing uploads
 * a file, so all of it was work done for no reason. It is most of what
 * PageSpeed was reporting as Total Blocking Time and "Reduce unused
 * JavaScript", and most of the gap between a desktop score of 97 and a mobile
 * score of 63 — a laptop chews through that much JavaScript quickly enough to
 * hide it, a phone does not.
 *
 * Auth stays here and stays eager because the header has to decide between
 * "Sign in" and the account avatar on first paint, and deferring that trades a
 * real download for a visible flicker.
 *
 * `db` now lives in ./db and `storage` in ./storage. Import them from there,
 * from the components that actually use them — the bundler then keeps them out
 * of every route that does not.
 */

// Falls back to placeholders so the app can build/render without crashing
// before real Firebase credentials are added to .env.local — actual auth
// calls will simply fail until real values are set.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
