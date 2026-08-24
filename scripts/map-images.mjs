/**
 * Rewrites src/data/images.ts from what is actually in public/images.
 *
 *   npm run map-images            # report only
 *   npm run map-images -- --apply # write the file
 *
 * Why this exists: the images came out of the old Care Life site with export
 * names nobody would choose by hand, and the extensions differ file to file
 * (.jpg, .jpeg, .png, .webp). Writing those paths by hand means a typo shows up
 * as a missing picture on the live site, which is exactly the kind of mistake
 * that survives review.
 *
 * Matching is by keyword, not by exact name: a slot lists the words its file
 * should contain, and the first file containing all of them wins. So
 * "skin_care-min-860x645.jpg" and "skin-care.webp" both satisfy ["skin"], and
 * renaming an image doesn't break anything as long as the subject stays in the
 * name.
 *
 * A slot that matches nothing keeps whatever path it already had, and is
 * reported. This never invents a path and never deletes one.
 */

import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const OFF = "\x1b[0m";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const TARGET = path.join(process.cwd(), "src", "data", "images.ts");

/**
 * Each slot, with candidate keyword sets tried in order. The first set that
 * matches a file wins, so put the specific choice first and the acceptable
 * substitute after it — `hero` would rather have a "health-care" photograph,
 * but an "aesthetic" one is better than a blank.
 */
const SLOTS = [
  { key: "heroCover", candidates: [["bg-doctor"], ["cover"], ["doctor"]] },
  { key: "mental", candidates: [["mental-care"], ["mental"]] },
  { key: "skin", candidates: [["skin_care"], ["skin-care"], ["skin"]] },
  { key: "diagnosis", candidates: [["diagnosis"], ["diagnos"]] },
  { key: "clinic", candidates: [["beauty_clinic"], ["clinic"]] },
  { key: "doctor", candidates: [["whatsapp"], ["naseem"], ["portrait"]] },
  { key: "award", candidates: [["award"], ["chicago"]] },
  { key: "aesthetic", candidates: [["aesthetic"], ["beauty_care"]] },
  { key: "wellbeing", candidates: [["hope"], ["mental-health"]] },
  { key: "care", candidates: [["health-care"], ["health_care"]] },
  { key: "logoIcon", candidates: [["logo", "icon"]] },
  { key: "logoFull", candidates: [["logo", "full"]] },
];

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"]);

if (!fs.existsSync(IMAGES_DIR)) {
  console.error(`${RED}public/images does not exist — nothing to map.${OFF}`);
  process.exit(1);
}

/**
 * Zero-byte files are skipped. The folder currently contains one — a truncated
 * export — and matching a slot to it would put an image on the page that can
 * never load, which is harder to notice than a slot that reports no match at
 * all.
 */
const empty = [];
const files = fs
  .readdirSync(IMAGES_DIR)
  .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
  .filter((f) => {
    if (fs.statSync(path.join(IMAGES_DIR, f)).size > 0) return true;
    empty.push(f);
    return false;
  })
  .sort();

if (empty.length) {
  console.log(`${YELLOW}Skipped ${empty.length} zero-byte file(s):${OFF}`);
  for (const f of empty) console.log(`  ${YELLOW}· ${f}${OFF}  ${DIM}— safe to delete${OFF}`);
  console.log("");
}

if (!files.length) {
  console.error(`${RED}public/images is empty — nothing to map.${OFF}`);
  process.exit(1);
}

console.log(`\n${DIM}${files.length} image${files.length === 1 ? "" : "s"} in public/images${OFF}\n`);

/** Everything lowercased once, so matching doesn't care about case. */
const lower = files.map((f) => ({ file: f, hay: f.toLowerCase() }));

function findMatch(candidates) {
  for (const words of candidates) {
    const hit = lower.find((f) => words.every((w) => f.hay.includes(w)));
    if (hit) return hit.file;
  }
  return null;
}

const resolved = {};
const missing = [];

for (const slot of SLOTS) {
  const match = findMatch(slot.candidates);
  if (match) {
    resolved[slot.key] = `/images/${match}`;
    console.log(`  ${GREEN}${slot.key.padEnd(10)}${OFF} ${DIM}→${OFF} ${match}`);
  } else {
    missing.push(slot.key);
    console.log(`  ${RED}${slot.key.padEnd(10)}${OFF} ${DIM}→ no match, keeping current value${OFF}`);
  }
}

/**
 * Certificates are numbered rather than named, so they are collected by prefix
 * and sorted numerically — a plain string sort would put frame-10 before
 * frame-2 and hang the certificates in the wrong order.
 */
const certificates = lower
  .filter((f) => /^frame[-_]?\d+\./i.test(f.file))
  .map((f) => ({ file: f.file, n: Number(f.file.match(/\d+/)[0]) }))
  .sort((a, b) => a.n - b.n)
  .map((f) => `/images/${f.file}`);

console.log(
  `\n  ${certificates.length ? GREEN : YELLOW}certificates${OFF} ${DIM}→ ${certificates.length} found${OFF}`
);

/** Files that matched nothing — usually a slot this project doesn't have yet. */
const used = new Set([...Object.values(resolved), ...certificates].map((p) => p.replace("/images/", "")));
const unused = files.filter((f) => !used.has(f));
if (unused.length) {
  console.log(`\n${DIM}Not referenced by any slot:${OFF}`);
  for (const f of unused) console.log(`  ${DIM}· ${f}${OFF}`);
}

if (!APPLY) {
  console.log(`\n${YELLOW}Report only. Re-run with --apply to write src/data/images.ts.${OFF}\n`);
  process.exit(0);
}

// Rewrite only the two literals, so every comment and the type exports in
// images.ts survive. A regenerated-from-scratch file would drop the
// explanation of what the slots are for, which is the part worth keeping.
let source = fs.readFileSync(TARGET, "utf8");
const eol = source.includes("\r\n") ? "\r\n" : "\n";

for (const [key, value] of Object.entries(resolved)) {
  const re = new RegExp(`(\\b${key}:\\s*)"[^"]*"`);
  if (!re.test(source)) {
    console.log(`${YELLOW}  slot ${key} not found in images.ts — skipped${OFF}`);
    continue;
  }
  source = source.replace(re, `$1"${value}"`);
}

if (certificates.length) {
  const block = [
    "export const certificates: string[] = [",
    ...certificates.map((c) => `  "${c}",`),
    "];",
  ].join(eol);

  source = source.replace(/export const certificates: string\[\] = \[[\s\S]*?\];/, block);
}

fs.writeFileSync(TARGET, source, "utf8");

console.log(`\n${GREEN}Written — src/data/images.ts now matches public/images.${OFF}`);
if (missing.length) {
  console.log(`${YELLOW}Still unmatched: ${missing.join(", ")}. Add a file whose name contains that word.${OFF}`);
}
console.log("");
