/**
 * Loads the clinic's services — with their published prices — into Firestore.
 *
 *   npm run seed-clinic-services            # report what would change
 *   npm run seed-clinic-services -- --apply # write it
 *
 * These are the services patients pick from when they book, so this writes the
 * same list the booking form and the admin panel read. A service whose slug
 * already exists is updated in place, never duplicated, so running this twice
 * is safe.
 *
 * Three categories, matching the three areas of care on the home page:
 * Diagnosis, Health Care, and Skin & Aesthetics.
 *
 * Vein procedures are absent by design. The published price list still carries
 * four of them — diagnostic ultrasound, injection therapy, surgical removal and
 * EVLT — but the clinic no longer offers vein care, and seeding one would put
 * it straight back into the booking form as something a patient can pay for.
 * They are listed further down, in a comment, so it is obvious they were left
 * out on purpose rather than missed.
 *
 * Nothing is deleted. If the clinic has added its own services by hand, they
 * stay; this only adds and updates the ones listed here.
 */

// Default import, then unpack: @next/env is CommonJS, and Node won't pull
// named exports off a CommonJS module inside an .mjs file.
import nextEnv from "@next/env";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true, { info: () => {}, error: () => {} });

const APPLY = process.argv.includes("--apply");

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const OFF = "\x1b[0m";

/** The advance the clinic takes online on its longer treatments. */
const ADVANCE = 5000;

const CATEGORY = {
  diagnosis: "Diagnosis",
  health: "Health Care",
  skin: "Skin & Aesthetics",
};

/**
 * `category` drives the grouping on the public site.
 *
 * Follow-up pricing is resolved separately, by matching /follow|session/
 * against a service's name OR category — which is why "Regular Follow-up" and
 * the two therapy sessions below still price correctly while sitting under
 * Health Care. Renaming them so they no longer contain "follow" or "session"
 * would silently break doctor-booked follow-ups.
 */
const SERVICES = [
  // ---- Diagnosis ----
  {
    slug: "initial-evaluation",
    category: CATEGORY.diagnosis,
    name: "Initial Evaluation with a Specialist",
    short: "Your first diagnostic visit with the specialist.",
    intro:
      "A longer first appointment, so your history and background can be gone through thoroughly before any medication is started. The doctor takes a full history, examines you, and explains what they think is going on and what the options are. Available in the clinic or by telemedicine.",
    points: ["First diagnostic visit", "In clinic or by telemedicine", "No referral needed"],
    treatments: ["Psychiatric evaluation", "Diagnosis", "Treatment plan"],
    price: 3000,
    durationMinutes: 45,
    order: 1,
  },

  // ---- Health Care ----
  {
    slug: "ketamine-therapy",
    category: CATEGORY.health,
    name: "Ketamine Therapy",
    short: "Infusion therapy for depression, PTSD, OCD and chronic pain.",
    intro:
      "A personalised approach to mental health treatment, with ketamine infusion for depression, suicidal thinking, post-traumatic stress disorder, anxiety disorders, postpartum depression, obsessive-compulsive disorder, chronic pain and other mood disorders. Ours is the first clinic of its kind in Lahore, run and supervised throughout by U.S. board certified physicians.",
    points: [
      "180-minute session",
      "Physician supervised from start to finish",
      "Observation before you leave",
    ],
    treatments: ["Ketamine infusion"],
    price: 18000,
    advancePayment: ADVANCE,
    durationMinutes: 180,
    order: 2,
  },
  {
    slug: "regular-follow-up",
    category: CATEGORY.health,
    name: "Regular Follow-up",
    short: "Medication management visit.",
    intro:
      "A focused review of how your treatment is working and any adjustments needed — dose, timing, side effects, and how you have actually been since the last visit.",
    points: ["Medication management visit", "In clinic or by telemedicine"],
    treatments: ["Medication management"],
    price: 3500,
    durationMinutes: 15,
    order: 3,
  },
  {
    slug: "therapy-med-management-30",
    category: CATEGORY.health,
    name: "Therapy + Medication Management (30 min session)",
    short: "Half-hour therapy session with a medication review.",
    intro:
      "A half-hour session combining therapy with a review of your medication, for when there is more to talk through than a follow-up allows.",
    points: ["Half hour session"],
    treatments: ["Therapy", "Medication management"],
    price: 6000,
    durationMinutes: 30,
    order: 4,
  },
  {
    slug: "therapy-med-management-60",
    category: CATEGORY.health,
    name: "Full Therapy + Medication Management (60 min session)",
    short: "A full hour of therapy with a medication review.",
    intro:
      "A full hour combining therapy with a review of your medication — the longer format, for work that needs continuity rather than a check-in.",
    points: ["One hour session"],
    treatments: ["Therapy", "Medication management"],
    price: 12000,
    durationMinutes: 60,
    order: 5,
  },

  // ---- Skin & Aesthetics ----
  {
    slug: "micro-needling-with-prp",
    category: CATEGORY.skin,
    name: "Full Face Micro-needling with PRP",
    short: "For acne scars, wrinkles, age spots and sun damage.",
    intro:
      "A needle-studded device is rolled over the skin to stimulate the tissue underneath, combined with platelet-rich plasma drawn from your own blood. For acne scars, wrinkles, age spots and sun damage.",
    points: ["90 minutes", "Uses your own blood plasma"],
    treatments: ["Micro-needling", "PRP"],
    price: 16000,
    advancePayment: ADVANCE,
    durationMinutes: 90,
    order: 6,
  },
  {
    slug: "hair-regrowth-with-prp",
    category: CATEGORY.skin,
    name: "Hair Regrowth with PRP",
    short: "Platelet-rich plasma injected into the scalp.",
    intro:
      "Growth-factor-rich plasma from your own blood, injected into the scalp to bring inactive or newly implanted hair follicles into active growth.",
    points: ["90 minutes", "Uses your own blood plasma"],
    treatments: ["PRP"],
    price: 20000,
    advancePayment: ADVANCE,
    durationMinutes: 90,
    order: 7,
  },
  {
    slug: "botox-50-units",
    category: CATEGORY.skin,
    name: "Botox — up to 50 units",
    short: "For crow's feet, glabellar lines and wrinkles.",
    intro:
      "Botulinum toxin relaxes the muscles beneath the skin, softening the lines they create. Up to 50 units.",
    points: ["Up to 50 units"],
    treatments: ["Botox"],
    price: 12000,
    durationMinutes: 30,
    order: 8,
  },
  {
    slug: "botox-100-units",
    category: CATEGORY.skin,
    name: "Botox — up to 100 units",
    short: "A larger treatment area.",
    intro: "Botulinum toxin for a larger treatment area. Up to 100 units.",
    points: ["Up to 100 units"],
    treatments: ["Botox"],
    price: 22000,
    advancePayment: ADVANCE,
    durationMinutes: 45,
    order: 9,
  },
  {
    slug: "prf-under-eyes",
    category: CATEGORY.skin,
    name: "PRF — Under Eyes",
    short: "For dark circles and eye bags.",
    intro:
      "Platelet-rich fibrin from your own blood, for the hollowing and shadowing under the eyes.",
    points: ["60 minutes"],
    treatments: ["PRF"],
    price: 12000,
    durationMinutes: 60,
    order: 10,
  },
  {
    slug: "prf-nasolabial-folds",
    category: CATEGORY.skin,
    name: "PRF — Nasolabial Folds",
    short: "For the lines running from nose to mouth.",
    intro:
      "Platelet-rich fibrin to soften the deep folds running from the nose to the corners of the mouth.",
    points: ["60 minutes"],
    treatments: ["PRF"],
    price: 10000,
    durationMinutes: 60,
    order: 11,
  },
  {
    slug: "prf-lips",
    category: CATEGORY.skin,
    name: "PRF — Lips",
    short: "Volume and skin quality for the lips.",
    intro: "Platelet-rich fibrin for the lips — volume and skin quality, using your own plasma.",
    points: ["60 minutes"],
    treatments: ["PRF"],
    price: 12000,
    durationMinutes: 60,
    order: 12,
  },
  {
    slug: "lip-flip-botox",
    category: CATEGORY.skin,
    name: "Lip Flip — Botox only",
    short: "A subtle change to the upper lip.",
    intro:
      "A small amount of botulinum toxin to relax the upper lip so more of it shows when you smile.",
    points: ["30 minutes"],
    treatments: ["Botox"],
    price: 8000,
    durationMinutes: 30,
    order: 13,
  },
  {
    slug: "lip-flip-botox-filler",
    category: CATEGORY.skin,
    name: "Lip Flip — Botox with Filler",
    short: "Lip flip combined with dermal filler.",
    intro: "A lip flip combined with dermal filler, for added volume as well as shape.",
    points: ["60 minutes"],
    treatments: ["Botox", "Dermal filler"],
    price: 20000,
    advancePayment: ADVANCE,
    durationMinutes: 60,
    order: 14,
  },
  {
    slug: "lipolytic-injection",
    category: CATEGORY.skin,
    name: "Lipolytic Injection (Double Chin) — Kybella",
    short: "Injection treatment for submental fullness.",
    intro:
      "An injection treatment for a double chin. More than one treatment is usually needed; the price is per treatment.",
    points: ["60 minutes per treatment", "Usually more than one treatment"],
    treatments: ["Lipolytic injection", "Kybella"],
    price: 12000,
    durationMinutes: 60,
    order: 15,
  },
];

/**
 * On the published price list and deliberately NOT seeded — the clinic has
 * retired vein care. Kept here so the omission is visible rather than silent:
 *
 *   Diagnostic ultrasound for varicose veins with evaluation  Rs 8,000    60 min
 *   Injection therapy for varicose veins                      Rs 12,000   60 min/treatment
 *   Surgical removal of superficial varicose veins            Rs 25,000   60 min/treatment
 *   Endo-venous laser treatment (EVLT), one side              Rs 150,000  120 min
 */

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

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: readPrivateKey(),
  }),
});
const db = getFirestore(app);

const money = (n) => `Rs ${n.toLocaleString("en-PK")}`;

console.log(
  APPLY
    ? `\n${YELLOW}Writing ${SERVICES.length} services${OFF}`
    : `\n${DIM}Report only — nothing will be written. Add --apply to write.${OFF}`
);

const existing = await db.collection("services").get();
const bySlug = new Map(existing.docs.map((d) => [d.data().slug, d]));

let added = 0;
let updated = 0;
let currentCategory = null;

for (const service of SERVICES) {
  if (service.category !== currentCategory) {
    currentCategory = service.category;
    console.log(`\n  ${DIM}${currentCategory}${OFF}`);
  }

  const current = bySlug.get(service.slug);
  const now = new Date().toISOString();
  const priceLabel = service.advancePayment
    ? `${money(service.price)} ${DIM}(${money(service.advancePayment)} advance)${OFF}`
    : money(service.price);

  if (current) {
    console.log(`    ${YELLOW}update${OFF}  ${service.name.padEnd(48)} ${priceLabel}`);
    updated++;
    if (APPLY) await current.ref.update({ ...service, id: current.id, updatedAt: now });
  } else {
    console.log(`    ${GREEN}add${OFF}     ${service.name.padEnd(48)} ${priceLabel}`);
    added++;
    if (APPLY) {
      const ref = db.collection("services").doc();
      await ref.set({ ...service, id: ref.id, createdAt: now, updatedAt: now });
    }
  }
}

// Anything already in Firestore that isn't in this list — including any vein
// service left over from before — is reported but never touched. Deleting a
// service that appointments already point at would leave those bookings
// referring to something that no longer exists.
const extra = existing.docs
  .map((d) => d.data())
  .filter((s) => !SERVICES.some((x) => x.slug === s.slug));

if (extra.length) {
  console.log(`\n${DIM}Already in Firestore and not in this list — left alone:${OFF}`);
  for (const s of extra) console.log(`  ${DIM}· ${s.name} (${s.category})${OFF}`);
  console.log(
    `${DIM}  Remove any you no longer offer from the admin Services panel, so past${OFF}`
  );
  console.log(`${DIM}  appointments that reference them stay readable.${OFF}`);
}

console.log(
  APPLY
    ? `\n${GREEN}Done — ${added} added, ${updated} updated.${OFF}\n`
    : `\n${YELLOW}Would add ${added} and update ${updated}. Re-run with --apply.${OFF}\n`
);

process.exit(0);
