import type { SVGProps } from "react";

/**
 * Campaign icon cohesion rules
 * - Stroke: 1.5px
 * - Corners: round caps + round joins
 * - Fill: none
 * - Metaphor: geometric paths and paper-like folds
 */
export type CampaignIconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: CampaignIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z" /></Icon>;
}

export function CampaignIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M4 6.5h6M14 6.5h6M7 3.5v6M4 17.5h6M14 17.5h6M17 14.5v6M10 6.5c2 0 2 3.5 4 3.5h3v4" /></Icon>;
}

export function PeopleIcon(props: CampaignIconProps) {
  return <Icon {...props}><circle cx="8" cy="8" r="3" /><path d="M2.5 20c.5-4 2.3-6 5.5-6s5 2 5.5 6M15 5.5a3 3 0 0 1 0 5.8M15.5 14c3.5.2 5.4 2.2 6 6" /></Icon>;
}

export function ReviewIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M7 3.5h10a2 2 0 0 1 2 2v15l-7-3-7 3v-15a2 2 0 0 1 2-2Z" /><path d="m8.5 10 2.1 2.1 4.9-5" /></Icon>;
}

export function PlusIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function SearchIcon(props: CampaignIconProps) {
  return <Icon {...props}><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></Icon>;
}

export function ArrowIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M5 12h14M14 7l5 5-5 5" /></Icon>;
}

export function BackIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M19 12H5M10 7l-5 5 5 5" /></Icon>;
}

export function MailIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M4 6.5h16v11H4z" /><path d="m4.5 7 7.5 6 7.5-6" /></Icon>;
}

export function WaitIcon(props: CampaignIconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></Icon>;
}

export function LinkedInIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M5 9v10M5 5.5v.2M10 19v-6.5c0-2.2 1.3-3.5 3.4-3.5 2.2 0 3.6 1.5 3.6 4v6M10 9v10" /></Icon>;
}

export function DemoIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M5 4h14v16H5z" /><path d="m9 9 6 3-6 3Z" /></Icon>;
}

export function MoreIcon(props: CampaignIconProps) {
  return <Icon {...props}><circle cx="5" cy="12" r=".7" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r=".7" fill="currentColor" stroke="none" /></Icon>;
}

export function MoveUpIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M12 19V5M7 10l5-5 5 5" /></Icon>;
}

export function MoveDownIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M12 5v14M7 14l5 5 5-5" /></Icon>;
}

export function TrashIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="M5 7h14M9 7V4h6v3M7.5 7l.7 13h7.6l.7-13M10 11v5M14 11v5" /></Icon>;
}

export function CloseIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
}

export function EditIcon(props: CampaignIconProps) {
  return <Icon {...props}><path d="m5 19 3.6-.8L19 7.8 16.2 5 5.8 15.4Z" /><path d="m14.8 6.4 2.8 2.8" /></Icon>;
}
