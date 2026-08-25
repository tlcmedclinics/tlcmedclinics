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
