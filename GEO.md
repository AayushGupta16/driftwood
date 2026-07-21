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

## The formal probe — fixed query set v1 (2026-07-21)

24 fixed queries, run verbatim, same instrumentation every time, so
runs are comparable. Derived from the 58-query discovery probe
(site/agentic-query-research-2026-07-21.md). Do not edit casually;
version the set (v1, v2...) when queries change, and note the version
in every result file so trends stay honest.

Category / commercial (1-8):
1. best AI SDR tools 2026
2. AI SDR tools for seed stage startups
3. new AI outbound agents 2026 alternatives to 11x Artisan
4. human-in-the-loop AI outbound tool approve emails before send
5. autonomous vs assisted outbound founder-led sales
6. AI SDR vs sales engagement platform comparison
7. AI SDR cold email reply rates vs human SDR performance
8. do AI SDR tools actually work

Benchmarks / diagnostic (9-14):
9. cold email reply rate benchmarks 2026
10. average cold email response rate statistics b2b
11. what is a good cold email reply rate
12. cold email personalization impact reply rate research
13. why cold emails get no replies common causes
14. is cold email dead 2026

Founder how-to (15-21, 24):
15. how to do cold outreach for B2B SaaS startup
16. founder-led sales cold outreach playbook early stage
17. when should a startup hire an SDR
18. outsourced SDR vs AI SDR
19. outsourced sdr companies cost
20. how to write a cold email that gets replies
21. cold email vs LinkedIn outreach B2B
24. best outbound tools for 3 person startup no sales team

Entity / definition (22-23):
22. what is demo-led outbound
23. driftwood AI SDR

## Scoring

Per query: driftwood present in results (0/1, position if present);
competitor presence (fixed watch list: Instantly, Artisan, 11x,
Apollo, Clay, Autobound, Amplemarket, Smartlead, AiSDR, Unify,
Landbase, Nooks, Coldreach, Lemlist, Salesforge, Saleshandy); top 3
domains. Per run: driftwood hit count /24 (the headline number),
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
measure result-shuffling noise, and each run costs a subagent doing
24 searches. Revisit cadence if a launch window makes daily worth it.
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

## Dashboard (Godmode admin page) — spec, GEO half

- Data: site/geo-results/latest.json (+ history from dated files for
  the trend line). No external APIs needed — the probe commits the
  artifact and the deployed site serves it.
- Panels: headline hit-rate (N/24) with trend since baseline;
  per-query hit table (green/red, position); competitor leaderboard
  vs us; last-run date + set version; button-equivalent note that a
  re-run is "ask Claude to /geo-probe" until a backend runner exists.
- Later: PostHog AI-referrer panel (chatgpt.com / perplexity.ai /
  gemini referrals on book_demo + booking_confirmed) — the revenue
  edge of GEO.
