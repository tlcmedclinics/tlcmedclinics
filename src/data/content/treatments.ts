import type { ContentPage } from "./types";

/**
 * The treatments offered, with their published prices.
 *
 * Prices are stated here because a patient's first question is almost always
 * "what does it cost?", and a clinic that makes people phone to find out loses
 * the ones who won't. They are duplicated from the booking form on purpose —
 * these pages are read by people who have not started booking yet.
 *
 * Vein procedures (ultrasound-guided injection, surgical removal, EVLT) are
 * absent: the clinic no longer offers them.
 */

const MENTAL = "Mental health";
const AESTHETIC = "Aesthetic";

export const treatmentPages: ContentPage[] = [
  {
    slug: "ketamine-therapy",
    title: "Ketamine Therapy",
    summary:
      "Ketamine infusion for depression, PTSD, OCD, anxiety and chronic pain — the first clinic of its kind in Lahore.",
    group: "treatments",
    section: MENTAL,
    blocks: [
      {
        kind: "p",
        text: "We offer a personalised approach to mental health treatment, with ketamine infusion for depression, suicidal thinking, post-traumatic stress disorder (PTSD), anxiety disorders, postpartum depression, obsessive-compulsive disorder (OCD), chronic pain, substance abuse disorders and other mood disorders.",
      },
      {
        kind: "p",
        text: "Ours is the first clinic of its kind in Lahore, run and supervised by U.S. board certified physicians — providing safe, effective and world-class treatment with the best outcomes.",
      },
      { kind: "prices", caption: "Session", slugs: ["ketamine-therapy"] },
      {
        kind: "note",
        text: "Ketamine therapy is given under physician supervision, and starts with an evaluation — it is not something to book without one. Your first visit will establish whether it is right for you.",
      },
    ],
  },
  {
    slug: "psychiatric-consultation",
    title: "Psychiatric Consultation & Therapy",
    summary:
      "Evaluation, medication management and therapy with an American Board Certified psychiatrist.",
    group: "treatments",
    section: MENTAL,
    blocks: [
      {
        kind: "p",
        text: "You will meet an American Board Certified psychiatrist with over 35 years of experience, ranked a 'top doctor' in the United States by his peers. First appointments are deliberately longer, so your history and background can be gone through thoroughly before any medication is started.",
      },
      {
        kind: "prices",
        caption: "Consultation fees",
        slugs: [
          "initial-evaluation",
          "regular-follow-up",
          "therapy-med-management-30",
          "therapy-med-management-60",
        ],
      },
      {
        kind: "p",
        text: "Consultations are available in the clinic or by telemedicine, with the same doctor either way.",
      },
    ],
  },
  {
    slug: "botox",
    title: "Botox",
    summary:
      "Botulinum toxin for crow's feet, glabellar lines, marionette lines and wrinkles.",
    group: "treatments",
    section: AESTHETIC,
    blocks: [
      {
        kind: "p",
        text: "Botox relaxes the muscles beneath the skin, which makes the lines they create less noticeable. It is used here for crow's feet, glabellar lines, marionette lines, wrinkles and sagging, and for the puckering that sometimes surrounds acne scars.",
      },
      {
        kind: "p",
        text: "Compared with other procedures it is affordable, and the risk of side effects is minimal. The effect is temporary, so treatment is repeated periodically.",
      },
      {
        kind: "prices",
        caption: "Fees",
        slugs: [
          "botox-50-units",
          "botox-100-units",
          "lip-flip-botox",
          "lip-flip-botox-filler",
        ],
      },
    ],
  },
  {
    slug: "dermal-fillers",
    title: "Dermal Fillers",
    summary:
      "Soft tissue fillers that restore volume and soften folds, indentations and scars.",
    group: "treatments",
    section: AESTHETIC,
    blocks: [
      {
        kind: "p",
        text: "Soft tissue fillers mimic the collagen and other structural components of your skin. Injected under indented scars they fill out or stretch the skin, making the scars less noticeable; used in the face they restore volume lost with age.",
      },
      {
        kind: "p",
        text: "We use fillers for nasolabial folds, marionette lines, crow's feet, wrinkles and sagging, and for acne scarring. Results are temporary, so injections are repeated periodically.",
      },
    ],
  },
  {
    slug: "micro-needling-with-prp",
    title: "Micro-needling with PRP",
    summary:
      "Full-face micro-needling with platelet-rich plasma, for acne scars, wrinkles, age spots and sun damage.",
    group: "treatments",
    section: AESTHETIC,
    blocks: [
      {
        kind: "p",
        text: "A needle-studded device is rolled over the skin to stimulate the tissue underneath, combined with platelet-rich plasma drawn from your own blood. It is a safe, simple technique for acne scarring — the result is subtle, and treatments are usually repeated.",
      },
      {
        kind: "p",
        text: "The same treatment is used for wrinkles, age spots and sun damage across the full face.",
      },
      {
        kind: "prices",
        caption: "Full face micro-needling with PRP",
        slugs: ["micro-needling-with-prp"],
      },
    ],
  },
  {
    slug: "hair-regrowth-with-prp",
    title: "Hair Regrowth with PRP",
    summary:
      "Platelet-rich plasma injected into the scalp to bring inactive hair back into growth.",
    group: "treatments",
    section: AESTHETIC,
    blocks: [
      {
        kind: "p",
        text: "Your blood is drawn and carefully processed to extract plasma rich in growth factors, which is then injected into the scalp. Those platelets prompt inactive or newly implanted hair to enter an active growth phase.",
      },
      {
        kind: "prices",
        caption: "Hair regrowth with PRP",
        slugs: ["hair-regrowth-with-prp"],
      },
    ],
  },
  {
    slug: "prf-treatments",
    title: "PRF Treatments",
    summary:
      "Platelet-rich fibrin for dark circles and eye bags, nasolabial folds and lips.",
    group: "treatments",
    section: AESTHETIC,
    blocks: [
      {
        kind: "p",
        text: "PRF — platelet-rich fibrin — is prepared from your own blood and used to restore volume and skin quality in the most delicate areas of the face, where a heavier filler would be too much.",
      },
      {
        kind: "prices",
        caption: "Fees",
        slugs: ["prf-under-eyes", "prf-nasolabial-folds", "prf-lips"],
      },
    ],
  },
  {
    slug: "lipolytic-injection",
    title: "Lipolytic Injection (Kybella)",
    summary: "Injection treatment for a double chin.",
    group: "treatments",
    section: AESTHETIC,
    blocks: [
      {
        kind: "p",
        text: "A lipolytic injection treatment for submental fullness — a double chin — given in the clinic. More than one treatment is usually needed, and your doctor will tell you how many to expect after examining you.",
      },
      { kind: "prices", caption: "Fees", slugs: ["lipolytic-injection"] },
    ],
  },
];
