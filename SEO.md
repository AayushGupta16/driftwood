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
/best-ai-sdr-tools, /founder-led-sales, /alternatives/instantly,
/alternatives/clay, /cold-outbound-benchmarks (+ homepage).
Checklist for every new page: build
as landing/public/<route>/index.html (self-contained pattern; copy an
existing page) -> sitemap -> llms.txt -> footer-link decision ->
internal links -> commit main (deploys) -> GSC request indexing.
Footer decision (Aayush-directed 2026-07-21): two-row sitewide
footer. Row 1 (site): customers, demo-led outbound, faq,
founder-led sales, outbound benchmarks, what is an AI SDR. Row 2
(compare, his call: every competitor named): compare AI SDR tools +
Instantly/Clay/Apollo/Artisan/11x alternatives, exact-match anchors
so each competitor page gets a sitewide anchor for its target query.
Any new /alternatives/<x> page joins row 2 at ship. Guide pages get
internal links, not footer slots.

Priority queue with validated targets:
1. /founder-led-sales — SHIPPED 2026-07-21 (subagent-drafted, QA'd;
   "founder led sales" 100-1K LOW; numbers-first structure as spec'd).
2. /cold-outbound-benchmarks — SHIPPED 2026-07-21 (methodology from
   Aayush same day: 200 sends over 3 weeks; reply definition = human
   reply either channel incl. negative, bounces/auto excluded, agent-
   drafted + Aayush can veto). Rate-question cluster answered with
   named-source numbers (Belkins/Sopro/Woodpecker/Expandi/Google);
   the listicle pitches are now UNGATED (Aayush sends).
3. /ai-sdr — SHIPPED 2026-07-21 (head-term destination; autonomous
   vs assisted section live, no third term coined; sitewide footer
   slot = the tail-funnel mechanism; DefinedTerm schema x3).
   POSITIONING CORRECTION (Aayush 2026-07-21): approve-before-send
   is NOT our wedge and not core to what we're building; the wedge
   is demo-led outbound (the demo in every message). Keep
   autonomous-vs-assisted as honest category taxonomy; at the
   pattern pass, recut this page's driftwood sections to lead with
   the demo, and stop framing "who approves the send" as our flag.
4. /alternatives/<competitor> — ALL FIVE SHIPPED 2026-07-21
   (instantly, clay, 11x, apollo, artisan). Monthly fact-check
   rotation covers all five + /best-ai-sdr-tools + /ai-sdr. First
   re-checks: Instantly annual-discount %, Clay Enterprise floor,
   11x Vendr median + whether they publish pricing, Artisan
   quote-based pricing nuance (fold into /best-ai-sdr-tools),
   Apollo now PRIMARY-sourced via r.jina.ai render of
   apollo.io/pricing (new credit-pool model 30/48/72k per seat/yr;
   many roundups still describe the old model).
5. /b2b-saas-outreach — SHIPPED 2026-07-21 (question-tail guide;
   all numbers cite /cold-outbound-benchmarks, no new claims).
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
4. BACKLINKS.md — CREATED 2026-07-21: canonical registry — every
   link, source, date, acquisition path; press-pilot log + unlinked
   mentions + pipeline sections. GSC Links report = discovery,
   monthly reconciliation. Crunchbase slug recorded there
   (organization/driftwood-driftwood-sh, verified indexed); G2 URL
   pending email.
5. Social surfaces — DECIDED 2026-07-21 (Aayush): invest in Reddit,
   X/Twitter, and LinkedIn for SEO/GEO and as direct funnels.
   Playbooks not yet built; per-channel subagent investigations are
   the next step when he asks. Details + standing rules in GEO.md.

## Competitor stance map (Aayush 2026-07-21)

Comparison pages do not treat all competitors the same, and the
current rhetoric was called super weak: the pattern pass rewrites
for conviction (a real point of view, plainly argued), not just
structure.
- Complimentary tier: Amplemarket (genuinely fine for its buyer);
  extend only as Aayush calls them.
- Contrarian tier: Artisan and 11x. Aayush is staunchly opposed,
  and the pages should carry that stance: they sell REPLACING
  humans, driftwood helps the humans currently employed sell
  better; they do many things adequately, driftwood does one thing
  extremely well; volume agents are a brand risk (sloppy sends go
  out in YOUR name; the 2025 11x reporting and Artisan churn
  complaints are the evidence base), while driftwood's sends are
  built to convert and to leave a good impression even on
  non-buyers (phrase as design intent, not a measured claim); they
  are a superset of us, we are niched with far higher-touch
  support.
- "Don't send slop" is an approved copy angle for these pages (his
  voice; the landing already uses "AI slop").
- Evidence discipline: "cheaper to start" is TRUE vs 11x (our
  published $1k floor vs their reported ~$5k/mo + implementation)
  and FALSE vs Artisan self-serve ($250/mo entry); never claim it
  generically. Contrarian never means unfair: named sources,
  both-sides reporting, and "when X is right" sections all stay;
  the stance shows in what we choose to compare, not in dunking.
- Visual layer (Aayush 2026-07-21, second round on the exemplar:
  copy approved, visuals rejected): pages must be scannable and
  clickable, not just rankable. Requirements: brand heading and
  type choices per design/design-language.md (the draft diverged);
  ONE consolidated top-of-page element, never stacked disclosure
  boxes; a slop-vs-not-slop graphic (his suggestion): a
  volume-agent email side by side with a driftwood send; wordiness
  is fine for SEO but the page must not LOOK wordy. Process rule:
  page-pattern research includes a SCREENSHOT-based visual audit of
  the exemplar sites vs ours; content-structure audits alone are
  half the job.

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
