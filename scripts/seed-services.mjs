/**
 * Run once to seed the "services" collection with the clinic's starting
 * list of services. After this, manage everything from /admin/services —
 * this script is only for the first run on a fresh Firestore project.
 *
 *   node --env-file=.env.local scripts/seed-services.mjs
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * in your environment (same as .env.local).
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();

function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const starterServices = [
  {
    category: "Vein Care",
    name: "Varicose Veins",
    short: "Twisted, bulging veins caused by weak or damaged valves.",
    intro:
      "Enlarged, rope-like veins that usually appear on the legs. Left untreated they can cause aching, swelling, and skin changes over time.",
    points: [
      "Common signs: aching legs, visible bulging veins, heaviness by evening",
      "Diagnosis with ultrasound vein mapping",
      "Most procedures are walk-in, walk-out",
    ],
    treatments: [
      "Endovenous Laser Treatment",
      "Ultrasound-Guided Sclerotherapy",
      "Phlebectomy",
      "Compression Therapy",
    ],
    price: 5000,
  },
  {
    category: "Vein Care",
    name: "Spider Veins",
    short: "Fine, web-like veins visible near the skin's surface.",
    intro:
      "Smaller than varicose veins and mostly a cosmetic concern, though they can signal early vein disease worth checking.",
    points: [
      "Thin red, blue, or purple web patterns",
      "Often on thighs, calves, and ankles",
      "Quick in-clinic treatment sessions",
    ],
    treatments: ["Visual Sclerotherapy"],
    price: 4000,
  },
  {
    category: "Vein Care",
    name: "Restless Leg Syndrome",
    short: "An urge to move the legs, often worse at night.",
    intro:
      "A neuro-vascular condition that disrupts sleep and daily comfort. Often linked to underlying circulation issues we can test for.",
    points: [
      "Uncomfortable, hard-to-describe leg sensations",
      "Symptoms typically worsen at rest or at night",
      "Treatable once the underlying cause is identified",
    ],
    treatments: ["Ultrasound-Guided Sclerotherapy", "Visual Sclerotherapy"],
    price: 4500,
  },
  {
    category: "Skin Care",
    name: "Acne Scars",
    short: "Textured marks left behind after acne has healed.",
    intro:
      "Depressed or raised scarring from past breakouts. Modern resurfacing techniques can noticeably even out skin texture.",
    points: [
      "Assessment of scar type and skin depth",
      "Personalized multi-session plans",
      "Downtime varies by treatment intensity",
    ],
    treatments: ["PRP Facial Treatment", "Micro-needling"],
    price: 6000,
  },
  {
    category: "Skin Care",
    name: "Hair Thinning & Hair Loss",
    short: "Gradual density loss with genetic and hormonal causes.",
    intro:
      "Early intervention gives the best results. We evaluate scalp health and hair cycle stage before recommending a plan.",
    points: [
      "Common in both men and women",
      "Causes range from genetics to stress to hormones",
      "Best results come from early, consistent treatment",
    ],
    treatments: ["Platelet Rich Plasma (PRP)"],
    price: 7000,
  },
  {
    category: "Skin Care",
    name: "Wrinkles & Fine Lines",
    short: "Crow's feet, glabellar lines, and nasolabial folds.",
    intro:
      "Expression lines that deepen with age and sun exposure. Treated conservatively for a natural, rested look.",
    points: [
      "Covers crow's feet, glabellar & marionette lines",
      "Natural-looking, conservative dosing philosophy",
      "Results typically visible within 3–7 days",
    ],
    treatments: ["Botox", "Dermal Fillers"],
    price: 8000,
  },
  {
    category: "Mental Health",
    name: "Mood & Anxiety Disorders",
    short: "Depression, anxiety, PTSD, OCD, and related conditions.",
    intro:
      "Confidential, physician-led mental health care, available in person or by telemedicine, for adults navigating mood and anxiety conditions.",
    points: [
      "Covers depression, GAD, panic disorder, PTSD, OCD",
      "Combined medication and psychotherapy plans",
      "Telemedicine consults available across Pakistan",
    ],
    treatments: ["Medication Management", "Psychotherapy"],
    price: 3500,
  },
  {
    category: "Mental Health",
    name: "Ketamine Therapy",
    short: "Physician-supervised infusions for treatment-resistant cases.",
    intro:
      "For patients who haven't found relief with standard treatment — offered for depression, PTSD, OCD, and chronic pain, under close medical supervision.",
    points: [
      "For treatment-resistant depression and mood disorders",
      "Administered and monitored by licensed physicians",
      "Structured multi-session protocol",
    ],
    treatments: ["Ketamine Infusion Therapy"],
    price: 15000,
  },
];

const existing = await db.collection("services").limit(1).get();
if (!existing.empty) {
  console.log(
    "services collection already has data — skipping seed (delete the collection first if you want to reseed)."
  );
  process.exit(0);
}

let order = 0;
for (const s of starterServices) {
  const ref = db.collection("services").doc();
  const now = new Date().toISOString();
  await ref.set({
    id: ref.id,
    slug: `${slugify(s.name)}-${ref.id.slice(0, 6)}`,
    order: order++,
    createdAt: now,
    updatedAt: now,
    ...s,
  });
  console.log(`✔ seeded ${s.name}`);
}

console.log(`Done — ${starterServices.length} services created.`);
process.exit(0);
