# Agentic query research, 2026-07-21

Method: four subagents were given realistic founder-delegated tasks
(learn cold outreach; evaluate outbound tools; write a playbook
grounded in numbers; debug a 0.5% reply rate) and instructed to do the
research for real while logging every search query verbatim. 58 queries
total. Caveat: all four are Claude agents on one search tool, so this
is directional for how AI agents phrase research, not a census of
ChatGPT/Perplexity behavior. These queries mostly do not register in
Keyword Planner; their value is GEO (being the page agents read and
cite), not rankings.

## Finding 0: driftwood appeared in zero of 58 queries

Across ~400 result slots, driftwood.sh never surfaced once, including
on the queries closest to our positioning:

- "human-in-the-loop AI outbound tool approve emails before send"
  (returned generic workflow tools, no sales product)
- "autonomous vs assisted outbound which is better for founder-led
  sales"
- "new AI outbound agents 2026 alternatives to 11x Artisan for seed
  startups" (returned AiSDR, Coldreach, Unify, Nooks, Landbase)
- "AI SDR cold email reply rates vs human SDR performance"
- "founder-led sales cold outreach playbook early stage startup"

Competitors that did appear organically: Instantly (everywhere),
Artisan, Apollo, Clay, Autobound, Amplemarket, Smartlead, 11x, Lemlist,
Cleverly, Unify, Landbase, Valley, Nooks, Coldreach, AiSDR. The SERP is
60-95% vendor content marketing plus programmatic SEO (prospeo.io
appeared in over 20 result slots across three probes on completely
different query shapes).

## Finding 1: how agents phrase queries (the phrasing playbook)

Patterns observed independently across probes:

1. Year-stamping: "2026"/"2025" appended to filter stale content (3 of
   4 probes; 6 of 14 queries in one log). Pages need a visible, honest
   year token. Our "Updated July 2026" freshness line is agent bait.
2. Data qualifiers: "data study", "statistics", "benchmarks",
   "research", "methodology" appended to escape listicles and find
   primary sources. Pages claiming data should carry these words
   literally.
3. Symptom-as-query: the diagnostically best query embedded the exact
   symptom ("0.5% reply rate what am I doing wrong"). Headings that
   mirror symptom phrasing ("reply rate below 1%") catch these.
4. Constraint stacking toward the buyer profile: "seed stage", "3
   person startup no sales team", "under $500 month" accumulate over a
   session. Stage-keyed content matches the terminal (highest-intent)
   queries.
5. X-vs-Y head-to-heads once names are known; category term lock-in
   ("AI SDR") as soon as a query surfaces the term of art.
6. Adversarial pivot: after vendor-positive results, agents inject
   "do they actually work", "churn deliverability problems reddit".
   Honest failure-mode content catches the skeptic pass.
7. Named-source anchoring: one probe's best query named the primary
   datasets (Gong, Backlinko, Woodpecker) + "methodology" to find the
   actual source of recycled numbers.
8. Reddit is unreachable for agents (crawler blocked; three separate
   attempts failed across two probes). The practitioner-voice content
   agents want most is structurally unavailable to them. First-party
   honest-practitioner content fills a void agents cannot fill
   elsewhere.

## Finding 2: the four pages agents wished existed

Each probe was asked what single page would have served it best:

1. Playbook probe: a first-party benchmark study with methodology
   inline (disclosed N, explicit definition of "reply", time window,
   cuts) - because the same 3-4 numbers mutate across dozens of pages
   citing each other.
2. Beginner probe: a founder-facing playbook leading with a funnel-math
   table (opens, replies, positive-reply-to-meeting, sends-per-meeting)
   then an ordered setup checklist. "I needed ~9 pages to assemble what
   one page could hold."
3. Debugger probe: a diagnostic flowchart anchored to a benchmark
   table: below 1% -> check bounce rate -> placement test -> only then
   copy, with hard thresholds inline.
4. Tool-evaluator probe: NOT another ranked listicle. A stage-keyed
   neutral comparison (real all-in cost, autonomy model, company-stage
   fit) and a category explainer distinguishing fully-autonomous AI SDR
   vs assisted/approve-before-send vs DIY stack. "The 'which fits a
   pre-PMF team' question was never answered in one place."

## Concrete edits implied (mapped to our pages)

- /cold-outbound-benchmarks (draft): add a methodology block for the
  1%-to-14% data (send counts, what counted as a reply, time window -
  numbers needed from Aayush); add the diagnostic-ordering section
  (finding 2.3); add symptom-phrased FAQ ("Why is my reply rate below
  1%?"); keep the year token prominent.
- /founder-led-sales (draft): add the funnel-math table (finding 2.2).
- /best-ai-sdr-tools (live, monthly refresh): add stage-fit, autonomy
  model (autonomous / assisted / DIY), and honest all-in-cost columns.
  The current ranked-list format is the format the buying agent
  explicitly distrusted.
- Category-defining opportunity: "assisted outbound" /
  approve-before-send as a named archetype. The HITL query returned no
  sales product; driftwood literally is this category. Candidate: a
  section on /ai-sdr ("autonomous vs assisted AI SDRs") rather than a
  new coinage page (we already carry demo-led outbound; two coinages
  is enough).
- llms.txt: phrase driftwood's line in agent-query vocabulary (AI SDR,
  approve before send, founder-led sales, reply-rate benchmarks).
- Pitch kit additions (target SERPs where an inclusion would put us in
  front of agents): the "AI SDR vs human reply rates" SERP
  (instantly.ai benchmark report, digitalapplied 100k-email analysis,
  saastr) and the "alternatives to 11x/Artisan" SERP (coldiq,
  getbreakout, vendor listicles already in the kit).

## Status

Research only; no page edits made from this yet. The three page drafts
awaiting Aayush's review should absorb their respective edits at review
time rather than being churned now.
