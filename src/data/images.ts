/**
 * Every photograph the site uses, named by the job it does rather than by its
 * filename.
 *
 * The files in public/images came from the old Care Life site and carry its
 * export names — "skin_care-min-860x645.jpeg", "WhatsApp-Image-2022-02-21-...".
 * Spreading those through a dozen components would mean that renaming one file
 * breaks the site in places nobody thinks to look. Here, a rename is one line.
 *
 * Two things about the folder worth knowing, because both are invisible until
 * something looks wrong on the live site:
 *
 *   · The certificate scans run frame-1 … frame-10 but there is no frame-4.
 *     The list below skips it rather than pointing at a file that isn't there.
 *   · beauty_clinic-min-min-860x645.png is zero bytes — a truncated export. It
 *     is deliberately unused; delete it from the folder when convenient.
 *
 * KEEPING THIS IN SYNC
 * --------------------
 *   npm run map-images            # report what it would change
 *   npm run map-images -- --apply # rewrite this file from public/images
 *
 * Nothing here is load-bearing: SiteImage falls back to a tinted panel if a
 * file is missing, so a wrong path costs a picture, never the page.
 */

export const images = {
  /** The home hero, used full-bleed behind the headline. */
  heroCover: "/images/bg-doctor-cover-1-scaled.jpg",

  /** The three care areas on the home page. */
  mental: "/images/mental-care.jpg",
  skin: "/images/skin_care-min-860x645.jpeg",
  diagnosis: "/images/diagnosis-2.jpg",

  /** The clinic itself, and the physician. */
  clinic: "/images/beauty_clinic-min-860x645.jpeg",
  doctor: "/images/WhatsApp-Image-2022-02-21-at-12.23.52-PM-500x500.jpeg",

  /** The Castle Connolly "Top Doctor" award. */
  award: "/images/top-chicago-award.png",

  /** Section banners. */
  aesthetic: "/images/aesthetic-min-860x645.jpeg",
  wellbeing: "/images/hope-min-516x360.jpg",
  care: "/images/health-care-2-500x500.png",

  /** The logo, in both forms. */
  logoIcon: "/images/logo-icon.png",
  logoFull: "/images/logo-full.png",
} as const;

export type ImageKey = keyof typeof images;

/**
 * Pictures for the individual condition and treatment pages, by slug.
 *
 * A partial map on purpose: a page with no entry renders without a banner
 * image, which is the correct outcome. Depression and PTSD have no honest
 * photograph, and reaching for a stock one — a person with their head in their
 * hands — is worse than nothing on a page someone may be reading about
 * themselves. The skin pages have real clinical subjects, so they get one.
 */
export const pageImages: Record<string, string> = {
  // Conditions — skin
  "acne-scars": "/images/acne-scar-min.jpg",
  "hair-thinning-hair-loss": "/images/hair-thinning-min.jpg",
  "crows-feet": "/images/crows-feet-1.png",
  "nasolabial-folds": "/images/nasolabial-folds.png",
  "wrinkles-and-sagging": "/images/skin_glow-min-860x645.jpeg",
  "glabellar-lines": "/images/beauty_care-min-860x645.jpeg",
  "marionette-lines": "/images/skin-care-2.jpg",
  "dark-circles-and-eye-bags": "/images/skin.jpg",

  // Conditions — mental health. Only the two that describe a service rather
  // than a diagnosis.
  "diagnosis-and-treatment": "/images/diagnosis-2.jpg",
  "mental-disorders": "/images/mental-health-min-1.jpg",

  // Treatments
  botox: "/images/face_fillers-min-860x645.jpeg",
  "dermal-fillers": "/images/face_fillers-min-860x645.jpeg",
  "micro-needling-with-prp": "/images/acne-min-860x645.jpeg",
  "hair-regrowth-with-prp": "/images/hair_loss-min-860x645.jpeg",
  "prf-treatments": "/images/skin_clinic-min-860x645.jpeg",
  "lipolytic-injection": "/images/aesthetic-min-860x645.jpeg",
  "psychiatric-consultation": "/images/mental-care.jpg",
  "ketamine-therapy": "/images/hope-min-516x360.jpg",
};

/**
 * The framed certificates and qualifications, shown as a strip on the About
 * page. There is no frame-4 in the export, which is why this is a written list
 * rather than a loop from 1 to 10.
 */
export const certificates: string[] = [
  "/images/frame-1.png",
  "/images/frame-2.png",
  "/images/frame-3.png",
  "/images/frame-5.png",
  "/images/frame-6.png",
  "/images/frame-7.png",
  "/images/frame-8.png",
  "/images/frame-9.png",
  "/images/frame-10.png",
];
