import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Wordmark } from "./components/Chrome";
import { GodModeButton, ImpersonationBanner } from "./GodMode";
import {
  CARD,
  ToastContext,
  relativeTime,
  useToast,
  type ToastVariant,
} from "./dashboard-shared";

/* /dashboard — Google-login-gated shell. Talks to the same-origin /auth/*
   endpoints (vite proxy in dev, vercel rewrite in prod), so every request
   must send the first-party session cookie.

   Deliberately bare-bones: the page exists to let approved users connect
   their accounts. Campaigns, demos and updates go out over Slack, not here. */

type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_approved: boolean;
  linkedin_connected: boolean;
  is_admin?: boolean;
  impersonating?: boolean;
};

type AuthState =
  | { status: "loading" }
  | { status: "logged-out" }
  | { status: "logged-in"; user: User };

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* ---------- toasts ---------- */

type ToastItem = { id: number; message: string; variant: ToastVariant };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId.current++;
      setToasts((ts) => [...ts, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-5 sm:items-end sm:px-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const TOAST_STYLE: Record<ToastVariant, { ring: string; glyph: string; tint: string }> =
  {
    success: { ring: "border-emerald-600/30", glyph: "✓", tint: "text-emerald-600" },
    error: { ring: "border-red-600/30", glyph: "✕", tint: "text-red-600" },
    info: { ring: "border-tide/30", glyph: "•", tint: "text-tide" },
  };

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const s = TOAST_STYLE[toast.variant];
  return (
    <div
      role="status"
      onClick={onDismiss}
      className={`toast-in pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-2.5 rounded-xl border bg-surface px-4 py-3 text-[13.5px] font-medium text-ink shadow-[0_18px_40px_-20px_rgba(22,24,29,0.55)] ${s.ring}`}
    >
      <span aria-hidden="true" className={`mt-px shrink-0 text-[15px] leading-none ${s.tint}`}>
        {s.glyph}
      </span>
      <span className="leading-snug">{toast.message}</span>
    </div>
  );
}

export default function Dashboard() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const user = (await res.json()) as User;
          if (!cancelled) setAuth({ status: "logged-in", user });
        } else {
          setAuth({ status: "logged-out" });
        }
      } catch {
        if (!cancelled) setAuth({ status: "logged-out" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/dashboard";
    }
  }

  return (
    <ToastProvider>
      <div className="grain relative flex min-h-screen flex-col overflow-x-clip">
        {auth.status === "loading" && <LoadingView />}
        {auth.status === "logged-out" && <LoggedOutView />}
        {auth.status === "logged-in" && (
          <LoggedInView user={auth.user} onLogout={handleLogout} />
        )}
      </div>
    </ToastProvider>
  );
}

function LoadingView() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span
        className="size-7 animate-spin rounded-full border-2 border-line border-t-tide"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function LoggedOutView() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)]">
        <a href="/" className="inline-flex justify-center text-ink no-underline">
          <Wordmark markSize="size-8" className="text-[18px]" />
        </a>
        <h1 className="m-0 mt-6 text-[24px] font-semibold tracking-[-0.015em]">
          Sign in to your dashboard
        </h1>
        <p className="mx-auto mt-2.5 max-w-[30ch] text-[15px] leading-relaxed text-ink-soft">
          Connect your accounts and we&rsquo;ll take it from there.
        </p>
        <a
          href="/auth/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-paper px-4.5 py-3 text-[14.5px] font-semibold text-ink no-underline shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:border-ink-faint/50"
        >
          <GoogleMark className="size-4.5 shrink-0" />
          Continue with Google
        </a>
        <p className="m-0 mt-4.5 font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
          Invite-only · approved accounts
        </p>
      </div>
    </main>
  );
}

/* ---------- logged-in shell ---------- */

function LoggedInView({ user, onLogout }: { user: User; onLogout: () => void }) {
  const displayName = user.name || user.email;

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 shadow-[0_10px_28px_-24px_rgba(22,24,29,0.5)] backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="text-[18px] text-ink no-underline">
            <Wordmark markSize="size-8" />
          </a>
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={`${displayName}'s avatar`}
                className="size-8 shrink-0 rounded-full border border-line object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide font-mono text-[13px] font-semibold text-white">
                {displayName[0]?.toUpperCase()}
              </span>
            )}
            <span className="hidden text-[14px] font-medium text-ink sm:inline">
              {displayName}
            </span>
            {user.is_admin && <GodModeButton />}
            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-14 sm:px-8 sm:py-18">
        {user.is_approved ? <ApprovedView user={user} /> : <PendingView />}
      </main>
    </>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <h1 className="m-0 text-[clamp(1.9rem,4.4vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
      {children}
    </h1>
  );
}

/* ---------- pending (awaiting approval) ---------- */

function PendingView() {
  return (
    <div className="mx-auto max-w-xl">
      <Heading>You&rsquo;re on the list.</Heading>
      <div className={`mt-7 ${CARD} p-7 sm:p-8`}>
        <p className="m-0 text-[15.5px] leading-relaxed text-ink-soft">
          Your account is created and pending review. We&rsquo;ll email you the
          moment your workspace is ready — usually within a day.
        </p>
      </div>
    </div>
  );
}

/* ---------- approved (workspace live) ---------- */

/* ---------- dashboard summary (GET /api/v1/dashboard/summary) ---------- */

type Sending = {
  invites_sent: number;
  invites_cap: number;
  messages_sent: number;
  messages_cap: number;
  within_limits: boolean;
  last_action_at: string | null;
};
type Funnel = {
  active: number;
  contacted: number;
  replied: number;
  meetings: number;
};
type Results = {
  meetings: number;
  meetings_delta_7d: number;
  replies: number;
  replies_delta_7d: number;
  reply_rate: number;
};
type Lists = {
  leads: number;
  blacklist: number;
};
type DashboardSummary = {
  linkedin_connected: boolean;
  sending: Sending | null;
  funnel: Funnel;
  results: Results;
  lists: Lists;
};

type SummaryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; summary: DashboardSummary };

function ApprovedView({ user }: { user: User }) {
  const firstName = user.name.split(" ")[0] || user.email;
  const [summary, setSummary] = useState<SummaryState>({ status: "loading" });

  // Reusable so a successful import can refresh the counts + funnel in place.
  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/dashboard/summary", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as DashboardSummary;
      setSummary({ status: "ready", summary: data });
    } catch {
      // Don't blank out an already-loaded summary if a refresh fails.
      setSummary((prev) => (prev.status === "ready" ? prev : { status: "error" }));
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadSummary();
    })();
  }, [loadSummary]);

  return (
    <>
      <LinkedInBanner />
      <Heading>{`Welcome back, ${firstName}.`}</Heading>

      {/* top bar — connect prompt when LinkedIn isn't connected, otherwise the
          slim sending-status strip once the summary loads. */}
      {!user.linkedin_connected && <LinkedInCard connected={false} />}
      {user.linkedin_connected &&
        summary.status === "ready" &&
        summary.summary.sending && (
          <StatusStrip sending={summary.summary.sending} />
        )}

      {/* two equal-height columns: metrics left, lists right. */}
      <div className="mt-3.5 grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-[1.45fr_1fr]">
        <MetricsCard state={summary} />
        <ListsCard state={summary} onImported={loadSummary} />
      </div>

      <LeadsEntryCard state={summary} />
    </>
  );
}

/* ---------- all leads entry (full table lives at /dashboard/leads) ---------- */

/* Compact card linking out to the dedicated full-width leads page. Reads the
   already-loaded summary so it can show the pipeline count without its own
   request. The link opens the leads page in a new tab. */
function LeadsEntryCard({ state }: { state: SummaryState }) {
  const leads = state.status === "ready" ? state.summary.lists.leads : null;
  const line =
    leads === null
      ? "Loading your pipeline…"
      : leads > 0
        ? `${plural(leads, "lead", "leads")} in your pipeline`
        : "No leads yet.";

  return (
    <div
      className={`mt-7 ${CARD} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
    >
      <div className="min-w-0">
        <SectionLabel>All leads</SectionLabel>
        <p className="m-0 mt-2 text-[14px] font-medium text-ink-soft">{line}</p>
      </div>
      <a
        href="/dashboard/leads"
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-tide px-4.5 py-2.5 text-[14px] font-semibold text-white no-underline shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:bg-tide-deep sm:self-auto"
      >
        View all leads
      </a>
    </div>
  );
}

/* shared disconnect logic — reused by LinkedInCard and the status strip. */
function useDisconnect() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/linkedin/disconnect", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      window.location.reload();
    } catch {
      setError("Couldn't disconnect. Please try again.");
      setPending(false);
    }
  }

  return { pending, error, disconnect };
}

/* 1 · STATUS — is it on & safe. Mirrors the mockup's .status card. */
function StatusStrip({ sending }: { sending: Sending }) {
  const { pending, error, disconnect } = useDisconnect();
  const rel = relativeTime(sending.last_action_at);

  return (
    <div className={`mt-7 ${CARD} p-4`}>
      <div className="flex items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-600/25 bg-emerald-500/10 text-emerald-700"
          aria-hidden="true"
        >
          <CheckMark className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold tracking-[-0.01em]">
            LinkedIn connected &amp; sending
          </div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
            <span className="tabular-nums">
              {sending.invites_sent}/{sending.invites_cap}
            </span>{" "}
            invites ·{" "}
            <span className="tabular-nums">
              {sending.messages_sent}/{sending.messages_cap}
            </span>{" "}
            messages today ·{" "}
            <span
              className={
                sending.within_limits
                  ? "font-medium text-emerald-700"
                  : "font-medium text-amber-700"
              }
            >
              {sending.within_limits ? "within safe limits" : "approaching limit"}
            </span>
            {rel && <> · last action {rel}</>}
          </div>
        </div>
        <button
          type="button"
          onClick={disconnect}
          disabled={pending}
          className="ml-auto shrink-0 cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
      {error && (
        <p className="m-0 mt-3 text-[13px] font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* small section eyebrow shared by the metrics + lists cards. */
function SectionLabel({ children }: { children: string }) {
  return (
    <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
      {children}
    </div>
  );
}

/* left column — Results (inline) + Pipeline funnel in one card. Owns the
   summary's loading/error/ready states so the grid stays stable. */
function MetricsCard({ state }: { state: SummaryState }) {
  return (
    <div className={`${CARD} flex flex-col p-5 sm:p-6`}>
      {state.status === "loading" && (
        <div className="flex flex-1 items-center justify-center py-12">
          <span
            className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
            role="status"
            aria-label="Loading metrics"
          />
        </div>
      )}
      {state.status === "error" && (
        <p className="m-0 text-[14px] font-medium text-red-700" role="alert">
          Couldn&rsquo;t load your metrics. Please refresh.
        </p>
      )}
      {state.status === "ready" && (
        <>
          <SectionLabel>Results</SectionLabel>
          <InlineResults results={state.summary.results} />
          <div className="my-4 h-px bg-line/70" />
          <SectionLabel>Pipeline</SectionLabel>
          <FunnelBars funnel={state.summary.funnel} />
        </>
      )}
    </div>
  );
}

/* Results — meetings is the focal figure; replies + reply rate support it,
   separated by hairline dividers (no boxes). */
function InlineResults({ results }: { results: Results }) {
  return (
    <div className="mt-2.5 flex gap-4">
      <div className="flex-1">
        <div className="text-[11.5px] font-medium text-tide">Meetings booked</div>
        <div className="mt-1.5 text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-tide-deep">
          {results.meetings}
        </div>
        {results.meetings_delta_7d > 0 && (
          <div className="mt-1.5 text-[11px] font-semibold text-emerald-700 tabular-nums">
            ↑ {results.meetings_delta_7d} this week
          </div>
        )}
      </div>
      <div className="flex-1 border-l border-line pl-4">
        <div className="text-[11.5px] font-medium text-ink-faint">Replies</div>
        <div className="mt-1.5 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
          {results.replies}
        </div>
        {results.replies_delta_7d > 0 && (
          <div className="mt-1.5 text-[11px] font-semibold text-emerald-700 tabular-nums">
            ↑ {results.replies_delta_7d} this week
          </div>
        )}
      </div>
      <div className="flex-1 border-l border-line pl-4">
        <div className="text-[11.5px] font-medium text-ink-faint">Reply rate</div>
        <div className="mt-1.5 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
          {(results.reply_rate * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

/* Pipeline funnel — horizontal bars, tide fill on a tide-wash track. */
function FunnelBars({ funnel }: { funnel: Funnel }) {
  const rows: { name: string; count: number }[] = [
    { name: "Active", count: funnel.active },
    { name: "Contacted", count: funnel.contacted },
    { name: "Replied", count: funnel.replied },
    { name: "Meeting", count: funnel.meetings },
  ];
  const active = funnel.active;

  return (
    <div className="mt-2.5 flex flex-col gap-2">
      {rows.map((row) => {
        const pct = active > 0 ? (row.count / active) * 100 : 0;
        return (
          <div
            key={row.name}
            className="grid grid-cols-[74px_1fr_auto] items-center gap-3"
          >
            <span className="text-[12.5px] text-ink-soft">{row.name}</span>
            <div className="h-[18px] overflow-hidden rounded-md bg-tide-wash">
              <div
                className="h-full rounded-md bg-gradient-to-r from-tide to-tide-deep"
                style={{ width: `max(3px, ${pct}%)` }}
              />
            </div>
            <span className="whitespace-nowrap text-right text-[12.5px] font-semibold tabular-nums">
              {row.count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LinkedInCard({ connected }: { connected: boolean }) {
  const [connectPending, setConnectPending] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const {
    pending: disconnectPending,
    error: disconnectError,
    disconnect: handleDisconnect,
  } = useDisconnect();
  const pending = connectPending || disconnectPending;
  const error = connectError ?? disconnectError;

  async function handleConnect() {
    setConnectPending(true);
    setConnectError(null);
    try {
      const res = await fetch("/linkedin/connect", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      setConnectError("Couldn't start the connection. Please try again.");
      setConnectPending(false);
    }
  }

  return (
    <div className={`mt-7 ${CARD} p-7 sm:p-8`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            connected
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-[#0A66C2]/10 text-[#0A66C2]"
          }`}
          aria-hidden="true"
        >
          {connected ? (
            <CheckMark className="size-6" />
          ) : (
            <LinkedInMark className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
            {connected ? "LinkedIn connected" : "Connect your LinkedIn"}
          </h2>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
            {connected
              ? "You're connected! We'll take it from here."
              : "This is all we need to get started. You'll sign in on a secure Unipile page — we never see your password."}
          </p>

          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={pending}
              className="mt-5 cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={pending}
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#0A66C2] px-4.5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:bg-[#095196] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LinkedInMark className="size-4.5 shrink-0" />
              {pending ? "Connecting…" : "Connect LinkedIn"}
            </button>
          )}

          {error && (
            <p
              className="m-0 mt-3 text-[13.5px] font-medium text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- lists (lead list + blacklist uploads) ---------- */

type RowError = { row: number; reason: string };
type LeadImportResult = {
  added: number;
  skipped_duplicate: number;
  skipped_suppressed: number;
  errors: RowError[];
};
type BlacklistImportResult = {
  added: number;
  already_present: number;
  overlap_removed: number;
  errors: RowError[];
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

function summarizeLeads(r: LeadImportResult): string {
  const parts = [`Added ${plural(r.added, "lead", "leads")}`];
  if (r.skipped_duplicate)
    parts.push(`${r.skipped_duplicate} already in your pipeline`);
  if (r.skipped_suppressed) parts.push(`${r.skipped_suppressed} on your blacklist`);
  if (r.errors.length) parts.push(`${r.errors.length} skipped (empty rows)`);
  return parts.join(" · ") + ".";
}

function summarizeBlacklist(r: BlacklistImportResult): string {
  const parts = [`Added ${plural(r.added, "entry", "entries")}`];
  if (r.overlap_removed)
    parts.push(`removed ${plural(r.overlap_removed, "matching lead", "matching leads")}`);
  if (r.already_present) parts.push(`${r.already_present} already listed`);
  return parts.join(" · ") + ".";
}

function ListsCard({
  state,
  onImported,
}: {
  state: SummaryState;
  onImported: () => void;
}) {
  const lists = state.status === "ready" ? state.summary.lists : null;
  const leadsLine =
    lists &&
    (lists.leads
      ? `${plural(lists.leads, "lead", "leads")} in your pipeline`
      : "No leads yet.");
  const blacklistLine =
    lists &&
    (lists.blacklist
      ? `${plural(lists.blacklist, "entry", "entries")} on your blacklist`
      : "Nothing blacklisted yet.");

  return (
    <div className={`${CARD} flex flex-col p-5 sm:p-6`}>
      <SectionLabel>Your lists</SectionLabel>
      <p className="m-0 mt-2 text-[13px] leading-relaxed text-ink-soft">
        Optional — we source leads for you either way. Add your own contacts, or a
        do-not-contact list we&rsquo;ll always exclude.
      </p>
      <div className="mt-3.5 flex flex-1 flex-col gap-3">
        <UploadField
          className="flex-1"
          title="Lead list"
          hint="Contacts to add to your pipeline. Any CSV — name, email, or LinkedIn; we'll match on whatever columns you've got and enrich the rest."
          endpoint="/api/v1/imports/leads"
          summarize={summarizeLeads}
          current={leadsLine}
          onImported={onImported}
          clearEndpoint="/api/v1/imports/leads"
          clearCount={lists?.leads ?? 0}
          clearConfirm="Clear every lead in your pipeline? This can't be undone."
          summarizeClear={(n) => `Cleared ${plural(n, "lead", "leads")}.`}
        />
        <UploadField
          className="flex-1"
          title="Blacklist"
          hint="Excluded from all outreach. Emails, domains, or LinkedIn URLs — one per row."
          endpoint="/api/v1/imports/blacklist"
          summarize={summarizeBlacklist}
          current={blacklistLine}
          onImported={onImported}
          clearEndpoint="/api/v1/imports/blacklist"
          clearCount={lists?.blacklist ?? 0}
          clearConfirm="Clear your uploaded blacklist? Unsubscribes and bounces are kept. This can't be undone."
          summarizeClear={(n) => `Cleared ${plural(n, "entry", "entries")}.`}
        />
      </div>
    </div>
  );
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

function UploadField<T>({
  className = "",
  title,
  hint,
  endpoint,
  summarize,
  current,
  onImported,
  clearEndpoint,
  clearCount = 0,
  clearConfirm,
  summarizeClear,
}: {
  className?: string;
  title: string;
  hint: string;
  endpoint: string;
  summarize: (data: T) => string;
  /** Persisted state from the summary (e.g. "200 leads in your pipeline"),
   *  shown until a fresh upload this session replaces it. */
  current?: string | null;
  /** Called after a successful import so the parent can refresh the counts. */
  onImported?: () => void;
  /** DELETE endpoint that clears this list. Enables the "Clear" button. */
  clearEndpoint?: string;
  /** How many rows exist now — the Clear button hides when this is 0. */
  clearCount?: number;
  /** Confirmation prompt shown before clearing. */
  clearConfirm?: string;
  /** Builds the success toast from the cleared count. */
  summarizeClear?: (cleared: number) => string;
}) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [clearing, setClearing] = useState(false);
  const toast = useToast();

  async function handleClear() {
    if (!clearEndpoint) return;
    if (!window.confirm(clearConfirm ?? `Clear ${title.toLowerCase()}? This can't be undone.`))
      return;

    setClearing(true);
    try {
      const res = await fetch(clearEndpoint, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { cleared: number };
      toast(`${title}: ${summarizeClear?.(data.cleared) ?? `cleared ${data.cleared}.`}`, "success");
      onImported?.();
    } catch {
      toast(`Couldn't clear ${title.toLowerCase()}. Please try again.`, "error");
    } finally {
      setClearing(false);
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    setStatus("uploading");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as T;
      setStatus("done");
      toast(`${title}: ${summarize(data)}`, "success");
      onImported?.();
    } catch {
      setStatus("error");
      toast(`${title} upload failed. Check the file and try again.`, "error");
    }
  }

  const uploading = status === "uploading";
  const busy = uploading || clearing;
  const label = uploading
    ? "Importing…"
    : status === "done"
      ? "Replace file"
      : "Upload CSV";
  const showClear = Boolean(clearEndpoint) && clearCount > 0;

  return (
    <div className={`rounded-xl border border-line bg-paper/40 p-4 ${className}`}>
      <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
      <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-faint">{hint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex items-center gap-2 rounded-lg border border-tide/40 bg-surface px-3.5 py-2 text-[13px] font-semibold text-tide transition-colors hover:border-tide hover:bg-tide-wash ${
            busy ? "pointer-events-none opacity-60" : "cursor-pointer"
          }`}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
            disabled={busy}
          />
          {uploading && (
            <span
              aria-hidden="true"
              className="size-3.5 animate-spin rounded-full border-[1.5px] border-tide/30 border-t-tide"
            />
          )}
          {label}
        </label>
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:border-red-600/40 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearing && (
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-full border-[1.5px] border-red-600/30 border-t-red-600"
              />
            )}
            {clearing ? "Clearing…" : "Clear"}
          </button>
        )}
      </div>
      {busy ? (
        <div
          role="progressbar"
          aria-label={`Importing ${title.toLowerCase()}`}
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line/70"
        >
          <div className="progress-indeterminate h-full w-1/4 rounded-full bg-tide" />
        </div>
      ) : (
        current && (
          <p className="m-0 mt-2.5 text-[13px] font-medium text-ink-soft">{current}</p>
        )
      )}
    </div>
  );
}

function LinkedInBanner() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("linkedin");
  if (status !== "connected" && status !== "failed") return null;

  const connected = status === "connected";
  return (
    <div
      role="status"
      className={`mb-7 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] font-medium ${
        connected
          ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-800"
          : "border-red-600/25 bg-red-500/10 text-red-800"
      }`}
    >
      <span aria-hidden="true">{connected ? "✓" : "✕"}</span>
      {connected
        ? "LinkedIn connected — you're all set."
        : "Connection failed, please try again."}
    </div>
  );
}
