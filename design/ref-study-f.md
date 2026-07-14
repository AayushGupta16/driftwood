# Ref study F — feature showcase mechanics: spurtest.com + linqalpha.com

*2026-07-13. For landing v6. Brief: founder likes how these two present themselves;
wants the v5 "walkthrough" (three artifact windows, Joe's Pizza worked example) GENERALIZED
— no specific fake customer — and presented the way great sites showcase features.
Both sites captured at 1440x900 (full page + per-viewport + hi-res 2x clips) with
Playwright and read visually; tab clicks and sticky behavior probed live. Screenshots
in /tmp/ref-shots/. Spur is an AI QA-agent product — near-identical product shape
(agent performs tasks on a customer's site), so its devices map ~1:1.*

## Baseline: what v5's walkthrough does today

Section "What happens to *one name* on your list." → three equal cards side by side:
(1) notes window "The agent reads their site · takes notes" with Joe's Pizza facts,
(2) browser window "joes-pizza.square.site" with menu + "Order in one tap" pill,
(3) message window "linkedin.com/messaging" with the send copy. Footnote: "Worked
example: Square's prospect, Joe's Pizza." Problems per the brief: named fake example;
all three shown at once with equal weight (no sequence, no focus); static; the fictional
specificity (Margherita $19) reads as invented the moment you think about it.

---

## 1. spurtest.com — the agent-vignette playbook

### Page structure (top → bottom)

1. Announcement bar → nav (cream, black pill CTA "Book a Demo")
2. **Hero = the feature showcase.** Serif H1 "Release Faster with Agentic QA", 15-word
   sub ("Spur's autonomous agents plan, execute, and report your tests…"), then the
   showcase device (below)
3. Logo wall (15 logos, "Trusted by the world's leading brands")
4. Case-study tabs ("Customers with real applications": photo card left, quote + stat
   "80% Automated test coverage" + Read Case Study right; 5 customer tabs)
5. Testimonial carousel (9 quotes, dot pagination)
6. **Two feature rows** (not alternating — text left, illustration right both times)
7. **"Covers Every Use-Case" tab section** (5 tabs — the core feature block)
8. Stats band (95% / 80% / 20X / 5X + "Calculate ROI for Yourself")
9. **Bug Book** receipts carousel ("production bugs found for our actual customers")
10. Pilot Program CTA band → Enterprise Security (checklist left, 3 cards on dotted
    grid with animated connector arrows right) → FAQ (category selector + accordion)
    → serif "Schedule A Demo" → footer ("Don't make your users QA your product")

### Hero showcase mechanics (the killer device)

- **Task tabs**: segmented control of 3 generic tasks — "Add to Cart | Book a Trip |
  Generate a Presentation". Active = blue text + blue underline in a white pill bar.
- **Instruction pill** below tabs: numbered chip ("1 ✓") + plain-English instruction in
  a bordered pill: "Add an item that's less than $600" / (tab 2) "Book an international
  flight to major city in Europe". 5–10 words, verb + constraint grammar.
- **Full browser window** underneath: complete chrome (back/forward, URL bar showing
  `spuroutdoors.com/shop/gear`, green "Connected" badge) rendering a fully-designed
  FICTIONAL brand site. Clicking a task tab swaps the whole environment: tab 2 →
  `vireonairlines.com`, a complete airline site.
- **Agent presence** = a branded cursor (the Spur logo arrow) + a blue status pill
  riding the UI: "Looking for item under $600". The agent is a character, not a diagram.
- **Decoration**: floating multiplayer-style cursor+label pills around the headline
  ("Shopify Migration", "Black Friday Sales") — the cursor motif reused as page
  ornament; it reappears pre-footer ("Analyzing as ICP" cursor pill by "Schedule A Demo").

### How Spur generalizes without a named fake customer

Three distinct honesty registers, never mixed up:
1. **Self-branded fiction for the mechanism.** The demo environments are invented brands
   — "SpurOutdoors" (named after themselves — transparently a demo store), "Vireon
   Airlines", "Togethere" (checkout row). Plausible, fully art-directed, but claiming
   nothing real. The *specifics* live in the fiction; the *behavior* is what's being sold.
2. **Real customers for proof.** Inside the use-case tab panels the browser windows show
   actual customer UIs (HelloFresh at `hellofresh.com/plans`, "Connected"), and the
   Bug Book is literal receipts: real bug screenshots with red annotation tags pinned to
   the broken element ("Wrong Result", "Text cut off"), category chip, plain-language
   headline ("Search results for 'gaming console' show accessories instead of consoles"),
   "See Full Test →".
3. **Generic task grammar for copy.** Instructions are verb+constraint with no proper
   nouns: "Add an item that's less than $600", "After each CTA click, go back before
   going forward twice", "Verify: Text is in French."

### Feature rows + tab panel anatomy

- Row: eyebrow pill (light-blue bg, blue text: "Built for Scale" / "Built for
  Reliability") → H2 3–7 words ("Run in Parallel") → sub 12–20 words → right: rounded
  card on dotted-grid-paper canvas holding **abstracted product chips**, not screenshots
  ("400 Active Tests", "186 ✓ Passing / 11 ✗ Bugs", "Localization Error", "Desktop
  Release", "Run-time: 15 minutes").
- Tab section: centered serif H2 → pill tab bar, 5 tabs each icon+label, active = white
  pill/blue border/blue text, instant swap on click → one big rounded lavender panel:
  LEFT: icon + H3 + eyebrow "Core Agent Objectives" + exactly 3 checkmark bullets
  (~8 words each, one bolded keyword: "Test **unpredictable** user paths automatically")
  + black "Learn More" pill. RIGHT: instruction/status pill on top + browser window
  collage with floating chips (French/Japanese/German flag chips, "+245") + a drawn blue
  agent path line + cursor. A small customer quote sits at panel bottom ("I'm gonna see
  if I can expense Spur through my wellness stipend. Category: Therapy").

### Palette / type / texture (borrowable)

- Cream base (~#faf7f2), black ink, watercolor peach/blue brush strokes bleeding in at
  hero edges and section seams (texture without pattern).
- Display serif for H1/H2 (Tiempos-ish), sans for everything UI; pills everywhere —
  tabs, instructions, statuses, CTAs are all the same rounded unit.
- **One accent = the agent's color.** Electric blue (#2b3cff-ish) is used ONLY for agent
  things: cursor pills, active tabs, check icons, path lines. Red reserved for bugs.
  Maps directly onto driftwood's tide blue.
- Dotted grid paper behind illustrations; hairline card borders; black pill CTAs.

### Craft details that make it premium

1. The agent cursor is a recurring *character* — hero, tab panels, footer decoration.
2. "Connected" badges + URL bars + "Run-time: 15 minutes" chips — operational specifics
   that signal "this actually runs."
3. Numbered instruction chips with checkmarks ("1 ✓") — instructions look executed.
4. Fictional demo brands are fully designed (nav, imagery, real layouts) — no lorem.
5. Bug Book: marketing made of artifacts, annotated at the exact broken pixel.

---

## 2. linqalpha.com — the sticky numbered rail

### Page structure (top → bottom)

1. Nav (white) → **Hero**: centered display serif H1 "AI for Global Markets & Research",
   2-line sub, black pill + outline pill CTAs → full-bleed muted photograph (Singapore
   skyline) with logo bar overlaid at its foot (Citibank, KB Securities, Schonfeld…)
2. "Overview" eyebrow → big serif claim with inline stats ("LinqAlpha reasons across
   139+ countries and 57,663+ companies in native languages…") + stat-label row
3. **"Key Use Cases" sticky section — the feature showcase** (below)
4. Stats band on sage-gray field: serif "Global markets don't wait. Neither should your
   research" + giant display-serif numerals (57,659+ / 133+ / 40+) with hairline rules
   and small gray labels
5. Testimonials: serif claim left, large serif quote right, segment-progress-bar
   pagination, attribution **"Fortune 50 Global Investment Bank"** (anonymous, title-only)
6. Security (page goes black): centered serif + 4 dark credential cards + "Security
   Measures" 2x3 icon grid
7. Final CTA (black): serif "Where Global Data Becomes Investment Conviction" → footer.
   Note the arc: page darkens white → photo → sage → black as you descend.

### The sticky-rail mechanics (verified live: one `position:sticky` div, top=100px, h=496)

- Two columns. LEFT (sticky): eyebrow "Key Use Cases", serif H2 "Investment researchers
  use LinqAlpha for", then a numbered list **01–05** (Market Signal Monitoring / Company
  Screening / Fundamental Analysis / Sentiment & Trend Tracking / Competitive Landscape
  Analysis). Active row: black text, heavier weight, black underline; inactive: gray,
  hairline dividers. Number is a small gray "01".
- RIGHT (scrolls): one large artifact card per use case (~620px wide, generous padding,
  big radius), alternating dark/light, each sitting on a blurred photographic backdrop.
  Scroll position drives which left item is active. No scroll-jacking — normal scroll,
  the rail just pins.
- **Artifact card anatomy** (this is the agent-credibility grammar):
  - 01 → dark card: chip "☀ Delivered, 7:30am" joined by a **drawn connector line** to a
    white document "OVERNIGHT NEWS FLOW / Wed, 18 Mar 2026" with a ticker strip
    (NVDA +2.4% | AAPL +1.8% | TSLA −3.2%) and real-sounding bullets.
  - 02 → light card: actual product UI — tab bar (Company Snapshot | Earnings History |
    Business & Strategy), NVDA $180.25 chart, chips "Bull-bear Debate / Headline Results".
  - 03/04 → **query cards**: mono slash-command label ("/sentiment", "/sector-screen") +
    "Query" eyebrow + one beautifully written realistic query ("Aggregate mgmt tone on
    China consumer across recent earnings"; "ASEAN banks ranked by market cap, growth,
    margins, and forward P/E, with top picks and commentary") + live status line
    ("Searching", "● Reading sources…").
  - 05 → dark card: query + **agent progress checklist**: "● Processing data… /
    ✓ Looking up tickers… / ✓ Pulling quarterly revenue data… / ◌ Building chart…"

### How Linq generalizes without a fake customer

- **Zero invented entities.** Artifacts use real public-market subjects (NVIDIA, AMD,
  ASEAN banks) because the product's raw material is public data — the examples are
  simultaneously specific AND true-shaped.
- The user is named by ROLE in the H2 ("Investment researchers use LinqAlpha for") —
  the customer in the story is a job title, not a name.
- Testimonial attribution anonymized to an institution class ("Fortune 50 Global
  Investment Bank") — reads MORE credible, not less, in a confidentiality-heavy market.
- The agent is shown as: plain-English query → status verbs progressing ("Searching",
  "Reading sources…", "Building chart…") → finished artifact. Nothing anthropomorphic;
  work states + outputs only.

### Palette / type / texture

- Near-monochrome: white, ink, sage-gray band, black closer; only escapes are one green
  chart line and tiny status dots. Muted documentary photography as the only texture.
- One display serif (Canela-like) carries headlines AND the giant stat numerals; small
  gray sans for eyebrows/labels; black pill CTA. Hairline rules everywhere.

### Craft details

1. Giant serif numerals as imagery — stats treated typographically, no icons.
2. Connector line from status chip to document — implies pipeline in one stroke.
3. Consistent lowercase-gray eyebrow system ("Overview", "Data", "Key Use Cases").
4. Segment progress bars as carousel control (not dots).
5. Every artifact framed like a physical document: date lines, headers, padding.

---

## Shared grammar (both sites, and the exact fit for driftwood)

Both show "the agent does X" identically: **plain-English instruction/query in a chip →
visible work-state progression (✓ ✓ ●) → concrete artifact out.** Neither narrates.
That pipeline IS driftwood's product: research → build → send. v5 already has the three
artifacts; what's missing is the sequence/focus mechanics and the generalization register.

---

## Recommendation for v6: sticky numbered rail + agent-work artifact cards

Replace the v5 three-across row with **Linq's sticky rail structure carrying Spur's
agent-work grammar**, generalized by redaction (an established house move — v5's real
Superhuman thread already uses "name redacted").

**Layout.** Full-width white section. Left rail ~400px, `position:sticky; top:96px`:
eyebrow, H2 (keep "What happens to one name on your list." — it's already generic),
then numbered list `01 Researches the company / 02 Builds them a working demo /
03 Sends it from your account`. Active: black + tide-blue number + underline; inactive
gray. Under the active item only: one sub-line ≤16 words + one status chip. Right
column: three artifact cards, ~680–760px wide, one viewport-ish tall each (~560–640px),
vertical rhythm ~120px gap; scroll drives activation (IntersectionObserver; static
all-visible fallback under `prefers-reduced-motion` and on mobile, where it stacks:
rail item → its card, interleaved).

**Card anatomy (the generalization).** Every card = window chrome + instruction pill +
work states + artifact, with SPECIFICS AS REDACTION BARS, labels real:
- 01 notes window. Instruction pill: "Read their site. Find the wedge." Checklist:
  "✓ site + socials read · ✓ reviews pulled · ● demo spec drafted". Note lines mix real
  category labels with gray redaction bars where the company facts would sit
  (e.g. "Their checkout: ▓▓▓▓▓ — 4 taps too many").
- 02 browser window. URL bar: "▓▓▓▓▓.demo.driftwood.sh · live, hosted". Skeleton
  product UI (gray blocks) with ONE real black pill CTA and a tide-blue agent cursor-pill
  drifting: "rebuilding their flow". Chip: "built in minutes, not mockups".
- 03 message window ("linkedin.com/messaging · sent from your account"). Real message
  scaffolding, redaction bars over name + link; chip: "You approve every send."

**Copy budget.** Rail items 3–5 words; subs ≤16 words; instruction pills 5–9 words;
≤3 status lines/card; zero proper nouns anywhere in the section.

**Motion.** No scroll-jack. Cards translate up 12px + fade on enter (300ms). Status
checkmarks tick in 400ms stagger once per activation. Exactly one moving element per
card (the cursor-pill on 02). Tide blue is reserved for agent presence — cursor, status
chips, active numbers — exactly Spur's accent discipline; the waterline wave can serve
as Linq's connector-line between chip and artifact on card 01.

**Fallback (if sticky is too heavy for v6).** Keep the v5 three-across row, but strip
Joe's Pizza: add 01/02/03 numbering, instruction pills, work-state chips, and redaction
bars per the anatomy above. That alone fixes the brief's core complaint.

**Adjacent steal (not this section).** Spur's Bug Book = driftwood's future "demos we
sent this week" receipts carousel; v5's real-Superhuman-thread block already occupies
this register — keep it separate from the generalized walkthrough. And note Linq's
anonymized attribution trick ("Fortune 50 Global Investment Bank") for future
testimonials where clients won't be named.
