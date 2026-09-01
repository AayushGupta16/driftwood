import { useCallback, useRef, useState, type ReactNode } from "react";
import { Wordmark } from "../components/Chrome";
import { ToastContext, type ToastVariant } from "../dashboard-shared";

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

type ToastItem = { id: number; message: string; variant: ToastVariant };

/* A missed failure must not evaporate as fast as a routine confirmation
   (ux-principles rule 7): errors dwell twice as long as success/info. */
const TOAST_DISMISS_MS: Record<ToastVariant, number> = {
  success: 5000,
  info: 5000,
  error: 10000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const push = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId.current++;
    setToasts((items) => [...items, { id, message, variant }]);
    window.setTimeout(() => dismiss(id), TOAST_DISMISS_MS[variant]);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {/* Announcements come from each toast's own role (status/alert) — an
          aria-live here would double-announce them. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-5 sm:items-end sm:px-6">
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

const TOAST_STYLE: Record<ToastVariant, { ring: string; tint: string }> = {
  success: { ring: "border-ok/30", tint: "text-ok" },
  error: { ring: "border-red-600/30", tint: "text-red-600" },
  info: { ring: "border-tide/30", tint: "text-tide" },
};

function ToastGlyph({ variant }: { variant: ToastVariant }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {variant === "success" ? <path d="m3 8.5 3 3L13 4.7" /> : variant === "error" ? <path d="m4 4 8 8M12 4l-8 8" /> : <><circle cx="8" cy="8" r="5.5" /><path d="M8 7v3M8 5h.01" /></>}
    </svg>
  );
}

/* The live-region role lives on a wrapper so the dismiss control can be a
   real <button> (keyboard reachable, ux-principles rule 15) without the role
   overriding its button semantics. Errors interrupt via role="alert";
   success/info stay polite via role="status". Same visuals as ever — the
   whole toast is still the click target. */
function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const style = TOAST_STYLE[toast.variant];
  return (
    <div role={toast.variant === "error" ? "alert" : "status"} className="pointer-events-auto w-full max-w-sm">
      <button
        type="button"
        onClick={onDismiss}
        className={`toast-in flex w-full cursor-pointer items-start gap-2.5 rounded-xl border bg-surface px-4 py-3 text-left text-[13.5px] font-medium text-ink shadow-win ${style.ring}`}
      >
        <span aria-hidden="true" className={`mt-px shrink-0 ${style.tint}`}><ToastGlyph variant={toast.variant} /></span>
        <span className="leading-snug">{toast.message}</span>
        <span className="sr-only">Dismiss notification</span>
      </button>
    </div>
  );
}

export function LoggedOutView() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 text-center shadow-win">
        <a href="/" className="inline-flex justify-center text-ink no-underline"><Wordmark markSize="size-8" className="text-[18px]" /></a>
        <h1 className="m-0 mt-6 text-[24px] font-semibold tracking-[-0.015em]">Sign in to your dashboard</h1>
        <p className="mx-auto mt-2.5 max-w-[30ch] text-[15px] leading-relaxed text-ink-soft">Connect your accounts and we&rsquo;ll take it from there.</p>
        <a href="/auth/login" className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full border border-line bg-paper px-4.5 py-3 text-[14.5px] font-medium text-ink no-underline transition-all hover:-translate-y-px hover:border-ink-faint/50"><GoogleMark className="size-4.5 shrink-0" />Continue with Google</a>
        <p className="m-0 mt-4.5 text-[12.5px] text-ink-faint">Invite-only · approved accounts</p>
      </div>
    </main>
  );
}
