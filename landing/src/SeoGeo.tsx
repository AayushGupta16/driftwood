import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "./components/Chrome";
import { LoggedOutView, ToastProvider } from "./Dashboard";
import { GodModeButton, ImpersonationBanner } from "./GodMode";
import seoQuerysetJson from "./seo-geo/queryset-seo.json";
import geoQuerysetJson from "./seo-geo/queryset-geo.json";

/* /dashboard/seo-geo — admin-only SEO/GEO metrics page, ported from
   design/draft-godmode-seo-geo.html (rev 4). Ground truth first (PostHog
   views + demos per channel), then the probe hit rates as leading
   indicators, one combined trend chart, per-tier query tables, and the two
   leaderboards. Data comes from GET /api/v1/admin/probes/dashboard with the
   first-party session cookie (same pattern as GodMode.tsx); when the
   endpoint has nothing yet (404 / error / no runs) the page renders the
   run-zero state from the bundled canonical querysets — that is the launch
   state, so it has to stand on its own. Nuances live in title tooltips per
   the draft's tooltip contract; no chart library, inline SVG only. */

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
  | { status: "denied" }
  | { status: "ok"; user: User };

/* ---------- payload types (GET /api/v1/admin/probes/dashboard) ---------- */

type ProbeResultRow = {
  n?: number;
  tier?: number;
  q: string;
  hit: boolean | null;
  position?: number | null;
  top_domains?: string[];
  competitors?: string[];
  score?: number | null;
  mention_rank?: number | null;
};
type ProbeLatest = {
  run_at?: string | null;
  set_version?: string;
  tool?: string;
  tier1_hits?: number;
  tier1_total?: number;
  tier1_score?: number;
  total_hits?: number;
  total?: number;
  results?: ProbeResultRow[];
};
type HistoryPoint = {
  date?: string;
  run_at?: string;
  tier1_rate?: number;
  tier1_score?: number;
  tier1_hits?: number;
  tier1_total?: number;
};
type ChannelPayload = { latest?: ProbeLatest | null; history?: HistoryPoint[] };
type WowPair = { views?: number | null; demos?: number | null };
type GtSide = { views?: number; demos?: number; wow?: WowPair | null };
type ProbesPayload = {
  ground_truth?: {
    date?: string | null;
    seo?: GtSide;
    geo?: GtSide;
    total?: { views?: number; demos?: number };
    gsc?: { clicks?: number; impressions?: number; note?: string } | null;
  } | null;
  seo?: ChannelPayload | null;
  geo?: ChannelPayload | null;
};

type DataState =
  | { status: "loading" }
  | { status: "ready"; payload: ProbesPayload | null };

/* ---------- bundled canonical querysets (run-zero rows) ---------- */

type Queryset = {
  version: string;
  tiers: Record<string, string>;
  queries: { n: number; tier: number; q: string }[];
};
const SEO_SET = seoQuerysetJson as Queryset;
const GEO_SET = geoQuerysetJson as Queryset;

/* ---------- grading bands (Aayush 2026-07-21) ----------
   Functional status colors (like ok-green / error-red), not accents — page
   local on purpose, they never leave this page's chrome. */
const BANDS = [
  { min: 0, label: "below minimum", short: "below min", color: "#c03a31", wash: "rgba(192,58,49,.09)" },
  { min: 20, label: "bare minimum", short: "bare min", color: "#c26a17", wash: "rgba(194,106,23,.09)" },
  { min: 40, label: "fine", short: "fine", color: "#a8871c", wash: "rgba(168,135,28,.09)" },
  { min: 60, label: "great", short: "great", color: "#2a9d5c", wash: "rgba(42,157,92,.09)" },
  { min: 80, label: "amazing", short: "amazing", color: "#1c7a44", wash: "rgba(28,122,68,.09)" },
];
const BANDS_TIP =
  "bands: under 20 below minimum · 20 bare minimum · 40 fine · 60 great · 80+ amazing.";

function bandFor(rate: number) {
  let band = BANDS[0];
  for (const b of BANDS) if (rate >= b.min) band = b;
  return band;
}

/* ---------- view model ---------- */

type RowStatus = "hit" | "miss" | "pend";
type Row = {
  n: number;
  tier: number;
  q: string;
  status: RowStatus;
  position: number | null;
  score: number | null;
  mentionRank: number | null;
  topDomains: string[];
  competitors: string[];
};
type TierModel = {
  tier: number;
  name: string;
  desc: string;
  rows: Row[];
  hits: number;
  probed: number;
};
type ChannelModel = {
  setVersion: string;
  tool: string | null;
  runDate: string | null;
  rows: Row[];
  tiers: TierModel[];
  tier1Hits: number;
  tier1Total: number;
  tier1Score: number;
  totalHits: number;
  probed: number;
  history: HistoryPoint[];
};

const TIER_NAMES: Record<number, string> = {
  1: "Tier 1 · must-win",
  2: "Tier 2 · near-term",
  3: "Tier 3 · long-term",
};

/* The bundled queryset is the row list; probe results join onto it by exact
   query string (older sets are strict subsets of the current one, so rows
   that were never probed fall out as "pending", never as misses). */
function buildChannel(set: Queryset, payload: ChannelPayload | null | undefined): ChannelModel {
  const byQ = new Map<string, ProbeResultRow>();
  for (const r of payload?.latest?.results ?? []) byQ.set(r.q, r);

  const rows: Row[] = set.queries.map((s) => {
    const r = byQ.get(s.q);
    return {
      n: s.n,
      tier: s.tier,
      q: s.q,
      status: r == null || r.hit == null ? "pend" : r.hit ? "hit" : "miss",
      position: r?.position ?? null,
      score: r?.score ?? null,
      mentionRank: r?.mention_rank ?? null,
      topDomains: r?.top_domains ?? [],
      competitors: r?.competitors ?? [],
    };
  });

  const tierNums = [...new Set(rows.map((r) => r.tier))].sort((a, b) => a - b);
  const tiers: TierModel[] = tierNums.map((t) => {
    const tRows = rows.filter((r) => r.tier === t);
    return {
      tier: t,
      name: TIER_NAMES[t] ?? `Tier ${t}`,
      desc: set.tiers[String(t)] ?? "",
      rows: tRows,
      hits: tRows.filter((r) => r.status === "hit").length,
      probed: tRows.filter((r) => r.status !== "pend").length,
    };
  });
  const tier1 = tiers.find((t) => t.tier === 1);

  return {
    setVersion: set.version,
    tool: payload?.latest?.tool ?? null,
    runDate: payload?.latest?.run_at ?? null,
    rows,
    tiers,
    tier1Hits: tier1?.hits ?? 0,
    tier1Total: tier1?.rows.length ?? 0,
    tier1Score: payload?.latest?.tier1_score ?? 0,
    totalHits: rows.filter((r) => r.status === "hit").length,
    probed: rows.filter((r) => r.status !== "pend").length,
    history: payload && Array.isArray(payload.history) ? payload.history : [],
  };
}

/* GSC stays a hand-pulled cross-check until the API credential exists; when
   the endpoint has nothing at all we show the last manual pull's constants
   (the draft's values) instead of hiding the footnote. */
const FALLBACK_GSC = {
  clicks: 0,
  impressions: 4,
  note: "Google Search Console cross-check, window Jul 14 to Jul 19, pulled Jul 21 · avg position 2.3 · manual pull until the GSC API credential exists",
};

function buildGroundTruth(payload: ProbesPayload | null) {
  const gt = payload?.ground_truth;
  const side = (s: GtSide | undefined) => ({
    views: s?.views ?? 0,
    demos: s?.demos ?? 0,
    wowViews: s?.wow?.views ?? 0,
    wowDemos: s?.wow?.demos ?? 0,
  });
  return {
    date: gt?.date ?? null,
    seo: side(gt?.seo),
    geo: side(gt?.geo),
    total: { views: gt?.total?.views ?? 0, demos: gt?.total?.demos ?? 0 },
    gsc: payload ? (gt?.gsc ?? null) : FALLBACK_GSC,
  };
}

/* ---------- date helpers (UTC, artifacts carry plain dates) ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDay(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
}

function fmtDay(day: number): string {
  const d = new Date(day * 86400000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function fmtShort(iso: string | null | undefined): string | null {
  const day = parseDay(iso);
  return day == null ? null : fmtDay(day);
}

function fmtLong(iso: string | null | undefined): string | null {
  const day = parseDay(iso);
  if (day == null) return null;
  const d = new Date(day * 86400000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/* ---------- page shell ---------- */

export default function SeoGeo() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const user = (await res.json()) as User;
          if (cancelled) return;
          // Admin-only page: everyone else gets the logged-out card.
          setAuth(user.is_admin ? { status: "ok", user } : { status: "denied" });
        } else {
          setAuth({ status: "denied" });
        }
      } catch {
        if (!cancelled) setAuth({ status: "denied" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col overflow-x-clip">
        {auth.status === "loading" && <LoadingView />}
        {auth.status === "denied" && <LoggedOutView />}
        {auth.status === "ok" && <SeoGeoView user={auth.user} />}
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

function SeoGeoView({ user }: { user: User }) {
  const displayName = user.name || user.email;
  const [data, setData] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let payload: ProbesPayload | null = null;
      try {
        const res = await fetch("/api/v1/admin/probes/dashboard", {
          credentials: "include",
        });
        if (res.ok) {
          const parsed = (await res.json()) as ProbesPayload;
          if (parsed && typeof parsed === "object") payload = parsed;
        }
      } catch {
        // No data yet (endpoint missing or down) — the run-zero state below
        // is the launch state, not an error page.
      }
      if (!cancelled) setData({ status: "ready", payload });
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
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
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
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide text-[13px] font-semibold text-white">
                {displayName[0]?.toUpperCase()}
              </span>
            )}
            <span className="hidden text-[14px] font-medium text-ink sm:inline">
              {displayName}
            </span>
            <GodModeButton />
            <a
              href="/dashboard/seo-geo"
              aria-current="page"
              className="inline-flex items-center rounded-full border border-tide bg-tide-wash px-3.5 py-2 text-[13.5px] font-medium text-tide no-underline"
            >
              SEO / GEO
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-14 pt-10 sm:px-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft no-underline transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span> Back to dashboard
        </a>
        <h1 className="m-0 mt-5 text-[clamp(1.7rem,3.6vw,2.2rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
          Search visibility
        </h1>
        {data.status === "loading" ? (
          <div className="flex items-center justify-center py-24">
            <span
              className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
              role="status"
              aria-label="Loading metrics"
            />
          </div>
        ) : (
          <Metrics payload={data.payload} />
        )}
      </main>
    </>
  );
}

/* ---------- the metrics body ---------- */

const CARD_SM = "rounded-xl border border-line bg-surface shadow-win-sm";
const COLS = "grid grid-cols-1 items-start gap-3.5 min-[920px]:grid-cols-2";

function Metrics({ payload }: { payload: ProbesPayload | null }) {
  const seo = buildChannel(SEO_SET, payload?.seo);
  const geo = buildChannel(GEO_SET, payload?.geo);
  const gt = buildGroundTruth(payload);
  const noRuns =
    !seo.runDate && !geo.runDate && seo.history.length === 0 && geo.history.length === 0;

  const lastDay = Math.max(
    parseDay(gt.date) ?? -1,
    parseDay(seo.runDate) ?? -1,
    parseDay(geo.runDate) ?? -1,
  );

  return (
    <>
      {noRuns && (
        <p className="m-0 mt-2 text-[12px] text-ink-faint">
          no data yet - first scheduled run at midnight PT
        </p>
      )}

      <GroundTruthStrip gt={gt} />

      <div
        className="mx-0.5 mt-[30px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint"
        title="Probe hit rates predict the ground truth above; they are the levers, not the goal."
      >
        Leading indicators · probe hit rates
      </div>

      <div className={`mt-3 ${COLS}`}>
        <div className="flex min-w-0 flex-col gap-3.5">
          <Hero
            ch={seo}
            label="SEO · Google"
            labelTitle={`Position-weighted tier-1 score: each keyword scores 1.0 at rank #1, 0.7 at #2-3, 0.4 at #4-10, 0 when absent; the headline is the tier-1 average. Source: ${seo.tool ?? "search probe"}; GSC above is the cross-check. ${seo.probed} of the ${seo.rows.length} ${seo.setVersion} keywords probed; unprobed keywords are pending, not misses.`}
            unit="keywords"
          />
          <TiersCard ch={seo} unitCap="Keywords" />
        </div>
        <div className="flex min-w-0 flex-col gap-3.5">
          <Hero
            ch={geo}
            label="GEO · AI answers"
            labelTitle={`Rank-weighted tier-1 score: each panel engine's answer scores 1.0 when it names us first (mention rank 1), 0.8 at rank 2, 0.6 further down, 0 when it doesn't name us; a query is the panel average and the headline is the tier-1 average. Panel: ${geo.tool ?? "answer probe"}; results are only comparable within one runner tool. ${geo.probed} of the ${geo.rows.length} ${geo.setVersion} queries probed; unprobed queries are pending, not misses.`}
            unit="queries"
          />
          <TiersCard ch={geo} unitCap="Queries" />
        </div>
      </div>

      <TrendChart seo={seo.history} geo={geo.history} />

      <div className={`mt-3.5 ${COLS}`}>
        <div className="flex min-w-0 flex-col gap-3.5">
          <SeoLeaderboard ch={seo} />
          <div
            className={`${CARD_SM} px-[18px] py-4`}
            title="Count reads from the BACKLINKS.md registry once it lands; 0 until then."
          >
            <div className="text-[0.85rem] text-ink-soft">
              Backlinks
              <span className="ml-2 inline-flex rounded-full border border-line bg-surface px-2 py-px align-[2px] text-[10.5px] text-ink-faint">
                registry pending
              </span>
            </div>
            <div className="mt-3 tabular-nums">
              <div className="text-[22px] font-semibold leading-none tracking-[-0.02em]">0</div>
              <div className="mt-1 text-[11px] text-ink-faint">in registry</div>
            </div>
          </div>
        </div>
        <GeoLeaderboard ch={geo} />
      </div>

      <div className="mt-9 border-t border-line pt-3.5">
        <p
          className="m-0 text-[12px] text-ink-faint tabular-nums"
          title="Probes run automatically every day at midnight Pacific; this page reads the latest published run."
        >
          {lastDay >= 0 ? `last updated ${fmtLong(new Date(lastDay * 86400000).toISOString())}` : "no runs yet"}
        </p>
      </div>
    </>
  );
}

/* ---------- ground truth strip (the north star) ---------- */

function GroundTruthStrip({ gt }: { gt: ReturnType<typeof buildGroundTruth> }) {
  const dateSuffix = fmtShort(gt.date);
  return (
    <>
      <div className="mt-[18px] flex items-baseline justify-between gap-3 px-0.5">
        <span
          className="text-[0.85rem] font-semibold text-ink"
          title="North star: how many views and demos each channel drives. Sessions are PostHog event-derived; posthog-js drops headless and bot traffic client-side, so these counts are human-biased by design. Attribution rule: the session's referring domain decides the channel — anything from an AI-assistant domain is GEO, search-engine domains are SEO."
        >
          Ground truth
        </span>
        <span
          className="text-[11.5px] text-ink-faint tabular-nums"
          title="all channels combined, all referrers included; subordinate to the per-channel numbers"
        >
          all channels: {gt.total.views} views · {gt.total.demos} demos · PostHog
          {dateSuffix ? ` · ${dateSuffix}` : ""}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-1 items-stretch gap-3.5 min-[920px]:grid-cols-2">
        <GtCard
          label="SEO"
          labelTitle="Attribution rule: the session's referring domain decides the channel — search-engine domains (google, bing) are SEO."
          src="search referrers"
        >
          <GtStat
            label="Views"
            value={gt.seo.views}
            title="Views: PostHog sessions whose $referring_domain is a search engine — google, bing. Referrer domain decides the channel: search-engine domains count as SEO."
            footnote={
              gt.gsc
                ? `GSC cross-check: ${gt.gsc.clicks ?? 0} clicks · ${gt.gsc.impressions ?? 0} impressions, manual pull`
                : undefined
            }
            footnoteTitle={gt.gsc?.note}
            delta={gt.seo.wowViews}
            deltaTitle="week over week; PostHog live since Jul 15"
          />
          <GtStat
            label="Demos booked"
            value={gt.seo.demos}
            title="booking_confirmed events attributed to search referrers by the session's referring domain"
            delta={gt.seo.wowDemos}
            deltaTitle="week over week"
          />
        </GtCard>
        <GtCard
          label="GEO"
          labelTitle="Attribution rule: the session's referring domain decides the channel — anything from an AI-assistant domain is GEO."
          src="AI referrers"
        >
          <GtStat
            label="Views"
            value={gt.geo.views}
            title="Views: PostHog sessions whose $referring_domain is an AI assistant — chatgpt.com · chat.openai.com · perplexity.ai · claude.ai · gemini.google.com · copilot.microsoft.com. Referrer domain decides the channel: anything from an AI-assistant domain counts as GEO."
            delta={gt.geo.wowViews}
            deltaTitle="week over week; PostHog live since Jul 15"
          />
          <GtStat
            label="Demos booked"
            value={gt.geo.demos}
            title="booking_confirmed events attributed to AI referrers by the session's referring domain"
            delta={gt.geo.wowDemos}
            deltaTitle="week over week"
          />
        </GtCard>
      </div>
    </>
  );
}

function GtCard({
  label,
  labelTitle,
  src,
  children,
}: {
  label: string;
  labelTitle: string;
  src: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-[#d9dee3] border-t-2 border-t-ink bg-surface px-5 pb-3.5 pt-4 shadow-win">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.85rem] font-semibold text-ink" title={labelTitle}>
          {label}
        </span>
        <span className="text-[11.5px] text-ink-faint">{src}</span>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-2 gap-5 tabular-nums">{children}</div>
    </div>
  );
}

function GtStat({
  label,
  value,
  title,
  footnote,
  footnoteTitle,
  delta,
  deltaTitle,
}: {
  label: string;
  value: number;
  title: string;
  footnote?: string;
  footnoteTitle?: string;
  delta: number;
  deltaTitle: string;
}) {
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  const deltaText =
    delta > 0 ? `+${delta} vs last week` : delta < 0 ? `${delta} vs last week` : "±0 vs last week";
  return (
    <div
      className="flex min-w-0 flex-col border-l border-line pl-5 first:border-l-0 first:pl-0"
      title={title}
    >
      <div className="text-[11.5px] font-semibold text-ink-soft">{label}</div>
      <div className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.025em]">
        {value.toLocaleString()}
      </div>
      {footnote && (
        <div className="mt-[7px] text-[10.5px] text-ink-faint" title={footnoteTitle}>
          {footnote}
        </div>
      )}
      <div className="mt-auto pt-2 text-[11px] text-ink-faint" title={deltaTitle}>
        <span aria-hidden="true" className="mr-1 inline-block">
          {arrow}
        </span>
        {deltaText}
      </div>
    </div>
  );
}

/* ---------- hero scorecard + band scale ---------- */

function Hero({
  ch,
  label,
  labelTitle,
  unit,
}: {
  ch: ChannelModel;
  label: string;
  labelTitle: string;
  unit: string;
}) {
  const rate = Math.round(ch.tier1Score);
  const band = bandFor(rate);
  const next = BANDS.map((b) => b.min).find((t) => t > rate);
  const scaleTitle =
    BANDS_TIP + (next != null ? ` Next milestone: ${next}%.` : "");

  return (
    <div className={`${CARD_SM} px-5 py-[18px]`}>
      <div className="text-[0.85rem] text-ink-soft" title={labelTitle}>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span
          className="text-[48px] font-semibold leading-none tracking-[-0.025em] tabular-nums"
          style={{ color: band.color }}
        >
          {rate}%
        </span>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-semibold"
          style={{ color: band.color, background: band.wash }}
        >
          {band.label}
        </span>
      </div>
      <p className="m-0 mt-[9px] text-[12.5px] text-ink-soft tabular-nums">
        {ch.tier1Hits} / {ch.tier1Total} tier-1 {unit} hit ·{" "}
        {fmtShort(ch.runDate) ?? "no runs yet"}
      </p>
      <div
        className="mt-3.5"
        role="img"
        aria-label={`Grading scale 0 to 100 percent, currently ${rate}`}
        title={scaleTitle}
      >
        <div className="relative flex h-[22px] overflow-hidden rounded-md border border-line">
          {BANDS.map((b) => (
            <span
              key={b.min}
              className="flex flex-1 items-center justify-center whitespace-nowrap text-[9px] font-semibold"
              style={{ color: b.color, background: b.wash }}
            >
              {b.short}
            </span>
          ))}
          <span
            className="absolute bottom-0 top-0 w-[3px] rounded-r-sm bg-ink"
            style={{ left: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-ink-faint tabular-nums">
          <span>0</span>
          <span>20</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- per-tier breakdown, Leads.tsx table density ---------- */

function Dot({ status, className = "" }: { status: RowStatus; className?: string }) {
  if (status === "pend")
    return (
      <span
        className={`inline-block size-1.5 rounded-full border-[1.5px] border-ink-faint align-middle ${className}`}
      />
    );
  if (status === "hit")
    return <span className={`inline-block size-[7px] rounded-full bg-ok align-middle ${className}`} />;
  return (
    <span
      className={`inline-block size-[7px] rounded-full align-middle ${className}`}
      style={{ background: BANDS[0].color }}
    />
  );
}

function rowTitle(row: Row): string {
  if (row.status === "pend") return "pending first run";
  const parts = [row.status === "hit" ? "hit" : "miss"];
  if (row.position != null) parts.push(`position ${row.position}`);
  if (row.mentionRank != null) parts.push(`mention rank ${row.mentionRank}`);
  if (row.score != null) parts.push(`score ${row.score}`);
  if (row.status === "miss" && row.topDomains.length)
    parts.push(`top: ${row.topDomains.join(" · ")}`);
  return parts.join(" · ");
}

function TiersCard({ ch, unitCap }: { ch: ChannelModel; unitCap: string }) {
  return (
    <div className={`${CARD_SM} pb-1 pt-3.5`}>
      <div className="flex items-baseline justify-between gap-3 px-[18px] pb-2.5">
        <span className="text-[0.85rem] text-ink-soft tabular-nums">
          {unitCap} · set {ch.setVersion} · {ch.rows.length}
        </span>
        <span className="flex items-center gap-3 text-[11.5px] text-ink-faint">
          <span>
            <Dot status="hit" className="mr-1" />
            hit
          </span>
          <span>
            <Dot status="miss" className="mr-1" />
            miss
          </span>
          <span>
            <Dot status="pend" className="mr-1" />
            pending
          </span>
        </span>
      </div>
      {ch.tiers.map((t) => (
        <TierDetails key={t.tier} tier={t} />
      ))}
    </div>
  );
}

function TierDetails({ tier }: { tier: TierModel }) {
  const pending = tier.rows.length - tier.probed;
  const pct = tier.rows.length > 0 ? (tier.hits / tier.rows.length) * 100 : 0;
  return (
    <details className="group border-t border-line">
      <summary
        className="flex cursor-pointer list-none items-center gap-2.5 px-[18px] py-[9px] hover:bg-sand [&::-webkit-details-marker]:hidden"
        title={`${tier.desc} · ${tier.probed} probed, ${pending} pending first run`}
      >
        <span
          aria-hidden="true"
          className="flex-none text-[9px] text-ink-faint transition-transform group-open:rotate-90"
        >
          ▶
        </span>
        <span className="whitespace-nowrap text-[13px] font-semibold">{tier.name}</span>
        <span className="ml-auto h-1.5 w-24 flex-none overflow-hidden rounded-full bg-sand">
          <span className="block h-full rounded-full bg-tide" style={{ width: `${pct}%` }} />
        </span>
        <span className="whitespace-nowrap text-[12.5px] font-semibold tabular-nums">
          {tier.hits} / {tier.rows.length}
        </span>
        <span className="whitespace-nowrap text-[11px] text-ink-faint tabular-nums">
          {tier.probed} probed
        </span>
      </summary>
      <table className="w-full border-collapse">
        <tbody>
          {tier.rows.map((row) => (
            <tr key={row.n} title={rowTitle(row)} className="hover:bg-sand">
              <td className="w-[34px] border-t border-line/60 py-[5.5px] pl-5 pr-0 align-middle">
                <Dot status={row.status} />
              </td>
              <td className="w-6 border-t border-line/60 py-[5.5px] pr-2.5 text-right align-middle text-[11px] text-ink-faint tabular-nums">
                {row.n}
              </td>
              <td
                className={`border-t border-line/60 py-[5.5px] pl-2 pr-[18px] align-middle text-[12.5px] leading-[1.35] ${
                  row.status === "pend" ? "text-ink-soft" : "text-ink"
                }`}
              >
                {row.q}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/* ---------- combined trend chart (inline SVG, no chart lib) ---------- */

/* Layout constants mirror the draft: plot x 84..1144 (1060 wide = 20 days at
   run zero), y 208 (0%) .. 16 (100%), band zones every 38.4px. history's
   tier1_rate is a 0-100 percentage. */
const ZONE_FILLS = [
  "rgba(28,122,68,.06)",
  "rgba(42,157,92,.06)",
  "rgba(168,135,28,.06)",
  "rgba(194,106,23,.06)",
  "rgba(192,58,49,.06)",
];
const ZONE_LABELS: [number, string, string][] = [
  [38, "#1c7a44", "amazing"],
  [76.4, "#2a9d5c", "great"],
  [114.8, "#a8871c", "fine"],
  [153.2, "#c26a17", "bare minimum"],
  [191.6, "#c03a31", "below minimum"],
];
const GRID_YS = [16, 54.4, 92.8, 131.2, 169.6, 208];
const Y_LABELS: [string, number][] = [
  ["100", 19.5],
  ["80", 57.9],
  ["60", 96.3],
  ["40", 134.7],
  ["20", 173.1],
  ["0", 211.5],
];

/* Captured at module load (lazy route, so ~page open) — only anchors the
   run-zero chart axis, nothing time-critical. Render stays pure. */
const TODAY_DAY = Math.floor(Date.now() / 86400000);

function toPoints(h: HistoryPoint[]): { day: number; rate: number }[] {
  const pts: { day: number; rate: number }[] = [];
  for (const p of h) {
    const day = parseDay(p.date ?? p.run_at);
    /* Backend history rows carry the position/rank-weighted tier1_score;
       tier1_rate and hits/total are accepted as fallbacks for old
       payload shapes. */
    const rate =
      typeof p.tier1_score === "number"
        ? p.tier1_score
        : typeof p.tier1_rate === "number"
          ? p.tier1_rate
          : typeof p.tier1_hits === "number" && p.tier1_total
            ? (100 * p.tier1_hits) / p.tier1_total
            : null;
    if (day == null || rate == null) continue;
    pts.push({ day, rate: Math.min(100, Math.max(0, rate)) });
  }
  pts.sort((a, b) => a.day - b.day);
  return pts;
}

function TrendChart({ seo, geo }: { seo: HistoryPoint[]; geo: HistoryPoint[] }) {
  const seoPts = toPoints(seo);
  const geoPts = toPoints(geo);
  // Zero-state design: no history yet still draws the single run-zero point —
  // an axis waiting for dots.
  if (seoPts.length === 0 && geoPts.length === 0) {
    seoPts.push({ day: TODAY_DAY, rate: 0 });
    geoPts.push({ day: TODAY_DAY, rate: 0 });
  }

  const allDays = [...seoPts, ...geoPts].map((p) => p.day);
  const startDay = Math.min(...allDays);
  const lastDay = Math.max(...allDays);
  const spanDays = Math.max(20, lastDay - startDay);
  const perDay = 1060 / spanDays;
  const x = (day: number) => 84 + (day - startDay) * perDay;
  const y = (rate: number) => 208 - (rate / 100) * 192;
  const labelEvery = Math.max(1, Math.round(spanDays / 5));
  const labelDays = Array.from({ length: 6 }, (_, i) => startDay + i * labelEvery);

  const runZero =
    seoPts.length === 1 &&
    geoPts.length === 1 &&
    seoPts[0].day === geoPts[0].day &&
    seoPts[0].rate === 0 &&
    geoPts[0].rate === 0;

  const line = (pts: { day: number; rate: number }[]) =>
    pts.map((p) => `${x(p.day)},${y(p.rate)}`).join(" ");

  return (
    <div className={`${CARD_SM} mt-3.5 px-5 py-[18px]`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span
          className="text-[0.85rem] text-ink-soft"
          title="Position/rank-weighted tier-1 score per run. One line per channel; a line never mixes runner tools — switching runners starts a new line."
        >
          Tier-1 score by run
        </span>
        <span className="inline-flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
            <svg width="30" height="10" aria-hidden="true">
              <line x1="1" y1="5" x2="29" y2="5" stroke="#15557e" strokeWidth="2" />
              <circle cx="15" cy="5" r="3.2" fill="#15557e" />
            </svg>
            SEO
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
            <svg width="30" height="10" aria-hidden="true">
              <line
                x1="1"
                y1="5"
                x2="29"
                y2="5"
                stroke="#16181b"
                strokeWidth="1.6"
                strokeDasharray="5 3"
              />
              <circle cx="15" cy="5" r="3.4" fill="#ffffff" stroke="#16181b" strokeWidth="1.6" />
            </svg>
            GEO
          </span>
        </span>
      </div>
      <svg
        viewBox="0 0 1180 244"
        className="mt-2.5 block h-auto w-full"
        aria-label="Combined trend chart of SEO and GEO tier-1 scores by run"
      >
        {ZONE_FILLS.map((fill, i) => (
          <rect key={fill} x="40" y={16 + i * 38.4} width="1110" height="38.4" fill={fill} />
        ))}
        <g stroke="#e9ebee" strokeWidth="1">
          {GRID_YS.map((gy) => (
            <line key={gy} x1="40" y1={gy} x2="1150" y2={gy} />
          ))}
        </g>
        <g fontSize="10" fill="#9aa2ab" textAnchor="end">
          {Y_LABELS.map(([t, ly]) => (
            <text key={t} x="32" y={ly}>
              {t}
            </text>
          ))}
        </g>
        <g fontSize="9.5" fontWeight="600" textAnchor="end" opacity=".55">
          {ZONE_LABELS.map(([ly, color, t]) => (
            <text key={t} x="1144" y={ly} fill={color}>
              {t}
            </text>
          ))}
        </g>
        <g fontSize="10" textAnchor="middle">
          {labelDays.map((day) => (
            <text
              key={day}
              x={x(day)}
              y="228"
              fill={day <= lastDay ? "#6a737d" : "#c6cbd1"}
              fontWeight={day <= lastDay ? "600" : "400"}
            >
              {fmtDay(day)}
            </text>
          ))}
        </g>
        <g stroke="#e9ebee" strokeWidth="1">
          {labelDays.map((day) => (
            <line key={day} x1={x(day)} y1="208" x2={x(day)} y2="212" />
          ))}
        </g>
        {geoPts.length > 1 && (
          <polyline
            fill="none"
            stroke="#16181b"
            strokeWidth="1.6"
            strokeDasharray="5 3"
            points={line(geoPts)}
          />
        )}
        {seoPts.length > 1 && (
          <polyline fill="none" stroke="#15557e" strokeWidth="2" points={line(seoPts)} />
        )}
        {geoPts.map((p) => {
          const coincident = seoPts.some((s) => s.day === p.day && s.rate === p.rate);
          return (
            <circle
              key={p.day}
              cx={x(p.day)}
              cy={y(p.rate)}
              r={coincident ? 7 : 4.5}
              fill="#ffffff"
              stroke="#16181b"
              strokeWidth="1.6"
            />
          );
        })}
        {seoPts.map((p) => (
          <circle key={p.day} cx={x(p.day)} cy={y(p.rate)} r="3.6" fill="#15557e" />
        ))}
        {runZero && (
          <text
            x={x(seoPts[0].day) + 14}
            y="196"
            fontSize="11"
            fontWeight="600"
            fill="#6a737d"
          >
            run zero · both 0%
          </text>
        )}
      </svg>
    </div>
  );
}

/* ---------- leaderboards + backlinks ---------- */

function LbRow({
  name,
  count,
  max,
  us = false,
}: {
  name: string;
  count: number;
  max: number;
  us?: boolean;
}) {
  return (
    <div className="grid grid-cols-[118px_1fr_26px] items-center gap-2.5">
      <span
        className={`overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] ${
          us ? "font-semibold text-tide" : "text-ink-soft"
        }`}
      >
        {name}
      </span>
      <span className="h-[13px] overflow-hidden rounded bg-sand">
        <span
          className={`block h-full rounded ${us ? "bg-tide" : "bg-ink-faint"}`}
          style={{ width: `${(count / max) * 100}%` }}
        />
      </span>
      <span className={`text-right text-[12px] font-semibold tabular-nums ${us ? "text-tide" : ""}`}>
        {count}
      </span>
    </div>
  );
}

function Leaderboard({
  eyebrow,
  eyebrowTitle,
  pinnedName,
  pinnedCount,
  rows,
  meta,
}: {
  eyebrow: string;
  eyebrowTitle: string;
  pinnedName: string;
  pinnedCount: number;
  rows: { name: string; count: number }[];
  meta?: string;
}) {
  const max = Math.max(1, pinnedCount, ...rows.map((r) => r.count));
  return (
    <div className={`${CARD_SM} px-[18px] py-4`}>
      <div className="text-[0.85rem] text-ink-soft" title={eyebrowTitle}>
        {eyebrow}
      </div>
      <div className="mt-3 flex flex-col gap-[7px]">
        <LbRow us name={pinnedName} count={pinnedCount} max={max} />
        <div className="h-px bg-line" />
        {rows.map((r) => (
          <LbRow key={r.name} name={r.name} count={r.count} max={max} />
        ))}
      </div>
      {meta && <p className="m-0 mt-3 text-[11.5px] text-ink-faint tabular-nums">{meta}</p>}
    </div>
  );
}

function SeoLeaderboard({ ch }: { ch: ChannelModel }) {
  const counts = new Map<string, number>();
  for (const row of ch.rows) {
    if (row.status === "pend") continue;
    for (const d of row.topDomains) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const us = counts.get("driftwood.sh") ?? 0;
  counts.delete("driftwood.sh");
  // Map preserves first-appearance order; the stable sort keeps it as tiebreak.
  const entries = [...counts.entries()];
  const rows = entries
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  const once = entries.filter(([, c]) => c === 1).length;
  const meta =
    once > 0
      ? `${once} more domains appeared once`
      : ch.probed === 0
        ? "no probed results yet"
        : undefined;
  return (
    <Leaderboard
      eyebrow="Top domains · target SERPs"
      eyebrowTitle={`Appearances in the top-3 results across the ${ch.probed} probed keywords, from the SEO probe's top_domains. driftwood pinned.`}
      pinnedName="driftwood.sh"
      pinnedCount={us}
      rows={rows}
      meta={meta}
    />
  );
}

function GeoLeaderboard({ ch }: { ch: ChannelModel }) {
  const counts = new Map<string, number>();
  for (const row of ch.rows) {
    if (row.status === "pend") continue;
    for (const c of row.competitors) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  return (
    <Leaderboard
      eyebrow="Competitors · AI answers"
      eyebrowTitle={`Vendor appearances across the ${ch.probed} probed queries. Fixed 16-vendor watch list; only vendors that showed up are listed. driftwood pinned.`}
      pinnedName="driftwood"
      pinnedCount={ch.totalHits}
      rows={rows}
      meta={ch.probed === 0 ? "no probed answers yet" : undefined}
    />
  );
}
