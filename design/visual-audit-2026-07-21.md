# Visual audit: comparison pages, 2026-07-21

Screenshot-based design audit feeding the visual rebuild of the
/alternatives pages. Context: Aayush approved the v2 draft's copy but
rejected its visuals ("doesn't follow my brand's heading/styling
choices, not scannable, no graphic, two big disclosures at top look
super weird"). This doc adds the visual layer on top of
comparison-page-research-2026-07-21.md (content layer) and measures the
draft against design-language.md and the live homepage.

Method: every page shot at 1440x900, viewport ("-fold") plus full-page
("-full") JPEGs in `audit-shots/`. Caveats on the full-page shots:
PostHog renders in an inner scroll container so its full shot equals
the fold shot; Help Scout and Smartlead's full shots repeat the top of
the page near the bottom (their layout re-renders under fullPage);
lazy-loaded images render blank in fullPage captures (same caveat
design-language.md already records for our own baked-asset QA).

## Screenshot inventory (site/design/audit-shots/)

| File | Page |
|---|---|
| posthog-vs-amplitude-fold.jpeg / -full.jpeg | posthog.com/blog/posthog-vs-amplitude (full == fold, scroll container) |
| helpscout-vs-zendesk-fold.jpeg / -full.jpeg | helpscout.com/compare/zendesk/ |
| plausible-vs-ga4-fold.jpeg / -full.jpeg | plausible.io/vs-google-analytics |
| smartlead-instantly-alternatives-fold.jpeg / -full.jpeg | smartlead.ai/blog/instantly-alternatives |
| zapier-n8n-alternatives-fold.jpeg / -full.jpeg | zapier.com/blog/n8n-alternatives/ |
| driftwood-live-alternatives-11x-fold.jpeg / -full.jpeg | driftwood.sh/alternatives/11x (shipped page) |
| driftwood-homepage-fold.jpeg / -full.jpeg | driftwood.sh (brand reference) |
| driftwood-draft-v2-fold.jpeg / -full.jpeg | design/draft-page-alternatives-11x-v2.html (local preview, since deleted) |

Page heights at 1440w: Help Scout 19,714px, Smartlead 23,022px, Zapier
18,435px, Plausible 7,987px, our draft 10,154px, our live page 6,120px,
homepage 5,712px.

---

## Part 1: the five external pages, as visual design

### 1. PostHog vs Amplitude (posthog-vs-amplitude-fold.jpeg)

Pros
- The right-rail "Jump to:" TOC is the best scannability device in the
  set: every H2 and sub-item visible from the first screen, so the
  page's depth is legible before you read a word.
- Custom illustration at the very top (hand-drawn hedgehog wrapped
  around the Amplitude logo, yin-yang composition). Decorative rather
  than informative, but unmistakably theirs; the fold cannot be
  confused with any other vendor's blog.
- Clear type contrast: large bold H1, roomy bold H2s, short paragraphs.
  Byline with two author avatars, date, and a category link directly
  under the H1.
- Disclosure handled inline in prose ("(that's us)" tone), no box at
  all. The honesty lives in the table cells (self X marks), so the top
  of the page carries no apology furniture.

Cons
- Extremely busy chrome: left blog-post rail, right TOC, game-style
  icon sidebars both sides, grass-texture background. Works only
  inside PostHog's dev-culture brand; the article column ends up
  narrow and squeezed.
- The illustration says nothing about the comparison; it is brand
  charm, not evidence.

Above the fold: yes, you keep reading; the TOC promises depth and the
illustration promises personality.

### 2. Help Scout vs Zendesk (helpscout-vs-zendesk-fold.jpeg, -full.jpeg)

Pros
- Calm, confident fold: centered two-line heavy H1, avatar byline with
  date, then a full-width branded gradient hero graphic holding both
  products' marks. Reads as a considered editorial page, not a landing
  page.
- "Quick look: who is Help Scout best for vs. who is Zendesk best for?"
  is the first H2, immediately after a three-line intro. Verdict-first
  ordering is visible in the scroll thumbnail alone.
- Third-party data rendered as designed artifacts: G2 ratings become a
  card of circular gauges on a tinted panel with a caption, one per
  feature section. Repeatable section rhythm: H2, ratings graphic,
  prose, bullets, concession sentence.
- Tables are words and dollars in cells, zebra striping, hairline
  borders, small gray header row. The closing summary table states
  balanced pro/con phrases per row, no checkmark iconography anywhere.

Cons
- 19,714px with no jump nav; you scroll blind through six feature
  areas.
- The repeated ratings-graphic shape dulls by the fourth occurrence.
- H3s ("Channel pricing comparison") sit close to body size, so
  mid-page hierarchy relies on the tables, not the type.

Above the fold: yes; the hero graphic plus verdict-first H2 signal
effort and fairness at once.

### 3. Plausible vs GA4 (plausible-vs-ga4-fold.jpeg, -full.jpeg)

Pros
- The comparison table IS the fold: big left-aligned four-line H1, two
  short paragraphs, then straight into an 8-row table. Tiny uppercase
  column labels, hairline row separators only, no fills, and every
  cell is a word ("No", "Yes", "Rarely", "From 3 years"). The most
  scannable first screen in the set.
- One graphic, and it is informative: side-by-side product screenshots
  (Plausible dashboard vs GA4 interface) with bold labeled bullets
  under each ("Clean, simple dashboard" vs "Complex interface"). The
  argument is made visually in one artifact.
- Attributed customer quotes (italic, named, titled) as trust devices
  right under the table; numbered nested TOC card after the graphic.
- From there a pure typographic essay: bold H2/H3, 2-4 line
  paragraphs, inline links as the only color. "What GA4 does better"
  is a plain H2 you can spot in the thumbnail. Single accent color
  throughout. Closing CTA gets the one display-type moment (second
  line in accent purple).

Cons
- After the fold there are no visual landmarks for 5,000px; every
  section has identical texture, so you navigate by reading.
- TOC is not sticky and is placed after the graphic rather than before.
- The screenshot pair carries no caption or date.

Above the fold: the strongest data-first fold of the five; a skimmer
gets the entire verdict without scrolling.

### 4. Smartlead Instantly-alternatives (smartlead-instantly-alternatives-fold.jpeg, -full.jpeg)

Pros
- Sticky right-rail "Table of Content" on a tinted panel with nested
  numbered entries; combined with the H1 and "Updated On: June 29,
  2026" line, structure and freshness are visible immediately.
- Disclosures as short prose sentences with rhythm ("Two disclosures
  before you keep reading. One, ... Two, ..."), not boxes. The page's
  candor costs zero visual weight at the top.
- The at-a-glance table marks bias structurally: Instantly's row wears
  a "BASELINE" chip, Smartlead's row wears "OUR PICK" plus a tinted
  highlight and left accent bar. Self-interest is a designed, honest
  element instead of a hidden thumb on the scale.
- Green check bullets for the "you are probably here because" triage
  list give the intro one scannable moment.

Cons
- The 8-column glance table is cramped: ~55px columns, heavy wrapping,
  6.5pt-feel text. Right idea, too many columns.
- Generic purple flat-illustration featured image (stock characters
  high-fiving). It is the hero-image equivalent of AI slop and
  cheapens an otherwise honest page.
- 23,022px long; the TOC is the only thing holding it together.

Above the fold: mixed; the checklist and TOC promise structure, the
stock illustration undermines it.

### 5. Zapier n8n-alternatives (zapier-n8n-alternatives-fold.jpeg, -full.jpeg)

Pros
- Fold: breadcrumb, category tag + "11 min read", huge centered serif
  H1, byline + date, share icons, then a hero graphic that is simple
  and informative: a tilted grid of competitor logo tiles. Cheap to
  produce, on-brand, and it says "roundup" at a glance.
- The at-a-glance table has only FOUR columns (Tool / Best for /
  Standout features / Pricing): decision-relevant and legible, the
  anti-pattern to Smartlead's 8-column cram. Zebra rows, hairlines.
- Repeated per-entry shape with strong anchors: use-case-phrased H2,
  tool-name H3 link, real product-UI screenshot in a rounded window,
  bold micro-labels "Zapier pros:" / "Zapier cons:", then a bold
  "Zapier pricing:" line. You can skim the whole list reading only
  bold fragments.
- Warm off-white ground and a comfortable single-column measure.

Cons
- Inline promo cards (orange Enterprise box, mint "Automate your
  entire tech stack" CTA banner) chop the article rhythm and read as
  ads inside the editorial.
- Jump-link list is plain links in the flow, easy to scroll past.

Above the fold: yes; H1 + logo-tile graphic communicates the entire
genre in one screen.

---

## Part 2: our pages

### Homepage, the brand reference (driftwood-homepage-fold.jpeg, -full.jpeg)

What the brand actually looks like at 1440:
- Hero H1: Public Sans, weight 600, `clamp(1.9rem, 1.1rem + 2.4vw,
  2.6rem)` (41.6px at this width), line-height 1.16, letter-spacing
  -0.014em, ink `#16181b`, with one Georgia-italic tide-blue voice
  phrase (`em.voice`): "Ship a *custom demo* in every cold message."
- Section H2s: the design-language heading scale `clamp(2rem, 1.2rem +
  2.8vw, 3.2rem)` = ~51px here, weight 600, line-height 1.12, again
  one voice phrase each ("Don't send out *AI slop*.", "The agent does
  the *whole job*.", "See what we'd send *your* prospects."), with a
  small gray support line underneath.
- Every headline is paired with a pixel-real artifact window (hero
  dashboard, slop-vs-driftwood message pair, Slack thread, Cal embed),
  1px `line` border, 12px radius, soft shadow.
- Rhythm devices: ASCII sea strips at section seams with the duck/log
  scenery, a wash-tint sheet for the closing section, and the deep
  navy footer docking on a wave-scallop edge. Buttons are tide pills.
- The one existing comparison artifact on the site is the homepage's
  labeled side-by-side: "what everyone else sends" vs "what driftwood
  sent", two windows under small tide/gray labels.

(Aside, out of scope for this audit: the hero support line under
"Don't send out AI slop." still reads "Same leads, 14x the replies";
the stat was reframed to the under-1%-to-over-14% wording elsewhere.
Flagged for the copy owner.)

### The live page (driftwood-live-alternatives-11x-fold.jpeg, -full.jpeg)

- Fold: header, H1 "11x alternatives" (41.6px, no voice phrase),
  gray-light byline, updated line, ONE tide-wash disclosure box, then
  gray prose. No table, no graphic, no jump nav anywhere on the
  6,120px page.
- H2s are fixed 1.45rem (23.2px), weight 600: blog-generic size, less
  than half the homepage's section-heading scale. Entry H3s 1.15rem,
  body 1.02rem; the entire type system spans ~7px, so the scroll
  thumbnail is uniform gray texture.
- The only designed moments are the disclosure box, the driftwood
  entry card with its "our tool" chip, and the numbered entry list
  (big gray numerals, which do help). "When 11x is the right choice"
  and the FAQ are unbroken prose walls. Zero tables; every price lives
  inside a paragraph.
- Verdict as design: a competent, compliant text page (right tokens,
  right button, right footer) that shares no visual DNA with the
  homepage beyond the header/footer chrome.

### The draft (driftwood-draft-v2-fold.jpeg, -full.jpeg)

What v2 adds over live: the at-a-glance table (words in cells,
driftwood row chip), the h2h mini-table inside driftwood's entry, the
choose-if pair cards, the pricing snapshot table with corrections line,
and the second tide-wash box ("The short version"). All the right
CONTENT artifacts; visually it keeps live's type system and stacks the
new material into the same blog skin.

Why the top reads as "two big disclosures":
- `.disclosure` and `.verdict` are the identical component: same
  `var(--tide-wash)` fill, same `var(--r-win)` radius, same padding,
  same bold run-in lead ("The disclosure, first." / "The short
  version."). Same construction = same meaning; the eye reads two
  stacked caveat boxes, not a caveat and a verdict.
- The verdict box is a single ~300-word, 14-line paragraph. At
  1440x900 the fold is: header, H1, byline, box one, then box two
  filling the rest of the screen and getting cut mid-sentence. The
  first screen of the page is 85% tinted-panel body text.
- design-language.md calls wash tints "section sheet tints
  (sparingly)". Nothing on the homepage ever stacks two tinted panels;
  the tint is a sheet under artifacts, not a container for prose.

Why it is unscannable at a glance:
- No TOC/jump nav on a 10,154px page (every good external page has
  one).
- H2s at 23.2px cannot anchor a scroll-skim; the tables and boxes are
  the only landmarks and the first one starts ~1,200px down.
- Paragraph lengths (intro 6 lines, verdict 14 lines, FAQ answers 5-7
  lines) against a uniform 46rem column with no sheet tints, no
  strips, no pull-stats. The numbers that would stop a skimmer
  ($5,000/mo reported, $50-60k first year, under 1% to over 14%) are
  buried mid-paragraph.

Specific gaps vs design-language.md and the homepage:

1. Heading scale. Draft/live H2 = fixed `1.45rem`/600. Brand rule
   ("Headings share one scale"): `clamp(2rem, 1.2rem + 2.8vw,
   3.2rem)`, 600, tracking -0.014em, ~51px at 1440 (homepage
   `.sect h2`). The draft's section heads render at 45% of brand size.
   (H1 is close enough: draft `clamp(1.9rem, 1.2rem + 2vw, 2.6rem)`
   vs homepage hero `clamp(1.9rem, 1.1rem + 2.4vw, 2.6rem)`.)
2. No voice accent. Homepage puts one Georgia-italic tide `em.voice`
   phrase in every major heading; the draft's only voice italic is in
   the footer CTA ("built for *your* business"). "11x alternatives"
   and every H2 are flat.
3. Two stacked tide-wash panels (see above); the brand never does
   this, and the second box is not visually distinguishable from a
   second disclosure.
4. No artifact in the fold. Homepage headlines are always paired with
   a window artifact; the draft's first visual object (the glance
   table) is below the fold, and there is no graphic on the whole
   page. Our one existing brand-native comparison graphic (the
   slop-vs-sent window pair) is unused.
5. Type-contrast compression: h2 23.2px, entry h3 18.4px, segment h3
   16.8px, body 16.3px. Heading levels sit 0-7px above body size.
6. Byline color is gray-light `#9aa2ab` at 0.9rem; the label rule
   says informational small text uses gray `#6a737d` (gray-light on
   white is ~2.7:1, under the AA floor, decorative only).
7. No section rhythm: uniform white ground and one column end to end,
   vs the homepage's white/wash sheet alternation and sea-strip seams
   (each strip with its duck). The draft page carries zero water.
8. Root type: the draft fixes `font-size: 16px` while `.landing` uses
   the fluid root `clamp(16px, 0.477vw + 8.8px, 21px)`; identical at
   1440, drifts apart on wide screens.

What the draft already gets right (keep): tokens and tide pills are
compliant, tables are hairline + words-not-checkmarks per the research
doc's spec, the "our tool" chip, numbered entries with big gray
numerals, the wave-scalloped navy footer, the corrections line.

---

## Part 3: ranked visual deltas for the rebuild

1. Adopt the homepage section-heading style for the page's 5-6
   top-level sections: Public Sans 600,
   `clamp(2rem, 1.2rem + 2.8vw, 3.2rem)`, line-height 1.12,
   letter-spacing -0.014em, ink, ONE `em.voice` Georgia-italic tide
   phrase on the load-bearing word (e.g. "Where 11x *falls short*",
   "The *slop* problem", "Pick one *honestly*"), each with a one-line
   gray support sentence. Demote current H2 styling (1.45rem/600) to
   the in-section sub-head (h3) role, and step entry titles up to
   ~1.35rem so the list scans.
2. Merge the two boxes into ONE artifact. The verdict keeps the
   tide-wash panel but becomes structured: a 1-2 sentence lead plus
   3-5 short bullets (who 11x is for, why people leave, where we fit
   with the concession attached). The disclosure collapses to a single
   casual line INSIDE that panel's footer, Zapier/Smartlead style
   ("We build driftwood; it is one of the options below. Hard claims
   about 11x are linked to outside sources."). Never two stacked wash
   panels; distinct jobs must get distinct constructions.
3. Put an artifact in the fold: pull the at-a-glance table up so its
   header and first rows are visible at 900px (Plausible's move). Fold
   order becomes H1 (with voice phrase), byline, one-line disclosure,
   verdict panel, table start.
4. Graphic slot after the verdict: the slop-vs-not-slop side-by-side,
   rebuilt from the homepage's compare artifact (two labeled windows,
   "what an autonomous SDR sends at volume" vs "what driftwood sent",
   with the real anonymized artifacts). It is pixel-real per the
   design language, reuses existing assets, and is the one graphic the
   page needs. No stock illustration, ever (Smartlead's failure mode).
5. Add a jump nav: "On this page:" link row under the byline (plain
   tide links, sentence case), optionally sticky right-rail at
   >=76rem where the 46rem column leaves dead margin. Pure HTML/CSS.
   PostHog/Smartlead prove this is the single best long-page device.
6. Give the page section rhythm: put one section (choose-if pair or
   pricing snapshot) on a wash-a sheet, homepage-style, and end with a
   thin static ASCII sea strip (with its duck) above the footer CTA.
   One sheet, one strip; earned, not decorated.
7. Surface pull-stats as designed moments: "replies went from under 1%
   to over 14% in week one" and "reported ~$5,000/mo, $50-60k first
   year" set as a compare-label + large-number pair (the dashboard
   results-card pattern), one per page, instead of living
   mid-paragraph.
8. Fix small-type colors: byline and any informational small text to
   gray `#6a737d`; gray-light only for decoration. Adopt the fluid
   root font-size from `.landing`.
9. Cap paragraphs at 2-4 lines in the verdict, segment blocks, and
   FAQ (Plausible's rhythm); keep the bold run-in leads ("March
   2025.", "Best for:") as the skim layer, and extend that device to
   FAQ answers.
10. Keep the tables exactly as specced (hairlines, words in cells,
    chips for baseline/our-tool rows) but give headers the gray
    0.85rem sentence-case label treatment consistently and let the
    glance table breathe: 5-6 columns maximum at 46rem, or let the
    table break out to ~60rem while prose stays at 46rem.

## Closest visual model

Plausible vs GA4. It is the page our design language would produce on
its own: white ground, single accent, typographic hierarchy doing the
work, the comparison table as the fold, exactly one graphic and it is
a real-product side-by-side, concessions as plain H2s, and a single
display-type CTA moment. The rebuild is Plausible's skeleton wearing
driftwood's skin (our heading scale + voice italics + wash sheet + sea
strip), with PostHog's jump nav grafted on and Zapier's four-column
glance-table discipline. Help Scout is the model for how our G2 data
could look later (designed gauge cards), not for now; Smartlead is the
content model but a visual anti-model except for its baseline/our-pick
row chips, which we already adopted.
