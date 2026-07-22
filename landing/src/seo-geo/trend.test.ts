/* node --test (npm test) — no test framework on purpose; Node 24 strips
   the types natively. Fixtures mirror the real prod probe_runs as of
   2026-07-22 (ids shortened), the exact data whose methodology mix broke
   the dashboard's trend line. The reference loads @types/node for this
   file only — the app tsconfig pins `types` to vite/client. */
/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { methodologyKey, toTrendSeries } from "./trend.ts";

const OLD_SEO_TOOL = "openrouter:google/gemini-3.5-flash:online";
const EXA_SEO_TOOL = "openrouter:google/gemini-3.5-flash+exa";
const ANSWER_GEO_TOOL =
  "openrouter-answer:openai/gpt-5.6-terra:online,anthropic/claude-opus-4.8:online,google/gemini-3.6-flash:online";

const seoHistory = [
  { id: "fd20", run_at: "2026-07-21T09:34:23+00:00", set_version: "v4", tool: OLD_SEO_TOOL, tier1_score: 0.0 },
  { id: "0897", run_at: "2026-07-22T07:11:19+00:00", set_version: "v4", tool: OLD_SEO_TOOL, tier1_score: 7.1 },
  { id: "8333", run_at: "2026-07-22T07:58:26+00:00", set_version: "v4", tool: EXA_SEO_TOOL, tier1_score: 33.6 },
  { id: "49ae", run_at: "2026-07-22T08:43:44+00:00", set_version: "v4", tool: EXA_SEO_TOOL, tier1_score: 31.4 },
  { id: "660a", run_at: "2026-07-22T18:37:33+00:00", set_version: "v4", tool: EXA_SEO_TOOL, tier1_score: 31.4 },
];

const geoHistory = [
  { id: "8873", run_at: "2026-07-21T09:39:56+00:00", set_version: "v2", tool: OLD_SEO_TOOL, tier1_score: 0.0 },
  { id: "7018", run_at: "2026-07-22T07:16:19+00:00", set_version: "v2", tool: OLD_SEO_TOOL, tier1_score: 5.0 },
  { id: "6ced", run_at: "2026-07-22T18:37:33+00:00", set_version: "v2", tool: ANSWER_GEO_TOOL, tier1_score: 13.3 },
];

test("SEO: only the latest-tool runs connect; earlier-tool runs fall to older", () => {
  const s = toTrendSeries(seoHistory);
  assert.deepEqual(
    s.current.map((p) => p.key),
    ["8333", "49ae", "660a"],
  );
  assert.deepEqual(
    s.older.map((p) => p.key),
    ["fd20", "0897"],
  );
  assert.deepEqual(
    s.current.map((p) => p.rate),
    [33.6, 31.4, 31.4],
  );
});

test("GEO: the answer-panel run starts its own series, search-graded runs fade", () => {
  const s = toTrendSeries(geoHistory);
  assert.deepEqual(
    s.current.map((p) => p.key),
    ["6ced"],
  );
  assert.deepEqual(
    s.older.map((p) => p.rate),
    [0.0, 5.0],
  );
});

test("same-day runs keep time-of-day: distinct x, ascending", () => {
  const s = toTrendSeries(seoHistory);
  const ts = s.current.map((p) => p.t);
  assert.equal(new Set(ts).size, ts.length);
  assert.deepEqual(ts, [...ts].sort((a, b) => a - b));
  // All three land on the same UTC day.
  assert.equal(new Set(ts.map(Math.floor)).size, 1);
});

test("methodology identity is set_version + tool", () => {
  assert.equal(methodologyKey(seoHistory[0]), `v4|${OLD_SEO_TOOL}`);
  assert.notEqual(methodologyKey(seoHistory[0]), methodologyKey(seoHistory[2]));
  assert.notEqual(
    methodologyKey({ set_version: "v4", tool: EXA_SEO_TOOL }),
    methodologyKey({ set_version: "v5", tool: EXA_SEO_TOOL }),
  );
});

test("old payload shapes without tool collapse to one connected line", () => {
  const s = toTrendSeries([
    { date: "2026-07-15", tier1_rate: 10 },
    { date: "2026-07-16", tier1_hits: 3, tier1_total: 20 },
  ]);
  assert.equal(s.older.length, 0);
  assert.equal(s.current.length, 2);
  assert.deepEqual(
    s.current.map((p) => Math.round(p.rate)),
    [10, 15],
  );
});

test("rows without a date or score are skipped; scores clamp to 0..100", () => {
  const s = toTrendSeries([
    { run_at: "2026-07-20T00:00:00+00:00", set_version: "v4", tool: "x", tier1_score: 120 },
    { set_version: "v4", tool: "x", tier1_score: 50 },
    { run_at: "2026-07-21T00:00:00+00:00", set_version: "v4", tool: "x" },
  ]);
  assert.equal(s.current.length, 1);
  assert.equal(s.current[0].rate, 100);
});

test("empty history yields empty series (the chart draws run zero itself)", () => {
  const s = toTrendSeries([]);
  assert.equal(s.current.length, 0);
  assert.equal(s.older.length, 0);
});
