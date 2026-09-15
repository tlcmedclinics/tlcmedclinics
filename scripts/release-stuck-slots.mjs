/**
 * Frees slots left on hold by payments that never started.
 *
 *   node --env-file=.env scripts/release-stuck-slots.mjs          # report only
 *   node --env-file=.env scripts/release-stuck-slots.mjs --apply  # actually release
 *
 * ── What went wrong, and what this undoes ──
 *
 * `POST /api/payments/start` holds the slot before handing the patient to the
 * gateway, which is right: two people must not be able to pay for the same
 * 3pm. But when the gateway refused the request outright — a wrong key, a
 * payload it did not recognise, an outage — the old code marked the attempt
 * failed and returned, without letting go of the slot.
 *
 * Nobody paid. Nobody has an appointment. The time is simply gone from the
 * clinic's calendar, with a `pendingBookings` document nobody will ever open
 * as the only trace. Safepay answering 417 for a day produced a number of
 * these.
 *
 * The leak itself is fixed. This clears up what it already left behind.
 *
 * ── What it will and will not touch ──
 *
 * Only pending bookings whose payment attempt is recorded as `failed`, or that
 * have no attempt at all and are older than the cut-off below. A booking whose
 * payment is still `started` and recent is somebody currently at a card form,
 * and releasing that would take the slot out from under a patient mid-payment.
 *
 * It never touches a finalised appointment: `finalizePendingBooking` deletes
 * the pending document, so anything still here was never completed.
 *
 * Reports by default. Nothing is written without `--apply`.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/** How long a payment may sit "started" before it is treated as abandoned.
 *  Generous: a patient can take a while to find their card. */
const ABANDONED_AFTER_MINUTES = 45;

const apply = process.argv.includes("--apply");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const cutoff = Date.now() - ABANDONED_AFTER_MINUTES * 60_000;

const pendings = await db.collection("pendingBookings").get();
if (pendings.empty) {
  console.log("No pending bookings at all. Nothing to do.");
  process.exit(0);
}

// One read of the attempts, keyed by the pending booking they point at, so a
// hundred pending bookings do not become a hundred queries.
const attempts = await db.collection("paymentAttempts").get();
const byTarget = new Map();
for (const doc of attempts.docs) {
  const a = doc.data();
  if (a.kind !== "booking" || !a.targetId) continue;
  const current = byTarget.get(a.targetId);
  // Keep the most recent attempt for each booking.
  if (!current || (a.createdAt ?? "") > (current.createdAt ?? "")) {
    byTarget.set(a.targetId, a);
  }
}

const release = [];
const keep = [];

for (const doc of pendings.docs) {
  const pending = doc.data();
  const attempt = byTarget.get(doc.id);
  const createdMs = Date.parse(pending.createdAt ?? "") || 0;
  const stale = createdMs > 0 && createdMs < cutoff;

  let reason = null;
  if (attempt?.status === "failed") reason = "payment failed";
  else if (attempt?.status === "completed") reason = null; // should not still be here
  else if (!attempt && stale) reason = "no payment attempt, and stale";
  else if (attempt?.status === "started" && stale) reason = "payment never finished";

  const line = `${doc.id}  slot=${pending.slotId ?? "—"}  ${pending.date ?? "?"} ${pending.time ?? "?"}  ${pending.service ?? "?"}`;
  if (reason) release.push({ id: doc.id, line: `${line}  (${reason})` });
  else keep.push(`${line}  (attempt: ${attempt?.status ?? "none"}, recent)`);
}

console.log(`\n${pendings.size} pending booking(s) found.\n`);

if (keep.length) {
  console.log(`Leaving alone — someone may be paying right now (${keep.length}):`);
  for (const l of keep) console.log("  · " + l);
  console.log("");
}

if (!release.length) {
  console.log("Nothing to release. Every held slot is accounted for.");
  process.exit(0);
}

console.log(`To release (${release.length}):`);
for (const r of release) console.log("  · " + r.line);

if (!apply) {
  console.log("\nReport only. Re-run with --apply to release these slots.");
  process.exit(0);
}

console.log("\nReleasing…");
let freed = 0;
for (const { id } of release) {
  const pendingRef = db.collection("pendingBookings").doc(id);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(pendingRef);
      if (!snap.exists) return;
      const pending = snap.data();

      if (pending.slotId) {
        const slotRef = db.collection("slots").doc(pending.slotId);
        const slotSnap = await tx.get(slotRef);
        // `appointmentId` set means a real appointment owns this slot. Leave it.
        if (slotSnap.exists && slotSnap.data().appointmentId === undefined) {
          tx.update(slotRef, { status: "available" });
        }
      }
      tx.delete(pendingRef);
    });
    freed += 1;
  } catch (err) {
    console.error(`  ! ${id}: ${err.message}`);
  }
}

console.log(`\nDone. ${freed} slot(s) back on the calendar.`);
process.exit(0);
