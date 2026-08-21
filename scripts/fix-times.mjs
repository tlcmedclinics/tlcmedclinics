/**
 * Finds — and optionally repairs — appointment and slot times that aren't
 * stored as 24-hour "HH:mm".
 *
 *   node scripts/fix-times.mjs                  # report only, changes nothing
 *   node scripts/fix-times.mjs --apply          # pad "9:00" -> "09:00"
 *   node scripts/fix-times.mjs --apply --pm     # also read "2:45" as 14:45
 *
 * Why this exists: a time typed as "2:45" is stored verbatim, and
 * `new Date("2026-08-21T2:45")` is Invalid Date rather than 02:45 — ISO 8601
 * requires a two-digit hour. Everything that asks "when is this appointment?"
 * then gets null: the join button never opens, and the reminder window never
 * matches. Nothing in the symptoms points at the time string.
 *
 * Padding is safe and needs no judgement, so --apply does it alone.
 *
 * --pm is separate because it is a guess about intent, not a correction of
 * format. "2:45" says two forty-five; whether that is night or afternoon is not
 * in the data. It is a reasonable guess — a clinic does not see patients at a
 * quarter to three in the morning — but it moves real appointments by twelve
 * hours, so it stays behind its own flag and only touches hours 1 to 7.
 *
 * Read the report first. Times are shown with the patient and doctor beside
 * them, so an odd one is recognisable before anything is written.
 */

// `import { loadEnvConfig } from "@next/env"` looks right and throws at
// startup: @next/env ships as CommonJS, and Node won't destructure named
// exports off one in an .mjs file. Import the default and unpack it here.
import nextEnv from "@next/env";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), true, { info: () => {}, error: () => {} });

const APPLY = process.argv.includes("--apply");
const ASSUME_PM = process.argv.includes("--pm");

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const OFF = "\x1b[0m";

/** Already canonical: two-digit hour, two-digit minute, 24-hour. */
const CANONICAL = /^([01]\d|2[0-3]):[0-5]\d$/;

function readPrivateKey() {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();
  if (b64) return Buffer.from(b64, "base64").toString("utf8");
  let key = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!key) return undefined;
  key = key.replace(/^"?private_key"?\s*:\s*/, "").trim().replace(/[,;]+$/, "").trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\+n/g, "\n");
}

/** What this time should become, or null if it can't be read at all. */
function proposed(time) {
  if (typeof time !== "string") return null;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?$/i);
  if (!m) return null;

  let hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm) || mm > 59 || hh > 23) return null;

  const suffix = m[3]?.toLowerCase().replace(/\./g, "");
  if (suffix === "pm" && hh < 12) hh += 12;
  else if (suffix === "am" && hh === 12) hh = 0;
  else if (!suffix && ASSUME_PM && hh >= 1 && hh <= 7) hh += 12;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: readPrivateKey(),
  }),
});
const db = getFirestore(app);

console.log(`\nScanning for times that aren't 24-hour HH:mm`);
console.log(
  APPLY
    ? `${YELLOW}Mode: APPLY${ASSUME_PM ? " (+ reading 1:00–7:59 as afternoon)" : ""}${OFF}\n`
    : `${DIM}Mode: report only — nothing will be written${OFF}\n`
);

let totalBad = 0;
let totalFixed = 0;
let totalUnreadable = 0;

for (const collection of ["appointments", "slots"]) {
  const snap = await db.collection(collection).get();
  const rows = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const time = data.time;
    if (typeof time === "string" && CANONICAL.test(time)) continue;

    const next = proposed(time);
    rows.push({
      id: doc.id,
      date: data.date ?? "?",
      time,
      next,
      who:
        collection === "appointments"
          ? `${data.patientName ?? "?"} / ${data.doctorName ?? "no doctor"}`
          : `${data.doctorName ?? "?"}`,
      status: data.status ?? "",
    });
  }

  console.log(`${collection}: ${rows.length} to look at (of ${snap.size})`);

  for (const r of rows) {
    totalBad++;
    if (!r.next) {
      totalUnreadable++;
      console.log(
        `  ${RED}unreadable${OFF} ${r.id}  ${r.date} ${JSON.stringify(r.time)}  ${DIM}${r.who}${OFF}`
      );
      continue;
    }

    const changed = r.next !== r.time;
    console.log(
      `  ${changed ? YELLOW : GREEN}${String(r.time).padEnd(8)}${OFF} -> ${r.next}  ${r.date}  ${DIM}${r.who} ${r.status}${OFF}`
    );

    if (APPLY && changed) {
      await db.collection(collection).doc(r.id).update({ time: r.next });
      totalFixed++;
    }
  }
  console.log("");
}

if (totalBad === 0) {
  console.log(`${GREEN}Every time is already stored as HH:mm.${OFF}\n`);
} else if (APPLY) {
  console.log(`${GREEN}Updated ${totalFixed} document(s).${OFF}`);
  if (totalUnreadable) {
    console.log(`${RED}${totalUnreadable} could not be read and were left alone.${OFF}`);
  }
  console.log("");
} else {
  console.log(`${YELLOW}${totalBad} document(s) would change. Nothing was written.${OFF}`);
  console.log(`${DIM}Re-run with --apply once the list above looks right.${OFF}\n`);
}

process.exit(0);
