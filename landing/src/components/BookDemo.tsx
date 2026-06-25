/* Single source of truth for the booking link. Replaces the old email
   waitlist everywhere — every CTA now drops the prospect straight onto the
   cal.com booking page. */
export const CAL_URL = "https://cal.com/aayush-gupta-qyilz6/30-min";

type Variant = "primary" | "nav" | "ghost";

const STYLES: Record<Variant, string> = {
  // hero + final CTA: prominent tide pill
  primary:
    "h-13 px-7 text-[16px] font-semibold text-white bg-tide hover:bg-tide-deep shadow-[0_12px_30px_-12px_rgba(13,60,91,0.6)] hover:-translate-y-px",
  // sticky nav: compact ink button, matches the old "Get early access"
  nav: "px-4.5 py-2 text-[14px] font-semibold text-paper bg-ink hover:bg-tide-deep shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] hover:-translate-y-px",
  // pricing tiers: outline on paper
  ghost:
    "px-4 py-2.5 w-full text-[14px] font-semibold text-ink bg-paper border border-line hover:border-ink-faint",
};

export default function BookDemo({
  label = "Book a demo",
  variant = "primary",
  className = "",
}: {
  label?: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <a
      href={CAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl no-underline transition-all ${STYLES[variant]} ${className}`}
    >
      {label}
      {variant !== "ghost" && (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 stroke-current" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </a>
  );
}
