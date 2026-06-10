type IconProps = {
  className?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* Radar sweep — intent-based lead sourcing */
export function IconRadar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" strokeDasharray="2.4 3.2" />
      <path d="M12 12 L18.4 5.8" />
      <circle cx="15" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Rising swells — inbox warming / deliverability */
export function IconSwell({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 17.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 1.5 1 3 1.6" />
      <path d="M3 12.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2" />
      <path d="M7 7.5c1.8 0 1.8-1.6 3.6-1.6s1.8 1.6 3.6 1.6" />
    </svg>
  );
}

/* Framed play — custom demo build */
export function IconDemo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M10.2 9.4v5.2l4.4-2.6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Tide loop — iterate and learn */
export function IconLoop({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1" />
      <path d="M19.5 12a7.5 7.5 0 0 1-13 5.1" />
      <path d="M17.5 3.5v3.6h-3.6" />
      <path d="M6.5 20.5v-3.6h3.6" />
    </svg>
  );
}

/* Forked path — reply-aware sequencing */
export function IconFork({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12h5c2 0 3-1.2 4.4-2.8C14.8 7.6 15.8 6.5 18 6.5" />
      <path d="M13 12c1.4 1.6 2.5 5.5 5 5.5" />
      <path d="M16 4l3 2.5-3 2.5" />
      <path d="M16 15l3 2.5-3 2.5" />
    </svg>
  );
}

/* Sounding line — full-funnel analytics */
export function IconSounding({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 19.5V4.5" />
      <path d="M4 19.5h16" />
      <path d="M7.5 15.5l3.4-4 3.2 2.4 4.4-6.4" />
      <circle cx="18.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Trim lines — sending-profile optimization */
export function IconTrim({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7.5h16" />
      <path d="M4 12h16" />
      <path d="M4 16.5h16" />
      <circle cx="9" cy="7.5" r="1.8" fill="var(--color-surface)" />
      <circle cx="15.5" cy="12" r="1.8" fill="var(--color-surface)" />
      <circle cx="7" cy="16.5" r="1.8" fill="var(--color-surface)" />
    </svg>
  );
}

/* Drift mark — ICP refinement / targeting */
export function IconMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    </svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 12h14" />
      <path d="M13.5 6.5L19 12l-5.5 5.5" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
