/**
 * Run once per doctor if you'd rather do it from the command line than the
 * admin panel's "Doctors" page.
 *
 *   node scripts/create-doctor.mjs doctor@tlcmedclinics.com "StrongPassw0rd!" "Dr. Jane Doe" "Vein care"
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * in your environment (same as .env.local).
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [, , email, password, name = "Doctor", specialization = ""] = process.argv;

if (!email || !password) {
  console.error(
    "Usage: node scripts/create-doctor.mjs <email> <password> [name] [specialization]"
  );
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
  console.log("Found existing user, promoting to doctor…");
} catch {
  user = await auth.createUser({ email, password, displayName: name });
  console.log("Created new user…");
}

await auth.setCustomUserClaims(user.uid, { role: "doctor" });
await db.collection("users").doc(user.uid).set({
  uid: user.uid,
  role: "doctor",
  name,
  email,
  specialization: specialization || undefined,
  active: true,
  createdAt: new Date().toISOString(),
});

console.log(`✔ ${email} is now a doctor. Assign patients to them from Admin → Appointments.`);
process.exit(0);
