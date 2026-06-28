import { createContext, useContext } from "react";

/* Shared dashboard vocabulary — card styling, relative-time formatting, and the
   toast context. Deliberately component-free so both /dashboard and
   /dashboard/leads can import it without tripping react-refresh's
   only-export-components rule (that rule only fires on files exporting
   components). The <ToastProvider> component itself lives in Dashboard.tsx. */

export const CARD =
  "rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_40px_-26px_rgba(22,24,29,0.4)]";

/* "4m ago" / "2h ago" / "3d ago"; null/invalid -> null (caller renders nothing). */
export function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export type ToastVariant = "success" | "error" | "info";

export const ToastContext = createContext<
  (message: string, variant?: ToastVariant) => void
>(() => {});

export function useToast() {
  return useContext(ToastContext);
}
