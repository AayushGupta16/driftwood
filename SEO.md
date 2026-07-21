# SEO.md — the operating manual (updated 2026-07-21)

Canonical doc for driftwood.sh organic search, INCLUDING press/earned
media. Companion: GEO.md (AI-engine visibility). Written for the agent
that grinds on this. Killed page drafts live in git history
(design/draft-page-* before the reorg commit); the research corpus is
ads/research-keyword-volumes-2026-07-20.md (8 validated rounds, ~200
terms).

## Mission and reader

Drive qualified organic traffic and demos. The reader we optimize for
(Aayush, 2026-07-21): founders scaling founder-led sales; operators
improving reply/demo rates and running cold outbound; "does channel X
work" learners; secondarily SDRs improving their numbers. NOT people
hiring/outsourcing SDRs. Test for every page: would a founder scaling
their own outbound actually need this?

## Standing founder gates (the agent NEVER crosses these alone)

- Copy rules in LISTINGS.md are law: stat verbatim "replies went from
  under 1% to over 14% in week one at Autosana (YC S25)" + "including
  founders who had ignored more than four months of prior outreach";
  no em dashes; never "personalized video/landing page"; case-study
  CTO and his company stay unnamed; name pairing "driftwood
  (driftwood.sh)".
- Homepage BODY copy is off-limits (standing decision). Homepage
  title/meta changes: proposals to Aayush only (open judgment call:
  title has zero query language; adding "AI SDR" trades brand voice).
- Never paid backlinks. Marketplace "featured" slots = Aayush's call.
- Nothing sends (pitches, asks, emails) without Aayush. Drafts of
  sends live in outreach-drafts-2026-07-21.md.
- Query set changes = versioned proposals (v5...) with his approval.
- Google Ads stays parked; nothing that spends.

## How the agent works (delegate and QA)

Same principle as the codebase: the agent on this doc orchestrates;
subagents do the work; the orchestrator QAs. Spawn one subagent per
bounded job with a narrow charter and a concrete deliverable — draft
the /alternatives/clay page, figure out the acquisition path for one
backlink target, research where founders actually ask a question
cluster, prepare a Reddit/community post. The orchestrator does not
write pages, pitches, or research syntheses inline; it scopes the job,
spawns, then reviews the deliverable against this doc + LISTINGS.md
before anything lands in the repo. The founder gates bind every
subagent exactly as they bind the orchestrator: nothing sends, posts,
or spends from anywhere in the tree; outward-facing output (a pitch, a
community post, a listing edit) always comes back as a draft for
Aayush.

## Page plan (the grind queue)

Shipped: /customers/autosana, /demo-led-outbound, /faq,
/best-ai-sdr-tools (+ homepage). Checklist for every new page: build
as landing/public/<route>/index.html (self-contained pattern; copy an
existing page) -> sitemap -> llms.txt -> footer-link decision ->
internal links -> commit main (deploys) -> GSC request indexing.

Priority queue with validated targets:
1. /founder-led-sales — "founder led sales" 100-1K LOW. Numbers-first:
   what it is, why it beats hired outbound early, calendar math where
   it breaks, when-to-hire-an-SDR (honest), the third option, funnel
   table, FAQ from the question tail.
2. /cold-outbound-benchmarks — the rate-question cluster (a dozen
   10-100 LOW terms) + the CITEABLE first-party data play: the
   1%-to-14% numbers WITH a methodology block (send count, reply
   definition, window — NUMBERS STILL OWED BY AAYUSH), diagnostic
   ordering section (below 1%? bounce rate -> placement test -> then
   copy), "Updated <month year>" freshness line.
3. /ai-sdr — head-term destination (1K-10K Med) + the
   "autonomous vs assisted AI SDRs" category section (unclaimed;
   approve-before-send is our wedge; do NOT coin a third term).
4. /alternatives/<competitor> — instantly (100-1K), clay (100-1K,
   $383 top bid), 11x, apollo, artisan. One template, REAL
   per-competitor content, honest "when X is right", monthly
   fact-check refresh (same rule as /best-ai-sdr-tools).
5. /b2b-saas-outreach — qualified-tail guide (thin volumes by
   design); absorbs the how-to-write question tail as H2s/FAQ.
6. Later: b2b saas lead gen cluster page; /outsourced-sdr exists in
   git history but is DEPRIORITIZED (off-ICP call 07-21).

How pages rank (the strategy stack): literal query-language H1/title/
FAQ phrasing; one strong page per intent cluster (variants = H2s,
never doorway pages); format gaps (numbers-first playbooks, data with
methodology, honest decision guides — every SERP we probed is vendor
listicles); internal links funnel tail -> /ai-sdr, everything cites
benchmarks; CTAs -> /#book.

## Authority engine

1. Live: Crunchbase, G2 (Yuvan review invited), LinkedIn.
2. Asks drafted, Aayush sends: Autosana cross-link, a16z speedrun
   directory, 4 listicle pitches (send after benchmarks page is live).
3. Integration marketplaces (product roadmap that emits backlinks):
   Zapier first (light REST triggers/actions), then Attio (ICP-native),
   then HubSpot App Marketplace; skip Salesforce AppExchange. Each
   listing = high-authority link + /integrations/<name> page target.
4. BACKLINKS.md (to create): canonical registry — every link, source,
   date, acquisition path. GSC Links report = discovery.

## Press (folded from PRESS.md; 104-agent verified research 2026-07-21)

Story assets, ranked: (1) the Autosana arc — Aayush was founding
engineer at Autosana (YC S25), built driftwood, his old company became
customer zero; ALWAYS disclose the relationship in pitches. (2) The
first-party data (journalists rank original data 2nd-most-valued;
~48% want data in pitches — Cision, verified). (3) a16z speedrun A001.
(4) demo-led outbound coinage + contrarian AI-spam angle. (5) UMD
alumni.

Verified channel playbook, priority order:
1. **UMD (do first, near-certain dofollow .edu):** Innovation Gateway
   "Founder Stories" (innovate.umd.edu/founder-stories — verified
   dofollow, indexable links to founders' sites) + OMC "Pitch Your
   Story" Asana form / omc@umd.edu (channels include Terp magazine +
   alumni newsletter). Pitch the two SEPARATELY. Dingman Center scope:
   unverified, investigate.
2. **TechCrunch:** speedrun beat verified; targets Dominic-Madori
   Davis (Senior Reporter, Venture) and Ivan Mehta — re-verify bylines
   at pitch time. Default speedrun story is funding-led, so pitch the
   DATA ("under 1% to over 14% when every cold email carried a working
   demo"), founder arc as color. Non-funding features happen (Clouted,
   May 2026) but are rare.
3. **Axios:** top-3 ChatGPT-cited domain in 13/17 industries (Muck
   Rack May 2026 — the ONLY verified stat from that report; the
   84%/0.3% companion stats were REFUTED, never cite them). No named
   sales-tech byline yet — open hunt. Mentions matter even without
   links: unlinked brand mentions correlate ~3x more with AI-answer
   visibility than backlinks (Ahrefs; correlation caveat).
4. **Platforms pilot (60-90 days, logged):** free Source of Sources
   (highest measured dofollow rate, 36.26%, BuzzStream 2025) + Qwoted
   (highest-authority request pool, 70.3% DR70+). ALL published
   acceptance rates were refuted — build our own base rate; log
   platform/DR/link-type per response into BACKLINKS.md.
Open: Business Insider / sales-tech trades / AI newsletters have no
verified targets; Yuvan on the record for the data story (ask bundled
with cross-link + G2 review).

## Learnings from the origin video (Jono Catliff), translated

Never guess keywords (validate volume — proven right 3x: "ai for cold
outbound", "demo-led outbound", "best ai growth tools" all ~zero);
search term = title = H1 (cluster-wise, not doorway-wise); intent
filtering (no informational-only chases); CRO once landed (inline
booking live; testimonials + founder video open); you make money
optimizing, not setting up.

## Measurement

GSC = truth (API credential still owed for dashboard panels; manual
pull meanwhile). /seo-probe skill + backend daily run = directional
presence tracking (queryset v4, 105 tiered; tier-1 hit rate headline;
bands 20/40/60/80 = bare-min/fine/great/amazing). Dashboard:
/dashboard/seo-geo. Expectations: brand queries flip weeks after links
land; tail impressions 4-8 wks; head terms quarters. Baselines
2026-07-21: probe 0/15 (v1), GSC 4 impressions / 3 organic sessions
this week. Monthly: comparison-page refresh + fold GSC query
discoveries back into targets.
