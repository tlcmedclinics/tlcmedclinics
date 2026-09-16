import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyRequest } from "@/lib/auth-server";
import type { Appointment } from "@/types";

/**
 * POST /api/account/delete
 *
 * Closes the signed-in patient's account for good.
 *
 * ── Why this cannot simply delete everything ──
 *
 * A patient's account and a patient's medical record are not the same object,
 * and only one of them is theirs to erase. Consultations that have happened,
 * prescriptions that were issued, payments that were taken — a clinic is
 * required to keep those, and a doctor who prescribed something needs to be
 * able to answer for it years later. "Delete my account" cannot be allowed to
 * mean "delete the evidence of my treatment".
 *
 * So the account goes and the record stays, with the identifying parts taken
 * out of it:
 *
 *   · the Firebase Auth user is deleted — the login stops existing, every
 *     session is invalidated, and the email is free to be used again
 *   · the profile document is emptied and left as a tombstone, because the
 *     appointments point at its id and an orphaned id says nothing
 *   · past appointments keep their clinical content and lose the patient's
 *     name and phone number
 *   · upcoming appointments are cancelled and their slots returned, so the
 *     clinic's calendar does not hold time for somebody who has left
 *   · push tokens are removed, so the phone stops receiving notifications
 *     the moment this returns
 *
 * The UI says all of this before the button is pressed. A deletion that
 * quietly keeps more than the person expected is worse than one that explains
 * itself.
 *
 * ── Why staff cannot use this ──
 *
 * A doctor's account is attached to appointments other people depend on, and
 * an admin deleting their own account could leave the clinic with no way in.
 * Both are refused here and pointed at a human. This is the one place where
 * "contact the clinic" is the right answer rather than a brush-off.
 */

/** Appointments that are still ahead of the patient, whatever their status. */
const LIVE_STATUSES = ["pending", "awaiting-payment", "confirmed"];

/** Firestore caps a batch at 500 writes; stay well clear. */
const BATCH_LIMIT = 300;

export async function POST(req: NextRequest) {
  const auth = await verifyRequest(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.role === "doctor" || auth.role === "admin") {
    return NextResponse.json(
      {
        error:
          "Staff accounts are closed by the clinic rather than from here. Please contact the clinic.",
      },
      { status: 403 }
    );
  }

  // Typed, not just clicked. A destructive action reached by a stray tap on a
  // phone is a destructive action that happens by accident.
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: "This deletion was not confirmed." }, { status: 400 });
  }

  const uid = auth.uid;
  const now = new Date().toISOString();

  try {
    // ── 1. Upcoming appointments, and the slots they are holding ──────────
    const upcoming = await adminDb
      .collection("appointments")
      .where("patientId", "==", uid)
      .where("status", "in", LIVE_STATUSES)
      .get();

    for (const doc of upcoming.docs) {
      const appointment = doc.data() as Appointment;
      try {
        await adminDb.runTransaction(async (tx) => {
          // Re-read inside the transaction: between the query and here the
          // clinic may have started the session or cancelled it already.
          const fresh = (await tx.get(doc.ref)).data() as Appointment | undefined;
          if (!fresh || !LIVE_STATUSES.includes(fresh.status)) return;

          tx.update(doc.ref, {
            status: "cancelled",
            cancelledBy: "patient",
            cancelReason: "The patient closed their account.",
            cancelledAt: now,
          });

          if (fresh.slotId) {
            const slotRef = adminDb.collection("slots").doc(fresh.slotId);
            const slotSnap = await tx.get(slotRef);
            if (slotSnap.exists) {
              tx.update(slotRef, {
                status: "available",
                appointmentId: FieldValue.delete(),
              });
            }
          }
        });
      } catch (err) {
        // One stuck appointment must not stop the deletion. The account still
        // goes; the clinic sees this in the log and can free the slot by hand.
        console.error(`[account/delete] could not release ${appointment.id}`, err);
      }
    }

    // ── 2. Take the patient's name off the record, keep the record ────────
    const mine = await adminDb.collection("appointments").where("patientId", "==", uid).get();
    for (let i = 0; i < mine.docs.length; i += BATCH_LIMIT) {
      const batch = adminDb.batch();
      for (const doc of mine.docs.slice(i, i + BATCH_LIMIT)) {
        batch.update(doc.ref, {
          patientName: "Deleted patient",
          patientPhone: FieldValue.delete(),
          patientAnonymisedAt: now,
        });
      }
      await batch.commit();
    }

    // ── 3. Stop the phone receiving anything ──────────────────────────────
    const tokens = await adminDb.collection("pushTokens").where("userId", "==", uid).get();
    if (!tokens.empty) {
      const batch = adminDb.batch();
      for (const doc of tokens.docs) batch.delete(doc.ref);
      await batch.commit();
    }

    // ── 4. The profile: emptied, not removed ──────────────────────────────
    //
    // Removed outright, every appointment would point at an id with nothing
    // behind it, and the clinic's own lists would show blanks with no
    // explanation. A tombstone says what happened.
    await adminDb.collection("users").doc(uid).set(
      {
        active: false,
        deletedAt: now,
        name: "Deleted account",
        nameUr: FieldValue.delete(),
        email: FieldValue.delete(),
        phone: FieldValue.delete(),
        photoURL: FieldValue.delete(),
        bio: FieldValue.delete(),
        bioUr: FieldValue.delete(),
      },
      { merge: true }
    );

    // ── 5. The login itself ───────────────────────────────────────────────
    //
    // Last, on purpose. Everything above needs the account to exist; if this
    // line fails the patient can press the button again, whereas a failure
    // after the auth user is gone would leave data nobody can reach.
    await adminAuth.deleteUser(uid);

    console.log(`[account/delete] closed ${uid}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/delete]", err);
    return NextResponse.json(
      { error: "We could not close the account. Please contact the clinic." },
      { status: 500 }
    );
  }
}
