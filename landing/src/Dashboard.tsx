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
  /* optional so older /auth/me payloads (pre-email-channel) still parse;
     absent reads as not connected. */
  email_connected?: boolean;
  /* why the mailbox isn't usable even though OAuth finished (e.g. a Google
     account with no Gmail service behind it) — set server-side, shown on
     the email card. */
  email_error?: string | null;
  /* optional so older /auth/me payloads still parse; absent reads as
     never-attempted. */
  twitter_connected?: boolean;
  /* profile+proxy exist but login isn't confirmed yet — the card starts in
     its "waiting on you" state instead of "Connect X" on page load. */
  twitter_pending?: boolean;
  /* logged in, but the profile is sitting behind X's encrypted-chat PIN
     wall — the account is connected and DMs specifically can't go out
     until the user enters that PIN. Its own state, not a kind of pending. */
  twitter_chat_locked?: boolean;
  twitter_handle?: string | null;
  is_admin?: boolean;
  impersonating?: boolean;
  /* org workspace membership; absent/null (solo accounts) reads as owner.
     Only the owner manages channel connections; members are read-only. For
     admins/members the connection booleans above reflect the workspace
     owner's connections. */
  org?: { name: string; role: "owner" | "admin" | "member" } | null;
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

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.24 2.25h3.31l-7.23 8.26L23 21.75h-6.66l-5.22-6.83-5.97 6.83H1.83l7.73-8.84L1 2.25h6.83l4.71 6.24 5.7-6.24Zm-1.16 17.52h1.84L7.02 4.13H5.04l12.04 15.64Z" />
    </svg>
  );
}

function MailMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
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

/* padlock — the X card's "connected, but chats are still locked" state. */
function LockMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.4a4 4 0 0 1 8 0v3.1" />
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
    success: { ring: "border-ok/30", glyph: "✓", tint: "text-ok" },
    error: { ring: "border-red-600/30", glyph: "✕", tint: "text-red-600" },
    info: { ring: "border-tide/30", glyph: "•", tint: "text-tide" },
  };

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const s = TOAST_STYLE[toast.variant];
  return (
    <div
      role="status"
      onClick={onDismiss}
      className={`toast-in pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-2.5 rounded-xl border bg-surface px-4 py-3 text-[13.5px] font-medium text-ink shadow-win ${s.ring}`}
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
      <div className="relative flex min-h-screen flex-col overflow-x-clip">
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

export function LoggedOutView() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 text-center shadow-win">
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
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full border border-line bg-paper px-4.5 py-3 text-[14.5px] font-medium text-ink no-underline transition-all hover:-translate-y-px hover:border-ink-faint/50"
        >
          <GoogleMark className="size-4.5 shrink-0" />
          Continue with Google
        </a>
        <p className="m-0 mt-4.5 text-[12.5px] text-ink-faint">
          Invite-only · approved accounts
        </p>
      </div>
    </main>
  );
}

/* ---------- logged-in shell ---------- */

function LoggedInView({ user, onLogout }: { user: User; onLogout: () => void }) {
  const displayName = user.name || user.email;
  // Shown next to the identity when the account belongs to a named workspace.
  const orgName = user.org?.name.trim() || null;

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
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
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide text-[13px] font-semibold text-white">
                {displayName[0]?.toUpperCase()}
              </span>
            )}
            <span className="hidden text-[14px] font-medium text-ink sm:inline">
              {displayName}
            </span>
            {orgName && (
              <span className="hidden text-[13px] text-ink-faint sm:inline">
                {orgName}
              </span>
            )}
            {user.is_admin && (
              <>
                <GodModeButton />
                <a
                  href="/dashboard/seo-geo"
                  className="inline-flex items-center rounded-full border border-tide/40 bg-surface px-3.5 py-2 text-[13.5px] font-medium text-tide no-underline transition-colors hover:border-tide hover:bg-tide-wash"
                >
                  SEO / GEO
                </a>
                <a
                  href="/dashboard/agents"
                  className="inline-flex items-center rounded-full border border-tide/40 bg-surface px-3.5 py-2 text-[13.5px] font-medium text-tide no-underline transition-colors hover:border-tide hover:bg-tide-wash"
                >
                  Agents
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink"
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
type Companies = {
  qualified: number;
  screened_out: number;
  unknown: number;
};
type DashboardSummary = {
  linkedin_connected: boolean;
  sending: Sending | null;
  funnel: Funnel;
  results: Results;
  lists: Lists;
  companies: Companies;
  pending_reviews: number;
};

type SummaryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; summary: DashboardSummary };

/* ---------- recent activity (GET /api/v1/dashboard/activity) ---------- */

type ActivityEvent = {
  at: string;
  kind: "stage" | "sent" | "reply";
  lead_id: string | null;
  lead_name: string | null;
  company_name: string | null;
  detail: string | null;
};

type ActivityState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; events: ActivityEvent[] };

function ApprovedView({ user }: { user: User }) {
  const firstName = user.name.split(" ")[0] || user.email;
  // Solo accounts carry no org and stay full-control. Only the owner manages
  // channel connections; members are read-only everywhere.
  const role = user.org?.role ?? "owner";
  const isOwner = role === "owner";
  const canWrite = role !== "member";
  const [summary, setSummary] = useState<SummaryState>({ status: "loading" });
  const [activity, setActivity] = useState<ActivityState>({ status: "loading" });

  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/dashboard/activity?limit=8", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { events: ActivityEvent[] };
      setActivity({ status: "ready", events: data.events });
    } catch {
      // Keep whatever loaded before; MetricsCard hides the section on error.
      setActivity((prev) => (prev.status === "ready" ? prev : { status: "error" }));
    }
  }, []);

  // Reusable so a successful import can refresh the counts + funnel in place.
  // Kicks the activity feed too so "Latest" stays in step with the summary.
  const loadSummary = useCallback(async () => {
    void loadActivity();
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
  }, [loadActivity]);

  useEffect(() => {
    void (async () => {
      await loadSummary();
    })();
  }, [loadSummary]);

  return (
    <>
      <LinkedInBanner />
      <EmailBanner emailError={user.email_error ?? null} />
      <Heading>{`Welcome back, ${firstName}.`}</Heading>

      {/* top bar — connect prompt when LinkedIn isn't connected, otherwise the
          slim sending-status strip once the summary loads. Connections belong
          to the workspace owner, so only the owner gets the connect/disconnect
          cards; everyone still sees the status strip. */}
      {isOwner && !user.linkedin_connected && <LinkedInCard connected={false} />}
      {user.linkedin_connected &&
        summary.status === "ready" &&
        summary.summary.sending && (
          <StatusStrip sending={summary.summary.sending} isOwner={isOwner} />
        )}
      {isOwner && (
        <EmailCard
          connected={user.email_connected ?? false}
          emailError={user.email_error ?? null}
        />
      )}
      {isOwner && (
        <TwitterCard
          connected={user.twitter_connected ?? false}
          pending={user.twitter_pending ?? false}
          chatLocked={user.twitter_chat_locked ?? false}
        />
      )}

      {/* two equal-height columns: metrics left, lists right. */}
      <div className="mt-3.5 grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-[1.45fr_1fr]">
        <MetricsCard state={summary} activity={activity} />
        <ListsCard state={summary} canWrite={canWrite} onImported={loadSummary} />
      </div>

      <LeadsEntryCard state={summary} />
      <CompaniesEntryCard state={summary} />
      <ReviewEntryCard state={summary} />
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
        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-tide px-4.5 py-2.5 text-[14px] font-medium text-white no-underline transition-all hover:-translate-y-px hover:bg-tide-deep sm:self-auto"
      >
        View all leads
      </a>
    </div>
  );
}

/* ---------- all companies entry (full table lives at /dashboard/companies) ---------- */

/* Same compact card, linking out to the dedicated target-accounts page. Reads
   the summary's company rollup so the line can show qualified vs screened-out
   counts without its own request. */
function CompaniesEntryCard({ state }: { state: SummaryState }) {
  const companies = state.status === "ready" ? state.summary.companies : null;
  const line =
    companies === null
      ? "Loading your accounts…"
      : companies.qualified || companies.screened_out || companies.unknown
        ? `${companies.qualified.toLocaleString()} qualified accounts · ${companies.screened_out.toLocaleString()} screened out by your AE`
        : "No target accounts yet.";

  return (
    <div
      className={`mt-3.5 ${CARD} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
    >
      <div className="min-w-0">
        <SectionLabel>All companies</SectionLabel>
        <p className="m-0 mt-2 text-[14px] font-medium text-ink-soft">{line}</p>
      </div>
      <a
        href="/dashboard/companies"
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-tide px-4.5 py-2.5 text-[14px] font-medium text-white no-underline transition-all hover:-translate-y-px hover:bg-tide-deep sm:self-auto"
      >
        View all companies
      </a>
    </div>
  );
}

/* ---------- approval queue entry (queue lives at /dashboard/review) ---------- */

/* Same compact card, linking out to the review queue. Reads the summary's
   pending_reviews count so the line can say how many decisions are waiting
   without its own request. */
function ReviewEntryCard({ state }: { state: SummaryState }) {
  const pending =
    state.status === "ready" ? state.summary.pending_reviews : null;
  const line =
    pending === null
      ? "Loading your queue…"
      : pending > 0
        ? `${plural(pending, "decision", "decisions")} waiting on you`
        : "Queue is clear — nothing needs a decision.";

  return (
    <div
      className={`mt-3.5 ${CARD} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
    >
      <div className="min-w-0">
        <SectionLabel>Approval queue</SectionLabel>
        <p className="m-0 mt-2 text-[14px] font-medium text-ink-soft">{line}</p>
      </div>
      <a
        href="/dashboard/review"
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-tide px-4.5 py-2.5 text-[14px] font-medium text-white no-underline transition-all hover:-translate-y-px hover:bg-tide-deep sm:self-auto"
      >
        Open review queue
      </a>
    </div>
  );
}

/* shared disconnect logic — reused by LinkedInCard, EmailCard and the
   status strip. */
function useDisconnect(endpoint: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
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

/* 1 · STATUS — is it on & safe. Mirrors the mockup's .status card. Everyone
   in the workspace sees the status; only the owner gets Disconnect. */
function StatusStrip({ sending, isOwner }: { sending: Sending; isOwner: boolean }) {
  const { pending, error, disconnect } = useDisconnect("/linkedin/disconnect");
  const rel = relativeTime(sending.last_action_at);

  return (
    <div className={`mt-7 ${CARD} p-4`}>
      <div className="flex items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-ok/25 bg-ok/10 text-ok"
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
                  ? "font-medium text-ok"
                  : "font-medium text-amber-700"
              }
            >
              {sending.within_limits ? "within safe limits" : "approaching limit"}
            </span>
            {rel && <> · last action {rel}</>}
          </div>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={disconnect}
            disabled={pending}
            className="ml-auto shrink-0 cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
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
    <div className="text-[0.85rem] text-ink-faint">
      {children}
    </div>
  );
}

/* left column — Results (inline) + Pipeline funnel + Latest activity in one
   card. Owns the summary's loading/error/ready states so the grid stays
   stable; the Latest section simply stays hidden until its own fetch lands. */
function MetricsCard({
  state,
  activity,
}: {
  state: SummaryState;
  activity: ActivityState;
}) {
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
          {activity.status === "ready" && (
            <>
              <div className="my-4 h-px bg-line/70" />
              <SectionLabel>Latest</SectionLabel>
              {activity.events.length > 0 ? (
                activity.events
                  .slice(0, 8)
                  .map((event, i) => <ActivityLine key={i} event={event} />)
              ) : (
                <p className="m-0 pt-1.5 text-[12.5px] text-ink-faint">
                  No activity yet.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* One "Latest" line — copy composed client-side from the event's kind +
   detail; lead name bold ink, company in parens, mono timestamp on the right. */
function ActivityLine({ event }: { event: ActivityEvent }) {
  const who = event.lead_name && (
    <>
      <span className="font-semibold text-ink">{event.lead_name}</span>
      {event.company_name && <> ({event.company_name})</>}
    </>
  );

  let body: ReactNode;
  if (event.kind === "reply") {
    body = who ? <>{who} replied</> : "New LinkedIn reply";
  } else if (event.kind === "sent") {
    const verb =
      event.detail === "message" ? "Message sent" : "Connection sent";
    body = who ? (
      <>
        {verb} to {who}
      </>
    ) : (
      verb
    );
  } else {
    body = who ? <>{who} moved to {event.detail}</> : <>Moved to {event.detail}</>;
  }

  const rel = relativeTime(event.at);
  return (
    <div className="flex gap-2.5 pt-1.5 text-[12.5px] text-ink-soft">
      <span className="min-w-0">{body}</span>
      {rel && (
        <span className="ml-auto flex-none text-[11px] text-ink-faint tabular-nums">
          {rel}
        </span>
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
          <div className="mt-1.5 text-[11px] font-semibold text-tide tabular-nums">
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
          <div className="mt-1.5 text-[11px] font-semibold text-tide tabular-nums">
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
            <div className="h-[18px] overflow-hidden rounded-md bg-sand">
              <div
                className="h-full rounded-md bg-tide"
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
  } = useDisconnect("/linkedin/disconnect");
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
              ? "bg-ok/10 text-ok"
              : "bg-tide/10 text-tide"
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
              className="mt-5 cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={pending}
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tide px-4.5 py-2.5 text-[14.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-tide-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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

function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" aria-hidden="true" className={className}>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

type EmailProvider = "gmail" | "outlook";

/* Same card as LinkedInCard, against the /email/* endpoints (Composio hosted
   auth — the redirect comes back with ?email=connected|failed). Two connect
   buttons because the provider must match where the mailbox actually lives:
   a Google sign-in on an M365-hosted address completes OAuth but can't send. */
function EmailCard({
  connected,
  emailError,
}: {
  connected: boolean;
  emailError: string | null;
}) {
  const [connectPending, setConnectPending] = useState<EmailProvider | null>(
    null,
  );
  const [connectError, setConnectError] = useState<string | null>(null);
  const {
    pending: disconnectPending,
    error: disconnectError,
    disconnect: handleDisconnect,
  } = useDisconnect("/email/disconnect");
  const pending = connectPending !== null || disconnectPending;
  const error = connectError ?? disconnectError;

  async function handleConnect(provider: EmailProvider) {
    setConnectPending(provider);
    setConnectError(null);
    try {
      const res = await fetch("/email/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      setConnectError("Couldn't start the connection. Please try again.");
      setConnectPending(null);
    }
  }

  return (
    <div className={`mt-7 ${CARD} p-7 sm:p-8`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            connected
              ? "bg-ok/10 text-ok"
              : "bg-tide/10 text-tide"
          }`}
          aria-hidden="true"
        >
          {connected ? (
            <CheckMark className="size-6" />
          ) : (
            <MailMark className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
            {connected ? "Email connected" : "Connect your email"}
          </h2>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
            {connected
              ? "You're connected! We'll take it from here."
              : "Optional — lets your AE send email as well as LinkedIn. Pick where your mailbox lives: Gmail for Google-hosted email, Outlook for Microsoft 365. We never see your password."}
          </p>

          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={pending}
              className="mt-5 cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => void handleConnect("gmail")}
                disabled={pending}
                className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line bg-surface px-4.5 py-2.5 text-[14.5px] font-semibold text-ink transition-colors hover:border-ink-faint/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleMark className="size-4.5 shrink-0" />
                {connectPending === "gmail" ? "Connecting…" : "Connect Gmail"}
              </button>
              <button
                type="button"
                onClick={() => void handleConnect("outlook")}
                disabled={pending}
                className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line bg-surface px-4.5 py-2.5 text-[14.5px] font-semibold text-ink transition-colors hover:border-ink-faint/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MicrosoftMark className="size-4.5 shrink-0" />
                {connectPending === "outlook"
                  ? "Connecting…"
                  : "Connect Outlook"}
              </button>
            </div>
          )}

          {!connected && emailError && (
            <p
              className="m-0 mt-3 text-[13.5px] font-medium text-red-700"
              role="alert"
            >
              {emailError}
            </p>
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

type TwitterState =
  | "idle"
  | "connecting" // a /connect or /unlock POST is in flight
  | "pending" // the login tab is open, we're watching for its close
  | "unlocking" // same, but the tab was opened to enter the chat PIN
  | "error";

/* The ordered list the card shows while the X tab is open.

   This exists because step 2 is the one people skip. The old copy — "Log in
   to X in the new tab, we'll pick it up automatically once you're back" —
   said login was the whole job, and a user who did exactly that got a green
   "Connected" card whose every DM then died at X's chat PIN wall. Closing
   the tab is listed LAST because the close is what confirms the connection:
   anything not done by then isn't in the saved profile. */
function TwitterSteps({ loggedIn }: { loggedIn: boolean }) {
  const steps = [
    { key: "login", done: loggedIn, text: <>Log in to your X account.</> },
    {
      key: "pin",
      done: false,
      text: <>Open Messages and enter your chat PIN.</>,
    },
    {
      key: "close",
      done: false,
      text: <>Close the X tab — that&rsquo;s what saves the connection.</>,
    },
  ];
  return (
    <ol className="m-0 mt-3.5 list-none p-0">
      {steps.map((step, i) => (
        <li key={step.key} className="relative mb-2.5 pl-[30px] text-[15px] leading-relaxed">
          <span
            aria-hidden="true"
            className={`absolute left-0 top-px inline-flex size-5 items-center justify-center rounded-full text-[11.5px] font-bold ${
              step.done ? "bg-ok/12 text-ok" : "bg-sand text-ink-soft"
            }`}
          >
            {step.done ? "✓" : i + 1}
          </span>
          <span className={step.done ? "text-ink-soft" : "text-ink"}>{step.text}</span>
        </li>
      ))}
    </ol>
  );
}

/* Same card shape as LinkedInCard/EmailCard, but against Kernel instead of
   an OAuth hosted-auth provider — X has none. handleConnect opens the
   returned live-view URL in a NEW TAB (nothing navigates the dashboard
   away, unlike the LinkedIn/Email redirect flows). There's no callback, so
   this card is the one that notices the user is done: it watches that tab
   for `closed` and POSTs /twitter/finish, which is what ends the Kernel
   session and confirms the login. It also polls /auth/me on the same
   interval + window focus, and reloads once connected. */
function TwitterCard({
  connected,
  pending: alreadyPending,
  chatLocked,
}: {
  connected: boolean;
  pending: boolean;
  chatLocked: boolean;
}) {
  const [state, setState] = useState<TwitterState>(
    alreadyPending ? "pending" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const {
    pending: disconnectPending,
    error: disconnectError,
    disconnect: handleDisconnect,
  } = useDisconnect("/twitter/disconnect");
  const pending = state === "connecting" || disconnectPending;
  const watching = state === "pending" || state === "unlocking";
  // Connected but walled: the login is fine, chats aren't reachable. Treated
  // as its own state rather than a variant of "connected" because the user
  // has something left to do, and as its own state rather than a variant of
  // "pending" because nothing about the connection is in doubt.
  const locked = connected && chatLocked;
  // Deliberately no noopener/noreferrer on the window.open below — we need
  // this reference back to watch for the user closing the tab (and to close
  // it ourselves if the backend confirms first), and the target is Kernel's
  // own live-view host, not arbitrary user content.
  const loginTab = useRef<Window | null>(null);

  useEffect(() => {
    if (!watching) return;
    const forUnlock = state === "unlocking";
    let cancelled = false;
    const check = async () => {
      // The user closing the tab is the trigger: the backend ends the Kernel
      // session (which is what flushes what they did into the saved profile)
      // and reads that profile back. Null the ref first so a focus +
      // interval overlap can't POST this twice.
      if (loginTab.current?.closed) {
        loginTab.current = null;
        try {
          await fetch("/twitter/finish", {
            method: "POST",
            credentials: "include",
          });
        } catch {
          /* the backend's own self-heal check still covers this */
        }
        if (cancelled) return;
      }
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          twitter_connected?: boolean;
          twitter_chat_locked?: boolean;
        };
        // What counts as done depends on why the tab was opened. An unlock
        // run starts already-connected, so waiting on twitter_connected
        // would be satisfied instantly and reload the page out from under
        // someone still typing their PIN.
        const done = forUnlock
          ? data.twitter_connected === true && !data.twitter_chat_locked
          : data.twitter_connected === true;
        if (done) {
          loginTab.current?.close();
          window.location.reload();
        }
      } catch {
        /* transient failure — keep polling, nothing to surface here */
      }
    };
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    // Tight enough that closing the tab feels instant; /auth/me itself is
    // cheap, and its Kernel-backed self-heal check is separately throttled
    // backend-side (routers/auth.py::_TWITTER_CHECK_MIN_INTERVAL).
    const interval = window.setInterval(() => void check(), 4_000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [watching, state]);

  /* One opener for both tabs. /unlock reuses the profile that already holds
     the login (so the user isn't made to log in again just to type a PIN)
     and lands on the chat surface; /connect mints or reuses per its own
     rules and lands on the login page. */
  async function openTab(kind: "connect" | "unlock") {
    setState("connecting");
    setError(null);
    try {
      const res = await fetch(`/twitter/${kind}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { live_view_url: string };
      loginTab.current = window.open(data.live_view_url, "_blank");
      setState(kind === "unlock" ? "unlocking" : "pending");
    } catch {
      setError(
        kind === "unlock"
          ? "Couldn't reopen X. Please try again."
          : "Couldn't start the connection. Please try again.",
      );
      setState("error");
    }
  }

  return (
    <div className={`mt-7 ${CARD} p-7 sm:p-8`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            locked
              ? "bg-amber-500/10 text-amber-700"
              : connected
                ? "bg-ok/10 text-ok"
                : "bg-tide/10 text-tide"
          }`}
          aria-hidden="true"
        >
          {locked ? (
            <LockMark className="size-6" />
          ) : connected ? (
            <CheckMark className="size-6" />
          ) : (
            <XMark className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
            {/* No @handle to show: the login check reads cookies, not X's
                DOM, so nothing scrapes the handle any more. Plain
                "Connected" until a later slice reads it back. */}
            {locked
              ? "Almost there — Messages is locked"
              : connected
                ? "Connected"
                : watching
                  ? "Finish in the X tab"
                  : "Connect your X account"}
          </h2>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
            {locked
              ? "You're logged in to X, but your chat PIN wasn't entered, so your AE can't send DMs yet."
              : connected
                ? "You're connected! We'll take it from here."
                : watching
                  ? "Do these in order, then come back:"
                  : "Optional — lets your AE reach prospects on X. You'll log in and unlock Messages with your chat PIN inside a secure isolated browser session; we never see either."}
          </p>

          {(watching || locked) && <TwitterSteps loggedIn={locked} />}

          {/* One callout, never two stacked: during an unlock both states
              are live at once, and the amber one is the specific message. */}
          {watching && !locked && (
            <p className="m-0 mt-3 rounded-lg border-l-[3px] border-tide bg-tide-wash px-3.5 py-2.5 text-[13.5px] leading-relaxed text-tide-deep">
              Step 2 is easy to miss. X keeps DMs behind a separate passcode,
              and if it isn&rsquo;t entered here your AE can&rsquo;t open a
              conversation later. We never see the PIN.
            </p>
          )}
          {locked && (
            <p className="m-0 mt-3 rounded-lg border-l-[3px] border-amber-600 bg-amber-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-amber-900">
              Your login is saved — this only takes a few seconds. Everything
              else on your account keeps working; it&rsquo;s DMs specifically
              that stay blocked until this is done.
            </p>
          )}

          {locked ? (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void openTab("unlock")}
                disabled={pending}
                className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tide px-4.5 py-2.5 text-[14.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-tide-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XMark className="size-4.5 shrink-0" />
                {state === "connecting" ? "Opening…" : "Reopen X tab"}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={pending}
                className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={pending}
              className="mt-5 cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void openTab("connect")}
              disabled={pending}
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tide px-4.5 py-2.5 text-[14.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-tide-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XMark className="size-4.5 shrink-0" />
              {state === "connecting"
                ? "Connecting…"
                : state === "pending"
                  ? "Reopen login tab"
                  : "Connect X"}
            </button>
          )}

          {(error ?? disconnectError) && (
            <p
              className="m-0 mt-3 text-[13.5px] font-medium text-red-700"
              role="alert"
            >
              {error ?? disconnectError}
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
  canWrite,
  onImported,
}: {
  state: SummaryState;
  canWrite: boolean;
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
          canWrite={canWrite}
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
          canWrite={canWrite}
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
  canWrite,
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
  /** Read-only members keep the counts; the upload/clear controls hide. */
  canWrite: boolean;
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
    <div className={`rounded-xl border border-line bg-surface p-4 shadow-win-sm ${className}`}>
      <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
      <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-faint">{hint}</p>
      {canWrite && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label
            className={`inline-flex items-center gap-2 rounded-full border border-tide/40 bg-surface px-3.5 py-2 text-[13px] font-medium text-tide transition-colors hover:border-tide hover:bg-tide-wash ${
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
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:border-red-600/40 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      )}
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
          ? "border-ok/25 bg-ok/10 text-ok"
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

/* Same banner for the hosted email auth's ?email=connected|failed redirect.
   The redirect only proves OAuth finished — when the server-side mailbox
   probe failed (email_error), stay quiet and let the card explain instead
   of flashing a green "all set" over a red error. */
function EmailBanner({ emailError }: { emailError: string | null }) {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("email");
  if (status !== "connected" && status !== "failed") return null;
  if (status === "connected" && emailError) return null;

  const connected = status === "connected";
  return (
    <div
      role="status"
      className={`mb-7 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] font-medium ${
        connected
          ? "border-ok/25 bg-ok/10 text-ok"
          : "border-red-600/25 bg-red-500/10 text-red-800"
      }`}
    >
      <span aria-hidden="true">{connected ? "✓" : "✕"}</span>
      {connected
        ? "Email connected — you're all set."
        : "Connection failed, please try again."}
    </div>
  );
}
