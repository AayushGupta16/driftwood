# SEO — strategy and operations

Owner doc for driftwood.sh organic search. Companion: GEO.md (AI-engine
visibility). Status history lives in GEO-PLAN.md; this file is the
current operating strategy. Updated 2026-07-21.

## The thesis (Aayush, 2026-07-21)

Focus on **how-to queries in the vocabulary of YC-stage founders and
early heads of growth**: anything they type into Google when figuring
out how to grow faster, make the company work, or learn whether a
channel works. We do not compete on high-volume head terms yet; we win
the long tail where a young domain can rank, and let accumulated
authority earn the head terms over quarters. Head pages (/ai-sdr,
/best-ai-sdr-tools) exist as destinations the tail funnels into.

## Who the reader is (Aayush's ICP refinement, 2026-07-21)

Core audiences, in priority order:

1. **Founders doing founder-led sales who want to scale it** without
   losing the quality that makes it work.
2. **Founders/teams trying to improve their numbers**: reply rates,
   demo rates, sales conversion; people diagnosing and operating their
   cold outbound channel.
3. **Operators figuring out whether/how a channel works** (the "does
   X work" and "how do I run X" questions).
4. Secondary: **SDRs/sales reps improving their own conversion
   rates** — not buyers, but readers and internal champions.

Explicitly NOT core: people shopping to hire an SDR or retain an SDR
agency. The outsourced-SDR searcher may overlap our buyer (outcome
without hiring) but Aayush's read is the intent skews away from his
market. Consequence: /outsourced-sdr drops from the core set to
opportunistic (draft exists, ships last, judged by results); the
founder-led-sales, benchmarks, and how-to-improve content is the
center. Every page must pass the test: is this what a founder scaling
their own outbound, or an operator improving their numbers, actually
needs?


## Qualified over broad (Aayush, 2026-07-21, queryset v3)

Only qualified people should reach the site. Broad educational terms
("how to write a cold email", 100-1K) attract students, job-seekers,
and one-person side projects; they are demoted to tier-3 watch terms.
The guide page targets B2B-SaaS-qualified phrasing instead: "b2b saas
outreach" and family (thin in Planner, high fit - the deliberate
trade). LinkedIn automation terms are a KEEP (medium-term lean-in).
Tool-category heads stay tier 3: we are competing with the
Amplemarket class. Cut outright: driftwood-autosana, the
outsourced/hire cluster, ai bdr, sdr ai, pipeline generation.
Guide-page retarget: /b2b-saas-outreach (not /cold-email-guide).


## Traffic expectations (goal retracted 2026-07-21)

The 10k-impressions-in-a-month goal was retracted by Aayush; the
operating expectation is the organic ladder: ~1,500-3,000
impressions/mo run-rate around day 30 (all pages shipped + indexing
requested), ~10k/mo around day 60-90, growing with authority. The
conversion target stands: 1% of visitors book a demo
(booking_confirmed / sessions in PostHog).

## Competitor-alternative pages (validated 2026-07-21, round 8)

The switching-intent cluster is real: "clay alternative" 100-1K/mo
($383 top bid), "instantly alternative" 100-1K, then 11x / apollo /
smartlead / lemlist / artisan / amplemarket alternatives at 10-100
each. Plan: /alternatives/<competitor> off one template with real
per-competitor content, an honest "when X is the right choice"
section (buyers and their agents distrust self-serving comparisons),
monthly fact-check refresh. Priority: instantly, clay, 11x, apollo,
artisan. These are also query targets: SEO queryset v4 adds the top
five alternative terms; GEO already tracks the pattern (the
alternatives-to-11x/Artisan queries). The never-bid-on-brands rule is
an ads rule; organic comparison pages are standard practice.

## Integration marketplaces - the authority engine (for a future agent)

Documented 2026-07-21 for whoever picks this up. The strongest
white-hat backlink + distribution play available: build real CRM/tool
integrations and get listed in their marketplaces. Each listing is a
high-authority backlink plus standing discovery traffic, and
acceptance is mechanical (build to spec, pass review, listed) unlike
editorial pitching. Framing rule: this is PRODUCT ROADMAP that emits
backlinks - "push booked demos + enriched leads into your CRM" closes
deals on its own and answers a standing sales objection.

Sequence by effort/authority/ICP fit:
1. Zapier - lightest (REST triggers/actions), real utility, instant
   marketplace page. Spec first.
2. Attio - driftwood's ICP lives in Attio (YC-stage startups);
   partner-friendly; featured-app potential.
3. HubSpot App Marketplace - biggest authority; app review takes
   weeks; "does it sync to HubSpot" is a real objection.
4. Pipedrive / Close - later.
5. Salesforce AppExchange - SKIP for now (enterprise-heavy, fees,
   wrong ICP).

Paid "featured" slots in marketplaces are advertising, not paid links;
Aayush draws that line if/when offered. Prerequisite for any of it:
the integration actually works and is documented on a
/integrations/<name> page (which itself targets "<crm> outbound
integration" queries).

## Validated targets (Keyword Planner, US, 2026-07-20/21, 184 terms)

Full data: ads/research-keyword-volumes-2026-07-20.md (4 rounds).

| Cluster | Volume, comp | Page | Status |
|---|---|---|---|
| founder led sales | 100-1K, Low | /founder-led-sales | drafted |
| cold email benchmarks + ~12 rate questions | 10-100 each, Low | /cold-outbound-benchmarks | drafted |
| b2b saas outreach family (qualified tail) | thin, Low | /b2b-saas-outreach | not drafted; broad write-a-cold-email terms demoted to T3 watch |
| outsourced sdr / sdr services | 100-1K, high CPC | /outsourced-sdr | drafted, DEPRIORITIZED (ICP call 07-21) |
| ai sdr / ai sales agent / ai sdr tool | 1K-10K, Medium | /ai-sdr | drafted |
| best ai sdr tools | comparison intent | /best-ai-sdr-tools | live, monthly refresh |
| b2b saas lead generation cluster | 100-1K, Low | tbd | validated, unassigned |

Dead, do not target: ai bdr (-90% YoY), insider phrasings (ai for cold
outbound, demo-led outbound as a search term), pipeline generation
(too generic), professor/academia cold-email noise.

## Round 5 candidates — the growth how-to expansion (VALIDATE FIRST)

The thesis extends beyond outreach to the founder's whole growth
question space. Candidates to run through Keyword Planner before any
page is built (the video's iron rule: never build on unvalidated
volume):

- how to get first 10 customers b2b saas
- how to grow a b2b saas startup / b2b saas growth strategy
- best growth channels for b2b saas / how to pick a growth channel
- gtm strategy for startups / seed stage gtm
- how to validate a sales channel
- do google ads work for b2b saas / is seo worth it for startups /
  does linkedin outreach work (the "is channel X worth it" family)
- paid ads vs cold outreach b2b
- plg vs sales led
- how to book more demos b2b
- how to build a sales pipeline from scratch
- how much should a startup spend on sales

SDR/operator-conversion angle (secondary audience, same validation
rule):

- how to improve sdr conversion rates / sdr metrics benchmarks
- how to increase demo bookings / improve demo show rate
- cold outbound playbook for sdrs
- how to scale founder led sales (bridges audience 1 directly)

Editorial rule for these pages: honest channel math with real numbers,
in founder language, citing our own data where we have it. The channel
pages ("does X work") are natural link magnets and GEO feeders; they
must be honest even where the answer is "not for you yet" — that
honesty is the differentiator (see the probe finding that agents
adversarially search "do these actually work").

## How we rank — the strategy stack (applies to every cluster)

1. **Query-language matching.** H1, title, meta, and FAQ questions use
   the searcher's literal words. One strong page per intent cluster;
   never one page per phrasing variant (doorway spam). Variants become
   H2s and FAQ entries.
2. **Format wins.** Every SERP we probed is vendor listicles. We ship
   the format the searcher (and agent) actually wants: numbers-first
   playbooks, data with methodology, diagnostic orderings, stage-keyed
   decision guides.
3. **Internal architecture.** Tail pages funnel to /ai-sdr; everything
   cites /cold-outbound-benchmarks; every page CTA lands on the inline
   booking section (/#book).
4. **Authority, free only.** Directories (Crunchbase live, G2 live),
   customer cross-link (Autosana), ecosystem (a16z speedrun), listicle
   inclusion pitches, first-party-data PR. Never paid links.
5. **Technical, already solid.** Prerendered HTML, per-page JSON-LD
   (Article/FAQPage/DefinedTerm), sitemap with real lastmod, llms.txt,
   clean CSP, self-hosted fonts, Lighthouse 90+.

## Learnings from the source video (Jono Catliff), translated to SEO

The video is a Google Ads playbook; these are the parts that transfer:

- **Never guess keywords.** All targeting decisions come from Keyword
  Planner volume data, not intuition. (Proven twice: "ai for cold
  outbound" and "demo-led outbound" both scored 0-10 despite sounding
  right.)
- **Search term = headline = page.** His SKAG principle, applied
  cluster-wise: the searcher must see their own words reflected in the
  title and H1. His Quality Score logic (relevance among query, ad,
  landing page) is the same relevance signal organic ranking uses.
- **Intent filtering.** Bid (write) only for buyer-relevant intents;
  jobs/courses/DIY/free intents are ignored, and their SEO analog is:
  do not chase informational queries with no path to a demo.
- **CRO once they land.** Form on the page (the inline Cal booking,
  live), testimonials (Yuvan video candidate), founder video (open),
  speed-to-lead.
- **You make money optimizing, not setting up.** The cadence below.

## Measurement and cadence

- **Google Search Console** is the source of truth: impressions ->
  clicks per query, page indexing, links report. Expectations: brand
  queries resolve 2-6 weeks after links land; tail impressions in 4-8
  weeks; head terms in quarters.
- **Weekly** (once data flows): GSC glance — new queries, impressions
  trend, indexing errors.
- **Monthly**: comparison-page refresh (vendor positioning drifts);
  re-check top clusters' rankings; fold GSC query discoveries back
  into this doc (queries we rank for accidentally = free clusters).
- **Rank probe**: /seo-probe skill, set v2 (100 tiered keywords,
  seo-results/queryset-v2.json; tier-1 hit rate is the headline,
  tier-3 head terms tracked from day one so the long game is visible).
  Directional proxy; GSC stays ground truth.
- **Backlink registry**: BACKLINKS.md (to create) — every known link,
  source, date, how acquired. GSC's Links report is the free
  discovery tool; the registry is canonical.

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

## Dashboard (Godmode admin page) — spec, SEO half

Aayush wants an SEO/GEO stats page in Godmode. SEO half needs:

- Data: GSC Search Analytics API (clicks, impressions, CTR, position
  by query and page; links report). Requires one-time OAuth: the GSC
  property is verified under aayush@driftwood.sh — a service account
  or OAuth token with webmasters.readonly scope, credentials stored
  like the PostHog creds pattern.
- Panels: top queries table (impressions/clicks/position, trend),
  indexed-pages count, backlinks (GSC links + BACKLINKS.md registry,
  new-since-last-visit flag), per-target-cluster rank tracking (the
  table above rendered live).
- Plumbing options: (a) backend endpoint proxying GSC API on demand,
  or (b) a daily job writing a static JSON the Godmode page reads.
  (b) is simpler and matches the GEO probe's artifact pattern —
  recommended.

## Page shipping checklist (every new page)

Draft in site/design/ -> Aayush review -> build as
landing/public/<route>/index.html -> sitemap entry -> llms.txt entry ->
footer-link decision -> internal links from/to related pages ->
commit to main (deploys) -> request indexing in GSC.
