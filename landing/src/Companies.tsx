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
import { CARD, relativeTime } from "./dashboard-shared";

/* /dashboard/companies — the full-width, dedicated "All companies" table.
   Self-contained page: does its own /auth/me gate (an unapproved or logged-out
   user is bounced back to /dashboard, which owns login/pending), then renders
   the paginated target-account table. Same first-party session cookie as the
   rest of the app. */

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

type CompanyRow = {
  id: string;
  name: string;
  domain: string | null;
  linkedin_slug: string | null;
  icp_status: string;
  disqualify_reason: string | null;
  qa_headcount: number | null;
  employee_count: number | null;
  funding_stage: string | null;
  location: string | null;
  source: string | null;
  lead_count: number;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};
type CompaniesPage = {
  companies: CompanyRow[];
  total: number;
  limit: number;
  offset: number;
};

export default function Companies() {
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
        {user ? <CompaniesView user={user} /> : <LoadingView />}
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

function CompaniesView({ user }: { user: User }) {
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
        <CompaniesTable />
      </main>
    </>
  );
}

/* ---------- the table (GET /api/v1/dashboard/companies) ---------- */

/* Same shape as the leads table: we load the current ICP segment once (paged
   loop against the 100-cap endpoint) and do search + pagination client-side.
   The segmented All/Qualified/Unknown/Disqualified control maps to the
   endpoint's server-side `icp_status` param, so picking a segment refetches
   just that group — the server also pre-sorts qualified -> unknown ->
   disqualified so the accounts worth looking at come back first. */
const COMPANIES_PAGE_SIZE = 25; // rows shown per page (display only)
const FETCH_CHUNK = 100; // server-side limit cap, used for the upfront load
const FETCH_GUARD = 1000; // hard ceiling on load-all iterations

/* Fuse keys, weighted so a name/domain hit outranks a location/source hit. */
const SEARCH_KEYS = [
  { name: "name", weight: 3 },
  { name: "domain", weight: 2 },
  { name: "location", weight: 1 },
  { name: "source", weight: 1 },
];

/* The segmented ICP filter. "all" omits the server-side param. */
const ICP_FILTERS = ["all", "qualified", "unknown", "disqualified"] as const;
type IcpFilter = (typeof ICP_FILTERS)[number];

type CompaniesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; companies: CompanyRow[] };

/* Stable empty fallback so the search memos keep a steady reference pre-load. */
const NO_COMPANIES: CompanyRow[] = [];

/* Status chip variants: qualified pops green, disqualified reads muted-red,
   unknown stays neutral (same base pill as the leads table's stage pill). */
const CHIP_BASE =
  "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em]";
const ICP_CHIP: Record<string, string> = {
  qualified: `${CHIP_BASE} border-emerald-600/25 bg-emerald-500/10 text-emerald-700`,
  disqualified: `${CHIP_BASE} border-red-600/25 bg-red-500/5 text-red-700/80`,
  unknown: `${CHIP_BASE} border-line bg-paper text-ink-soft`,
};
/* Sticky header: opaque bg so scrolling rows don't bleed through, bottom border
   travels with the cell since border-collapse drops the row border when stuck. */
const TH =
  "sticky top-0 z-10 border-b border-line bg-surface whitespace-nowrap px-3 py-2.5 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-faint";
const TD = "whitespace-nowrap px-3 py-2.5 align-middle text-ink-soft";

function Dash() {
  return <span className="text-ink-faint">—</span>;
}

function CompaniesTable() {
  const [state, setState] = useState<CompaniesState>({ status: "loading" });
  const [filter, setFilter] = useState<IcpFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  // Pull the selected segment once via a paged loop against the 100-cap
  // endpoint. Re-runs whenever the segment changes (state resets to loading).
  const loadAll = useCallback(async (icp: IcpFilter) => {
    setState({ status: "loading" });
    try {
      const icpParam = icp === "all" ? "" : `&icp_status=${icp}`;
      const all: CompanyRow[] = [];
      for (let i = 0; i < FETCH_GUARD; i++) {
        const res = await fetch(
          `/api/v1/dashboard/companies?limit=${FETCH_CHUNK}&offset=${all.length}${icpParam}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("request failed");
        const pageData = (await res.json()) as CompaniesPage;
        all.push(...pageData.companies);
        if (pageData.companies.length === 0 || all.length >= pageData.total)
          break;
      }
      setState({ status: "ready", companies: all });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadAll(filter);
    })();
  }, [loadAll, filter]);

  const allCompanies = useMemo(
    () => (state.status === "ready" ? state.companies : NO_COMPANIES),
    [state],
  );
  const allCount = allCompanies.length;

  // useDeferredValue keeps typing snappy: the input updates immediately while
  // the (cheap, but non-blocking) Fuse pass runs against the deferred value.
  const deferredQuery = useDeferredValue(query);
  const trimmed = deferredQuery.trim();

  const fuse = useMemo(
    () =>
      new Fuse(allCompanies, {
        // 0.4 tolerates real typos ("Pizzza", "Joes Piza") and partial terms
        // without the false positives that creep in around 0.5+. ignoreLocation
        // so a match anywhere in the field counts (these aren't line-anchored).
        keys: SEARCH_KEYS,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [allCompanies],
  );

  const filtered = useMemo(() => {
    if (!trimmed) return allCompanies;
    return fuse.search(trimmed).map((r) => r.item);
  }, [fuse, trimmed, allCompanies]);

  // A new search resets to the first page — handled in the input's onChange
  // (below) rather than an effect, so we don't trigger a cascading render.
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / COMPANIES_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const startIdx = safePage * COMPANIES_PAGE_SIZE;
  const visible = filtered.slice(startIdx, startIdx + COMPANIES_PAGE_SIZE);
  const start = total === 0 ? 0 : startIdx + 1;
  const end = Math.min(startIdx + COMPANIES_PAGE_SIZE, total);

  return (
    <>
      <div className="mt-5 flex items-end justify-between gap-3">
        <h1 className="m-0 text-[clamp(1.7rem,3.6vw,2.25rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
          All companies
        </h1>
        {state.status === "ready" && allCount > 0 && (
          <span className="shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-faint tabular-nums">
            {allCount.toLocaleString()} {filter === "all" ? "total" : filter}
          </span>
        )}
      </div>

      <div className={`mt-5 ${CARD} p-5 sm:p-6`}>
        {/* Segmented ICP filter — always visible so an empty segment can still
            be switched away from. Each pick refetches from the server. */}
        <div
          className="mb-4 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter by ICP status"
        >
          {ICP_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={f === filter}
              onClick={() => {
                setFilter(f);
                setPage(0); // jump back to page 1 of the new segment
              }}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors ${
                f === filter
                  ? "border-tide/40 bg-tide-wash/60 text-ink"
                  : "border-line bg-surface text-ink-soft hover:border-ink-faint/50 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {state.status === "loading" && (
          <div className="flex items-center justify-center py-16">
            <span
              className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
              role="status"
              aria-label="Loading companies"
            />
          </div>
        )}

        {state.status === "error" && (
          <p className="m-0 text-[14px] font-medium text-red-700" role="alert">
            Couldn&rsquo;t load your companies. Please refresh.
          </p>
        )}

        {state.status === "ready" &&
          (allCount === 0 ? (
            <p className="m-0 text-[13px] leading-relaxed text-ink-soft">
              {filter === "all"
                ? "No companies yet."
                : `No ${filter} companies.`}
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
                    placeholder="Search by name, domain, location…"
                    aria-label="Search companies"
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
                  No companies match &ldquo;{trimmed}&rdquo;.
                </p>
              ) : (
                <>
                  <div className="max-h-[70vh] overflow-auto rounded-lg">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr>
                          <th className={TH}>Name</th>
                          <th className={TH}>ICP status</th>
                          <th className={TH}>Employees</th>
                          <th className={TH}>Funding stage</th>
                          <th className={TH}>QA headcount</th>
                          <th className={TH}>Leads</th>
                          <th className={TH}>Last verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((company) => {
                          const verified = relativeTime(
                            company.last_verified_at,
                          );
                          return (
                            <tr
                              key={company.id}
                              className="border-b border-line/70"
                            >
                              <td className={TD}>
                                <span className="block font-medium text-ink">
                                  {company.name}
                                </span>
                                {company.domain && (
                                  <span className="block font-mono text-[11px] text-ink-faint">
                                    {company.domain}
                                  </span>
                                )}
                              </td>
                              <td className={TD}>
                                <span
                                  className={
                                    ICP_CHIP[company.icp_status] ??
                                    ICP_CHIP.unknown
                                  }
                                  // Surface the why on disqualified accounts.
                                  title={
                                    company.disqualify_reason ?? undefined
                                  }
                                >
                                  {company.icp_status}
                                </span>
                              </td>
                              <td className={`${TD} tabular-nums`}>
                                {company.employee_count !== null ? (
                                  company.employee_count.toLocaleString()
                                ) : (
                                  <Dash />
                                )}
                              </td>
                              <td className={TD}>
                                {company.funding_stage || <Dash />}
                              </td>
                              <td className={`${TD} tabular-nums`}>
                                {company.qa_headcount !== null ? (
                                  company.qa_headcount.toLocaleString()
                                ) : (
                                  <Dash />
                                )}
                              </td>
                              <td className={`${TD} tabular-nums`}>
                                {company.lead_count.toLocaleString()}
                              </td>
                              <td className={`${TD} tabular-nums`}>
                                {verified || <Dash />}
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
