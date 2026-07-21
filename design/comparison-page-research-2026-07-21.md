# Comparison-page design pattern research, 2026-07-21

**This is a PROPOSAL for Aayush's review. Nothing here has been applied
to any page.** Context: the five /alternatives/<competitor> pages
shipped 2026-07-21 from one prose template were called "a little too
sloppy". Before reworking them or building more, this doc studies 13
widely used competitor-comparison and alternatives pages, ranks what
works, and proposes a driftwood pattern.

Method: each page fetched and cataloged via WebFetch (structure,
artifacts, bias handling, data density). Caveat: WebFetch summarizes
through a small model and truncates very long pages; where a catalog is
lower-confidence it is flagged. The buying-agent side of this is
grounded in site/agentic-query-research-2026-07-21.md (verified
finding: buying agents distrust ranked listicles and want stage,
autonomy-model, and all-in-cost comparison columns).

---

## Part 1: findings per page

### 1. PostHog vs Amplitude (head-to-head)
https://posthog.com/blog/posthog-vs-amplitude

- Structure: "How is PostHog different" (3 claims) -> master feature
  table -> per-feature sections (product analytics, flags, experiments,
  replay, surveys), each a sub-table + prose -> price comparison with
  both vendors' pricing PHILOSOPHY explained -> integrations ->
  security -> "When to choose PostHog vs Amplitude" with per-team-type
  recommendations -> FAQ. Table of contents with jump links.
- Artifacts: one master matrix (columns PostHog | Amplitude, 10 product
  rows) plus nested per-feature tables. The load-bearing honesty device
  is structural: PostHog gives ITSELF X marks (Product Tours: PostHog ✗,
  Amplitude ✓; Revenue analytics: PostHog "Beta"). Qualification notes
  in cells ("Beta", "Add-on") instead of naked checkmarks.
- Voice: "(that's us)" style casual disclosure, no formal ethics box.
  Their handbook policy (posthog.com/handbook/marketing) is the real
  spec: be honest because competitors are assumed to be reading;
  fix mistakes fast; accept corrections from competitors; occasionally
  say when a competitor is the better fit. Internally they maintain
  "where PostHog wins / where PostHog is not suitable" per competitor.
- Data: specific free-tier numbers, dated price cuts (2024, 2025),
  named customers, "Jan 27, 2026" stamp. FAQ section. ~2,500+ words
  (bottom section truncated in fetch; the "choose Amplitude when you
  have dedicated analysts / need enterprise governance" framing is
  corroborated by third-party quotes of the page).
- Verdict: the best-in-class head-to-head. Honesty is implemented as
  table cells, not adjectives.

### 2. PostHog: The best Heap alternatives, compared (roundup)
https://posthog.com/blog/best-heap-alternatives

- Structure: 7 alternatives (PostHog first), then "Which should you
  choose", "Is PostHog right for you?", FAQ. TOC with jump links.
- The per-entry template is the finding. Every entry repeats exactly:
  metadata block (Founded / Similar to / Typical users / Typical
  customers) -> what is X -> key features -> "How does X compare to
  Heap?" table -> why companies use X -> "Bottom line" TLDR box.
  Identical repeated shape makes the page scannable and machine-
  extractable.
- Bias: PostHog is #1 with a wink disclosure. Competitors' gaps stated
  as facts, not sneers.
- Verdict: the best roundup template. The repeated per-entry shape +
  bottom-line box is worth stealing; the self-at-#1 is the one
  debatable move.

### 3. Zapier: The 6 best n8n alternatives in 2026 (roundup)
https://zapier.com/blog/n8n-alternatives/

- Structure: intro -> list of the 6 -> "What is n8n?" -> "at a glance"
  table (columns: Best for | Standout features | Pricing) -> six
  entries with 2-3 pros/cons bullets each -> "What's the best n8n
  alternative?" -> related reading. Jump links.
- Voice: the casual first-person disclosure is the standout: "Since I
  work at Zapier, it won't surprise you that I think it's the best n8n
  alternative out there", immediately followed by "the best automation
  tool is the one that fits your team." Human author, human jokes.
  n8n's strengths described fairly ("a ton of flexibility under the
  hood, with code nodes, conditional logic, loops, and webhooks").
- Weaknesses: Zapier ranks itself #1 and gets the longest, most
  promotional entry; its own listed con is trivial ("free plan limited
  to two-step workflows"); no dates on prices; no G2 data. ~2,800 words.
- Verdict: best disclosure voice in the set; self-ranking and soft
  self-cons keep it short of PostHog.

### 4. Ahrefs vs Semrush (head-to-head)
https://ahrefs.com/vs/semrush

- Structure: "How is Ahrefs better than Semrush" -> data superiority
  claims -> 18 exclusive-features subsections -> side-by-side table ->
  "Semrush got acquired by Adobe" jab.
- Artifacts: enormous data density (35T backlinks, 28.7B keywords, 77
  vs 22 API endpoints, Cloudflare Radar bot rankings dated July 2026,
  "44% of the Fortune 500") but the comparison table includes joke rows
  ("Brand name hard to pronounce", "Will upsell you Photoshop").
- Zero concessions, no FAQ.
- Verdict: proof that data density alone does not equal trust. The
  named third-party source (Cloudflare Radar, dated) is the one move
  worth keeping; the rigged joke table is the anti-pattern.

### 5. Ahrefs: Ahrefs Alternatives: 8 Reasons Budget Tools Don't Measure Up
https://ahrefs.com/blog/ahrefs-alternatives/

- A defensive "alternatives" page that names no real alternatives.
  Opens by mocking "SaaS tool slugfests", then runs one anyway via
  indirect superiority claims. ~2,000 words.
- Verdict: performative self-awareness without follow-through reads
  worse than honest bias. Occupying your own "X alternatives" SERP
  without actually listing alternatives burns the reader.

### 6. Intercom vs Zendesk (head-to-head landing)
https://www.intercom.com/compare-intercom-vs-zendesk

- Structure: hero -> social proof -> Fin AI sections -> comparison
  table -> pricing narrative -> testimonials -> 5-question FAQ.
- The comparison table is 5 rows of self-serving claims where Zendesk
  scores No on every row ("The highest-performing AI Agent": Intercom
  yes, Zendesk no). No pricing table, no concessions, headline claim
  ("Fin resolves an average of 76% of customer queries") with no
  methodology.
- Verdict: the canonical rigged-table page. Exactly the format the
  buying-agent research says agents discount. Nothing to steal except
  the collapsible FAQ.

### 7. Help Scout vs. Zendesk: A Deep-Dive Comparison
https://www.helpscout.com/compare/zendesk/

- Structure: "Quick look: who each is best for" AT THE TOP -> six
  feature-area comparison tables with G2/Capterra/TrustRadius ratings
  embedded -> channel pricing table -> both vendors' full pricing
  tables -> ease of use -> integrations -> scalability -> "Quick guide
  for choosing" (if/then decision statements) -> FAQ. ~3,500 words,
  dated March 12, 2026, named author.
- Concessions are specific and quotable: "Zendesk also offers
  enterprise-focused ticket management features that you won't find in
  Help Scout, such as SLAs and skill-based routing"; "Zendesk offers
  far more integrations overall" (nearly 2,000 vs ~100). Help Scout's
  own gaps listed plainly (phone/SMS via integration only, no
  community forums).
- Data: exact per-seat prices for both vendors including AI
  per-resolution pricing ($0.75 vs $1.50), cross-referenced review
  scores from three platforms, an implementation-timeline citation
  from a named consultancy.
- Verdict: the most complete honest head-to-head in the set, and the
  closest existing page to what the buying-agent research asked for.
  Verdict-first ordering + concessions with numbers + if/then chooser.

### 8. Linear: Switch to Linear (switch kit, not a comparison)
https://linear.app/switch

- Linear has NO Jira comparison page. The pattern is a migration kit:
  what's changing in the industry -> why switch -> named migration
  stories (Oscar Health moved 600 engineers off Jira in a month) ->
  how switching works -> pitch guide (for convincing your own team) +
  pilot guide + migration guide -> FAQ addressing contract/lock-in
  anxieties. Quantified outcomes (3.3x faster issue resolution).
- Verdict: a premium-brand alternative to comparison pages entirely:
  sell the migration, not the matrix. Not our pattern today (we need
  the SERP), but the "how to leave X" migration block is stealable as
  a section, and it is the strongest answer to "what do you do when
  a feature table would be a lie".

### 9. Notion compare-against pages (retired)
https://www.notion.com/compare-against/notion-vs-evernote

- Both fetch attempts (including en-gb) redirect to the generic
  homepage; the standalone compare pages appear retired. Search
  snapshots show they were thin marketing landings: G2 badges,
  checkmark claims, import CTA.
- Verdict: data point, not a model: thin brand-vs-brand landing pages
  get retired. The import/migration one-click CTA was their one
  durable idea.

### 10. Plausible vs Google Analytics 4 (head-to-head)
https://plausible.io/vs-google-analytics

- Structure: comparison table at top -> "What GA4 changed" (5 argued
  subsections) -> speed section -> **"What GA4 does better"** as a
  named H2 -> "Why isn't Plausible free while GA4 is free?" ->
  "Is Plausible right for you?" -> "Ready to switch?" TOC, ~2,500-3,000
  words.
- The concession section is verbatim-strong: "If you need deep custom
  attribution modeling or enterprise-scale reporting with SQL access,
  GA4, especially with BigQuery, has more depth... the tight
  integration between GA4 and Google's ad products is hard to
  replicate elsewhere." Plus an explicit not-for-you list: "Plausible
  is not the right fit for every use case."
- Data: 135KB vs 2.5KB script size, independent study citations
  (Orbit Media), dated regulatory rulings, though most claims are not
  hyperlinked to sources.
- Verdict: the best small-company template. One competitor, David vs
  Goliath, concessions as a named section, self-disqualification list,
  and the pricing objection ("why pay when X is free") answered
  head-on instead of dodged.

### 11. Smartlead: Smartlead vs Instantly + 6 more Instantly Alternatives (category roundup)
https://www.smartlead.ai/blog/instantly-alternatives

- The category's best page, and recent (June 2026). Structure: "How we
  evaluated" -> at-a-glance table (columns: Tool | Entry price |
  Unlimited mailboxes | Lead database | Dedicated infra | Master inbox
  | Outbound calls | Best for; Instantly as baseline row) -> "Where
  Instantly still wins, and three signs you have outgrown it" -> 7
  tool entries -> criterion-by-criterion head-to-head -> "The honest
  verdict" with paired decision trees ("Pick Smartlead if..." 8
  conditions / "Pick Instantly if..." 5 conditions) -> 5-step
  migration guide -> 12 FAQs -> testimonials.
- Disclosure verbatim: "Two disclosures before you keep reading. One,
  we built one of the alternatives on this list. We are not pretending
  to be neutral." And it pays it off: "Where Smartlead loses" is a
  real section ("SmartProspect is younger than Apollo's or Instantly's
  lead database... If search filter depth is a P0 requirement,
  validate both before committing"), and Instantly gets genuine
  credit ("First campaign live within 20 minutes is realistic").
- Failure modes: ~7,500 words, FAQ answers are recycled marketing copy
  ("transform cold emails into reliable revenue streams"), testimonial
  carousel filler, unverifiable self-metrics mixed in with real ones.
- Verdict: proof the honest pattern already entered our category. It
  wins on artifacts and disclosure and loses on bloat. Our opening is
  the same honesty at a quarter of the length, with dated pricing and
  stage/autonomy columns nobody in the category has.

### 12. lemlist vs Instantly (versus page)
https://www.lemlist.com/versus/lemlist-vs-instantly-ai-alternative

- Hero pitch -> "3 reasons to choose lemlist" -> feature table where
  lemlist has nearly every checkmark -> feature breakdowns -> "Which
  one should you pick?" -> CTA. ~1,200 words.
- It displays G2 ratings where Instantly OUTSCORES lemlist (4.8 vs
  4.6) with no comment, and the fetch found literal "Lorem ipsum"
  strings in nav dropdowns. No disclosure, no FAQ, no dates.
- Verdict: category baseline: templated, rigged, unfinished. This is
  the page our buyers have already seen ten of.

### 13. Woodpecker: Best Lemlist Alternatives (roundup) and Instantly: Smartlead alternatives (roundup)
https://woodpecker.co/blog/lemlist-alternatives/ and https://instantly.ai/blog/smartlead-alternatives/

- Woodpecker: no comparison table at all; itself listed #1 with 40%+
  of the space and no "challenges" section on its own entry while
  every competitor gets one; competitor user quotes chosen to wound
  ("After 8 months of using Salesloft, it's still not working as it
  should"). Prices present, un-dated. 10-question FAQ of generic
  answers.
- Instantly: decent skeleton (at-a-glance 4-tool table, TLDR box,
  pros/cons per entry, FAQ, terminology glossary) but ZERO prices
  anywhere ("Flat-fee" / "Per-seat" labels only), one soft self-con,
  and competitors relegated to narrow-use-case boxes.
- Verdict: the two standard category moves: self-first bias (Woodpecker)
  and price-free vagueness (Instantly). Both are exactly what the
  agentic research says gets discounted.

---

## Part 2: synthesis

### What works, ranked

1. **Concessions as structure, not adjectives.** Named sections and
   table cells that go against the author: Plausible's "What GA4 does
   better" H2, PostHog's ✗ marks against itself, Help Scout's "far
   more integrations overall" for Zendesk, Smartlead's "Where
   Smartlead loses". Every page that feels trustworthy does this
   structurally; every page that feels like marketing does it with
   hedged adjectives or not at all. (Proof: Plausible, PostHog x2,
   Help Scout, Smartlead.)
2. **A decision-relevant at-a-glance table near the top.** Not a
   feature checkmark matrix: columns that map to the buyer's actual
   decision (Best for / Entry price / infra model at Smartlead and
   Zapier; channel pricing at Help Scout). This is also literally
   what buying agents asked for (stage, autonomy, all-in cost).
   (Proof: Smartlead, Zapier, Help Scout; anti-proof: Intercom,
   lemlist checkmark tables.)
3. **Paired "Pick X if / Pick Y if" checklists with concrete
   conditions.** The single highest-trust closing artifact, and the
   exact shape an AI answer engine lifts into a response. (Proof:
   Smartlead's honest verdict, Help Scout's quick guide, Plausible's
   "Is Plausible right for you"; PostHog's per-team-type
   recommendations.)
4. **Named, dated, third-party-attributed facts.** Cloudflare Radar
   dated July 2026 (Ahrefs), G2/Capterra/TrustRadius scores
   cross-referenced (Help Scout), independent study citations
   (Plausible), exact both-sided pricing with per-resolution AI costs
   (Help Scout). Dates and named sources are what separate citable
   data from recycled numbers, and year-stamping is confirmed agent
   bait. (Proof: Help Scout, Plausible, Ahrefs; anti-proof:
   Instantly's price-free page.)
5. **Early, casual, human disclosure that the page then pays off.**
   "Since I work at Zapier, it won't surprise you..." / "We are not
   pretending to be neutral." Disclosure alone is cheap; it works when
   the rest of the page spends it (a real self-cons section, real
   competitor credit). (Proof: Zapier, Smartlead, PostHog; anti-proof:
   Ahrefs' alternatives page, which discloses the genre's sins and
   commits them anyway.)

Also worth keeping: the repeated per-entry template with a bottom-line
box (PostHog roundup); the migration/how-to-leave block (Smartlead's
5 steps, Linear's whole page); answering the awkward objection head-on
(Plausible's "why isn't it free").

### What doesn't work

- **Rigged checkmark tables** where the author sweeps every row
  (Intercom's 5-row all-No table, lemlist's matrix, Ahrefs' joke
  rows). Instantly discounted by skeptical readers and buying agents.
- **Self-first with unequal depth**: Woodpecker giving itself 40% of
  the page and no self-criticism; Zapier's own con being trivial.
- **No prices, no dates** (Intercom, Instantly, Zapier's undated
  prices). A comparison page without numbers is a brochure.
- **Bloat and recycled copy**: Smartlead's 7,500 words, marketing-copy
  FAQ answers, testimonial carousels; lemlist shipping lorem ipsum.
- **Claims without methodology** ("Fin resolves 76% of queries").
- **Thin brand-vs-brand landings** age badly (Notion retired theirs).

### Where the category baseline is weak (our opening)

The cold-outbound category has exactly one honest, artifact-rich page
(Smartlead's, June 2026) and it is bloated and self-hosted-metric
heavy. Nobody in the category has: stage-keyed fit columns, an
autonomy-model column (autonomous vs approve-before-send vs DIY), a
who-approves-sends distinction, all-in cost with as-of dates, or a
disclosed fact-check cadence. That is precisely the un-served format
the tool-evaluator agent probe asked for ("NOT another ranked
listicle... real all-in cost, autonomy model, company-stage fit").
Being the honest, dated, stage-keyed page in a category of rigged
tables is an available position, and we already run the monthly
fact-check rotation that makes the dates credible.

---

## Part 3: proposed driftwood comparison-page pattern

Applies to /alternatives/<competitor>. /best-ai-sdr-tools would adopt
the same table columns in its own rework (separate proposal; the
ranked-list format there is the one agents distrust).

Keep the current template's bones. The shipped pages already have the
right skeleton (disclosure first, "what X is good at", "where X falls
short", entries with Best for lines, "when X is right", FAQ, schema).
What is missing is artifacts: there is not a single table on the page,
pricing lives in dense paragraphs, and there is no verdict a skimmer
or an agent can lift. The rework adds three tables and one checklist
box and tightens the prose around them.

### Exact section order

1. **H1 + byline + updated line** (keep). Updated line gains the
   fact-check date explicitly: "Updated July 2026. Prices checked
   2026-07-21; this page gets a monthly fact-check."
2. **Disclosure box** (keep, unchanged position: first thing after the
   byline). Same copy pattern as today.
3. **Verdict box (NEW).** 4-6 sentences, tide-wash panel, directly
   under the disclosure: what <X> actually is (its layer of the
   stack), who should just stay on <X>, the one or two real reasons
   people leave, and one sentence on where driftwood fits with its
   concession attached. This is the TLDR the skimmer and the answer
   engine take.
4. **At-a-glance table (NEW, the core artifact).** One row per tool
   (anchor competitor first as the baseline row, then the
   alternatives). Columns:
   - Tool
   - What it is (data layer / sending infra / autonomous AI SDR /
     assisted AI SDR / all-in-one)
   - Who approves sends (you per-send / you set rules / no one, it
     sends autonomously)
   - Entry price (as of Jul 2026)
   - What you still need to buy (the honest all-in signal)
   - Best stage (pre-PMF founder / small team / scaled team / agency)
   The driftwood row carries the "our tool" chip and its Best-stage
   cell stays narrow and honest (founders and small teams whose
   product demos well). This table IS the stage/autonomy/all-in-cost
   answer the agent research asked for.
5. **What <X> is, and what it is genuinely good at** (keep as is).
6. **Where <X> falls short, and for whom** (keep the segment blocks).
7. **The alternatives** (keep entry list + driftwood card). Tighten
   each entry to: one paragraph positioning against the anchor, one
   pricing sentence with as-of date, Best for line. The pricing
   sentence references the snapshot table instead of restating tiers.
   Driftwood's entry keeps its concession paragraph; that paragraph is
   load-bearing, not optional.
8. **Choose <X> if / choose driftwood if (NEW).** Paired checklist
   box replacing the current "When X is the right choice" prose wall:
   a two-column (stacked on phone) pair of bulleted conditions, 4-6
   per side, each concrete (team size, stage, budget, whether data or
   sending or the whole motion is the bottleneck). The <X> side must
   contain conditions we would genuinely concede, phrased plainly.
   One short intro sentence of prose survives from the old section.
9. **Pricing snapshot table (NEW).** Rows: anchor + each alternative +
   driftwood. Columns: entry plan and price / what it includes / what
   it does not include / as-of date. This is where the monthly
   fact-check rotation writes; the dateModified in Article schema
   bumps on every check. Driftwood's row states our published range
   plainly ($1-5k, per the published FAQ pricing) rather than "custom".
10. **FAQ** (keep, plus one symptom-phrased question per page where
    honest, e.g. "Is <X> why my reply rate is under 1%?" only if we
    can answer without blaming the competitor for physics).
11. **CTA** (keep).
12. Footer (keep).

### Artifact list worth building (once, as shared CSS in the template)

- `table.compare-glance`: the at-a-glance table. Hairline `--line`
  borders, sentence-case gray labels per design language, no pills,
  no checkmark iconography. Words in cells ("you approve every send"),
  never bare ✓/✗: checkmark matrices are the category's rigged
  artifact and we should not resemble them.
- `.verdict`: tide-wash box, same construction as `.disclosure`.
- `.choose-pair`: the paired choose-if checklist, two stacked lists
  with plain bullets.
- `table.compare-pricing`: the pricing snapshot with an as-of column.
- A one-line corrections invitation under the pricing table: "Work at
  one of these companies and see something out of date? Email
  aayush@driftwood.sh and we will fix it." (PostHog's accept-
  corrections policy, implemented cheaply. It is a trust signal and a
  freshness mechanism.)

Explicitly NOT building: competitor UI screenshots (licensing unclear,
flagged below; also our design language demands pixel-real artifacts,
which we cannot honestly produce for competitor products), feature
checkmark matrices, review-quote carousels, star-rating widgets,
decision-tree graphics (the choose-if pair does that job in text).

### What to CUT from the current template

- Pricing tier recitations duplicated across body prose AND FAQ AND
  (now) the snapshot table. Numbers live once, in the table; prose
  and FAQ reference it. This is the biggest source of the current
  pages' "wall of prose" feel and of monthly-fact-check drift risk.
- The "When <X> is the right choice" prose paragraph collapses into
  the choose-if pair plus one intro sentence.
- Any entry sentence that restates the at-a-glance row without adding
  positioning ("X starts at $Y a month" alone is now table content).
- Nothing else: length target stays roughly current (1,800-2,200
  words of prose plus the tables). We are not building 7,500-word
  Smartlead pages.

### How the pattern stays honest (policy, so future agents cannot drift)

- Disclosure stays the first block after the byline, before any
  claims. Current copy pattern is good; keep it.
- Concession floor: driftwood never appears anywhere on the page
  (verdict box, entry, choose-if pair) without at least one concrete
  concession attached ("it is early", "does not replace <X> for
  <X's actual job>", the narrow Best-stage cell). The choose-<X> side
  of the pair must be real conditions, not strawmen ("choose X if you
  enjoy configuring things" is banned).
- Symmetry rule: competitor strengths get the same specificity as
  their weaknesses (numbers, named features). If a competitor
  outscores us on something public (G2 and the like), we either show
  it or do not cite that source anywhere on the page; selective
  citation is lemlist's move.
- Every number carries "as of <month year>"; the monthly fact-check
  updates the as-of dates and dateModified, and the corrections email
  line stands on every page.
- No claim about a competitor sourced only from another vendor's
  comparison page; primary sources (their pricing page, their docs)
  or named third parties only. (Already our practice per SEO.md's
  Apollo primary-sourcing note; now stated as pattern policy.)
- Words not marks: in tables, autonomy and approval are described in
  words per row, so no row can be silently rigged.

### Constraint compliance notes

- Self-contained static HTML: the three tables and two boxes are pure
  HTML/CSS inside the existing single-file pattern; no JS added.
- Tokens: tide-wash panels, `--line` hairlines, `--r-win` radius,
  existing type scale. No new colors, no second accent. Tables use
  gray sentence-case labels (design-language label rules).
- No em dashes, flat voice, no "supercharge" vocabulary, stat verbatim
  per LISTINGS.md wherever the Autosana number appears.
- Schema: keep Article + ItemList + FAQPage. Tables stay semantic
  `<table>` elements (machine-extractable). Bump dateModified on
  every fact-check.

---

## Part 4: open questions for Aayush

1. **Driftwood's position in the list.** PostHog puts itself #1;
   Smartlead puts the anchor competitor first as the baseline and
   itself second. Current pages put driftwood #1 with a card. Proposal
   keeps driftwood #1 in the entry list (with the concession paragraph
   doing the honesty work) but makes the ANCHOR competitor row 1 in
   both tables. Comfortable with that split, or move driftwood off #1
   in the list too?
2. **Competitor UI screenshots**: proposal is to skip entirely
   (licensing unclear, and our artifact rule says pixel-real or
   nothing). Confirm, or is there a case you want them?
3. **All-in cost**: list prices are safe; a true all-in monthly figure
   requires assumptions (mailboxes, data credits, seats). Proposal
   ships a "what you still need to buy" column (qualitative, safe)
   rather than modeled dollar totals. Want modeled totals with stated
   assumptions instead? They are more citable but higher maintenance
   and easier to dispute.
4. **Third-party review scores**: cite G2/Capterra numbers for
   competitors (Help Scout style)? We barely have G2 presence, so
   symmetry means showing established competitors' strong scores
   while we show none. Proposal: skip ratings until our G2 page has
   real reviews, then revisit.
5. **Driftwood pricing row**: the snapshot table is most honest if our
   row shows the published $1-5k range from /faq. Confirm you want
   that number restated on five competitor pages (monthly fact-check
   would keep them in sync).
6. **Head-to-head pages later?** "driftwood vs <X>" is a different
   page type targeting different queries (lemlist/versus, Help Scout
   /compare, PostHog /vs). Not proposed now; flagging that the
   pattern above is roundup-only and a vs-template would be a second,
   smaller proposal if the queries ever justify it.
7. **Migration blocks**: Smartlead's 5-step "how to leave Instantly"
   and Linear's switch kit are strong trust artifacts, but for most of
   our five anchors a switch to driftwood is not a like-for-like
   migration (different layer of the stack). Proposal: omit for now,
   revisit per-page where a real switching story exists (Instantly,
   Artisan, 11x). Agree?
