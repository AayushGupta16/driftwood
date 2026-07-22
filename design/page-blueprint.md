# Page blueprint (approved 2026-07-21, Aayush, after four rounds)

The APPROVED style blueprint for ALL driftwood.sh SEO/GEO pages. The
living reference is the shipped exemplar:
landing/public/alternatives/11x/index.html. New or rebuilt pages copy
its CSS system verbatim and adapt content. History of the four
feedback rounds that produced it: SEO.md (stance map + visual layer)
and design/visual-audit-2026-07-21.md.

## Layout system (copy from the exemplar, do not reinvent)

- ONE text edge: .wrap 46rem holds everything readable (H1, byline,
  deck, disclosure, jump nav, headings, prose, FAQ, checklists).
- Breakout .wrap-wide 68rem, symmetric, for TABLES and GRAPHICS only
  (matches the header wordmark edge). Captions left-align to their
  table's text edge. No third edges.
- Vertical spacing tokens (xs/s/m/l/xl in :root): tight inside a
  block, distinct step to nav, large consistent gaps between H2
  sections, extra around sea strip and CTA. Never ad-hoc margins.
- Fluid root sizing per the landing; labels/bylines gray #6a737d.
- Mobile: nothing overflows at 390px (grid children need min-width:0
  when they contain wide tables).

## Top of page (hard rules)

H1 (brand clamp scale, one Georgia-italic em.voice phrase) -> byline
-> updated + fact-check line -> 2-3 sentence PLAIN deck (no box, no
tint, ever; boxes at the top were rejected twice) -> one casual gray
disclosure line (comparison pages only) -> one-line "On this page:"
jump nav on the text edge.

## Artifacts (the scannability layer)

- Glance table near the fold: words in cells, never checkmarks, max
  5-6 columns.
- Pull-stat pairs as designed large-number moments (the verbatim stat
  sentence rides as caption; the verbatim form appears exactly once
  per page).
- The window-pair graphic (slop send vs driftwood send), ported from
  the exemplar/homepage artifact; caption register matches the page
  tier.
- One wash-sheet-tinted section per page max; one static sea strip
  with the duck above the CTA (design-language.md sea rules are HARD
  rules).
- Paragraphs 2-4 lines with bold run-in leads, through the FAQ.
- FAQ questions are page-unique; JSON-LD always mirrors visible text.

## Voice tiers (comparison pages; stance map in SEO.md governs)

- Contrarian (Artisan, 11x): deck states the replace-humans vs
  help-humans disagreement; head-to-head table (Built for / What the
  message carries / A good week / A bad week / Entry cost / Support);
  "The slop problem" section grounded in that competitor's own
  sourced receipts. Never dunking: named sources, both-sides
  reporting, when-X-is-right stays. Cheaper-to-start claimable vs
  11x only, never vs Artisan ($250 entry).
- Complimentary (Amplemarket, and per stance map): honest-routing
  deck, neutral head-to-head, NO slop section; "for most readers,
  keep X" honesty where true (Apollo).
- All tiers: plain flat sentences that argue something; never
  punchy-clever, never limp-neutral; "honest" at most once per page.

## Copy gates (unchanged, every page)

Stat verbatim exactly once: "replies went from under 1% to over 14%
in week one at Autosana (YC S25)". No em dashes. Never "personalized
video"/"personalized landing page". Case-study CTO/company unnamed.
"driftwood (driftwood.sh)" on first body mention. Demo-led outbound
is the wedge; human review is a fact, never an identity.

## Process (every ship)

Build agents do not touch the shared browser; a verification pass
screenshots fold + full at 1440x900 plus a 390px overflow check, and
visual QA measures alignment edges and spacing with coordinates, not
just fold contents. Orchestrator greps the copy gates before commit.

## Rollout state

Wave 1 (2026-07-22): 11x SHIPPED (the exemplar itself); Artisan,
Instantly, Clay, Apollo, /best-ai-sdr-tools rebuilt to blueprint.
Wave 2 (owed): founder-led-sales, cold-outbound-benchmarks,
b2b-saas-outreach, ai-sdr (incl. the positioning recut of its
driftwood sections), demo-led-outbound, faq, customers/autosana.
Non-comparison pages drop the disclosure line and use the graphic
where it earns its place.
