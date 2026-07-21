# GEO/SEO plan — driftwood.sh

Owner: Claude (execution) + Aayush (approvals, founder content).
Baseline sweep + plan audit: 2026-07-15. Re-run the sweep monthly.

## Baseline findings (2026-07-15)

- driftwood.sh is indexed but cited nowhere: no listicle, directory, or
  category page mentions it.
- The "AI SDR" citation pool that ChatGPT/Perplexity draw from is mostly
  vendor-authored listicles (autobound.ai, unifygtm.com/explore,
  saleshandy.com, amplemarket.com, knock-ai.com, fundraiseinsider.com) plus
  two real category pages: g2.com/categories/ai-sdrs and
  producthunt.com/categories/ai-sdr. Inclusion is pitchable; there is no
  neutral gatekeeper. Generic AI directories (Futurepedia etc.) are noise.
- Cited competitor set: 11x (Alice), Artisan (Ava), AiSDR, Qualified (Piper),
  Regie, Unify, Clay, Topo, Amplemarket, Autobound. None claim the
  custom-demo-per-prospect wedge. Wording landmine: SDRCloud.ai claims 1:1
  landing pages/videos per signal, so driftwood's phrasing is always
  "a working demo of your product, built for their business", never
  "personalized video" or "personalized landing page".
- Name collision: driftwood.ai is a research org, driftwood-ai.com is a
  consulting firm. Entity rule: every listing/blurb says
  "driftwood (driftwood.sh)" plus a category qualifier.
- "Demo-led outbound" has zero exact-match usage anywhere: coinable. The
  legitimizing analog is Unify's "product-led outbound".
- The 14x Autosana stat goes verbatim into every listing and pitch; answer
  engines preferentially cite pages with specific numbers.

## Goals

1. 30 days, entity: "driftwood AI SDR" / "driftwood.sh" resolve to us, not
   the .ai squatter or the consultancy.
2. 90 days, citations: present in >=3 citation-pool pages (2 listicles +
   G2 or Product Hunt); mentioned for some tracked category prompts.
3. 90-180 days, the term: AI engines answer "what is demo-led outbound"
   with driftwood as the definer.
4. Ongoing, attribution: book_demo tagged by channel in PostHog (AI
   referrers: chatgpt.com, perplexity.ai, gemini; plus organic).

## Decisions (Aayush, 2026-07-15)

- New pages: YES, but not linked from the homepage body. Footer links
  APPROVED (quiet row in the existing footer); homepage body untouched.
- Crunchbase and similar directories: approved. Blurb kit in LISTINGS.md.
- Category vocabulary: "demo-led outbound" (ours, coined) + AI SDR +
  GTM agent + revenue agent.
- Ranked comparison page naming competitors: YES.
- G2 and directories: list now. Product Hunt: soon, his timing.
- Yuvan will post a G2 review once listed.
- Backlinks: never paid. Free paths only: listicle inclusion pitches,
  directories, Autosana cross-link, journalist-request platforms
  (Qwoted/Featured), HN/newsletters for the 14x story.
- Prompt tracking: OpenRouter keys (fleet config) cover OpenAI models.

## Phases

- **Phase 0, on-site (drafts in design/, then build):** definitional
  homepage line + footer treatment; /customers/autosana case study
  (CTO and his company stay redacted, hard rule); /demo-led-outbound
  definition page; /faq with FAQPage schema; /best-ai-sdr-tools ranked
  comparison. Sitemap + llms.txt grow with each page; prerender covers
  every new route.
- **Phase 1, entity + citations:** Crunchbase, G2 listing + Yuvan review,
  TAAFT, Product Hunt (Aayush's go), inclusion pitches to Autobound /
  Saleshandy / Knock / Fundraise Insider with the 14x stat verbatim
  (candidate for dogfooding through a driftwood agent, human-approved).
- **Phase 2, measurement:** monthly prompt-set share-of-voice run
  (~20 prompts, Claude + OpenRouter), weekly GSC/Bing once data flows,
  PostHog AI-referral channel tagging on book_demo, monthly sweep re-run.
- **Phase 3, founder content:** LinkedIn company-page posts, 14x story as
  digital PR, Show HN at launch. Aayush's voice; Claude drafts only.

## Maintenance rules

- The comparison page carries an "Updated July 2026" line: refresh it with
  each monthly sweep (vendor positioning drifts fast; the 2026-07-15
  fact-check already caught Unify=warm outbound, Regie=RegieOne,
  Autobound pivoted to a signal data layer).
- New pages live as landing/public/<route>/index.html, self-contained
  static HTML served ahead of the SPA rewrite. Adding a page = new dir +
  sitemap URL + llms.txt line + footer link decision.
- FAQ publishes the $1k-5k/month range (Claude's call on Aayush's
  delegation, 2026-07-15). If pricing strategy changes, edit
  public/faq/index.html (visible copy AND the FAQPage JSON-LD).

## Status log

- 2026-07-15: mechanical on-site fixes shipped (5a14132, d8ecfa4, 9d98639):
  og tags, AI SDR vocabulary in JSON-LD + llms.txt, /og noindex,
  build-stamped sitemap lastmod, sameAs=LinkedIn company page,
  speed-insights removed. GSC + Bing registered (Aayush). Firewall clean
  for AI crawlers. Phase 0 drafts in design/ awaiting review.
- 2026-07-15 (later): Phase 0 SHIPPED (5b36014). Four pages live
  (/customers/autosana, /demo-led-outbound, /faq, /best-ai-sdr-tools),
  competitor copy fact-checked same day, homepage footer gains the
  definitional line + links row, sitemap at 5 URLs, llms.txt lists the
  pages. Remaining: Crunchbase + G2 (Aayush), Yuvan G2 review, TAAFT,
  listicle pitches, prompt-tracking cron, PostHog channel tagging.
- 2026-07-20/21 (overnight session): Phase 1 largely DONE via browser
  automation. Crunchbase live (driftwood (driftwood.sh), founder, SF,
  2026). G2 approved same-day, Aayush = profile admin, review invite
  sent to Yuvan through G2's form. TAAFT: now fee-gated, SKIPPED per
  never-paid rule. alternateName ["driftwood.sh", "Driftwood AI SDR"]
  added to Organization/WebSite JSON-LD. GSC finding: the site IS
  indexed; authority, not indexing, is the bottleneck. Inline Cal.com
  booking shipped to prod (all CTAs anchor to #book; new
  booking_calendar_open/booking_confirmed events). STAT REFRAMED by
  Aayush: "replies went from under 1% to over 14% in week one at
  Autosana (YC S25)" + "including founders who had ignored more than
  four months of prior outreach" replace the 14x form; LISTINGS.md is
  canonical. Keyword research done in Keyword Planner (111 terms, 3
  rounds, ads/research-keyword-volumes-2026-07-20.md): head terms
  confirmed but STRATEGY PIVOT per Aayush - compete on the long tail in
  seed/Series-A founder + early-Head-of-Growth vocabulary, keep head
  pages as destinations. Flagship long-tail find: "founder led sales"
  (100-1K, Low comp). Money cluster: "outsourced sdr" (100-1K, $36-135
  CPC). Drafts in flight: /ai-sdr (ready for review),
  /founder-led-sales, /cold-outbound-benchmarks, /outsourced-sdr,
  match-audit proposal, outreach pitch drafts. Remaining on Aayush:
  draft reviews, Autosana cross-link ask, a16z directory ask, sending
  pitches.
