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

## Status log

- 2026-07-15: mechanical on-site fixes shipped (5a14132, d8ecfa4, 9d98639):
  og tags, AI SDR vocabulary in JSON-LD + llms.txt, /og noindex,
  build-stamped sitemap lastmod, sameAs=LinkedIn company page,
  speed-insights removed. GSC + Bing registered (Aayush). Firewall clean
  for AI crawlers. Phase 0 drafts in design/ awaiting review.
