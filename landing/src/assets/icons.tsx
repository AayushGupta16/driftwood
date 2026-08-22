import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps & { children: ReactNode }) {
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

export function UploadIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 14v5h14v-5" /></Icon>;
}

export function LinkIcon(props: IconProps) {
  return <Icon {...props}><path d="m9.5 14.5 5-5" /><path d="M7.2 17.8 5.7 19.3a3.5 3.5 0 0 1-5-5l3.5-3.5a3.5 3.5 0 0 1 5 0" transform="translate(3 -2)" /><path d="m16.8 6.2 1.5-1.5a3.5 3.5 0 0 1 5 5l-3.5 3.5a3.5 3.5 0 0 1-5 0" transform="translate(-3 2)" /></Icon>;
}

export function SearchIcon(props: IconProps) {
  return <Icon {...props}><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></Icon>;
}

export function ImageIcon(props: IconProps) {
  return <Icon {...props}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><circle cx="9" cy="10" r="1.5" /><path d="m5 18 4.5-4 3 2 2.5-3 4 5" /></Icon>;
}

export function VideoIcon(props: IconProps) {
  return <Icon {...props}><rect x="3.5" y="5.5" width="13" height="13" rx="1.5" /><path d="m16.5 10 4-2v8l-4-2" /><path d="m9 10 4 2-4 2Z" /></Icon>;
}

export function ExternalIcon(props: IconProps) {
  return <Icon {...props}><path d="M13 5h6v6M19 5l-8 8" /><path d="M17 13v6H5V7h6" /></Icon>;
}

export function TrashIcon(props: IconProps) {
  return <Icon {...props}><path d="M5 7h14M9 7V4h6v3M7.5 7l.7 13h7.6l.7-13M10 11v5M14 11v5" /></Icon>;
}

export function CloseIcon(props: IconProps) {
  return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
}
