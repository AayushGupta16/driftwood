import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { AdminPanelControls, ImpersonationBanner } from "./GodMode";
import { listAssets } from "./assets/api";
import type { CompanyAsset } from "./assets/model";
import { listAudiences } from "./audiences/api";
import type { AudienceSummary } from "./audiences/model";
import { listCampaigns } from "./campaigns/api";
import type { CampaignSummary } from "./campaigns/model";
import AddInboxes from "./dashboard/AddInboxes";
import AppShell from "./dashboard/AppShell";
import InboxListOverlay from "./dashboard/InboxListOverlay";
import {
  DOMAIN_CAP,
  INBOX_CAP,
  managedInboxCap,
  useManagedInboxes,
  type MailboxesOverview,
  type PurchaseResult,
  type SenderInput,
} from "./dashboard/managed-inboxes";
import {
  AssetsIcon,
  AudienceIcon,
  CampaignIcon,
  PeopleIcon,
} from "./dashboard/icons";
import { withMockMode } from "./mock-mode";
import { GoogleMark, LoggedOutView, ToastProvider } from "./dashboard/DashboardCommon";
import {
  buildOverviewSnapshot,
  type OverviewSnapshot,
} from "./dashboard/overview-model";
import {
  CARD,
  relativeTime,
  useToast,
} from "./dashboard-shared";
import "./dashboard/overview.css";
import "./dashboard/managed-inboxes.css";

/* /dashboard — Google-login-gated shell. Talks to the same-origin /auth/*
   endpoints (vite proxy in dev, vercel rewrite in prod), so every request
   must send the first-party session cookie.

   The dashboard remains the control surface for account connections and the
   entry point for browser-based campaign planning. */

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
      window.location.href = withMockMode("/dashboard");
    }
  }

  return (
    <ToastProvider>
      <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip">
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

/* ---------- logged-in shell ---------- */

function LoggedInView({ user, onLogout }: { user: User; onLogout: () => void }) {
  const displayName = user.name || user.email;
  // Shown next to the identity when the account belongs to a named workspace.
  const orgName = user.org?.name.trim() || null;
  const canWrite = (user.org?.role ?? "owner") !== "member";

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <AppShell
        active="home"
        identity={{ name: displayName, workspace: orgName, avatarUrl: user.avatar_url }}
        onLogout={onLogout}
        adminControl={user.is_admin ? <AdminPanelControls /> : undefined}
        canWrite={canWrite}
      >
        <div className="mx-auto w-full max-w-5xl py-5 sm:py-8">
          {user.is_approved ? <ApprovedView user={user} /> : <PendingView />}
        </div>
      </AppShell>
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
type EmailSending = {
  emails_sent: number;
  emails_cap: number;
  within_limits: boolean;
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
  email_sending?: EmailSending | null;
  funnel: Funnel;
  results: Results;
  lists: Lists;
  companies: Companies;
  pending_reviews: number;
  queued_sends?: number; // optional: tolerate a backend that predates it
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

type InventoryState = {
  status: "loading" | "ready";
  audiences: AudienceSummary[] | null;
  campaigns: CampaignSummary[] | null;
  assets: CompanyAsset[] | null;
};

function ApprovedView({ user }: { user: User }) {
  // Solo accounts carry no org and stay full-control. Only the owner manages
  // channel connections; members are read-only everywhere.
  const role = user.org?.role ?? "owner";
  const isOwner = role === "owner";
  const canWrite = role !== "member";
  // The managed pool feeds two surfaces: the email tile (count + add flow)
  // and the quiet capacity line on Today's sending — so it lives here.
  const { pool, applyPurchase } = useManagedInboxes();
  const [summary, setSummary] = useState<SummaryState>({ status: "loading" });
  const [activity, setActivity] = useState<ActivityState>({ status: "loading" });
  const [inventory, setInventory] = useState<InventoryState>({
    status: "loading",
    audiences: null,
    campaigns: null,
    assets: null,
  });
  const [importsOpen, setImportsOpen] = useState(false);
  const importsRef = useRef<HTMLDetailsElement>(null);

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [audiences, campaigns, assets] = await Promise.allSettled([
        listAudiences(),
        listCampaigns(),
        listAssets(),
      ]);
      if (cancelled) return;
      setInventory({
        status: "ready",
        audiences: audiences.status === "fulfilled" ? audiences.value : null,
        campaigns: campaigns.status === "fulfilled" ? campaigns.value : null,
        assets: assets.status === "fulfilled" ? assets.value : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshot = buildOverviewSnapshot(
    summary.status === "ready" ? summary.summary.pending_reviews : null,
    {
      audienceCount: inventory.audiences?.length ?? null,
      assetCount: inventory.assets?.length ?? null,
      campaigns: inventory.campaigns,
    },
  );

  /* the email channel's daily ceiling — own connected mailbox (20/day)
     plus what the managed pool carries today. Shown quietly where the
     dashboard already talks send volume; absent whenever there is no pool
     (or the fetch failed). */
  const emailCapLine = pool
    ? `Up to ${((user.email_connected ?? false) ? 20 : 0) + managedInboxCap(pool.mailboxes)} emails/day`
    : null;

  function openImports() {
    setImportsOpen(true);
    window.requestAnimationFrame(() => {
      importsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      importsRef.current?.querySelector("summary")?.focus();
    });
  }

  return (
    <div className="overview-page">
      <LinkedInBanner />
      <EmailBanner emailError={user.email_error ?? null} />
      <header className="overview-heading">
        <h1>Overview</h1>
        <div className="overview-heading-links" aria-label="Lead database shortcuts">
          <a href={withMockMode("/dashboard/leads")}>{formatCount(summary, "leads")} leads</a>
          <a href={withMockMode("/dashboard/companies")}>{formatCount(summary, "companies")} qualified companies</a>
        </div>
      </header>

      <ConnectionSetup
        user={user}
        isOwner={isOwner}
        pool={pool}
        applyPurchase={applyPurchase}
      />
      <TodaysSending summary={summary} activity={activity} emailCapLine={emailCapLine} />
      <MetricsCard state={summary} />
      {canWrite && <QuickActions onImport={openImports} />}
      <CampaignDesk snapshot={snapshot} inventory={inventory} />

      <details
        className="overview-imports"
        open={importsOpen}
        ref={importsRef}
        onToggle={(event) => setImportsOpen(event.currentTarget.open)}
      >
        <summary>
          <strong>Imports and blacklist</strong>
          <span aria-hidden="true" className="overview-imports-toggle">+</span>
        </summary>
        <ListsCard state={summary} canWrite={canWrite} onImported={loadSummary} />
      </details>
    </div>
  );
}

function formatCount(state: SummaryState, key: "leads" | "companies") {
  if (state.status !== "ready") return "—";
  const value = key === "leads" ? state.summary.lists.leads : state.summary.companies.qualified;
  return value.toLocaleString();
}

function ConnectionSetup({
  user,
  isOwner,
  pool,
  applyPurchase,
}: {
  user: User;
  isOwner: boolean;
  pool: MailboxesOverview | null;
  applyPurchase: (result: PurchaseResult, senders: SenderInput[]) => void;
}) {
  if (!isOwner) return null;
  const linkedInMissing = !user.linkedin_connected;
  const emailMissing = !(user.email_connected ?? false);
  const xMissing = !(user.twitter_connected ?? false) || (user.twitter_chat_locked ?? false);
  const remaining = [linkedInMissing, emailMissing, xMissing].filter(Boolean).length;
  const connected = 3 - remaining;

  return (
    <section className="overview-connections" aria-labelledby="connections-title">
      <div className="overview-section-heading">
        <h2 id="connections-title">Sending accounts</h2>
        <span>{connected} of 3 connected{remaining > 0 ? ` · ${remaining} left` : ""}</span>
      </div>
      <div className="overview-connection-grid">
        <LinkedInCard connected={!linkedInMissing} />
        <EmailCard
          connected={!emailMissing}
          emailError={user.email_error ?? null}
          companyName={user.org?.name ?? null}
          pool={pool}
          applyPurchase={applyPurchase}
        />
        <TwitterCard
          connected={user.twitter_connected ?? false}
          pending={user.twitter_pending ?? false}
          chatLocked={user.twitter_chat_locked ?? false}
        />
      </div>
    </section>
  );
}

function TodaysSending({
  summary,
  activity,
  emailCapLine,
}: {
  summary: SummaryState;
  activity: ActivityState;
  /** the email channel's daily ceiling (own mailbox + managed pool);
   *  null when there is no managed pool */
  emailCapLine: string | null;
}) {
  const sending = summary.status === "ready" ? summary.summary.sending : null;
  const emailSending = summary.status === "ready" ? summary.summary.email_sending ?? null : null;
  const pendingReviews = summary.status === "ready" ? summary.summary.pending_reviews : null;
  const queuedSends = summary.status === "ready" ? summary.summary.queued_sends ?? null : null;
  /* "On track" means approved outreach is actually queued and flowing — not
     merely "under cap". No queued sends but items waiting on the founder is
     an approval bottleneck; neither queued nor pending is an empty pipe. */
  const statusValue = summary.status === "loading"
    ? "—"
    : summary.status === "error"
      ? "Unavailable"
      : sending?.within_limits === false || emailSending?.within_limits === false
        ? "Near limit"
        : sending === null && emailSending === null
          ? "Setup needed"
          : queuedSends === null
            ? "On track"
            : queuedSends > 0
              ? "On track"
              : (pendingReviews ?? 0) > 0
                ? "Awaiting review"
                : "Nothing queued";
  const statusTone = statusValue === "On track" ? "success" : statusValue === "—" || statusValue === "Unavailable" ? undefined : "warning";
  const latestSends = activity.status === "ready"
    ? activity.events.filter((event) => event.kind === "sent").slice(0, 6)
    : [];

  return (
    <section className="overview-panel overview-sending" aria-labelledby="sending-title">
      <div className="overview-panel-heading">
        <h2 id="sending-title">Today&rsquo;s sending</h2>
        <a href={withMockMode("/dashboard/review")}>Open review queue</a>
      </div>
      <div className="overview-sending-layout">
        <div className="overview-sending-stats">
          <SendingStat
            label="LinkedIn invites"
            value={summary.status !== "ready" ? "—" : sending ? `${sending.invites_sent}/${sending.invites_cap}` : "Not connected"}
          />
          <SendingStat
            label="LinkedIn messages"
            value={summary.status !== "ready" ? "—" : sending ? `${sending.messages_sent}/${sending.messages_cap}` : "Not connected"}
          />
          <SendingStat
            label="Emails sent"
            value={summary.status !== "ready" ? "—" : emailSending ? `${emailSending.emails_sent}/${emailSending.emails_cap}` : "Not connected"}
            sub={emailCapLine}
          />
          <SendingStat
            label="Waiting for review"
            value={pendingReviews === null ? "—" : pendingReviews.toLocaleString()}
          />
          <SendingStat
            label="Status"
            value={statusValue}
            tone={statusTone}
          />
        </div>
        <div className="overview-latest-sends">
          <h3>
            Latest sends
            <a
              className="overview-latest-sends-all"
              href={withMockMode("/dashboard/review?tab=sent")}
            >
              View all
            </a>
          </h3>
          {activity.status === "loading" && <p className="overview-empty" role="status">Loading…</p>}
          {activity.status === "error" && <p className="overview-empty" role="alert">Unavailable right now.</p>}
          {activity.status === "ready" && latestSends.length === 0 && <p className="overview-empty">Nothing sent yet today.</p>}
          {latestSends.map((event, index) => (
            <ActivityLine key={`${event.at}-${index}`} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SendingStat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
  /** quiet context line under the figure (e.g. the email channel's daily
   *  ceiling when a managed pool exists) */
  sub?: string | null;
}) {
  return (
    <div className="overview-sending-stat">
      <span>{label}</span>
      <div>
        <strong className={tone ? `is-${tone}` : value === "Not connected" ? "is-muted" : undefined}>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function QuickActions({ onImport }: { onImport: () => void }) {
  return (
    <section className="overview-panel overview-add" aria-labelledby="add-title">
      <div className="overview-panel-heading">
        <h2 id="add-title">Add more</h2>
      </div>
      <div className="overview-action-grid">
        <a href={withMockMode("/dashboard/audiences")}><AudienceIcon size={18} /><span>Find leads</span></a>
        <a href={withMockMode("/dashboard/campaigns/new")}><CampaignIcon size={18} /><span>New campaign</span></a>
        <a href={withMockMode("/dashboard/assets")}><AssetsIcon size={18} /><span>Add assets</span></a>
        <button type="button" onClick={onImport}><PeopleIcon size={18} /><span>Import CSV</span></button>
      </div>
    </section>
  );
}

function CampaignDesk({
  snapshot,
  inventory,
}: {
  snapshot: OverviewSnapshot;
  inventory: InventoryState;
}) {
  return (
    <section className="overview-panel overview-campaign-desk" aria-labelledby="campaign-desk-title">
      <div className="overview-panel-heading">
        <h2 id="campaign-desk-title">Campaigns</h2>
        <a href={withMockMode("/dashboard/campaigns")}>View all</a>
      </div>
      {inventory.status === "loading" ? (
        <p className="overview-empty" role="status">Loading campaigns…</p>
      ) : inventory.campaigns === null ? (
        <p className="overview-empty" role="alert">Campaigns are temporarily unavailable.</p>
      ) : snapshot.recentCampaigns.length === 0 ? (
        <p className="overview-empty">No campaigns yet.</p>
      ) : (
        <div className="overview-campaign-list">
          {snapshot.recentCampaigns.map((campaign) => (
            <a href={withMockMode(`/dashboard/campaigns/${encodeURIComponent(campaign.id)}`)} key={campaign.id}>
              <span className={`overview-campaign-status is-${campaign.status}`}>
                {campaign.status}
              </span>
              <strong>{campaign.name}</strong>
              <small>{campaign.contactCount} leads · {campaign.stepCount} steps</small>
              <time dateTime={campaign.updatedAt}>{relativeTime(campaign.updatedAt) ?? "Recently"}</time>
            </a>
          ))}
        </div>
      )}
    </section>
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

/* Honest summary metrics remain the overview's largest surface. Activity has
   its own supporting panel so the funnel stays scannable at a glance. */
function MetricsCard({ state }: { state: SummaryState }) {
  return (
    <section className="overview-panel overview-metrics" aria-labelledby="pipeline-title">
      <div className="overview-panel-heading">
        <h2 id="pipeline-title">Results</h2>
        <a href={withMockMode("/dashboard/metrics")}>Open metrics</a>
      </div>
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
          <InlineResults results={state.summary.results} />
          <div className="overview-metrics-rule" />
          <FunnelBars funnel={state.summary.funnel} />
        </>
      )}
    </section>
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
    const verb = event.detail === "email"
      ? "Email sent"
      : event.detail === "message"
        ? "LinkedIn message sent"
        : event.detail === "connection_request"
          ? "LinkedIn invite sent"
          : event.detail === "x_dm"
            ? "X DM sent"
            : event.detail === "x_follow"
              ? "X follow sent"
              : "Outreach sent";
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
    <div className="overview-channel-row">
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
          <h3 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
            {connected ? "LinkedIn" : "Connect LinkedIn"}
          </h3>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
            {connected ? "Ready." : "Required for LinkedIn outreach."}
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
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tide px-4.5 py-2.5 text-[14.5px] font-semibold text-white transition-[background,transform] hover:-translate-y-px hover:bg-tide-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
  companyName,
  pool,
  applyPurchase,
}: {
  connected: boolean;
  emailError: string | null;
  companyName: string | null;
  pool: MailboxesOverview | null;
  applyPurchase: (result: PurchaseResult, senders: SenderInput[]) => void;
}) {
  const [connectPending, setConnectPending] = useState<EmailProvider | null>(
    null,
  );
  const [connectError, setConnectError] = useState<string | null>(null);
  /* the managed pool is null for every customer without one (and on any
     fetch error) — the tile then renders exactly as it did before the
     feature existed. Shown only alongside the customer's own connected
     mailbox. The tile itself never grows past its siblings: the inbox
     list and the add flow both float over the grid as overlays. */
  const [listOpen, setListOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const showPool = connected && pool !== null;
  // own connected mailbox + the managed pool
  const boxCount = 1 + (pool?.mailboxes.length ?? 0);
  const underCaps =
    (pool?.domains.length ?? 0) < DOMAIN_CAP &&
    (pool?.mailboxes.length ?? 0) < INBOX_CAP;
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
    <div className="overview-channel-row">
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
          <h3 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
            {connected ? "Email" : "Connect email"}
          </h3>
          {showPool ? (
            /* exactly one body line — the count, doubling as the way into
               the inbox list, which floats over the grid so the tile never
               grows past its siblings */
            pool.mailboxes.length > 0 ? (
              <button
                type="button"
                className="managed-inboxes-count"
                aria-haspopup="dialog"
                onClick={() => setListOpen(true)}
              >
                {boxCount} email {boxCount === 1 ? "box" : "boxes"} connected
                <svg
                  className="managed-inboxes-caret"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            ) : (
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
                {boxCount} email {boxCount === 1 ? "box" : "boxes"} connected
              </p>
            )
          ) : (
            <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
              {connected
                ? "Ready."
                : "Send from Gmail or Outlook."}
            </p>
          )}

          {connected ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={pending}
                className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Disconnecting…" : "Disconnect"}
              </button>
              {underCaps && (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  disabled={pending}
                  onClick={() => setAddOpen(true)}
                  className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-tide/40 hover:bg-tide-wash hover:text-tide-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add inboxes
                </button>
              )}
            </div>
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

          {listOpen && pool && (
            <InboxListOverlay
              mailboxes={pool.mailboxes}
              onClose={() => setListOpen(false)}
            />
          )}
          {addOpen && (
            <AddInboxes
              companyName={companyName}
              ownedDomains={pool?.domains.map((d) => d.name) ?? []}
              existingDomains={pool?.domains.length ?? 0}
              existingInboxes={pool?.mailboxes.length ?? 0}
              onClose={() => setAddOpen(false)}
              onPurchased={(result, senders) => {
                applyPurchase(result, senders);
                setAddOpen(false);
              }}
            />
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
    <div className="overview-channel-row">
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
          <h3 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
            {/* No @handle to show: the login check reads cookies, not X's
                DOM, so nothing scrapes the handle any more. */}
            {locked
              ? "Almost there — Messages is locked"
              : connected
                ? "X"
                : watching
                  ? "Finish in the X tab"
                  : "Connect X"}
          </h3>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
            {locked
              ? "Enter your chat PIN to enable DMs."
              : connected
                ? "Ready."
                : watching
                  ? "Complete these steps in X:"
                  : "Send direct messages from X."}
          </p>

          {(watching || locked) && <TwitterSteps loggedIn={locked} />}

          {locked ? (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void openTab("unlock")}
                disabled={pending}
                className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tide px-4.5 py-2.5 text-[14.5px] font-semibold text-white transition-[background,transform] hover:-translate-y-px hover:bg-tide-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-tide px-4.5 py-2.5 text-[14.5px] font-semibold text-white transition-[background,transform] hover:-translate-y-px hover:bg-tide-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
  audience?: { id: string; name: string; member_count: number; created: boolean } | null;
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
  if (r.audience)
    parts.push(
      `${r.audience.created ? "created" : "updated"} audience “${r.audience.name}” (${r.audience.member_count})`,
    );
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
    <div className="overview-import-body">
      <div className="flex flex-1 flex-col gap-3">
        <UploadField
          className="flex-1"
          title="Lead list"
          hint="CSV with a name plus email or LinkedIn URL."
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
          hint="Emails, domains, or LinkedIn URLs to exclude."
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
