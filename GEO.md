# GEO.md — the operating manual (updated 2026-07-21)

Canonical doc for driftwood's visibility in AI engines and agents.
Absorbs GEO-PLAN.md (now deleted; history in git). Companion: SEO.md
(which owns press). Written for the agent that grinds on this.
Research artifacts: agentic-query-research-2026-07-21.md (58-query
discovery probe + agent phrasing playbook), geo-results/ (probe runs).

## Why GEO exists (the 2026-07-15 baseline, still true)

driftwood.sh had ZERO citations anywhere; the AI-SDR citation pool is
pitchable vendor listicles + G2/PH category pages; NOBODY claims the
custom-demo-per-prospect wedge; and the NAME COLLISION is real
(driftwood.ai = research org, driftwood-ai.com = consultancy; the
branded probe query resolves to them, not us). Entity work precedes
everything.

## The five moves

1. **Entity resolution.** "driftwood (driftwood.sh)" pairing
   everywhere; alternateName schema (SHIPPED); Crunchbase (LIVE) + G2
   (LIVE, Yuvan review pending) as identity anchors; TAAFT skipped
   (fee-gated, never-paid rule); Product Hunt on Aayush's timing.
   First metric to flip: the branded probe queries.
2. **Primary-source status.** First-party data with methodology inline
   — agents verifiably hunt "data/study/methodology" and cite sources
   over listicles. The /cold-outbound-benchmarks page is this play
   (methodology numbers owed by Aayush).
3. **Agent-phrasing surface.** Year tokens ("Updated July 2026"),
   symptom-phrased headings, data-qualifier vocabulary, llms.txt in
   agent language. Full phrasing playbook (verified across 4 probes):
   year-stamping, "data/study/benchmarks/methodology" qualifiers,
   symptom-as-query, constraint stacking ("seed stage", "3 person
   startup"), X-vs-Y after name discovery, adversarial pivots ("do
   they actually work"), named-source anchoring. Agents CANNOT reach
   Reddit (verified) — honest practitioner-voice content fills a void
   nothing else can.
4. **Pool membership.** Get into what engines cite: the 4 listicle
   pitches (drafted, Aayush sends after benchmarks is live), G2
   reviews, comparison pages. Unlinked MENTIONS correlate ~3x more
   with AI visibility than backlinks (Ahrefs) — press mentions count
   even without links (press playbook lives in SEO.md).
5. **Definition ownership.** demo-led outbound (live page; verbatim
   repetition in listings); autonomous-vs-assisted AI SDRs (/ai-sdr
   section LIVE; do NOT coin a third term). Engines answer
   "what is X" with whoever defined X. POSITIONING RULE (Aayush
   2026-07-21): approve-before-send is NOT the wedge and not core
   to what we're building; the wedge is demo-led outbound. Human
   review is a product fact we may state, never an identity we
   build strategy or copy around.

## Standing founder gates

Same as SEO.md: LISTINGS.md copy rules are law; nothing sends without
Aayush; never paid; query-set changes are versioned proposals needing
his approval; probes' fixed sets are never edited casually.

## How the agent works (delegate and QA)

Same rule as SEO.md and the codebase: the orchestrating agent scopes
and QAs; subagents do the work. One subagent per bounded job (a
listicle-pitch draft, a listings-consistency audit, a probe-result
analysis, an entity-resolution investigation), each with a concrete
deliverable the orchestrator reviews against this doc + LISTINGS.md.
Founder gates bind the whole subagent tree; anything outward-facing is
a draft for Aayush, never a send.

## The probe (measurement)

- Fixed sets, versioned: geo-results/queryset-v2.json (100, tiers
  20/40/40; approved as-is by Aayush). Tier 1 = must-win (entity,
  coinage, winnable SERPs) and its hit rate is THE headline metric;
  tier 2 = near-term clusters; tier 3 = long-term heads ("best AI
  SDR", "best AI growth tools"). Grading: 20/40/60/80 = bare-min/
  fine/great/amazing.
- Scoring per query (ANSWER-LAYER since 2026-07-22): each engine in
  the panel is asked the query verbatim; verdicts
  (named_us/named_collision/ambiguous) come from a context-rich LLM
  judge (backend/app/geo_grader.py — deepseek-v4-flash, reasoning
  off, knows who we are + every lookalike; hand-audit-validated 17/17
  on 2026-07-22, see geo-results/grader-audit-2026-07-22.md); a regex
  absent gate skips the judge when driftwood isn't mentioned. Hit = a
  majority of the panel names us. mention_rank (1-based, our first
  mention vs the watch-list's) records whether we're the top
  recommendation when named. Competitor watch-list presence
  (Instantly, Artisan, 11x, Apollo, Clay, Autobound, Amplemarket,
  Smartlead, AiSDR, Unify, Landbase, Nooks, Coldreach, Lemlist,
  Salesforge, Saleshandy) unions across answers.
- Runners: backend daily job (00:07 PT) asks the basic web-grounded
  mainstream assistants — gpt-5-mini:online,
  claude-sonnet-4.6:online, gemini-3.5-flash:online
  (PROBE_ANSWER_MODELS overridable) — the production trend line.
  Before 2026-07-22 the backend GEO probe graded SEARCH-RESULT ranks
  (gemini:online = native grounding), which marked branded queries
  as misses even while real ChatGPT named us — wrong layer; the
  answer probe replaced it. /geo-probe skill = on-command via Claude
  WebSearch (search layer). RESULTS COMPARABLE ONLY WITHIN ONE
  RUNNER TOOL — every run records its tool; never mix lines.
- Artifacts: probe_runs + ground_truth_snapshots tables (backend),
  geo-results/ dated files. Dashboard: /dashboard/seo-geo (ground
  truth on top: per-channel views + demos from PostHog referrer
  attribution — AI-assistant domains = GEO, search domains = SEO).
  Fleet tool: seo_geo_report (free, read-only) for agents.
- Baselines 2026-07-21: discovery probe 0/58; fixed v1 0/24 (branded
  query lost to the collision; "what is demo-led outbound" lost to a
  Steam game); geo_views ground truth = 0. Winnable SERPs with zero
  AI-SDR competitor presence: approve-before-send/HITL, founder-led
  playbook, when-to-hire-SDR, outsourced-SDR-cost.
- Layer 2 BUILT + BASELINE RUN 2026-07-21: answer-share — asks the
  100 queries verbatim to real engines (sonar, gpt-5-mini:online,
  gemini-3.5-flash:online via OpenRouter; GEO_ANSWER_MODELS
  overridable), grades named_us/named_collision/ambiguous/absent.
  Spend approved <$100/week (Aayush 2026-07-21). Run: python3
  site/scripts/geo-answer-probe.py (key from backend/.env; ~$7.5 per
  full run, $15 hard stop; daily-capable). CANONICAL day-0 baseline
  (2026-07-21 evening, fixed grader, all hits audited): gemini 7/20
  tier-1 (branded + BOTH coinage queries), sonar 4/20 (branded;
  flipped intraday from 0 after the FAQ recut + new pages), gpt
  1/20; tiers 2-3 zero on all engines; lines comparable only within
  one engine+model. Answer-share is the truth metric — and since
  2026-07-22 it IS the backend daily probe. Grading canon moved to
  backend/app/geo_grader.py (LLM judge); this script's vocab grader
  is legacy/offline only.
- Quarterly: re-run the 4-persona discovery probe (prompts in
  agentic-query-research-2026-07-21.md), revise the fixed set to
  v-next as a proposal.

## First observed citation (2026-07-21)

Google AI Overview on "driftwood ai sdr" (Aayush's logged-in SERP)
describes driftwood as demo-led outbound, citing OUR /faq plus a
r/SaaSMarketing thread (2026-06-01, "has anyone actually gotten
meetings from ai sdr"); organic #1 = /faq. Six days after Phase 0,
one day after Crunchbase/G2. Caveats that drove same-day fixes: the
overview called us an "autonomous SDR platform" and dropped the
review step (wedge inversion; /faq first answer + JSON-LD recut to
lead with assisted + approve-before-send), and the collision
consultancy (driftwood-ai.com) still held organic #2. Channel
nuance: Google Overviews cite Reddit (licensing) even though
ChatGPT-class agents cannot reach it; Reddit threads count for
Google's engine line specifically. Same day, sonar full baseline =
0/100 named. Engines diverge; never generalize one engine's result.

## Social surfaces: Reddit, X, LinkedIn (decided 2026-07-21)

Aayush's call: invest in Reddit, X/Twitter, and LinkedIn as SEO/GEO
surfaces AND as direct funnels, alongside the site. Why engines
care: Google AI Overviews cite Reddit (licensing) — proven on our
own branded query 2026-07-21; X and LinkedIn posts rank for
name-plus-topic queries and feed entity resolution; LinkedIn is
also the founder-voice channel with his warm network. Status:
direction set, playbooks NOT built. Next step: per-channel subagent
investigations (what to post, where, cadence, what compounds, how
it converts to demos) when Aayush asks. Standing rules meanwhile:
never astroturf (the r/SaaSMarketing thread the Overview cites is
vendor-slop; joining it would read as more of the same);
real-identity participation only; every outward post is a send =
Aayush approves and sends until he changes that gate.

## Expectations

Tier-1 hit rate 20% by ~60 days (entity flips first as Crunchbase/G2
propagate), 40% by 6 months. First AI-referred sessions within ~60
days of listicle inclusions; AI-referred visitors are few but the
highest-intent traffic that exists. GSC-style patience does not apply
here: citation-pool entry events (a listicle inclusion, an Axios
mention, benchmarks-page pickup) move this metric in steps, not
curves.
