/**
 * Turns the private key in .env into a base64 blob you can paste into a
 * hosting panel.
 *
 *   node scripts/make-key-base64.mjs
 *
 * Why bother: a PEM key is multi-line, and every panel's environment-variable
 * box mangles multi-line values in its own way — dropping the line breaks,
 * adding quotes, keeping a trailing comma from the service-account JSON. Any
 * one of those stops the key parsing, which takes down every Firestore call on
 * the site with no useful error anywhere. Base64 is a single line of plain
 * ASCII, so there is nothing left to mangle.
 *
 * It writes to a file rather than printing, because copying a 1700-character
 * value out of a terminal is exactly where the last mangling happened.
 *
 * The output file contains your private key. Delete it once it's pasted.
 */

import fs from "fs";
import path from "path";
// Default import, then unpack: @next/env is CommonJS, and Node refuses to pull
// named exports off a CommonJS module inside an .mjs file.
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), true, { info: () => {}, error: () => {} });

let key = process.env.FIREBASE_PRIVATE_KEY?.trim();

if (!key) {
  console.error("\nFIREBASE_PRIVATE_KEY is not set in .env — nothing to convert.\n");
  process.exit(1);
}

// Same normalisation as src/lib/firebase/admin.ts, so what gets encoded is
// exactly what the app would use.
key = key.replace(/^"?private_key"?\s*:\s*/, "").trim();
key = key.replace(/[,;]+$/, "").trim();
if (
  (key.startsWith('"') && key.endsWith('"')) ||
  (key.startsWith("'") && key.endsWith("'"))
) {
  key = key.slice(1, -1);
}
key = key.replace(/\\n/g, "\n");

const lines = key.split("\n").filter(Boolean).length;

if (!key.startsWith("-----BEGIN PRIVATE KEY-----") || lines < 5) {
  console.error(
    `\nThat doesn't look like a PEM key (${lines} line(s)). Fix .env first — run: npm run check-firebase\n`
  );
  process.exit(1);
}

const out = path.join(process.cwd(), "key-base64.txt");
fs.writeFileSync(out, Buffer.from(key, "utf8").toString("base64"), "utf8");

console.log(`\n  Key looks good — ${lines} lines.`);
console.log(`  Written to: ${out}`);
console.log(`\n  Open that file, copy the whole line, and paste it into the panel as`);
console.log(`  FIREBASE_PRIVATE_KEY_BASE64. Then delete the file — it holds your key.\n`);
