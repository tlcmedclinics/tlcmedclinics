type VitalsLineProps = {
  className?: string;
  color?: string;
};

/**
 * Signature motif: a thin measurement/vitals line with tick marks,
 * referencing a monitoring readout without leaning on cliché medical icons.
 */
export default function VitalsLine({ className = "", color = "var(--indigo)" }: VitalsLineProps) {
  return (
    <svg
      viewBox="0 0 240 16"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="8" x2="240" y2="8" stroke={color} strokeWidth="1" opacity="0.35" />
      <path
        d="M0 8 H90 L98 1 L106 15 L114 8 H150"
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="150" y1="8" x2="240" y2="8" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="106" cy="15" r="2" fill={color} />
    </svg>
  );
}
