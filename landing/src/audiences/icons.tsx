import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps) {
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

export function AudienceIcon(props: IconProps) {
  return <Icon {...props}><circle cx="8" cy="8" r="3" /><path d="M2.5 20c.5-4 2.3-6 5.5-6s5 2 5.5 6M15 5.5a3 3 0 0 1 0 5.8M15.5 14c3.5.2 5.4 2.2 6 6" /></Icon>;
}

export function SearchIcon(props: IconProps) {
  return <Icon {...props}><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></Icon>;
}

export function PlusIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function BackIcon(props: IconProps) {
  return <Icon {...props}><path d="M19 12H5M10 7l-5 5 5 5" /></Icon>;
}

export function FilterIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 6h16M7 12h10M10 18h4" /></Icon>;
}

export function CheckIcon(props: IconProps) {
  return <Icon {...props}><path d="m5 12 4.2 4.2L19 6.5" /></Icon>;
}

export function TrashIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 7h14M9 7V4h6v3M7.5 7l.7 13h7.6l.7-13M10 11v5M14 11v5" /></Icon>;
}

export function ArrowIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14M14 7l5 5-5 5" /></Icon>;
}

export function OrangeSliceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 17.5a9 9 0 0 1 16 0H4Z" />
      <path d="M12 8.5v9M6.5 11.5l5.5 6M17.5 11.5l-5.5 6" />
    </Icon>
  );
}
