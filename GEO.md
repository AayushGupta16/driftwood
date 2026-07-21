# GEO — strategy, formal query set, probe protocol

Owner doc for driftwood's visibility in AI engines and agents.
Companion: SEO.md. Phase history: GEO-PLAN.md. Updated 2026-07-21.

## The strategy

AI engines and research agents do not rank pages; they read a citation
pool and resolve entities. GEO is five moves:

1. **Entity resolution.** "driftwood (driftwood.sh)" pairing
   everywhere; alternateName schema (shipped); Crunchbase + G2 as
   identity anchors (live). Kills the driftwood.ai / driftwood-ai.com
   collision.
2. **Primary-source status.** First-party data with methodology inline
   (N, definitions, window). Agents demonstrably hunt "data / study /
   methodology" and cite the source, not the listicle. The
   /cold-outbound-benchmarks page is this play.
3. **Agent-phrasing surface.** Year tokens ("Updated July 2026"),
   symptom-phrased headings, the literal words agents append to
   queries. llms.txt written in agent vocabulary.
4. **Pool membership.** Get into what engines already cite: vendor
   listicles (4 pitches drafted), G2 (live, reviews pending),
   comparison pages.
5. **Definition ownership.** demo-led outbound (live page);
   autonomous-vs-assisted AI SDRs (section planned on /ai-sdr).
   Engines answer "what is X" with whoever defined X.

Void worth filling: agents cannot reach Reddit (crawler blocked,
verified). Honest practitioner-voice content with real numbers is
uniquely valuable to them.

## The formal probe — fixed query set

CURRENT SET: v2, 100 queries, in geo-results/queryset-v2.json
(2026-07-21, same day as v1 — expanded per Aayush to include the
long-term head terms from day one, e.g. "best AI SDR", "best AI growth
tools"). Three tiers:

- Tier 1 (20): must-win now — entity/brand, coinage, the winnable
  SERPs, shipping pages. THE HEADLINE METRIC is the tier-1 hit rate.
- Tier 2 (40): near-term — clusters our pages target, question tail,
  founder/operator how-to.
- Tier 3 (40): long-term build-up — head and best-of terms. Expected
  to sit at zero for quarters; tracked so the day they move is
  visible, never used as the headline.

Scoring is per-tier hit rate + total /100. Do not edit the set
casually; version it (v3...) when queries change and note the version
in every result file so trends stay honest. v1 (24 queries, inline in
git history of this file) is a strict subset by intent; the 07-21
baseline used v1.

The original v1 rationale, kept for the record: queries derived from
the 58-query discovery probe (site/agentic-query-research-2026-07-21.md),
run verbatim, same instrumentation every time.

## Scoring

Per query: driftwood present in results (0/1, position if present);
competitor presence (fixed watch list: Instantly, Artisan, 11x,
Apollo, Clay, Autobound, Amplemarket, Smartlead, AiSDR, Unify,
Landbase, Nooks, Coldreach, Lemlist, Salesforge, Saleshandy); top 3
domains. Per run: tier-1 hit rate (the headline number), per-tier hits, total /100,
competitor leaderboard, domain leaderboard.

Results live in site/geo-results/: one dated markdown per run
(YYYY-MM-DD.md, raw per-query lines + summary) plus latest.json
(machine-readable, what the dashboard reads):
`{"date", "set_version", "driftwood_hits", "total", "per_query":
[{"q", "hit", "position", "competitors"}], "competitor_counts"}`.

## Running it

On command: the `/geo-probe` skill (.claude/skills/geo-probe) runs the
fixed set via a subagent, writes the dated file + latest.json, and
commits. Anyone in a Claude Code session on this repo can run it.

Cadence recommendation: **weekly**, plus on-command after any ship
that should move it (new page live, listicle inclusion lands, PH
launch). Daily/every-other-day is possible but not recommended:
search-index composition changes on week timescales, so daily runs
measure result-shuffling noise, and each run costs subagents doing
100 searches. Revisit cadence if a launch window makes daily worth it.
Quarterly: re-run the 4-persona DISCOVERY probe (free-form, prompts in
site/agentic-query-research-2026-07-21.md) to find new query shapes,
then revise the fixed set to v-next.

Layer 2 (future): answer-checking — ask the actual engines (ChatGPT,
Perplexity, Gemini via API) the prompt-set questions and record
whether driftwood is named in ANSWERS, not just search results.
Requires API keys/credits (OpenRouter fleet key currently dry);
GEO-PLAN Phase 2 owns this. The fixed-set probe is the leading
indicator; answer-share is the lagging truth.

## Baseline

- 2026-07-21 discovery probe: driftwood 0/58 free-form agent queries
  (~400 result slots). Competitors everywhere; prospeo.io programmatic
  SEO dominates symptom queries.
- 2026-07-21 fixed-set v1 baseline: see geo-results/2026-07-21.md
  (first tracked run).

## Grading scale (Aayush, 2026-07-21)

Applied to tier-1 hit rate (headline) and shown per tier: under 20% =
below bare minimum, 20% = bare minimum, 40% = fine, 60% = great, 80%+
= amazing. Dashboard colors follow these bands.

## Probe runner notes

- Parallelize freely: current skills run 4x25 subagent batches; can go
  wider. Light token work.
- A future backend cron runner could use OpenRouter search-enabled
  models instead of Claude Code sessions. Two caveats recorded: the
  shared OpenRouter key was out of credits as of 2026-07-20 (top up
  first), and RESULTS ARE ONLY COMPARABLE WITHIN ONE SEARCH TOOL -
  switching runner (Claude WebSearch -> OpenRouter/Perplexity) starts
  a new trend line. Every result file records its tool; the dashboard
  charts per tool, never mixed.
- Probes are PAUSED until the dashboard is built (Aayush, 2026-07-21);
  v1 baselines stand as run zero.

## Dashboard (Godmode admin page) — spec, GEO half

- Data: site/geo-results/latest.json (+ history from dated files for
  the trend line). No external APIs needed — the probe commits the
  artifact and the deployed site serves it.
- Panels: headline tier-1 hit-rate (+ total /100) with trend since baseline;
  per-query hit table (green/red, position); competitor leaderboard
  vs us; last-run date + set version; button-equivalent note that a
  re-run is "ask Claude to /geo-probe" until a backend runner exists.
- Later: PostHog AI-referrer panel (chatgpt.com / perplexity.ai /
  gemini referrals on book_demo + booking_confirmed) — the revenue
  edge of GEO.
