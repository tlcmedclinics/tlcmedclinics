/**
 * Checks that the Firebase Admin credentials actually work — using the exact
 * same environment the Next.js app sees.
 *
 *   npm run check-firebase
 *
 * Run this whenever Firestore "stops working": every API route returning 500,
 * dashboard counters stuck at 0, /services erroring. Those all have the same
 * handful of causes and guessing between them from the browser wastes hours.
 *
 * It loads .env through `@next/env` — Next's own loader — rather than Node's
 * `--env-file`. That matters: the two parse env files differently, so a check
 * that passes under one can still leave the app with no credentials under the
 * other, which looks impossible from the outside and is very hard to spot.
 * Testing what the app actually sees removes that whole class of confusion.
 *
 * It never prints the private key. Only lengths, shapes and yes/no answers, so
 * the output is safe to paste into a chat or a ticket.
 */

// Default import, then unpack: @next/env is CommonJS, and Node refuses to pull
// named exports off a CommonJS module inside an .mjs file.
import nextEnv from "@next/env";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const OFF = "\x1b[0m";

const ok = (m) => console.log(`${GREEN}  PASS${OFF}  ${m}`);
const bad = (m) => console.log(`${RED}  FAIL${OFF}  ${m}`);
const note = (m) => console.log(`${DIM}        ${m}${OFF}`);

let fatal = false;

console.log("\nFirebase Admin credential check\n");

/* ---------------------------------------------------------------- *
 * 0. Load the environment the way Next.js does, and say which files
 *    it actually found. "No file loaded" is itself a common cause.
 * ---------------------------------------------------------------- */

const { loadEnvConfig } = nextEnv;

const { loadedEnvFiles } = loadEnvConfig(process.cwd(), true, {
  info: () => {},
  error: () => {},
});

if (loadedEnvFiles.length === 0) {
  bad("Next.js loaded NO env files from this directory");
  note("Expected a .env here. Run this from the project root.");
  fatal = true;
} else {
  ok(`Env files Next.js loads: ${loadedEnvFiles.map((f) => f.path).join(", ")}`);
  if (loadedEnvFiles.length > 1) {
    note("Files earlier in that list override later ones — check for a stale .env.local.");
  }
}

/* ---------------------------------------------------------------- *
 * 1. Are the three variables even present?
 * ---------------------------------------------------------------- */

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (projectId) ok(`FIREBASE_PROJECT_ID = ${projectId}`);
else {
  bad("FIREBASE_PROJECT_ID is not set");
  fatal = true;
}

if (clientEmail) ok(`FIREBASE_CLIENT_EMAIL = ${clientEmail}`);
else {
  bad("FIREBASE_CLIENT_EMAIL is not set");
  fatal = true;
}

/* ---------------------------------------------------------------- *
 * 2. Read the key exactly the way src/lib/firebase/admin.ts does.
 * ---------------------------------------------------------------- */

function readPrivateKey() {
  const base64 = process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();
  if (base64) {
    note(`FIREBASE_PRIVATE_KEY_BASE64 is set (${base64.length} chars) — this one wins`);
    try {
      const decoded = Buffer.from(base64, "base64").toString("utf8");
      if (decoded.includes("BEGIN")) return { key: decoded, from: "FIREBASE_PRIVATE_KEY_BASE64" };
      bad("FIREBASE_PRIVATE_KEY_BASE64 decoded, but the result is not a PEM key");
      note("Encode the private_key value itself, not the whole service-account JSON.");
    } catch {
      bad("FIREBASE_PRIVATE_KEY_BASE64 is not valid base64");
      note("Something was truncated, or an extra character crept in while pasting.");
    }
  }

  let key = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!key) return { key: undefined, from: null };

  note(`FIREBASE_PRIVATE_KEY is set (${key.length} chars)`);

  const labelled = key.replace(/^"?private_key"?\s*:\s*/, "").trim();
  if (labelled !== key) {
    note('It still has the `"private_key":` label from the JSON — removing it.');
    key = labelled;
  }

  const depunctuated = key.replace(/[,;]+$/, "").trim();
  if (depunctuated !== key) {
    note("It ends with a comma left over from the service-account JSON — removing it.");
    note("Worth deleting from .env too: Node and Next.js disagree about that comma,");
    note("so it can make this check pass while the app itself gets no credentials.");
    key = depunctuated;
  }

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    note("It is wrapped in quotes — stripping them (the app does this too).");
    key = key.slice(1, -1);
  }

  // `\\+n`, not `\\n`: some panels escape the value a second time, so `\n`
  // arrives as `\\n`. See the note in src/lib/firebase/admin.ts.
  return { key: key.replace(/\\+n/g, "\n"), from: "FIREBASE_PRIVATE_KEY" };
}

const { key: privateKey, from } = readPrivateKey();

if (!privateKey) {
  bad("No private key found in FIREBASE_PRIVATE_KEY or FIREBASE_PRIVATE_KEY_BASE64");
  note("The variable exists in .env but Next.js is not exposing it — see the env files listed above.");
  fatal = true;
} else {
  ok(`Private key read from ${from}`);

  const lines = privateKey.split("\n").filter(Boolean).length;

  if (privateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
    ok("Key starts with -----BEGIN PRIVATE KEY-----");
  } else {
    bad("Key does NOT start with -----BEGIN PRIVATE KEY-----");
    note(`It starts with: ${JSON.stringify(privateKey.slice(0, 30))}`);
    fatal = true;
  }

  if (privateKey.trimEnd().endsWith("-----END PRIVATE KEY-----")) {
    ok("Key ends with -----END PRIVATE KEY-----");
  } else {
    bad("Key does NOT end with -----END PRIVATE KEY-----");
    note("Most likely the value was truncated when it was pasted or saved.");
    fatal = true;
  }

  if (lines >= 5) {
    ok(`Key has ${lines} lines — the newlines survived`);
  } else {
    bad(`Key has only ${lines} line(s) — the newlines did NOT survive`);
    note("A PEM key needs real line breaks. In .env write them as literal \\n,");
    note("or use FIREBASE_PRIVATE_KEY_BASE64 instead, which cannot be mangled.");
    fatal = true;
  }
}

/* ---------------------------------------------------------------- *
 * 3. The real test: can it actually reach Firestore?
 *
 * Every check above can pass on a key that is well-formed but revoked, or
 * belongs to a different project. Only a live read proves it works.
 * ---------------------------------------------------------------- */

if (fatal) {
  console.log(`\n${RED}Stopping — fix the problems above first.${OFF}\n`);
  process.exit(1);
}

console.log("\nTalking to Firestore...\n");

try {
  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  ok("Credentials accepted by firebase-admin");

  const db = getFirestore(app);

  for (const name of ["services", "blogs", "users", "appointments"]) {
    try {
      const snap = await db.collection(name).count().get();
      const n = snap.data().count;
      console.log(`${GREEN}  PASS${OFF}  ${name}: ${n} document${n === 1 ? "" : "s"}`);
    } catch (err) {
      bad(`${name}: ${err instanceof Error ? err.message : err}`);
      fatal = true;
    }
  }
} catch (err) {
  bad(`Could not initialise: ${err instanceof Error ? err.message : err}`);
  note("'Failed to parse private key' means the key is still malformed.");
  note("An authentication error means the key parses but is revoked, or belongs to another project.");
  fatal = true;
}

console.log(
  fatal
    ? `\n${RED}Firestore is NOT reachable with these credentials.${OFF}\n`
    : `\n${GREEN}All good — Firestore is reachable, using exactly what the app sees.${OFF}\n` +
      `${YELLOW}If the app still fails, stop the dev server completely and start it again:${OFF}\n` +
      `${YELLOW}firebase-admin caches its app for the life of the process.${OFF}\n`
);

process.exit(fatal ? 1 : 0);
