/**
 * Every photograph the site uses, named by the job it does rather than by its
 * filename.
 *
 * The files in public/images came from the old Care Life site and carry its
 * export names. Spreading those through a dozen components would mean that
 * renaming one file breaks the site in places nobody thinks to look. Here, a
 * rename is one line — which is exactly what saved this file the last time the
 * folder was reorganised.
 *
 * ── THE clinic (N).jpeg FILES ──
 * The ten treatment/interior photographs were re-exported and are now named
 * "clinic (1).jpeg" … "clinic (10).jpeg". Those names contain a space and
 * brackets, so every path below writes the space as %20 — a raw space in a URL
 * is not a URL, and the browser would silently ask for a file that does not
 * exist. If these are ever renamed again, keep them free of spaces and the
 * encoding can go.
 *
 * Which old picture became which number (matched by byte size, so this is
 * fact rather than guesswork):
 *
 *   (1) spider_veins   (2) acne         (3) aesthetic    (4) beauty_care
 *   (5) beauty_clinic  (6) face_fillers (7) hair_loss    (8) skin_care
 *   (9) skin_clinic   (10) skin_glow
 *
 * Two other things about the folder, both invisible until something looks
 * wrong on the live site:
 *
 *   · The certificate scans run frame-1 … frame-10 but there is no frame-4.
 *     The list below skips it rather than pointing at a file that isn't there.
 *   · beauty_clinic-min-min-860x645.png is zero bytes — a truncated export. It
 *     is deliberately unused; delete it from the folder when convenient.
 *
 * Nothing here is load-bearing: SiteImage falls back to a tinted panel if a
 * file is missing, so a wrong path costs a picture, never the page.
 */

export const images = {
  /**
   * The doctor on the home hero — a cut-out, filling the right of the green
   * band from its top edge to its floor.
   *
   * Two things were wrong with what this pointed at before. The path said
   * hero-img.jpg and the file is hero-img.png, so nothing loaded at all; and
   * hero-img.png is not a cover photograph, it is a PNG cut-out — 63% of it
   * transparent, all of it on the left — which was being stretched full-bleed
   * across the section and then covered by a dark scrim. A cut-out used as a
   * background picture is a background picture of nothing.
   *
   * hero-doctor.png is that file with the empty left half trimmed off (the
   * alpha bounding box, 352×307), then doubled to 704×614 with Lanczos and
   * given a light unsharp mask. The upscale adds no detail — nothing can add
   * detail that was never captured — but it means the browser DOWNscales to
   * the ~560px the hero draws it at, instead of upscaling, and the unsharp
   * mask puts back the local contrast that any resize washes out. Between them
   * that is the difference between "slightly soft" and "low resolution", and
   * it is as far as this photograph can be taken.
   *
   * Trimming is what lets it be placed at all: with the transparent margin
   * still attached, "align this to the right edge" aligns the emptiness.
   */
  heroDoctor: "/images/hero-doctor.png",

  /** The three care areas on the home page. */
  mental: "/images/mental-care.jpg",
  skin: "/images/clinic%20(8).jpeg",
  diagnosis: "/images/diagnosis-2.jpg",

  /** The clinic itself, and the physician. */
  clinic: "/images/clinic%20(5).jpeg",
  doctor: "/images/WhatsApp-Image-2022-02-21-at-12.23.52-PM-500x500.jpeg",

  /** The Castle Connolly "Top Doctor" award. */
  award: "/images/top-chicago-award.png",

  /** Section banners. */
  aesthetic: "/images/clinic%20(3).jpeg",
  wellbeing: "/images/hope-min-516x360.jpg",
  care: "/images/health-care-2-500x500.png",

  /** The logo, in both forms. */
  logoIcon: "/images/logo-icon.png",
  logoFull: "/images/logo-full.png",
} as const;

export type ImageKey = keyof typeof images;

/**
 * The clinic itself, cycled as a slideshow on the About section.
 *
 * These are the ten photographs chosen for this section, in their own order.
 * `images.clinic` above is one of them, and stays as the single-image fallback
 * for anywhere that wants one photograph rather than a loop.
 *
 * ── Changing what the About slideshow shows ──
 * This list is the whole control. Add a line, remove a line, reorder them —
 * the loop follows. Every filename here must exist in public/images; a missing
 * one costs a slide, not the section, because SiteImage draws a tinted panel
 * instead of a broken icon.
 *
 * Ten rather than four: four photographs of one clinic cycle back round before
 * a reader has finished the paragraph beside them, which makes the place look
 * smaller than it is.
 */
export const clinicGallery: string[] = [
  "/images/clinic%20(1).jpeg",
  "/images/clinic%20(2).jpeg",
  "/images/clinic%20(3).jpeg",
  "/images/clinic%20(4).jpeg",
  "/images/clinic%20(5).jpeg",
  "/images/clinic%20(6).jpeg",
  "/images/clinic%20(7).jpeg",
  "/images/clinic%20(8).jpeg",
  "/images/clinic%20(9).jpeg",
  "/images/clinic%20(10).jpeg",
];

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
  "wrinkles-and-sagging": "/images/clinic%20(10).jpeg",
  "glabellar-lines": "/images/clinic%20(4).jpeg",
  "marionette-lines": "/images/skin-care-2.jpg",
  "dark-circles-and-eye-bags": "/images/skin.jpg",
  "spider-veins": "/images/clinic%20(1).jpeg",

  // Conditions — mental health. Only the two that describe a service rather
  // than a diagnosis.
  "diagnosis-and-treatment": "/images/diagnosis-2.jpg",
  "mental-disorders": "/images/mental-health-min-1.jpg",

  // Treatments
  botox: "/images/clinic%20(6).jpeg",
  "dermal-fillers": "/images/clinic%20(6).jpeg",
  "micro-needling-with-prp": "/images/clinic%20(2).jpeg",
  "hair-regrowth-with-prp": "/images/clinic%20(7).jpeg",
  "prf-treatments": "/images/clinic%20(9).jpeg",
  "lipolytic-injection": "/images/clinic%20(3).jpeg",
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


/**
 * The looping clip on the home page.
 *
 * Empty until a file exists, and the section renders nothing while it is —
 * which is the point. A <video> pointing at a missing file shows a black
 * rectangle with a broken-play icon, and that is worse than no video at all.
 *
 * ── What to put here ──
 * An MP4 (H.264) of the clinic — the waiting room, a consultation being set
 * up, hands preparing a treatment. Ten to twenty seconds is plenty: it loops,
 * so a longer clip mostly means a longer download before anything moves.
 *
 * Keep it under about 4 MB. This plays on Pakistani mobile data, and a 30 MB
 * hero video is a home page that stays blank for fifteen seconds on 3G. If the
 * export is bigger, run it through HandBrake at 1280×720 and a bitrate around
 * 2000 kbps — nobody will see the difference at this size.
 *
 * `poster` is the still shown before the video is ready. Without one there is
 * a flash of empty box on every load. It pointed at bg-doctor-cover-1-scaled
 * .jpg, which has been deleted from the folder; the hero picture stands in
 * until there is a real frame of the clip to use.
 */
export const videos = {
  /** e.g. "/videos/clinic-loop.mp4" — put the file in public/videos/. */
  clinicLoop: "",
  clinicLoopPoster: "/images/hero-img.png",
};
