/* Pure data transform for the "Tier-1 score by run" trend chart on
   /dashboard/admin/search-visibility.

   The canonical comparability rule (site/GEO.md): probe results are
   COMPARABLE ONLY WITHIN ONE RUNNER TOOL — every run records its tool and
   query-set version, and a trend line must never connect runs across a
   methodology switch. The chart draws ONLY the newest methodology's runs
   (`current`); a switch clears the chart and starts the line over
   (Aayush 2026-07-22 — no faded history, no change marker). `older` is
   still split out here so the chart has nothing to compute, but it is
   not rendered.

   Kept free of browser APIs and React so `node --test` runs it directly
   (npm test). */

export type HistoryPoint = {
  id?: string;
  date?: string;
  run_at?: string;
  set_version?: string;
  tool?: string | null;
  tier1_rate?: number;
  tier1_score?: number;
  tier1_hits?: number;
  tier1_total?: number;
};

export type TrendPt = {
  /* Fractional UTC day (Date.parse / 86400000): run_at keeps its
     time-of-day, so same-day runs spread instead of stacking on one x. */
  t: number;
  /* 0-100 tier-1 score, clamped. */
  rate: number;
  /* Stable render key: the run id when the payload carries one. */
  key: string;
  tool: string | null;
};

export type TrendSeries = {
  /* Runs sharing the newest run's methodology — the trustworthy line. */
  current: TrendPt[];
  /* Earlier-methodology runs — rendered faded and never connected. */
  older: TrendPt[];
};

/* The identity a line may connect: query-set version + runner tool (kind is
   implicit — each channel transforms separately). Old payload shapes
   without the fields collapse to one identity, i.e. one line, the old
   behavior. */
export function methodologyKey(p: HistoryPoint): string {
  return `${p.set_version ?? ""}|${p.tool ?? ""}`;
}

function instant(p: HistoryPoint): number | null {
  const iso = p.run_at ?? p.date;
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms / 86400000;
}

/* Backend history rows carry the position/rank-weighted tier1_score;
   tier1_rate and hits/total are accepted as fallbacks for old payload
   shapes. */
function score(p: HistoryPoint): number | null {
  if (typeof p.tier1_score === "number") return p.tier1_score;
  if (typeof p.tier1_rate === "number") return p.tier1_rate;
  if (typeof p.tier1_hits === "number" && p.tier1_total)
    return (100 * p.tier1_hits) / p.tier1_total;
  return null;
}

export function toTrendSeries(history: HistoryPoint[]): TrendSeries {
  const pts: (TrendPt & { meth: string })[] = [];
  for (const p of history) {
    const t = instant(p);
    const rate = score(p);
    if (t == null || rate == null) continue;
    pts.push({
      t,
      rate: Math.min(100, Math.max(0, rate)),
      key: p.id ?? p.run_at ?? p.date ?? String(t),
      tool: p.tool ?? null,
      meth: methodologyKey(p),
    });
  }
  pts.sort((a, b) => a.t - b.t);
  const currentMeth = pts.length > 0 ? pts[pts.length - 1].meth : null;
  return {
    current: pts.filter((p) => p.meth === currentMeth),
    older: pts.filter((p) => p.meth !== currentMeth),
  };
}
