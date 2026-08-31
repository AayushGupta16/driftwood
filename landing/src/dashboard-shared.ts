import { createContext, useContext } from "react";

/* Shared dashboard vocabulary — card styling, relative-time formatting, the
   toast context, and the progressive-loading plumbing (fetchInWaves +
   prefetch). Deliberately component-free so both /dashboard and
   /dashboard/leads can import it without tripping react-refresh's
   only-export-components rule (that rule only fires on files exporting
   components). The <ToastProvider> component lives in dashboard/DashboardCommon.tsx. */

export const CARD = "rounded-xl border border-line bg-surface shadow-win";

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

/* ---------- progressive list loading ---------- */

/* Later pages of a paged list, FETCH_PARALLEL in flight at once; results come
   back in offset order, `null` where a page failed — a failed later page must
   never blank an already-painted first page, so per-page errors are swallowed
   here and read back by the caller as an incomplete load. Shared by the
   review queue, the leads table, and the companies table. */
export const FETCH_PARALLEL = 5;

export async function fetchInWaves<T>(
  offsets: number[],
  fetchPage: (offset: number) => Promise<T>,
  parallel: number = FETCH_PARALLEL,
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array<T | null>(offsets.length).fill(null);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(parallel, offsets.length) },
    async () => {
      while (next < offsets.length) {
        const i = next;
        next += 1;
        try {
          results[i] = await fetchPage(offsets[i]);
        } catch {
          results[i] = null;
        }
      }
    },
  );
  await Promise.all(workers);
  return results;
}

/* ---------- mount-time prefetch ---------- */

export type Prefetch<T> = { take: () => Promise<T> | null };

/* Starts a request the moment the page's chunk evaluates — in parallel with
   /auth/me instead of serially behind it (dashboard navigation is full page
   reloads, so the auth round-trip used to gate every page's first data
   fetch). mock.ts installs its window.fetch wrapper in main.tsx before any
   page chunk loads, so a prefetch rides the same mock path as every later
   fetch. take() hands the in-flight promise to the view's initial load
   exactly once; after that it returns null and retry/reload paths fetch
   fresh. The no-op rejection handler keeps an unauthed 401 racing the auth
   redirect from ever surfacing as an unhandled rejection. */
export function prefetch<T>(start: () => Promise<T>): Prefetch<T> {
  let pending: Promise<T> | null = null;
  if (typeof window !== "undefined") {
    pending = start();
    pending.then(undefined, () => {});
  }
  return {
    take() {
      const p = pending;
      pending = null;
      return p;
    },
  };
}

export type ToastVariant = "success" | "error" | "info";

export const ToastContext = createContext<
  (message: string, variant?: ToastVariant) => void
>(() => {});

export function useToast() {
  return useContext(ToastContext);
}
