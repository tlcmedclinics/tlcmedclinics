import { getFirestore } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase/client";

/**
 * The Firestore client, in its own module.
 *
 * Split out of client.ts so that importing `auth` does not drag the Firestore
 * SDK along with it. Everything that reads or writes a document imports `db`
 * from here, and Next then bundles Firestore only into the routes that contain
 * one of those components — the patient dashboard, the doctor's appointments,
 * the chat panel — instead of into every page on the site.
 *
 * See the note in client.ts for what that cost before.
 *
 * Importing this module is what creates the Firestore instance, so import it
 * only where it is used. Do not re-export it from a barrel file: a barrel
 * defeats the split, because importing anything from the barrel imports all of
 * it.
 */
export const db = getFirestore(firebaseApp);
