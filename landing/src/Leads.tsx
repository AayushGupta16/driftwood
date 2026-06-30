import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import Fuse from "fuse.js";
import { Wordmark } from "./components/Chrome";
import { ToastProvider } from "./Dashboard";
import { GodModeButton, ImpersonationBanner } from "./GodMode";
import { CARD, relativeTime, useToast } from "./dashboard-shared";

/* /dashboard/leads — the full-width, dedicated "All leads" table. Self-contained
   page: does its own /auth/me gate (an unapproved or logged-out user is bounced
   back to /dashboard, which owns login/pending), then renders the paginated
   table that used to live inline on the dashboard. Same first-party session
   cookie as the rest of the app. */

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

type LeadRow = {
  id: string;
  name: string | null;
  company: string | null;
  title: string | null;
  email: string | null;
  linkedin_url: string | null;
  stage: string;
  origin: string;
  source: string | null;
  demo_idea: string | null;
  demo_artifact_id: string | null;
  created_at: string;
  updated_at: string;
};
type LeadsPage = {
  leads: LeadRow[];
  total: number;
  limit: number;
  offset: number;
};

export default function Leads() {
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
          // Only approved users get the table; everyone else goes back to the
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
        {user ? <LeadsView user={user} /> : <LoadingView />}
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

function LeadsView({ user }: { user: User }) {
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
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft no-underline transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span> Back to dashboard
        </a>
        <LeadsTable />
      </main>
    </>
  );
}

/* ---------- the table (GET /api/v1/dashboard/leads) ---------- */

/* We load every lead once (paged loop against the 100-cap endpoint) and do
   search + pagination client-side. Per-customer lead counts are small, so the
   upfront load is sub-second and every page flip / keystroke after it is
   instant — no per-page network round-trips. If a customer ever holds many
   thousands of leads, move the filter server-side (add a `q` param to
   `list_leads`) and this component keeps the same shape. */
const LEADS_PAGE_SIZE = 25; // rows shown per page (display only)
const FETCH_CHUNK = 100; // server-side limit cap, used for the upfront load
const FETCH_GUARD = 1000; // hard ceiling on load-all iterations

/* Fuse keys, weighted so a name/company hit outranks a title/source hit. */
const SEARCH_KEYS = [
  { name: "name", weight: 3 },
  { name: "company", weight: 2 },
  { name: "email", weight: 2 },
  { name: "title", weight: 1 },
  { name: "source", weight: 1 },
];

type LeadsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; leads: LeadRow[] };

/* Stable empty fallback so the search memos keep a steady reference pre-load. */
const NO_LEADS: LeadRow[] = [];

const STAGE_PILL =
  "inline-flex items-center rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-soft";
/* Sticky header: opaque bg so scrolling rows don't bleed through, bottom border
   travels with the cell since border-collapse drops the row border when stuck. */
const TH =
  "sticky top-0 z-10 border-b border-line bg-surface whitespace-nowrap px-3 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint";
const TD = "whitespace-nowrap px-3 py-2.5 align-middle text-ink-soft";

function leadLabel(lead: LeadRow): string {
  return lead.name || lead.email || "this lead";
}

function Dash() {
  return <span className="text-ink-faint">—</span>;
}

function LeadsTable() {
  const [state, setState] = useState<LeadsState>({ status: "loading" });
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const toast = useToast();

  // Pull every lead once via a paged loop against the 100-cap endpoint.
  // Runs on mount only; state already starts as "loading".
  const loadAll = useCallback(async () => {
    try {
      const all: LeadRow[] = [];
      for (let i = 0; i < FETCH_GUARD; i++) {
        const res = await fetch(
          `/api/v1/dashboard/leads?limit=${FETCH_CHUNK}&offset=${all.length}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("request failed");
        const pageData = (await res.json()) as LeadsPage;
        all.push(...pageData.leads);
        if (pageData.leads.length === 0 || all.length >= pageData.total) break;
      }
      setState({ status: "ready", leads: all });
    } catch {
      setState((prev) =>
        prev.status === "ready" ? prev : { status: "error" },
      );
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadAll();
    })();
  }, [loadAll]);

  async function handleRemove(lead: LeadRow) {
    const label = leadLabel(lead);
    if (
      !window.confirm(
        `Remove ${label}? They'll be deleted and added to your blacklist so we never contact them again.`,
      )
    )
      return;

    setRemovingId(lead.id);
    try {
      const res = await fetch(`/api/v1/dashboard/leads/${lead.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      toast(`Removed ${label} and added to your blacklist.`, "success");
      // Drop it from the in-memory list — no refetch. Pagination clamps below.
      setState((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              leads: prev.leads.filter((l) => l.id !== lead.id),
            }
          : prev,
      );
    } catch {
      toast(`Couldn't remove ${label}. Please try again.`, "error");
    } finally {
      setRemovingId(null);
    }
  }

  const allLeads = useMemo(
    () => (state.status === "ready" ? state.leads : NO_LEADS),
    [state],
  );
  const allCount = allLeads.length;

  // useDeferredValue keeps typing snappy: the input updates immediately while
  // the (cheap, but non-blocking) Fuse pass runs against the deferred value.
  const deferredQuery = useDeferredValue(query);
  const trimmed = deferredQuery.trim();

  const fuse = useMemo(
    () =>
      new Fuse(allLeads, {
        // 0.4 tolerates real typos ("Pizzza", "Joes Piza") and partial terms
        // without the false positives that creep in around 0.5+. ignoreLocation
        // so a match anywhere in the field counts (these aren't line-anchored).
        keys: SEARCH_KEYS,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [allLeads],
  );

  const filtered = useMemo(() => {
    if (!trimmed) return allLeads;
    return fuse.search(trimmed).map((r) => r.item);
  }, [fuse, trimmed, allLeads]);

  // A new search resets to the first page — handled in the input's onChange
  // (below) rather than an effect, so we don't trigger a cascading render.
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const startIdx = safePage * LEADS_PAGE_SIZE;
  const visible = filtered.slice(startIdx, startIdx + LEADS_PAGE_SIZE);
  const start = total === 0 ? 0 : startIdx + 1;
  const end = Math.min(startIdx + LEADS_PAGE_SIZE, total);

  return (
    <>
      <div className="mt-5 flex items-end justify-between gap-3">
        <h1 className="m-0 text-[clamp(1.7rem,3.6vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
          All leads
        </h1>
        {allCount > 0 && (
          <span className="shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-faint tabular-nums">
            {allCount.toLocaleString()} total
          </span>
        )}
      </div>

      <div className={`mt-5 ${CARD} p-5 sm:p-6`}>
        {state.status === "loading" && (
          <div className="flex items-center justify-center py-16">
            <span
              className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
              role="status"
              aria-label="Loading leads"
            />
          </div>
        )}

        {state.status === "error" && (
          <p className="m-0 text-[14px] font-medium text-red-700" role="alert">
            Couldn&rsquo;t load your leads. Please refresh.
          </p>
        )}

        {state.status === "ready" &&
          (allCount === 0 ? (
            <p className="m-0 text-[13px] leading-relaxed text-ink-soft">
              No leads yet.
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="m17 17-3.2-3.2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(0); // jump back to page 1 of the new results
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setQuery("");
                        setPage(0);
                      }
                    }}
                    placeholder="Search by name, company, email, title…"
                    aria-label="Search leads"
                    className="w-full rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-tide"
                  />
                </div>
                {trimmed && (
                  <span className="shrink-0 text-[12.5px] text-ink-faint tabular-nums">
                    {total.toLocaleString()} {total === 1 ? "match" : "matches"}
                  </span>
                )}
              </div>

              {total === 0 ? (
                <p className="m-0 py-6 text-[13px] leading-relaxed text-ink-soft">
                  No leads match &ldquo;{trimmed}&rdquo;.
                </p>
              ) : (
                <>
                  <div className="max-h-[70vh] overflow-auto rounded-lg">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr>
                          <th className={TH}>Name</th>
                          <th className={TH}>Company</th>
                          <th className={TH}>Title</th>
                          <th className={TH}>Email</th>
                          <th className={TH}>LinkedIn</th>
                          <th className={TH}>Stage</th>
                          <th className={TH}>Source</th>
                          <th className={TH}>Demo</th>
                          <th className={TH}>Added</th>
                          <th className={`${TH} text-right`}>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((lead) => {
                          const added = relativeTime(lead.created_at);
                          const removing = removingId === lead.id;
                          return (
                            <tr
                              key={lead.id}
                              className="border-b border-line/70"
                            >
                              <td className={`${TD} font-medium text-ink`}>
                                {lead.name || <Dash />}
                              </td>
                              <td className={TD}>{lead.company || <Dash />}</td>
                              <td className={TD}>{lead.title || <Dash />}</td>
                              <td className={TD}>{lead.email || <Dash />}</td>
                              <td className={TD}>
                                {lead.linkedin_url ? (
                                  <a
                                    href={lead.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-tide no-underline hover:underline"
                                  >
                                    Profile
                                  </a>
                                ) : (
                                  <Dash />
                                )}
                              </td>
                              <td className={TD}>
                                <span className={STAGE_PILL}>{lead.stage}</span>
                              </td>
                              <td className={TD}>{lead.source || <Dash />}</td>
                              <td className={TD}>
                                {lead.demo_artifact_id ? (
                                  <span className={STAGE_PILL}>Demo</span>
                                ) : (
                                  <Dash />
                                )}
                              </td>
                              <td className={`${TD} tabular-nums`}>
                                {added || <Dash />}
                              </td>
                              <td className={`${TD} text-right`}>
                                <button
                                  type="button"
                                  onClick={() => handleRemove(lead)}
                                  disabled={removing}
                                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-red-600/40 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {removing && (
                                    <span
                                      aria-hidden="true"
                                      className="size-3.5 animate-spin rounded-full border-[1.5px] border-red-600/30 border-t-red-600"
                                    />
                                  )}
                                  {removing ? "Removing…" : "Remove"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-ink-faint tabular-nums">
                      Showing {start.toLocaleString()}–{end.toLocaleString()} of{" "}
                      {total.toLocaleString()}
                      {trimmed ? " matching" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage(Math.max(0, safePage - 1))}
                        disabled={safePage === 0}
                        className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPage(Math.min(pageCount - 1, safePage + 1))
                        }
                        disabled={safePage >= pageCount - 1}
                        className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ))}
      </div>
    </>
  );
}
