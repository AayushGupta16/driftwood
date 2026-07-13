# Anti-slop notes — what makes a landing read as AI-generated vs real

Research distilled 2026-07-13 to drive the credibility pass on the landing
(real Autosana stats + dashboard proof). Companion to `DESIGN.md`, which holds
the brand tokens; this holds the *credibility* rules.

Best empirical source: Adrian Krebs scanned 1,590 Show HN landings against 16
deterministic slop patterns (adriankrebs.ch/blog/design-slop). Top single tells:
permanent dark theme (34%), gradient backgrounds (27%), icon-card grids (22%).
A corpus of 412 v0/Lovable/Bolt pages found 60% share the identical
"Centered Sparkle Stack" hero (sailop.com/blog/hero-section-anti-slop-21-compositions-2026).
Satirical field guide of trust-tells: shitfa.st.

## Slop tells (checkable)

Visual / layout:
- Purple/indigo Tailwind-default gradients (200-290° hue band), gradient blob
  or aurora behind the hero, gradient-clipped headline text.
- The Centered Sparkle Stack: "✨ Now in beta" pill eyebrow → centered H1 →
  muted subhead → dual buttons (filled + outline, arrow icon) → tilted
  screenshot in fake browser chrome.
- Three identical icon-top feature cards; numbered 1-2-3 steps; stat-banner
  rows with count-up animation; all-caps section labels; glowing "Most
  Popular" pricing tier; circular-avatar testimonial slider; 4-column footer.
- Colored 3-4px left border on cards ("as reliable a sign as em-dashes").
- Inter everywhere; serif-italic on one accent word; `rounded-2xl` on every
  container; glassmorphism nav; `transition: all`.
- Scroll animations as the most impressive engineering on the page.

Copy:
- "Streamline your workflow", "Effortlessly/Seamlessly", "Unlock/Empower/
  Elevate/Harness", "AI-powered", "Transform your X with intelligent Y".
- The competitor-swap test: put a competitor's name in your copy; if it still
  reads fine, the copy is slop (Harry Dry: "never write an ad a competitor
  could sign").
- Feature triad "Lightning Fast / Secure by Default / Easy to Use"; emoji as
  feature icons; generic CTAs ("Get Started", "Learn More").

Trust (what a skeptical founder actually checks — shitfa.st taxonomy):
- Logo hallucination: logo walls real enough to reduce questions, fake enough
  to invite them. A one-logo gray "trusted by" bar reads as weakness.
- Number hallucination: "Trusted by 5,000+ teams" on a three-week-old domain.
  "The comma is load-bearing."
- Testimonial without a last name ("Sarah K., verified customer").
- Promise without product / waitlist as product: you can scroll the whole
  page without ever seeing the software actually do anything.

## Quality markers

- Harry Dry's three rules (marketingexamples.com/landing-page/guide):
  visualization (concrete over abstract), falsifiability (every claim
  checkable), uniqueness (copy no competitor could sign).
- Show the product, not illustrations — real UI is now the trust signal;
  illustration heroes read as "AI builder, didn't customize".
- Iron rule of verifiability: every trust signal should survive a
  LinkedIn/Google check. A smaller set of real proof beats a larger set of
  questionable proof every time (roast.page/blog/trust-gap).
- Skip the logo bar entirely if the logos aren't recognizable; use one named
  story with a real person instead.
- Founder's note at the bottom: named human, real voice, answers "is there a
  real person behind this?"
- One base color + one accent outside the indigo band, asymmetric layouts,
  borders over shadows. (Already our system, see DESIGN.md.)

## One-client social proof (we have exactly one: Autosana)

- Depth beats breadth: a named 2-sentence micro case study ("Acme cut churn
  22% in 90 days") outperforms both anonymous testimonials and a logo wall of
  nobodies. Named case studies convert ~2x anonymous ones.
- Structure as story, not badge: outcome headline with number + name →
  short summary with the key numbers → situation/intervention/result →
  quote in the customer's own words, full name + title (verifiable on
  LinkedIn).
- Name a person, not just the company. Publish their quote near-verbatim
  (Basecamp method).
- Reframe n=1 as intentional: "design partner" / founding-customer framing
  turns one client from weakness into a deliberate stage. (Our final CTA
  already says design partners — the case study should echo it.)
- Include friction/honesty; a story with zero setup cost reads as invented.

## Presenting the reply-rate stat credibly

Four required parts: metric + before + after + timeframe.
- Before → after format: "reply rate 0.8% → 10.1% in six weeks", never a
  naked "10x replies!!".
- Non-round beats round: 10.3% is more believable than 10%. Use the exact
  measured numbers.
- Show absolute counts (X replies out of Y sends), not just the rate — rates
  without denominators are how people lie.
- Benchmark context: "typical cold email gets 1-5%" lets the reader evaluate
  instead of just being impressed.
- Explain the mechanism in one sentence (per-prospect working demo) — a
  dramatic number with no how reads as fabricated.
- Attribute to the client in their own words where possible; readers discount
  vendor-reported numbers.
- No count-up animation on the number.

## Dashboard screenshot as proof-of-life

- Real screenshot, clean flat frame. No 3D tilt, no multi-device fan, no
  generic fake-browser-chrome hero (that composition is itself a slop tell
  now).
- Populated with believable data: non-round numbers, realistic records, no
  "John Doe" placeholders. Anonymize real prospect names if needed but keep
  the texture of real data.
- Show the moment of value (the funnel/results view), not login/onboarding,
  and make it answer the adjacent headline directly.
- Motion is the strongest cheap anti-vaporware proof: a short clip/GIF of the
  product doing the thing beats any static shot.

## Audit of the current landing (2026-07-13)

Already clean (keep): paper+tide palette (no indigo, no gradients-as-decor),
no icon-card grid, no pill eyebrows, no fake logo wall, no fake testimonials,
product-forward walkthrough, hand-drawn arrow, honest "made-up examples, not
customers" caption, real founder email in the footer.

Gaps (the pass to run):
1. Zero verifiable proof on the page — every visual is fabricated (Slack
   readout numbers, example emails). The page is all promise, no product
   receipts. This is the vaporware tell, and it's the whole gap.
2. Hero subhead "Grow your revenue with cold outbound that converts" fails
   the competitor-swap test.
3. The fabricated Slack readout card sits exactly where a REAL readout
   screenshot could sit.
4. "Joe's doesn't take online orders" still lingers in Compare + Examples
   subject lines (Joe's HAS ordering, it converts poorly — standing note).
5. Minor pattern-matches to keep an eye on, not urgent: arrow-icon in CTA
   buttons, rounded-2xl everywhere, backdrop-blur nav.
