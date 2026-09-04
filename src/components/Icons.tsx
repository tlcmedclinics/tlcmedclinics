/**
 * The icon set, drawn inline.
 *
 * Not a package: the sandbox this project is built in cannot reach the npm
 * registry, and pulling a 200-icon library to use fourteen of them would ship
 * the other 186 to every visitor. These are stroked paths on a 24-unit grid,
 * all `currentColor`, so an icon takes the colour of the text it sits beside
 * and needs no props to theme.
 *
 * Every icon is decorative — it repeats a label that is already on the page in
 * words — so they carry aria-hidden and are invisible to a screen reader. An
 * icon that is the *only* label needs a <span className="sr-only"> next to it,
 * not an aria-label here.
 */

import type { ReactNode } from "react";

export type IconProps = {
  className?: string;
};

/** Shared attributes. 1.6 reads as a medical line weight — clinical, not chunky. */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Svg({ className = "h-6 w-6", children }: IconProps & { children: ReactNode }) {
  return (
    <svg {...base} className={className}>
      {children}
    </svg>
  );
}

/** Mental health, psychiatry, ketamine. */
export function BrainIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Two lobes and the seam between them. The bumps used to be 2.5 units
          across — two and a half pixels at the size this icon is actually
          rendered — so they merged into their own stroke and the whole thing
          read as a coin with a line through it. At 3.5 the lobes survive down
          to 24px, which is where it is used. */}
      <path d="M12 6.5a3.5 3.5 0 0 0-6.6-1.6A3 3 0 0 0 4.2 10 3.2 3.2 0 0 0 5.4 15.6 3.2 3.2 0 0 0 12 18Z" />
      <path d="M12 6.5a3.5 3.5 0 0 1 6.6-1.6A3 3 0 0 1 19.8 10 3.2 3.2 0 0 1 18.6 15.6 3.2 3.2 0 0 1 12 18Z" />
    </Svg>
  );
}

/** Skin care, aesthetics — anything cosmetic. */
export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 17.9 10.3 12.4 5 10.7 10.3 9Z" />
      <path d="M18.5 15.5 19.2 17.6 21.3 18.3 19.2 19 18.5 21.1 17.8 19 15.7 18.3 17.8 17.6Z" />
    </Svg>
  );
}

/** Diagnosis, evaluation, the doctor. */
export function StethoscopeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Wider tubing and a bigger bell. The bell was 2.3 units and sat almost
          on top of the tube it hangs from; at 24px the two shapes touched and
          the icon lost its outline. */}
      <path d="M6 3v5.5a4.5 4.5 0 0 0 9 0V3" />
      <path d="M4.2 3h3.6M13.2 3h3.6" />
      <path d="M10.5 13v1.5a5 5 0 0 0 10 0v-1.7" />
      <circle cx="20.5" cy="10.5" r="2.6" />
    </Svg>
  );
}

/** Telemedicine, video consults. */
export function VideoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="12" height="12" rx="2.5" />
      <path d="M15 10.5 20.5 7.5v9L15 13.5Z" />
    </Svg>
  );
}

/** Hours, waiting time, session length. */
export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  );
}

/** Safety, privacy, supervision. */
export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2 19 6v5.6c0 4.2-2.8 7.5-7 9.2-4.2-1.7-7-5-7-9.2V6Z" />
      <path d="m9.2 12.2 2 2 3.6-3.9" />
    </Svg>
  );
}

/** Credentials, board certification, awards. */
export function AwardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="9" r="5.2" />
      <path d="m8.6 13.6-1.3 7 4.7-2.6 4.7 2.6-1.3-7" />
    </Svg>
  );
}

/** Care, wellbeing, the clinic's own voice. */
export function HeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20.2C7 17.2 3.8 14.3 3.8 10.7A4 4 0 0 1 12 8.4a4 4 0 0 1 8.2 2.3c0 3.6-3.2 6.5-8.2 9.5Z" />
    </Svg>
  );
}

/** Medication management, prescriptions. */
export function PillIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.6" y="8.6" width="18.8" height="6.8" rx="3.4" transform="rotate(-45 12 12)" />
      <path d="M9.2 9.2 14.8 14.8" />
    </Svg>
  );
}

/** Infusions, PRP, anything drawn or injected. */
export function DropletIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.4c3 3.6 5.4 6.4 5.4 9.2A5.4 5.4 0 0 1 6.6 12.6c0-2.8 2.4-5.6 5.4-9.2Z" />
    </Svg>
  );
}

/** The team, family involvement. */
export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M3.8 19.2a5.8 5.8 0 0 1 11.4 0" />
      <path d="M16.4 6.1a3.2 3.2 0 0 1 0 6" />
      <path d="M17.6 13.8a5.8 5.8 0 0 1 2.7 4.6" />
    </Svg>
  );
}

/** Location. */
export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21c4-4.2 6-7.3 6-9.9a6 6 0 1 0-12 0C6 13.7 8 16.8 12 21Z" />
      <circle cx="12" cy="11" r="2.3" />
    </Svg>
  );
}

/** Phone. */
export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.3 3.5h3l1.5 3.7-1.9 1.4a11.5 11.5 0 0 0 5.5 5.5l1.4-1.9 3.7 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.3 5.7a2 2 0 0 1 2-2.2Z" />
    </Svg>
  );
}

/** Email. */
export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m3.8 7.5 8.2 5.4 8.2-5.4" />
    </Svg>
  );
}

/** Confirmation, list items that are claims rather than bullets. */
export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.8 4.4 4.4L19 7.6" />
    </Svg>
  );
}

/** "Read more". Flips under RTL via the parent's direction, not here. */
export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </Svg>
  );
}

/** Dropdown affordance in the header. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
    </Svg>
  );
}

/** Forms, records, patient paperwork. */
export function FileIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 3.2H7.4A2.2 2.2 0 0 0 5.2 5.4v13.2a2.2 2.2 0 0 0 2.2 2.2h9.2a2.2 2.2 0 0 0 2.2-2.2V8.5Z" />
      <path d="M13.5 3.2V8.5h5.3" />
      <path d="M8.8 13h6.4M8.8 16.5h4.2" />
    </Svg>
  );
}

/**
 * Icons by name, for data files that want to name an icon as a string rather
 * than import a component. Keeps content data free of JSX.
 */
export const ICONS = {
  brain: BrainIcon,
  sparkle: SparkleIcon,
  stethoscope: StethoscopeIcon,
  video: VideoIcon,
  clock: ClockIcon,
  shield: ShieldIcon,
  award: AwardIcon,
  heart: HeartIcon,
  pill: PillIcon,
  droplet: DropletIcon,
  users: UsersIcon,
  mapPin: MapPinIcon,
  phone: PhoneIcon,
  mail: MailIcon,
  check: CheckIcon,
  arrowRight: ArrowRightIcon,
  chevronDown: ChevronDownIcon,
  file: FileIcon,
} as const;

export type IconName = keyof typeof ICONS;

/** Renders an icon named by string. Unknown names render nothing, not a crash. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  const Cmp = ICONS[name];
  return Cmp ? <Cmp className={className} /> : null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Social marks.
 *
 * These three break the rules the rest of this file follows, and have to.
 * Everything above is a 1.6-weight stroked path that takes the colour of the
 * text beside it; a brand mark drawn that way stops being the brand mark —
 * Facebook's "f" outlined rather than solid reads as a letter in a circle, and
 * nobody recognises it in a footer at 18px. So these are filled shapes on the
 * same 24-unit grid, still `currentColor`, still decorative.
 *
 * They are the official geometry of each mark, not a redrawing: a social icon
 * that is nearly right is worse than one that is plainly a link, because the
 * eye spots the difference without being able to name it and the whole footer
 * looks counterfeit.
 * ──────────────────────────────────────────────────────────────────────────── */

function BrandSvg({ className = "h-5 w-5", children }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      {children}
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.19 2.24.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12Z" />
    </BrandSvg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0-2.16C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8Zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
    </BrandSvg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.37 4.26 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </BrandSvg>
  );
}

/**
 * The three above, by the `icon` name used in data/site.ts.
 *
 * A lookup rather than a chain of conditionals in the footer: adding a network
 * then means one entry in site.ts and one icon here, and no component has to
 * learn about it.
 */
export const socialIcons = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
} as const;
