import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "./components/Chrome";
import { ToastProvider } from "./Dashboard";
import { GodModeButton, ImpersonationBanner } from "./GodMode";
import { CARD, useToast } from "./dashboard-shared";

/* /dashboard/review — the founder's review queue: one flat chronological list
   of decisions the AE is waiting on (oldest first), per the signed-off draft
   in site/design/review-queue.html, plus kind-filter chips so one send type
   (e.g. connection requests) can be isolated and bulk-approved. Mobile-first:
   the usual entry point is a Slack magic link tapped on a phone, so the base
   layout IS the ~640px single column with 44px touch targets; ≥700px only
   adds air and right-aligns actions.

   Auth: a `?token=` magic link is exchanged for the normal session cookie
   via POST /api/v1/dashboard/reviews/token-login BEFORE the /auth/me gate,
   then scrubbed from the URL. A bad token simply falls through to the gate,
   which bounces to /dashboard like the other dashboard pages. */

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
  kind: string; // "message" | "connection_request"
  queued: number;
  sent_24h: number;
  cap: number;
  runs_through: string | null; // ISO date; null when nothing is queued
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
  kind: string; // "send_message" | "send_connection" | "bug_validation"
  title: string;
  body: string;
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
      // Magic-link entry: exchange ?token= for the session cookie FIRST, then
      // strip the param from the URL so it never lingers in history/shares.
      // Token failure is silent — the /auth/me gate below decides where we land.
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        try {
          await fetch("/api/v1/dashboard/reviews/token-login", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        } catch {
          // fall through to the normal session gate
        }
        params.delete("token");
        const qs = params.toString();
        window.history.replaceState(
          null,
          "",
          window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
        );
      }
      if (cancelled) return;
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const u = (await res.json()) as User;
          if (cancelled) return;
          // Only approved users get the queue; everyone else goes back to the
          // dashboard, which handles login + the pending-approval state.
          if (u.is_approved) setUser(u);
          else window.location.href = "/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      } catch {
        if (!cancelled) window.location.href = "/dashboard";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ToastProvider>
      <div className="grain relative flex min-h-screen flex-col overflow-x-clip">
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

  async function handleLogout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/dashboard";
    }
  }

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 shadow-[0_10px_28px_-24px_rgba(22,24,29,0.5)] backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
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
              onClick={handleLogout}
              className="cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-[110px] pt-5 min-[700px]:px-8 min-[700px]:pb-[120px] min-[700px]:pt-11">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft no-underline transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span> Back to dashboard
        </a>
        <ReviewQueue />
      </main>
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
  | { status: "ready"; items: ReviewItemRow[]; stats: QueueStats[] };

type DecideError = { message: string; itemId: string | null };

const EMPTY_SET: ReadonlySet<string> = new Set();

const DECIDE_FALLBACK = "Couldn't submit that decision. Please try again.";

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
  if (kind === "bug_validation") return "bug";
  return kind;
}

/* Chip order — connections first (the kind that piles up and gets
   bulk-cleared), then messages, then bugs; unknown kinds trail in
   queue order. */
const KIND_ORDER = ["send_connection", "send_message", "bug_validation"];

function kindRank(kind: string): number {
  const i = KIND_ORDER.indexOf(kind);
  return i === -1 ? KIND_ORDER.length : i;
}

/* Pull the human-readable error out of the backend's envelope
   ({"error": {"code", "detail"}}) — e.g. the 409 linkedin_not_connected
   message — falling back to a generic line. */
async function readDecideError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { code?: string; detail?: unknown };
    };
    const detail = data.error?.detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    // non-JSON body — use the fallback
  }
  return DECIDE_FALLBACK;
}

function summarizeDecide(r: DecideResult): string {
  const parts: string[] = [];
  if (r.approved) parts.push(`${r.approved} approved`);
  if (r.denied) parts.push(`${r.denied} denied`);
  if (r.skipped.length) parts.push(`${r.skipped.length} already decided`);
  const head = parts.join(" · ") || "Nothing to decide";
  return r.queued.length ? `${head} — ${r.queued.join("; ")}.` : `${head}.`;
}

function ReviewQueue() {
  const [state, setState] = useState<QueueState>({ status: "loading" });
  const [selected, setSelected] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [deny, setDeny] = useState<{ id: string; reason: string } | null>(null);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [decideError, setDecideError] = useState<DecideError | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [kindFilter, setKindFilter] = useState<string | null>(null);
  const toast = useToast();

  /* An armed "Approve all" disarms itself after a beat — no stale confirm
     button waiting to be fat-fingered minutes later. */
  useEffect(() => {
    if (!confirmAll) return;
    const t = window.setTimeout(() => setConfirmAll(false), 5000);
    return () => window.clearTimeout(t);
  }, [confirmAll]);

  const loadAll = useCallback(async () => {
    try {
      const all: ReviewItemRow[] = [];
      let stats: QueueStats[] = [];
      for (let i = 0; i < FETCH_GUARD; i++) {
        const res = await fetch(
          `/api/v1/dashboard/reviews?limit=${FETCH_CHUNK}&offset=${all.length}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("request failed");
        const page = (await res.json()) as ReviewsPageData;
        if (i === 0) stats = page.queue_stats ?? [];
        all.push(...page.pending);
        if (page.pending.length === 0 || all.length >= page.total_pending)
          break;
      }
      setState({ status: "ready", items: all, stats });
    } catch {
      setState((prev) => (prev.status === "ready" ? prev : { status: "error" }));
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadAll();
    })();
  }, [loadAll]);

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
        if (!res.ok) throw new Error(await readDecideError(res));
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

  const items = state.status === "ready" ? state.items : [];

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
    kindFilter !== null && kindCounts.has(kindFilter) ? kindFilter : null;
  const visible =
    activeKind === null
      ? items
      : items.filter((item) => item.kind === activeKind);

  const busy = busyIds.size > 0;
  const allSelected = visible.length > 0 && selected.size === visible.length;

  /* Selection resets on every filter change so a card hidden by the filter
     can never ride along into a bulk approve; the armed Approve all disarms
     for the same reason (its count just changed meaning). */
  function switchFilter(kind: string | null) {
    setKindFilter(kind);
    setSelected(EMPTY_SET);
    setConfirmAll(false);
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
      setConfirmAll(true);
      return;
    }
    setConfirmAll(false);
    void decide(
      visible.map((item) => ({ item_id: item.id, decision: "approve" as const })),
      null,
    );
  }

  return (
    <>
      <div className="mt-4 flex items-end justify-between gap-3">
        <h1 className="m-0 text-[clamp(1.65rem,6vw,2.1rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
          Review queue
        </h1>
        {state.status === "ready" && items.length > 0 && (
          <span className="mb-[5px] shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-faint tabular-nums">
            {items.length} pending
          </span>
        )}
      </div>
      <p className="m-0 mt-2 text-[13px] leading-[1.5] text-ink-soft">
        Decisions your AE is waiting on &mdash; oldest first.
      </p>

      {state.status === "ready" && <QueueStatsStrip stats={state.stats} />}

      {state.status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <span
            className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
            role="status"
            aria-label="Loading review queue"
          />
        </div>
      )}

      {state.status === "error" && (
        <p className="m-0 mt-6 text-[14px] font-medium text-red-700" role="alert">
          Couldn&rsquo;t load your review queue. Please refresh.
        </p>
      )}

      {state.status === "ready" &&
        (items.length === 0 ? (
          <EmptyQueue />
        ) : (
          <>
            {kindCounts.size > 1 && (
              <div
                role="group"
                aria-label="Filter by type"
                className="mx-0.5 mt-[18px] flex flex-wrap items-center gap-2"
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
              </div>
            )}

            <div className="mx-0.5 mb-2.5 mt-[14px] flex flex-wrap items-center gap-2.5">
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

            <div className="grid gap-3.5">
              {visible.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  checked={selected.has(item.id)}
                  busy={busyIds.has(item.id)}
                  denyReason={deny?.id === item.id ? deny.reason : null}
                  error={
                    decideError?.itemId === item.id ? decideError.message : null
                  }
                  onToggleSelect={() => toggleSelect(item.id)}
                  onApprove={() =>
                    void decide(
                      [{ item_id: item.id, decision: "approve" }],
                      item.id,
                    )
                  }
                  onToggleDeny={() =>
                    setDeny((prev) =>
                      prev?.id === item.id ? null : { id: item.id, reason: "" },
                    )
                  }
                  onReasonChange={(reason) => setDeny({ id: item.id, reason })}
                  onCancelDeny={() => setDeny(null)}
                  onConfirmDeny={() =>
                    void decide(
                      [
                        {
                          item_id: item.id,
                          decision: "deny",
                          reason: deny?.reason.trim() ?? "",
                        },
                      ],
                      item.id,
                    )
                  }
                />
              ))}
            </div>
          </>
        ))}
    </>
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
   ~Jul 20" — one line per send kind; kinds with nothing queued and nothing
   sent are noise, not news, so they're skipped (nothing at all renders when
   both are quiet). */
function QueueStatsStrip({ stats }: { stats: QueueStats[] }) {
  const live = stats.filter((s) => s.queued > 0 || s.sent_24h > 0);
  if (live.length === 0) return null;
  return (
    <div className="mt-4 grid gap-1.5 rounded-[10px] border border-line bg-paper px-3.5 py-2.5">
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
        </p>
      ))}
    </div>
  );
}

/* ---------- one review item ---------- */

function ItemCard({
  item,
  checked,
  busy,
  denyReason,
  error,
  onToggleSelect,
  onApprove,
  onToggleDeny,
  onReasonChange,
  onCancelDeny,
  onConfirmDeny,
}: {
  item: ReviewItemRow;
  checked: boolean;
  busy: boolean;
  /** null = deny box closed; string = the in-progress reason text. */
  denyReason: string | null;
  error: string | null;
  onToggleSelect: () => void;
  onApprove: () => void;
  onToggleDeny: () => void;
  onReasonChange: (reason: string) => void;
  onCancelDeny: () => void;
  onConfirmDeny: () => void;
}) {
  const isBug = item.kind === "bug_validation";
  const isSend = item.kind === "send_message" || item.kind === "send_connection";
  const denyOpen = denyReason !== null;
  // Bug items read Real / Not real, but map to the same approve/deny.
  const approveLabel = isBug ? "Real" : "Approve";
  const denyLabel = isBug ? "Not real" : "Deny";
  const evidence = isBug ? item.evidence : null;

  return (
    <article className={`${CARD} p-4 min-[700px]:px-[22px] min-[700px]:py-5`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleSelect}
          disabled={busy}
          aria-label={`Select: ${item.title}`}
          className="size-5 shrink-0 accent-tide"
        />
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
      ) : (
        <>
          <span className={`${MICROLABEL} mb-1.5 mt-[3px] block`}>
            {item.kind === "send_connection"
              ? "Connection note — sends exactly as shown"
              : "Outgoing message — sends exactly as shown"}
          </span>
          {/* the exact frozen payload — mono, primary ink, no truncation */}
          <pre className="m-0 mb-3.5 whitespace-pre-wrap break-words rounded-[10px] border border-line bg-paper px-3.5 py-[13px] font-mono text-[12.75px] leading-[1.65] text-ink">
            {item.body}
          </pre>
        </>
      )}

      {item.attachment_slug && (
        <>
          <video
            controls
            playsInline
            preload="metadata"
            src={`/d/${item.attachment_slug}`}
            className="mb-1.5 aspect-video w-full rounded-xl bg-[#101820]"
          />
          <p className="m-0 mb-3.5 font-mono text-[10.5px] text-ink-faint">
            d/{item.attachment_slug}
            {isSend && " · attached to this message"}
          </p>
        </>
      )}

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
