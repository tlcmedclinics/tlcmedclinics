/**
 * Run once to create (or promote) the clinic's admin account.
 *
 *   node scripts/create-admin.mjs admin@tlcmedclinics.com "StrongPassw0rd!" "Admin Name"
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * in your environment (same as .env.local).
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [, , email, password, name = "Admin"] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [name]");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log("Found existing user, promoting to admin…");
} catch {
  user = await auth.createUser({ email, password, displayName: name });
  console.log("Created new user…");
}

await auth.setCustomUserClaims(user.uid, { role: "admin" });
await db.collection("users").doc(user.uid).set({
  uid: user.uid,
  role: "admin",
  name,
  email,
  createdAt: new Date().toISOString(),
});

console.log(`✔ ${email} is now an admin.`);
process.exit(0);
