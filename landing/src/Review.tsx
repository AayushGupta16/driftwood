import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ToastProvider } from "./dashboard/DashboardCommon";
import { AdminPanelControls, ImpersonationBanner } from "./GodMode";
import { CARD, useToast } from "./dashboard-shared";
import AppShell from "./dashboard/AppShell";
import { EmailPreview } from "./EmailPreview";
import { emailBodySummary } from "./email-preview";
import { withMockMode } from "./mock-mode";
import "./review-queue.css";

/* /dashboard/review — the founder's chronological decision inbox. The scan
   list and exact-send detail stay together in the workspace; type filters and
   bulk decisions remain available above the in-page workbench. */

type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_approved: boolean;
  linkedin_connected: boolean;
  is_admin?: boolean;
  impersonating?: boolean;
  /* org workspace membership; absent/null (solo accounts) reads as owner.
     Members are read-only — every decide/cancel/dismiss affordance hides. */
  org?: { name: string; role: "owner" | "admin" | "member" } | null;
};

/* ---------- API shapes (mirror backend app/schemas/reviews.py) ---------- */

type ReviewLeadContext = {
  lead_id: string;
  name: string | null;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  stage: string;
  prior_sends: number;
  last_sent_at: string | null;
};

/* Per-kind ScheduledSend runway (approved but not yet delivered). */
type QueueStats = {
  kind: string; // "message" | "connection_request" | "email"
  queued: number;
  sent_24h: number;
  cap: number;
  runs_through: string | null; // ISO date; null when nothing is queued
  failed?: number; // optional: tolerate a backend that predates it
};

/* One approved-but-undelivered ScheduledSend (GET /dashboard/sends). */
type SendRow = {
  id: string;
  batch_id: string;
  kind: string; // "message" | "connection_request" | "email"
  note: string; // the frozen copy — sends exactly as shown
  subject: string | null; // email kind only; null elsewhere
  attachment_slug: string | null;
  lead: ReviewLeadContext | null;
  status: string; // "pending" | "sending" | "failed"
  error: string | null;
  // "quota" | "already_connected" | "profile_not_found" | "other";
  // null = old rows from before failure classification
  error_class: string | null;
  due_at: string; // ISO; the API orders by this asc (the send order)
  projected_date: string | null; // "YYYY-MM-DD"
  created_at: string;
  sent_at: string | null; // set on ledger rows (view=sent); null on live ones
};

type SendsPageData = {
  sends: SendRow[];
  total: number;
  limit: number;
  offset: number;
  counts: { pending: number; sending: number; failed: number; sent?: number };
};

type CancelResult = {
  canceled: number;
  skipped: string[]; // ids that already went out
  agent_woken: boolean;
};

/* POST /dashboard/sends/dismiss — failed rows only; skipped ids weren't
   failed (or weren't ours), so they stay in the list. */
type DismissResult = {
  dismissed: number;
  skipped: string[];
};

/* bug_validation's structured evidence — required at submission by the
   request_review tool, but typed defensively (the column is JSONB). */
type BugEvidence = {
  repro_steps?: string[];
  url?: string;
  device?: string;
  video_timestamp?: string;
};

type ReviewItemRow = {
  id: string;
  batch_id: string;
  agent_id: string;
  kind: string; // "send_message" | "send_connection" | "send_email" | "send_x_dm" | "follow_x_account" | "bug_validation"
  title: string;
  body: string;
  subject: string | null; // send_email only; null elsewhere
  lead: ReviewLeadContext | null;
  attachment_slug: string | null;
  evidence: BugEvidence | null;
  status: string;
  decision_reason: string | null;
  decided_at: string | null;
  scheduled_batch_id: string | null;
  created_at: string;
};

type ReviewsPageData = {
  pending: ReviewItemRow[];
  decided: ReviewItemRow[]; // returned by the API; ignored in v1
  total_pending: number;
  limit: number;
  offset: number;
  queue_stats?: QueueStats[]; // optional: tolerate a backend that predates it
  counts?: ReviewQueueCounts; // optional: tolerate a backend that predates it
};

type ReviewQueueCounts = {
  pending: number;
  pending_sends: number;
  pending_system: number;
  approved_7d: number;
  denied_7d: number;
};

type DecideItem = {
  item_id: string;
  decision: "approve" | "deny";
  reason?: string;
};

type DecideResult = {
  approved: number;
  denied: number;
  skipped: string[];
  queued: string[];
  agent_woken: boolean;
};

/* ---------- page shell ---------- */

export default function Review() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const u = (await res.json()) as User;
          if (cancelled) return;
          // Only approved users get the queue; everyone else goes back to the
          // dashboard, which handles login + the pending-approval state.
          if (u.is_approved) setUser(u);
          else window.location.href = withMockMode("/dashboard");
        } else {
          window.location.href = withMockMode("/dashboard");
        }
      } catch {
        if (!cancelled) window.location.href = withMockMode("/dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ToastProvider>
      <div className="grain relative flex min-h-[100dvh] flex-col overflow-x-clip">
        {user ? <ReviewView user={user} /> : <LoadingView />}
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

function ReviewView({ user }: { user: User }) {
  const displayName = user.name || user.email;
  // Solo accounts carry no org and stay full-control; workspace members are
  // read-only — they see the queue and the sends, never the buttons.
  const role = user.org?.role ?? "owner";
  const canWrite = role !== "member";

  async function handleLogout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = withMockMode("/dashboard");
    }
  }

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <AppShell
        active="review"
        identity={{ name: displayName, workspace: user.org?.name, avatarUrl: user.avatar_url }}
        onLogout={handleLogout}
        adminControl={user.is_admin ? <AdminPanelControls /> : undefined}
        canWrite={canWrite}
      >
        <div className="review-page"><ReviewQueue canWrite={canWrite} /></div>
      </AppShell>
    </>
  );
}

/* ---------- the queue (GET /api/v1/dashboard/reviews) ---------- */

/* Pending items are loaded in full via a paged loop against the 100-cap
   endpoint (the Leads.tsx pattern) — queues are dozens of items, not
   thousands, so the upfront load is sub-second and select-all is honest. */
const FETCH_CHUNK = 100;
const FETCH_GUARD = 100; // hard ceiling on load-all iterations

type QueueState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      items: ReviewItemRow[];
      stats: QueueStats[];
      counts: ReviewQueueCounts | null;
    };

type SendsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; sends: SendRow[] };

type SentState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; sends: SendRow[]; total: number };

type DecideError = { message: string; itemId: string | null };

const EMPTY_SET: ReadonlySet<string> = new Set();

/* Stamped on every bulk denial so the agent reading back decision_reason can
   tell a considered no from a queue clear-out. The per-item deny box is where
   a real reason gets typed. */
const BULK_DENY_REASON = "Bulk denied from the review queue";

const DECIDE_FALLBACK = "Couldn't submit that decision. Please try again.";
const CANCEL_FALLBACK = "Couldn't cancel those sends. Please try again.";
const DISMISS_FALLBACK = "Couldn't dismiss those sends. Please try again.";

const MICROLABEL =
  "font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint";
const STAGE_PILL =
  "inline-flex items-center rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft";

/* "3h" / "2d" — the draft's compact age, not the "ago" form. */
function shortAge(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 3600) return `${Math.max(1, Math.round(secs / 60))}m`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h`;
  return `${Math.round(secs / 86400)}d`;
}

function kindLabel(kind: string): string {
  if (kind === "send_message") return "message";
  if (kind === "send_connection") return "connection";
  if (kind === "send_email") return "email";
  if (kind === "send_x_dm") return "X DM";
  if (kind === "follow_x_account") return "X follow";
  if (kind === "bug_validation") return "bug";
  if (kind === "drift_task_install") return "drift task";
  return kind;
}

/* ScheduledSend kinds use the stats-strip vocabulary, not the review-item
   one — same human labels either way. */
function sendKindLabel(kind: string): string {
  if (kind === "message") return "message";
  if (kind === "connection_request") return "connection";
  if (kind === "email") return "email";
  if (kind === "x_dm") return "X DM";
  if (kind === "x_follow") return "X follow";
  return kind;
}

/* Failure classes → the human tail of the red status line ("failed ·
   already connected"); null (rows from before classification) renders bare
   "failed". Quota failures now defer server-side instead of failing, so
   live failed rows are mostly the other three. */
const ERROR_CLASS_LABEL: Record<string, string> = {
  quota: "quota",
  already_connected: "already connected",
  profile_not_found: "profile not found",
  other: "other",
};

/* Kind order — bugs first: they are few, decision-critical, and gate the
   agent's outreach drafting, while connections pile up and get bulk-cleared.
   Orders both the chips and the card list (stable-sorted, so it stays
   oldest-first within each kind); unknown kinds trail in queue order. */
const KIND_ORDER = [
  "bug_validation",
  "drift_task_install",
  "send_connection",
  "send_message",
  "send_email",
  "send_x_dm",
  "follow_x_account",
];

/* Real outreach vs system items (bug validations, drift installs): the
   queue leads with sends — the things a founder is here to approve — and
   system items live behind their own chip so they never crowd the emails. */
const SEND_ITEM_KINDS = new Set([
  "send_message",
  "send_connection",
  "send_email",
  "send_x_dm",
  "follow_x_account",
]);
const SYSTEM_CHIP = "__system";

function kindRank(kind: string): number {
  const i = KIND_ORDER.indexOf(kind);
  return i === -1 ? KIND_ORDER.length : i;
}

type SortMode = "kind" | "oldest" | "newest" | "company";

/* The list's sort control. "kind" is the historical default (KIND_ORDER
   groups, oldest-first inside each — the API's order is preserved by the
   stable sort); the rest are what a founder reaches for when triaging by
   arrival time or clearing one account's items together. */
function sortItems(items: ReviewItemRow[], mode: SortMode): ReviewItemRow[] {
  const sorted = [...items];
  if (mode === "kind")
    return sorted.sort((a, b) => kindRank(a.kind) - kindRank(b.kind));
  if (mode === "oldest")
    return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (mode === "newest")
    return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return sorted.sort((a, b) =>
    (a.lead?.company ?? "").localeCompare(b.lead?.company ?? ""),
  );
}

/* Bug demos are hosted at /d/<slug>. Items should carry attachment_slug,
   but early bug_validation submissions referenced their demo only inside
   the evidence text — pull the first /d/ slug out of it so the card still
   renders the player instead of a text-only claim. */
function salvagedDemoSlug(item: ReviewItemRow): string | null {
  if (item.kind !== "bug_validation") return null;
  const text = `${item.evidence?.video_timestamp ?? ""} ${item.body}`;
  const match = /\/d\/([a-z0-9][a-z0-9_-]*)/i.exec(text);
  return match ? match[1] : null;
}

/* Same convention for the queued tab's send kinds. */
const SEND_KIND_ORDER = ["connection_request", "message", "email"];

function sendKindRank(kind: string): number {
  const i = SEND_KIND_ORDER.indexOf(kind);
  return i === -1 ? SEND_KIND_ORDER.length : i;
}

/* Pull the human-readable error out of the backend's envelope
   ({"error": {"code", "detail"}}) — e.g. the 409 linkedin_not_connected
   message — falling back to a generic line. Decide and cancel share the
   envelope, so they share this reader. */
async function readErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { code?: string; detail?: unknown };
    };
    const detail = data.error?.detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    // non-JSON body — use the fallback
  }
  return fallback;
}

function summarizeDecide(r: DecideResult): string {
  const parts: string[] = [];
  if (r.approved) parts.push(`${r.approved} approved`);
  if (r.denied) parts.push(`${r.denied} denied`);
  if (r.skipped.length) parts.push(`${r.skipped.length} already decided`);
  const head = parts.join(" · ") || "Nothing to decide";
  return r.queued.length ? `${head} — ${r.queued.join("; ")}.` : `${head}.`;
}

function summarizeCancel(r: CancelResult): string {
  const parts: string[] = [];
  if (r.canceled) parts.push(`${r.canceled} canceled`);
  if (r.skipped.length) parts.push(`${r.skipped.length} already sent`);
  return `${parts.join(" · ") || "Nothing to cancel"}.`;
}

function summarizeDismiss(r: DismissResult): string {
  const parts: string[] = [];
  if (r.dismissed) parts.push(`${r.dismissed} dismissed`);
  if (r.skipped.length) parts.push(`${r.skipped.length} skipped`);
  return `${parts.join(" · ") || "Nothing to dismiss"}.`;
}

type Tab = "review" | "queued" | "sent";

/* `?tab=queued` / `?tab=sent` deep-link those views (the digest link and
   the overview's "View all" respectively); anything else lands on
   needs-review. */
function tabFromUrl(): Tab {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab === "queued" ? "queued" : tab === "sent" ? "sent" : "review";
}

function ReviewQueue({ canWrite }: { canWrite: boolean }) {
  const [state, setState] = useState<QueueState>({ status: "loading" });
  const [selected, setSelected] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [deny, setDeny] = useState<{ id: string; reason: string } | null>(null);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [decideError, setDecideError] = useState<DecideError | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmDenyAll, setConfirmDenyAll] = useState(false);
  const [kindFilter, setKindFilter] = useState<string | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(tabFromUrl);
  const [sendsState, setSendsState] = useState<SendsState>({
    status: "loading",
  });
  const [sentState, setSentState] = useState<SentState>({ status: "loading" });
  const [sortMode, setSortMode] = useState<SortMode>("kind");
  const toast = useToast();

  /* An armed "Approve all" disarms itself after a beat — no stale confirm
     button waiting to be fat-fingered minutes later. */
  useEffect(() => {
    if (!confirmAll) return;
    const t = window.setTimeout(() => setConfirmAll(false), 5000);
    return () => window.clearTimeout(t);
  }, [confirmAll]);

  /* Same for "Deny all" — and the two are mutually exclusive, so arming one
     disarms the other. Denying is not destructive the way approving is (it
     sends nothing), but 300 items is still not something to fat-finger. */
  useEffect(() => {
    if (!confirmDenyAll) return;
    const t = window.setTimeout(() => setConfirmDenyAll(false), 5000);
    return () => window.clearTimeout(t);
  }, [confirmDenyAll]);

  const loadAll = useCallback(async () => {
    try {
      const all: ReviewItemRow[] = [];
      let stats: QueueStats[] = [];
      let counts: ReviewQueueCounts | null = null;
      for (let i = 0; i < FETCH_GUARD; i++) {
        const res = await fetch(
          `/api/v1/dashboard/reviews?limit=${FETCH_CHUNK}&offset=${all.length}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("request failed");
        const page = (await res.json()) as ReviewsPageData;
        if (i === 0) {
          stats = page.queue_stats ?? [];
          counts = page.counts ?? null;
        }
        all.push(...page.pending);
        if (page.pending.length === 0 || all.length >= page.total_pending)
          break;
      }
      setState({ status: "ready", items: all, stats, counts });
    } catch {
      setState((prev) => (prev.status === "ready" ? prev : { status: "error" }));
    }
  }, []);

  /* The queued tab's data loads up front alongside the reviews (its count
     sits in the tab label, so it can't wait for a tab switch) — same paged
     loop, same guard, against GET /dashboard/sends (due_at asc = send
     order; the page keeps that order). */
  const loadAllSends = useCallback(async () => {
    try {
      const all: SendRow[] = [];
      for (let i = 0; i < FETCH_GUARD; i++) {
        const res = await fetch(
          `/api/v1/dashboard/sends?limit=${FETCH_CHUNK}&offset=${all.length}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("request failed");
        const page = (await res.json()) as SendsPageData;
        all.push(...page.sends);
        if (page.sends.length === 0 || all.length >= page.total) break;
      }
      setSendsState({ status: "ready", sends: all });
    } catch {
      setSendsState((prev) =>
        prev.status === "ready" ? prev : { status: "error" },
      );
    }
  }, []);

  /* The delivered ledger (view=sent): first page is enough for the tab —
     newest 100 with the all-time total in the label. */
  const loadSent = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/dashboard/sends?view=sent&limit=100", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      const page = (await res.json()) as SendsPageData;
      setSentState({ status: "ready", sends: page.sends, total: page.total });
    } catch {
      setSentState((prev) =>
        prev.status === "ready" ? prev : { status: "error" },
      );
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([loadAll(), loadAllSends(), loadSent()]);
    })();
  }, [loadAll, loadAllSends, loadSent]);

  /* Re-pull just the stats strip after a decide — approvals turn into
     ScheduledSend rows server-side, so "queued" moves immediately. Items are
     already reconciled locally; a failure here just leaves the strip one
     decide stale. */
  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/dashboard/reviews?limit=1", {
        credentials: "include",
      });
      if (!res.ok) return;
      const page = (await res.json()) as ReviewsPageData;
      const stats = page.queue_stats;
      if (stats)
        setState((prev) =>
          prev.status === "ready" ? { ...prev, stats } : prev,
        );
    } catch {
      // stale strip is fine — the next full load refreshes it
    }
  }, []);

  /* One decide POST per user action (bulk decisions arrive as one call, so an
     approve-all session is one agent wake). On success the decided items
     leave the list; on failure everything stays put and the error renders
     red next to where the tap happened (`source` = item id, null = bulk). */
  const decide = useCallback(
    async (decisions: DecideItem[], source: string | null) => {
      if (decisions.length === 0) return;
      setBusyIds(new Set(decisions.map((d) => d.item_id)));
      setDecideError(null);
      try {
        const res = await fetch("/api/v1/dashboard/reviews/decide", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(decisions),
        });
        if (!res.ok) throw new Error(await readErrorDetail(res, DECIDE_FALLBACK));
        const result = (await res.json()) as DecideResult;
        // Skipped ids were already decided elsewhere — no longer pending
        // either way, so every posted id leaves the queue.
        const done = new Set(decisions.map((d) => d.item_id));
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                items: prev.items.filter((item) => !done.has(item.id)),
              }
            : prev,
        );
        setSelected((prev) => new Set([...prev].filter((id) => !done.has(id))));
        setDeny((prev) => (prev && done.has(prev.id) ? null : prev));
        toast(summarizeDecide(result), "success");
        void refreshStats();
      } catch (err) {
        setDecideError({
          message: err instanceof Error && err.message ? err.message : DECIDE_FALLBACK,
          itemId: source,
        });
      } finally {
        setBusyIds(EMPTY_SET);
      }
    },
    [toast, refreshStats],
  );

  /* Optimistic reconciliation for cancels — the QueuedList posts, then hands
     back the ids that are no longer queued (canceled OR already sent). */
  const removeSends = useCallback((ids: ReadonlySet<string>) => {
    setSendsState((prev) =>
      prev.status === "ready"
        ? { ...prev, sends: prev.sends.filter((s) => !ids.has(s.id)) }
        : prev,
    );
  }, []);

  /* replaceState (not push) keeps the param shareable without growing
     history — back should leave the page, not unwind tab flips. */
  function switchTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "review") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
    );
  }

  /* Sends and system items are separate populations: the queue leads with
     the outreach a founder is here to approve, and bug validations / drift
     installs sit behind their own chip. Within the send list the sort
     control applies; "by type" (default) keeps the historical KIND_ORDER
     grouping with the API's oldest-first order inside each kind. */
  const allItems = state.status === "ready" ? state.items : [];
  const systemItems = allItems.filter((item) => !SEND_ITEM_KINDS.has(item.kind));
  const items = sortItems(
    allItems.filter((item) => SEND_ITEM_KINDS.has(item.kind)),
    sortMode,
  );
  /* Sends load in full (same guard), so the row list IS
     counts.pending + counts.sending + counts.failed. */
  const queuedCount =
    sendsState.status === "ready" ? sendsState.sends.length : null;

  /* Kind filter: chips narrow the list so "select all → approve" can clear
     one send type (e.g. every connection request) without hand-sorting.
     Everything below the chips — select-all, Approve selected, Approve all,
     the cards — operates on the FILTERED list only. A filter whose kind
     empties out (last item decided) falls back to "all" by derivation, so
     the list never strands on an empty view. */
  const kindCounts = new Map<string, number>();
  for (const item of items)
    kindCounts.set(item.kind, (kindCounts.get(item.kind) ?? 0) + 1);
  const chipKinds = [...kindCounts.keys()].sort(
    (a, b) => kindRank(a) - kindRank(b),
  );
  const activeKind =
    kindFilter === SYSTEM_CHIP
      ? systemItems.length > 0
        ? SYSTEM_CHIP
        : null
      : kindFilter !== null && kindCounts.has(kindFilter)
        ? kindFilter
        : null;
  const visible =
    activeKind === SYSTEM_CHIP
      ? sortItems(systemItems, sortMode)
      : activeKind === null
        ? items
        : items.filter((item) => item.kind === activeKind);
  const activeReviewItem =
    visible.find((item) => item.id === activeReviewId) ?? visible[0] ?? null;

  const busy = busyIds.size > 0;
  const allSelected = visible.length > 0 && selected.size === visible.length;

  /* Selection resets on every filter change so a card hidden by the filter
     can never ride along into a bulk approve; the armed Approve all disarms
     for the same reason (its count just changed meaning). */
  function switchFilter(kind: string | null) {
    setKindFilter(kind);
    setSelected(EMPTY_SET);
    setConfirmAll(false);
    setConfirmDenyAll(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkApprove() {
    // Preserve queue order in the POST — oldest first, like the page.
    void decide(
      visible
        .filter((item) => selected.has(item.id))
        .map((item) => ({ item_id: item.id, decision: "approve" as const })),
      null,
    );
  }

  /* First tap arms the button ("Approve all N? Confirm"); the second submits
     every visible pending item as one decide POST. Real outreach gets queued
     on approve — never off a single click. */
  function handleApproveAll() {
    if (!confirmAll) {
      setConfirmDenyAll(false);
      setConfirmAll(true);
      return;
    }
    setConfirmAll(false);
    void decide(
      visible.map((item) => ({ item_id: item.id, decision: "approve" as const })),
      null,
    );
  }

  function handleBulkDeny() {
    void decide(
      visible
        .filter((item) => selected.has(item.id))
        .map((item) => ({
          item_id: item.id,
          decision: "deny" as const,
          reason: BULK_DENY_REASON,
        })),
      null,
    );
  }

  /* Deny all, armed the same way as Approve all. Clearing a whole kind at once
     is the point: a lane that gets shelved (say outreach moves off LinkedIn)
     leaves hundreds of pending items that would otherwise need one tap each,
     and the per-item deny box does not scale to that. */
  function handleDenyAll() {
    if (!confirmDenyAll) {
      setConfirmAll(false);
      setConfirmDenyAll(true);
      return;
    }
    setConfirmDenyAll(false);
    void decide(
      visible.map((item) => ({
        item_id: item.id,
        decision: "deny" as const,
        reason: BULK_DENY_REASON,
      })),
      null,
    );
  }

  return (
    <>
      <div className="review-page-header">
        <h1 className="m-0 text-[clamp(1.7rem,3.6vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
          Review queue
        </h1>
        {state.status === "ready" && (items.length > 0 || state.counts) && (
          <span className="mb-[5px] shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-faint tabular-nums">
            {items.length} pending
            {state.counts ? ` · ${state.counts.approved_7d} approved this week` : ""}
          </span>
        )}
      </div>

      {/* Needs review = decisions still owed; Queued = approved sends waiting
          on the dispatcher. Counts fill in as each list finishes loading. */}
      <div
        role="group"
        aria-label="Queue sections"
        className="review-tabs"
      >
        <TabButton
          label="Needs review"
          count={state.status === "ready" ? items.length : null}
          active={tab === "review"}
          onClick={() => switchTab("review")}
        />
        <TabButton
          label="Queued"
          count={queuedCount}
          active={tab === "queued"}
          onClick={() => switchTab("queued")}
        />
        <TabButton
          label="Sent"
          count={sentState.status === "ready" ? sentState.total : null}
          active={tab === "sent"}
          onClick={() => switchTab("sent")}
        />
      </div>

      {state.status === "ready" && <QueueStatsStrip stats={state.stats} />}

      {tab === "review" && state.status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <span
            className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
            role="status"
            aria-label="Loading review queue"
          />
        </div>
      )}

      {tab === "review" && state.status === "error" && (
        <p className="m-0 mt-6 text-[14px] font-medium text-red-700" role="alert">
          Couldn&rsquo;t load your review queue. Please refresh.
        </p>
      )}

      {tab === "review" &&
        state.status === "ready" &&
        (items.length === 0 && systemItems.length === 0 ? (
          <EmptyQueue />
        ) : (
          <>
            {/* Always visible (even single-kind) so the queue's composition
                is readable at a glance — hiding it read as "the feature is
                gone" when the queue happened to be all one type. */}
            <div
              role="group"
              aria-label="Filter by type"
              className="review-filters"
            >
              <FilterChip
                label="all"
                count={items.length}
                active={activeKind === null}
                onClick={() => switchFilter(null)}
              />
              {chipKinds.map((kind) => (
                <FilterChip
                  key={kind}
                  label={kindLabel(kind)}
                  count={kindCounts.get(kind) ?? 0}
                  active={activeKind === kind}
                  onClick={() =>
                    switchFilter(activeKind === kind ? null : kind)
                  }
                />
              ))}
              {systemItems.length > 0 && (
                <FilterChip
                  label="system"
                  count={systemItems.length}
                  active={activeKind === SYSTEM_CHIP}
                  onClick={() =>
                    switchFilter(activeKind === SYSTEM_CHIP ? null : SYSTEM_CHIP)
                  }
                />
              )}
              <label className="ml-auto inline-flex items-center gap-2 text-[12.5px] text-ink-soft">
                sort
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[12.5px] text-ink"
                >
                  <option value="kind">by type</option>
                  <option value="oldest">oldest first</option>
                  <option value="newest">newest first</option>
                  <option value="company">by company</option>
                </select>
              </label>
            </div>

            {/* read-only members keep the count line; the selection +
                decide affordances only exist for writers */}
            <div className="review-toolbar">
              {canWrite && (
                <>
                  <label className="inline-flex cursor-pointer items-center gap-[9px] text-[13.5px] font-medium text-ink-soft">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? new Set(visible.map((item) => item.id))
                            : EMPTY_SET,
                        )
                      }
                      aria-label="Select all items"
                      className="size-5 shrink-0 accent-tide"
                    />
                    Select all
                  </label>
                  {selected.size > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkApprove}
                      disabled={busy}
                      className="min-h-9 cursor-pointer rounded-[10px] bg-tide px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-colors hover:bg-tide-deep disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve selected ({selected.size})
                    </button>
                  )}
                  {selected.size > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkDeny}
                      disabled={busy}
                      className="min-h-9 cursor-pointer rounded-[10px] border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-red-700 transition-colors hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Deny selected ({selected.size})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApproveAll}
                    disabled={busy}
                    className={`min-h-9 cursor-pointer rounded-[10px] px-3.5 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      confirmAll
                        ? "bg-tide font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] hover:bg-tide-deep"
                        : "border border-line bg-surface font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
                    }`}
                  >
                    {confirmAll
                      ? `Approve all ${visible.length}? Confirm`
                      : "Approve all"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDenyAll}
                    disabled={busy}
                    className={`min-h-9 cursor-pointer rounded-[10px] px-3.5 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      confirmDenyAll
                        ? "bg-red-700 font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] hover:bg-red-800"
                        : "border border-line bg-surface font-medium text-ink-soft hover:border-red-700 hover:text-red-700"
                    }`}
                  >
                    {confirmDenyAll
                      ? `Deny all ${visible.length}? Confirm`
                      : "Deny all"}
                  </button>
                </>
              )}
              <span className="ml-auto shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-faint tabular-nums">
                {activeKind === null
                  ? `${items.length} pending`
                  : `${visible.length} of ${items.length}`}
              </span>
            </div>

            {decideError && decideError.itemId === null && (
              <p
                className="m-0 mb-2.5 text-[13.5px] font-medium text-red-700"
                role="alert"
              >
                {decideError.message}
              </p>
            )}

            <div className="review-workbench">
              <div className="review-inbox" role="list" aria-label="Items awaiting review">
                {visible.map((item) => (
                  <ReviewListRow
                    key={item.id}
                    item={item}
                    active={activeReviewItem?.id === item.id}
                    canWrite={canWrite}
                    checked={selected.has(item.id)}
                    busy={busyIds.has(item.id)}
                    onOpen={() => {
                      setActiveReviewId(item.id);
                      setDeny(null);
                    }}
                    onToggleSelect={() => toggleSelect(item.id)}
                  />
                ))}
              </div>
              <div className="review-detail" aria-live="polite">
                {activeReviewItem && (
                  <ItemCard
                    key={activeReviewItem.id}
                    item={activeReviewItem}
                    canWrite={canWrite}
                    busy={busyIds.has(activeReviewItem.id)}
                    denyReason={deny?.id === activeReviewItem.id ? deny.reason : null}
                    error={decideError?.itemId === activeReviewItem.id ? decideError.message : null}
                    onApprove={() => void decide([{ item_id: activeReviewItem.id, decision: "approve" }], activeReviewItem.id)}
                    onToggleDeny={() => setDeny((prev) => prev?.id === activeReviewItem.id ? null : { id: activeReviewItem.id, reason: "" })}
                    onReasonChange={(reason) => setDeny({ id: activeReviewItem.id, reason })}
                    onCancelDeny={() => setDeny(null)}
                    onConfirmDeny={() => void decide([{ item_id: activeReviewItem.id, decision: "deny", reason: deny?.reason.trim() ?? "" }], activeReviewItem.id)}
                  />
                )}
              </div>
            </div>
          </>
        ))}

      {tab === "queued" && sendsState.status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <span
            className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
            role="status"
            aria-label="Loading queued sends"
          />
        </div>
      )}

      {tab === "queued" && sendsState.status === "error" && (
        <p className="m-0 mt-6 text-[14px] font-medium text-red-700" role="alert">
          Couldn&rsquo;t load your queued sends. Please refresh.
        </p>
      )}

      {tab === "queued" &&
        sendsState.status === "ready" &&
        (sendsState.sends.length === 0 ? (
          <EmptyQueued />
        ) : (
          <QueuedList
            sends={sendsState.sends}
            canWrite={canWrite}
            onRemove={removeSends}
            refreshStats={refreshStats}
          />
        ))}

      {tab === "sent" && sentState.status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <span
            className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
            role="status"
            aria-label="Loading sent ledger"
          />
        </div>
      )}

      {tab === "sent" && sentState.status === "error" && (
        <p className="m-0 mt-6 text-[14px] font-medium text-red-700" role="alert">
          Couldn&rsquo;t load your sent history. Please refresh.
        </p>
      )}

      {tab === "sent" &&
        sentState.status === "ready" &&
        (sentState.sends.length === 0 ? (
          <p className="m-0 mt-8 text-[14px] text-ink-soft">
            Nothing delivered yet — approved sends land here once the
            dispatcher delivers them.
          </p>
        ) : (
          <SentLedger sends={sentState.sends} total={sentState.total} />
        ))}
    </>
  );
}

/* ---------- the delivered ledger (Sent tab) ---------- */

/* Every delivered send, newest first: who it went to, through what channel,
   and the exact frozen copy that went out — the after-the-fact answer to
   "what did we actually say to these people". */
function SentLedger({ sends, total }: { sends: SendRow[]; total: number }) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {total > sends.length && (
        <p className="m-0 text-[12.5px] text-ink-faint">
          Showing the latest {sends.length} of {total} delivered sends.
        </p>
      )}
      {sends.map((send) => (
        <details
          key={send.id}
          className="rounded-xl border border-line bg-surface px-4 py-3 shadow-win"
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[13.5px] font-semibold text-ink">
              {send.lead?.name ?? "(removed lead)"}
            </span>
            {send.lead?.company && (
              <span className="text-[12.5px] text-ink-soft">
                {send.lead.company}
              </span>
            )}
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink-soft">
              {sendKindLabel(send.kind)}
            </span>
            {send.subject && (
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">
                {send.subject}
              </span>
            )}
            <span className="ml-auto font-mono text-[11px] text-ink-faint tabular-nums">
              {send.sent_at ? statsTime(send.sent_at) : "sent"}
            </span>
          </summary>
          <pre className="mt-3 whitespace-pre-wrap border-t border-line pt-3 font-sans text-[13px] leading-relaxed text-ink">
            {send.note}
          </pre>
        </details>
      ))}
    </div>
  );
}

/* "Aug 23, 4:12 PM" — absolute, because a ledger is a record, not a feed. */
function statsTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "sent";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ---------- tab control ---------- */

/* Quiet segmented control: sand track, the active segment is the white
   card (surface + small window shadow), pills throughout — no black. */
function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number | null; // null while that list is still loading
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 cursor-pointer rounded-full px-4 py-1.5 text-[13.5px] tabular-nums transition-colors ${
        active
          ? "bg-surface font-semibold text-ink shadow-win-sm"
          : "font-medium text-ink-soft hover:text-ink"
      }`}
    >
      {count === null ? label : `${label} (${count})`}
    </button>
  );
}

/* ---------- kind-filter chip ---------- */

/* Mono-uppercase like the per-card kind badge so the chip visually names the
   badge it filters on; active = tide-wash fill (design-language tinted chip).
   min-h-9 keeps it tappable on the phone-first layout. */
function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
        active
          ? "border-tide/40 bg-tide-wash text-tide"
          : "border-line bg-paper text-ink-soft hover:border-ink-faint/50 hover:text-ink"
      }`}
    >
      {label}
      <span
        className={`tabular-nums ${active ? "text-tide/70" : "text-ink-faint"}`}
      >
        {count}
      </span>
    </button>
  );
}

/* ---------- queue-state strip (per-kind send runway) ---------- */

const STATS_KIND_LABEL: Record<string, string> = {
  message: "messages",
  connection_request: "connection requests",
  email: "emails",
};

const STATS_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* "2026-07-20" -> "Jul 20" without a Date round-trip (a bare date string
   parses as UTC midnight and can render a day early in local time). */
function statsDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return m >= 1 && m <= 12 && d ? `${STATS_MONTHS[m - 1]} ${d}` : iso;
}

/* "connection requests: 34 queued · 12/20 sent in last 24h · runs through
   ~Jul 20 · 2 failed" — one line per send kind; kinds with nothing queued,
   nothing sent, and nothing failed are noise, not news, so they're skipped
   (nothing at all renders when all are quiet). */
function QueueStatsStrip({ stats }: { stats: QueueStats[] }) {
  const live = stats.filter(
    (s) => s.queued > 0 || s.sent_24h > 0 || (s.failed ?? 0) > 0,
  );
  if (live.length === 0) return null;
  return (
    <div className="review-runway">
      {live.map((s) => (
        <p
          key={s.kind}
          className="m-0 font-mono text-[11.5px] leading-[1.6] text-ink-soft tabular-nums"
        >
          <span className="text-ink">{STATS_KIND_LABEL[s.kind] ?? s.kind}:</span>{" "}
          {s.queued} queued &middot; {s.sent_24h}/{s.cap} sent in last 24h
          {s.runs_through !== null && (
            <> &middot; runs through ~{statsDate(s.runs_through)}</>
          )}
          {(s.failed ?? 0) > 0 && (
            <>
              {" "}
              &middot; <span className="text-red-700">{s.failed} failed</span>
            </>
          )}
        </p>
      ))}
    </div>
  );
}

/* ---------- the queued tab (GET /api/v1/dashboard/sends) ---------- */

/* Cancel and dismiss failures share one channel — same render spot, same
   semantics (`sendId` = the row that was tapped, null = bulk). */
type ActionError = { message: string; sendId: string | null };

function QueuedList({
  sends,
  canWrite,
  onRemove,
  refreshStats,
}: {
  sends: SendRow[];
  canWrite: boolean;
  onRemove: (ids: ReadonlySet<string>) => void;
  refreshStats: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  /* Which bulk button is armed — only one at a time, so arming Cancel all
     disarms an armed Dismiss all (and vice versa). */
  const [confirmAll, setConfirmAll] = useState<"cancel" | "dismiss" | null>(
    null,
  );
  const [kindFilter, setKindFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(EMPTY_SET);
  const toast = useToast();

  /* Same disarm-after-a-beat as the armed Approve all. */
  useEffect(() => {
    if (!confirmAll) return;
    const t = window.setTimeout(() => setConfirmAll(null), 5000);
    return () => window.clearTimeout(t);
  }, [confirmAll]);

  /* One cancel POST per user action, mirroring decide. On success every
     posted id leaves the list — skipped ids already went out the door, so
     they're not queued either way — and the toast says which was which. On
     failure nothing is removed; the error renders red where the tap
     happened (`source` = send id, null = bulk). */
  const cancel = useCallback(
    async (ids: string[], source: string | null) => {
      if (ids.length === 0) return;
      setBusyIds(new Set(ids));
      setActionError(null);
      try {
        const res = await fetch("/api/v1/dashboard/sends/cancel", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ send_ids: ids }),
        });
        if (!res.ok)
          throw new Error(await readErrorDetail(res, CANCEL_FALLBACK));
        const result = (await res.json()) as CancelResult;
        const done = new Set(ids);
        onRemove(done);
        setSelected((prev) => new Set([...prev].filter((id) => !done.has(id))));
        toast(summarizeCancel(result), "success");
        void refreshStats();
      } catch (err) {
        setActionError({
          message:
            err instanceof Error && err.message ? err.message : CANCEL_FALLBACK,
          sendId: source,
        });
      } finally {
        setBusyIds(EMPTY_SET);
      }
    },
    [onRemove, refreshStats, toast],
  );

  /* Dismiss mirrors cancel, with one difference in the reconciliation:
     a skipped id here means the row WASN'T dismissed (it wasn't failed),
     so unlike cancel's already-sent skips it stays in the list. Dismissed
     rows also vanish server-side (GET /sends excludes them), so the
     optimistic removal and the next full load agree. */
  const dismiss = useCallback(
    async (ids: string[], source: string | null) => {
      if (ids.length === 0) return;
      setBusyIds(new Set(ids));
      setActionError(null);
      try {
        const res = await fetch("/api/v1/dashboard/sends/dismiss", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ send_ids: ids }),
        });
        if (!res.ok)
          throw new Error(await readErrorDetail(res, DISMISS_FALLBACK));
        const result = (await res.json()) as DismissResult;
        const skipped = new Set(result.skipped);
        onRemove(new Set(ids.filter((id) => !skipped.has(id))));
        // No selection cleanup: failed rows are never selectable.
        toast(summarizeDismiss(result), "success");
        void refreshStats();
      } catch (err) {
        setActionError({
          message:
            err instanceof Error && err.message
              ? err.message
              : DISMISS_FALLBACK,
          sendId: source,
        });
      } finally {
        setBusyIds(EMPTY_SET);
      }
    },
    [onRemove, refreshStats, toast],
  );

  /* Same chip semantics as the review tab: everything below the chips
     operates on the FILTERED list; an emptied-out filter falls back to
     "all" by derivation. */
  const kindCounts = new Map<string, number>();
  for (const send of sends)
    kindCounts.set(send.kind, (kindCounts.get(send.kind) ?? 0) + 1);
  const chipKinds = [...kindCounts.keys()].sort(
    (a, b) => sendKindRank(a) - sendKindRank(b),
  );
  const activeKind =
    kindFilter !== null && kindCounts.has(kindFilter) ? kindFilter : null;
  const visible =
    activeKind === null ? sends : sends.filter((s) => s.kind === activeKind);
  /* Failed rows have nothing left to cancel. Sending rows can still be
     posted — the API reports the ones that beat us as skipped. */
  const cancelable = visible.filter((s) => s.status !== "failed");
  /* Failed rows get dismissed instead; the bulk button only earns its spot
     when there's more than one of them under the current filter. */
  const failedVisible = visible.filter((s) => s.status === "failed");

  const busy = busyIds.size > 0;
  const allSelected =
    cancelable.length > 0 && selected.size === cancelable.length;

  function switchFilter(kind: string | null) {
    setKindFilter(kind);
    setSelected(EMPTY_SET);
    setConfirmAll(null);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCancelSelected() {
    // Preserve queue order in the POST — due first, like the list.
    void cancel(
      cancelable.filter((s) => selected.has(s.id)).map((s) => s.id),
      null,
    );
  }

  /* First tap arms ("Cancel all N? Confirm"); the second posts every
     visible cancelable send as one call. */
  function handleCancelAll() {
    if (confirmAll !== "cancel") {
      setConfirmAll("cancel");
      return;
    }
    setConfirmAll(null);
    void cancel(
      cancelable.map((s) => s.id),
      null,
    );
  }

  /* Same arm-then-confirm for clearing every visible failed row. */
  function handleDismissAllFailed() {
    if (confirmAll !== "dismiss") {
      setConfirmAll("dismiss");
      return;
    }
    setConfirmAll(null);
    void dismiss(
      failedVisible.map((s) => s.id),
      null,
    );
  }

  return (
    <>
      <div
        role="group"
        aria-label="Filter by type"
        className="mx-0.5 mt-[18px] flex flex-wrap items-center gap-2"
      >
        <FilterChip
          label="all"
          count={sends.length}
          active={activeKind === null}
          onClick={() => switchFilter(null)}
        />
        {chipKinds.map((kind) => (
          <FilterChip
            key={kind}
            label={sendKindLabel(kind)}
            count={kindCounts.get(kind) ?? 0}
            active={activeKind === kind}
            onClick={() => switchFilter(activeKind === kind ? null : kind)}
          />
        ))}
      </div>

      {/* read-only members keep the count line; the selection + cancel /
          dismiss affordances only exist for writers */}
      <div className="mx-0.5 mb-2.5 mt-[14px] flex flex-wrap items-center gap-2.5">
        {canWrite && (
          <>
            <label className="inline-flex cursor-pointer items-center gap-[9px] text-[13.5px] font-medium text-ink-soft">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? new Set(cancelable.map((s) => s.id))
                      : EMPTY_SET,
                  )
                }
                aria-label="Select all queued sends"
                className="size-5 shrink-0 accent-tide"
              />
              Select all
            </label>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={handleCancelSelected}
                disabled={busy}
                className="min-h-9 cursor-pointer rounded-[10px] bg-tide px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-colors hover:bg-tide-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel selected ({selected.size})
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelAll}
              disabled={busy || cancelable.length === 0}
              className={`min-h-9 cursor-pointer rounded-[10px] px-3.5 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                confirmAll === "cancel"
                  ? "bg-tide font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] hover:bg-tide-deep"
                  : "border border-line bg-surface font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
              }`}
            >
              {confirmAll === "cancel"
                ? `Cancel all ${cancelable.length}? Confirm`
                : "Cancel all queued"}
            </button>
            {failedVisible.length > 1 && (
              <button
                type="button"
                onClick={handleDismissAllFailed}
                disabled={busy}
                className={`min-h-9 cursor-pointer rounded-[10px] px-3.5 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmAll === "dismiss"
                    ? "bg-tide font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] hover:bg-tide-deep"
                    : "border border-line bg-surface font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
                }`}
              >
                {confirmAll === "dismiss"
                  ? `Dismiss all ${failedVisible.length} failed? Confirm`
                  : `Dismiss all failed (${failedVisible.length})`}
              </button>
            )}
          </>
        )}
        <span className="ml-auto shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-faint tabular-nums">
          {activeKind === null
            ? `${sends.length} queued`
            : `${visible.length} of ${sends.length}`}
        </span>
      </div>

      {actionError && actionError.sendId === null && (
        <p
          className="m-0 mb-2.5 text-[13.5px] font-medium text-red-700"
          role="alert"
        >
          {actionError.message}
        </p>
      )}

      <div className="review-queued-grid">
        {visible.map((send) => (
          <QueuedRow
            key={send.id}
            send={send}
            canWrite={canWrite}
            checked={selected.has(send.id)}
            busy={busyIds.has(send.id)}
            expanded={expanded.has(send.id)}
            error={actionError?.sendId === send.id ? actionError.message : null}
            onToggleSelect={() => toggleSelect(send.id)}
            onToggleExpand={() => toggleExpand(send.id)}
            onCancel={() => void cancel([send.id], send.id)}
            onDismiss={() => void dismiss([send.id], send.id)}
          />
        ))}
      </div>
    </>
  );
}

/* ---------- one queued send ---------- */

/* The review card's vocabulary, but lighter — this is a list entry, not a
   decision card: smaller shadow, tighter padding, no action pair. */
function QueuedRow({
  send,
  canWrite,
  checked,
  busy,
  expanded,
  error,
  onToggleSelect,
  onToggleExpand,
  onCancel,
  onDismiss,
}: {
  send: SendRow;
  canWrite: boolean;
  checked: boolean;
  busy: boolean;
  expanded: boolean;
  error: string | null;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const failed = send.status === "failed";
  const isEmail = send.kind === "email";
  return (
    <article className="review-queued-row">
      <div className="flex items-center gap-2">
        {/* selection only feeds the bulk cancel, so it hides with it */}
        {canWrite && (
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggleSelect}
            disabled={busy || failed}
            aria-label={`Select send to ${send.lead?.name ?? "lead"}`}
            className="size-5 shrink-0 accent-tide disabled:cursor-not-allowed"
          />
        )}
        <span className="rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
          {sendKindLabel(send.kind)}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10.5px] text-ink-faint tabular-nums">
          {shortAge(send.created_at)}
        </span>
      </div>

      {send.lead && <LeadLine lead={send.lead} />}

      {/* the frozen copy — the review card's mono block, clamped to three
          lines; tapping the block toggles it open (list rows stay short) */}
      {isEmail && expanded ? (
        <div className={send.lead ? "" : "mt-3"}>
          <EmailPreview subject={send.subject} body={send.note} />
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded="true"
            className="email-preview-toggle"
          >
            Collapse email
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse note" : isEmail ? "Preview email" : "Expand note"}
          className={`block w-full cursor-pointer rounded-[10px] border border-line bg-paper px-3.5 py-[13px] text-left ${
            send.lead ? "" : "mt-3"
          }`}
        >
          {/* emails lead with their subject line, above the clamped summary */}
          {send.subject && (
            <span className="mb-1 block font-mono text-[12.75px] font-semibold leading-[1.65] text-ink">
              Subject: {send.subject}
            </span>
          )}
          {/* line-clamp sets its own display (-webkit-box), so `block` only
              applies to the expanded state — stacking both breaks the clamp */}
          <span
            className={`whitespace-pre-wrap break-words font-mono text-[12.75px] leading-[1.65] text-ink ${
              expanded ? "block" : "line-clamp-3"
            }`}
          >
            {isEmail ? emailBodySummary(send.note) : send.note}
          </span>
        </button>
      )}

      {send.attachment_slug && (
        <p className="m-0 mt-1.5 font-mono text-[10.5px] text-ink-faint">
          d/{send.attachment_slug} &middot; attached
        </p>
      )}

      <div className="mt-2.5 flex min-h-6 items-center gap-2.5">
        <SendStatus send={send} />
        {canWrite && send.status === "pending" && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="ml-auto cursor-pointer px-1 py-1.5 text-[13px] font-medium text-ink-faint transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        )}
        {/* failed rows swap Cancel for Dismiss — same quiet weight; the
            send already didn't happen, this just clears the wreckage */}
        {canWrite && failed && (
          <button
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="ml-auto cursor-pointer px-1 py-1.5 text-[13px] font-medium text-ink-faint transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            Dismiss
          </button>
        )}
      </div>

      {failed && send.error && (
        <p className="m-0 mt-1 text-[12.5px] leading-[1.55] text-red-700">
          {send.error}
        </p>
      )}

      {error && (
        <p
          className="m-0 mt-2 text-[13px] font-medium text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
    </article>
  );
}

/* pending → "sends ~Jul 22" (the strip's date form; "queued" when the
   dispatcher hasn't projected a day); sending → live green; failed → red
   with the failure class ("failed · already connected"), the full error
   rendered under the row. */
function SendStatus({ send }: { send: SendRow }) {
  if (send.status === "sending")
    return (
      <span className="font-mono text-[11.5px] tracking-[0.02em] text-ok">
        sending now
      </span>
    );
  if (send.status === "failed") {
    const cls = send.error_class
      ? (ERROR_CLASS_LABEL[send.error_class] ?? send.error_class)
      : null;
    return (
      <span className="font-mono text-[11.5px] font-medium tracking-[0.02em] text-red-700">
        failed
        {cls && <> &middot; {cls}</>}
      </span>
    );
  }
  return (
    <span className="font-mono text-[11.5px] tracking-[0.02em] text-ink-soft tabular-nums">
      {send.projected_date
        ? `sends ~${statsDate(send.projected_date)}`
        : "queued"}
    </span>
  );
}

/* ---------- one review item ---------- */

function ReviewListRow({
  item,
  active,
  canWrite,
  checked,
  busy,
  onOpen,
  onToggleSelect,
}: {
  item: ReviewItemRow;
  active: boolean;
  canWrite: boolean;
  checked: boolean;
  busy: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
}) {
  const context = item.lead
    ? [item.lead.name, item.lead.title, item.lead.company].filter(Boolean).join(" · ")
    : item.body;
  return (
    <article className={`review-list-row ${active ? "is-active" : ""}`} role="listitem">
      {canWrite && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleSelect}
          disabled={busy}
          aria-label={`Select: ${item.title}`}
          className="review-list-check"
        />
      )}
      <button type="button" onClick={onOpen} className="review-list-open" aria-current={active ? "true" : undefined}>
        <span className="review-list-topline">
          <span className="review-list-kind">{kindLabel(item.kind)}</span>
          <span>{shortAge(item.created_at)}</span>
        </span>
        <strong>{item.title}</strong>
        <span className="review-list-context">{context}</span>
      </button>
    </article>
  );
}

function ItemCard({
  item,
  canWrite,
  busy,
  denyReason,
  error,
  onApprove,
  onToggleDeny,
  onReasonChange,
  onCancelDeny,
  onConfirmDeny,
}: {
  item: ReviewItemRow;
  canWrite: boolean;
  busy: boolean;
  /** null = deny box closed; string = the in-progress reason text. */
  denyReason: string | null;
  error: string | null;
  onApprove: () => void;
  onToggleDeny: () => void;
  onReasonChange: (reason: string) => void;
  onCancelDeny: () => void;
  onConfirmDeny: () => void;
}) {
  const isBug = item.kind === "bug_validation";
  const isSend =
    item.kind === "send_message" ||
    item.kind === "send_connection" ||
    item.kind === "send_email" ||
    item.kind === "send_x_dm";
  const denyOpen = denyReason !== null;
  // Bug items read Real / Not real, but map to the same approve/deny.
  const approveLabel = isBug ? "Real" : "Approve";
  const denyLabel = isBug ? "Not real" : "Deny";
  const evidence = isBug ? item.evidence : null;
  const videoSlug = item.attachment_slug || salvagedDemoSlug(item);

  return (
    <article className="review-decision-card">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
          {kindLabel(item.kind)}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10.5px] text-ink-faint tabular-nums">
          {shortAge(item.created_at)}
        </span>
      </div>

      <h2 className="m-0 mt-3 text-[15.5px] font-semibold leading-[1.3] tracking-[-0.01em]">
        {item.title}
      </h2>

      {item.lead && <LeadLine lead={item.lead} />}

      {isBug ? (
        <>
          {/* claim → evidence → video, in that order (spec's hard ordering:
              the founder validates without hand-reproducing). */}
          <p className="m-0 mb-3 mt-[3px] text-[13.5px] leading-[1.55] text-ink">
            {item.body}
          </p>
          {evidence && <EvidenceBlock evidence={evidence} />}
        </>
      ) : item.kind === "send_email" ? (
        <EmailPreview subject={item.subject} body={item.body} />
      ) : (
        <>
          {/* the exact frozen payload — mono, primary ink, no truncation;
              emails lead with their subject line */}
          <pre className="m-0 mb-3.5 whitespace-pre-wrap break-words rounded-[10px] border border-line bg-paper px-3.5 py-[13px] font-mono text-[12.75px] leading-[1.65] text-ink">
            {item.subject && (
              <span className="mb-1.5 block font-semibold">
                Subject: {item.subject}
              </span>
            )}
            {item.body}
          </pre>
        </>
      )}

      {videoSlug && (
        <>
          <video
            controls
            playsInline
            preload="metadata"
            src={`/d/${videoSlug}`}
            className="mb-1.5 aspect-video w-full rounded-xl bg-[#101820]"
          />
          <p className="m-0 mb-3.5 font-mono text-[10.5px] text-ink-faint">
            d/{videoSlug}
            {isSend && " · attached to this message"}
          </p>
        </>
      )}

      {/* read-only members get the full card minus the decision pair */}
      {canWrite && (
        <>
          <div className="flex gap-2.5 min-[700px]:justify-end">
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="min-h-11 flex-[1.4] cursor-pointer rounded-xl bg-tide px-[18px] py-2.5 text-[14px] font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-colors hover:bg-tide-deep disabled:cursor-not-allowed disabled:opacity-60 min-[700px]:min-w-[130px] min-[700px]:flex-none"
            >
              {approveLabel}
            </button>
            <button
              type="button"
              onClick={onToggleDeny}
              disabled={busy}
              aria-expanded={denyOpen}
              className={`min-h-11 flex-1 cursor-pointer rounded-xl border bg-surface px-4 py-2.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 min-[700px]:min-w-[130px] min-[700px]:flex-none ${
                denyOpen
                  ? "border-ink-faint text-ink"
                  : "border-line text-ink-soft hover:border-ink-faint hover:text-ink"
              }`}
            >
              {denyLabel}
            </button>
          </div>

          {denyOpen && (
            <div className="mt-3 border-t border-dashed border-line pt-3">
              <input
                type="text"
                value={denyReason}
                onChange={(e) => onReasonChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onConfirmDeny();
                }}
                placeholder="what should change?"
                aria-label="Deny reason"
                autoFocus
                className="min-h-11 w-full rounded-[10px] border border-line bg-paper px-3 py-[11px] text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-tide"
              />
              <p className="m-0 mb-2.5 mt-1.5 text-[12px] leading-[1.5] text-ink-faint">
                Optional &mdash; goes to your AE as feedback; the revised copy
                comes back here for review.
              </p>
              <div className="flex items-center gap-3 min-[700px]:justify-end">
                <button
                  type="button"
                  onClick={onCancelDeny}
                  className="cursor-pointer px-1 py-2 text-[13.5px] font-medium text-ink-faint transition-colors hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirmDeny}
                  disabled={busy}
                  className="min-h-10 cursor-pointer rounded-[10px] bg-tide px-[18px] py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-tide-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {denyLabel}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="m-0 mt-3 text-[13px] font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

/* "Maya Reston — VP Engineering, Loomi · [new] · no prior sends"; the name
   links out to the lead's LinkedIn profile when we have one (tide + hover
   underline, the Leads-table affordance) — no more hand-searching names. */
function LeadLine({ lead }: { lead: ReviewLeadContext }) {
  const role = [lead.title, lead.company].filter(Boolean).join(", ");
  const prior =
    lead.prior_sends === 0
      ? "no prior sends"
      : `${lead.prior_sends} prior ${lead.prior_sends === 1 ? "send" : "sends"}`;

  return (
    <p className="m-0 mb-3 mt-[3px] text-[13px] leading-[1.5] text-ink-soft">
      {lead.name &&
        (lead.linkedin_url ? (
          <a
            href={lead.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-tide no-underline hover:underline"
          >
            {lead.name}
            <span aria-hidden="true" className="text-[11px]">
              {" "}
              ↗
            </span>
          </a>
        ) : (
          lead.name
        ))}
      {lead.name && role ? ` — ${role}` : role}
      {(lead.name || role) && <> &middot; </>}
      <span className={STAGE_PILL}>{lead.stage}</span> &middot; {prior}
    </p>
  );
}

/* bug_validation's structured evidence — always rendered ABOVE the video so
   the founder can judge the claim without hand-reproducing it. */
function EvidenceBlock({ evidence }: { evidence: BugEvidence }) {
  const steps = Array.isArray(evidence.repro_steps) ? evidence.repro_steps : [];
  const hasAny =
    steps.length > 0 ||
    Boolean(evidence.url) ||
    Boolean(evidence.device) ||
    Boolean(evidence.video_timestamp);
  if (!hasAny) return null;

  return (
    <>
      <span className={`${MICROLABEL} mb-1.5 block`}>Evidence</span>
      <div className="mb-3.5 grid gap-2.5 rounded-[10px] border border-line bg-paper px-3.5 py-[13px]">
        {steps.length > 0 && (
          <EvidenceRow label="Repro">
            <ol className="m-0 grid list-decimal gap-1 pl-[18px] text-[13px] leading-[1.55] text-ink tabular-nums">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </EvidenceRow>
        )}
        {evidence.url && (
          <EvidenceRow label="Target">
            <span className="break-all font-mono text-[12px] leading-[1.55]">
              <a
                href={
                  /^https?:\/\//i.test(evidence.url)
                    ? evidence.url
                    : `https://${evidence.url}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-tide no-underline hover:underline"
              >
                {evidence.url}
              </a>
            </span>
          </EvidenceRow>
        )}
        {evidence.device && (
          <EvidenceRow label="Device">
            <span className="text-[13px] leading-[1.55] text-ink">
              {evidence.device}
            </span>
          </EvidenceRow>
        )}
        {evidence.video_timestamp && (
          <EvidenceRow label="In video">
            <span className="text-[13px] leading-[1.55] text-ink">
              {evidence.video_timestamp}
            </span>
          </EvidenceRow>
        )}
      </div>
    </>
  );
}

function EvidenceRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2.5">
      <span className={`${MICROLABEL} pt-0.5`}>{label}</span>
      {children}
    </div>
  );
}

/* ---------- alt state: nothing pending ---------- */

function EmptyQueue() {
  return (
    <div className={`${CARD} mt-6 px-6 py-11 text-center`}>
      <svg
        width="60"
        height="17"
        viewBox="0 0 60 17"
        fill="none"
        aria-hidden="true"
        className="mx-auto block text-tide"
      >
        <path
          d="M2 5q7 -6 14 0t14 0t14 0t14 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity=".9"
        />
        <path
          d="M2 12q7 -6 14 0t14 0t14 0t14 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity=".4"
        />
      </svg>
      <h2 className="m-0 mb-1.5 mt-3.5 text-[17px] font-semibold tracking-[-0.01em]">
        Queue is clear
      </h2>
      <p className="mx-auto my-0 max-w-[350px] text-[13px] leading-[1.55] text-ink-soft">
        Nothing needs a decision right now. When your AE submits new work, it
        lands here and you get a Slack ping with the link.
      </p>
    </div>
  );
}

/* ---------- alt state: nothing queued ---------- */

function EmptyQueued() {
  return (
    <div className={`${CARD} mt-6 px-6 py-11 text-center`}>
      <p className="mx-auto my-0 max-w-[350px] text-[13px] leading-[1.55] text-ink-soft">
        Nothing queued &mdash; approved sends land here until they go out.
      </p>
    </div>
  );
}
