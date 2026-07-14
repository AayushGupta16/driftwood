# Reference design study: raycast.com, mintlify.com, cursor.com
Method: Playwright, 1440x900 viewport, full-page + per-viewport scroll screenshots (all in /tmp: raycast-*, mintlify-*, cursor-*). All three sites rendered cleanly; no bot-blocking. Raycast screenshots caught several sections mid fade-in (20–40% opacity) — direct evidence of scroll-triggered opacity/translate reveals. Studied 2026-07-13 for driftwood.sh redesign (sections: hero, LinkedIn-thread case study, how-it-works animation, dashboard screenshot, CTA).

---

## RAYCAST.COM — dark, cinematic, poster-grade
Page height: 15,626px (~17 viewports — very long). Theme: near-black (#0a0a0a-ish), ONE brand accent (red), white/gray type.

### Nav
Floating "island" nav: a rounded-rect card inset from the top edge (not an edge-to-edge bar). Logo left, 9 center links (Store, Pro, AI, iOS, Windows, Teams, Enterprise, Blog, Pricing), right: "Log in" text + white pill Download button with Apple glyph. Sticky throughout.

### Hero (y0)
- Centered. H1 "Your shortcut to everything." — ~64–72px, bold, sentence case WITH a period, 2 lines. 4 words.
- Subcopy tiny by contrast (~14px, gray): "A collection of powerful productivity tools all within an extendable launcher. Fast, ergonomic and reliable." (~17 words, 2 centered lines).
- Two small dark download buttons side by side (Mac / Windows beta), then a MONOSPACE micro-line: "Install via homebrew or winget | Try the new Raycast beta".
- Background: full-bleed custom artwork — grainy diagonal red/black airbrushed streaks, poster-grade. Not a gradient preset; hand-made texture. The artwork recurs as a motif behind later sections and in the footer.
- Total hero words ≈ 25. Extreme size contrast between H1 and everything else.

### Signature type system (repeats on EVERY section)
Two-tone headline: first sentence white/bold, second sentence same size but gray-500. Examples: "Take shortcuts, not detours. / One interface, everything you need." — "Remember Everything. / Stop playing Clipboard ping pong…" — "It's not about saving time. / It's about feeling like you're never wasting it." — "Don't repeat yourself. / Automate the things you do all the time." — "What else can Raycast do? / It can take notes." This one device unifies a 15k-px page.

### Product-visual framing
Every screenshot is a full macOS window: rounded corners, real menu bar (Finder File Edit…, wifi/battery/clock), realistic content. Windows are large (~80% viewport width), often embedded on the red artwork or a darker desktop frame. Under the clipboard demo: an icon-row segmented control (clipboard / snippets / emoji / calculator / windows) that swaps the demo — feature-switcher-under-visual pattern.

### Bento / feature cards (y3600 area)
Left rail: headline + Download button. Right: small cards — "Fast. Think in milliseconds." / "Ergonomic. Keyboard First." / "Native. Pure performance." / "Reliable. 99.8% crash-free rate." Pattern: ONE bold word + period + 2–4 gray words + small icon. Cards near-black with 1px subtle borders, ~12px radius, over a faint giant keyboard illustration bleeding through the section background. Real number (99.8%) instead of adjective.

### Extensions grid
"There's an extension for that." left-aligned + category pill-switcher right (Productivity/Engineering/…). Each extension card is its own mini color world: deep-blue Linear-style card with ring-status icons, indigo translation card showing the same word set in ~8 languages as a type specimen, green Spotify card with album art + play controls. Cards = caption text at TOP, illustration filling the rest. Ends with a plain text link "Browse thousands more →".

### AI section
Red "AI" kicker chip centered on a horizontal hairline (chip-on-rule section divider). Headline pair, then big chat UI window ("How do I quit Vim?") on red artwork. Three columns of blurbs, each = bold lead phrase + gray continuation, ~20–25 words. Centered "More about AI →" bold link.

### Social proof
- "Built for professionals like you. / Used by seriously productive people."
- Testimonial cards w/ avatar + name + role (CEO Vercel, Creator MKBHD, Designer/Owner…).
- Featured-user deep-dive: LEFT = monospace labels ("Favorite Feature:", "Top Extension:") with tag chips (AI Chat, Notion Search) + 1-line explanations; RIGHT = oversized pull-quote with giant quote marks where the quote is gray but the key phrase is WHITE: "Raycast is incrementally **turning my Mac into an AI-native operating system** and I'm so here for it." In-quote selective emphasis = steal-worthy.
- Community: two wide cards, Slack "37k members" / X "90k followers" — counts in monospace, right-aligned in the card header. Then video thumbnail strip.

### Developer section — a deliberate style break
Entire section switches to "blueprint" language: hairline grid rules dividing the viewport into drafting-table panels, EVERYTHING monospace (body copy, "FIG_01…FIG_06" panel labels), isometric line-drawn illustrations (Mac SE, keycaps, battery, floppy stack) in blue outline on black, arrows ↗ in cell corners. Huge "Build the perfect tools." Cards: React to macOS / Built-in UI / Batteries included / Publish to the Store, each w/ ~20-word mono body. Signals "for engineers" via texture alone. A second design language inside one page — expensive.

### Final CTA
Full-viewport photorealistic dark keyboard; the ⌘ key and command row GLOW ember-red. Centered: "Take the short way. / Download and use Raycast for free." + 2 download buttons + mono install hint. The CTA visual dramatizes the product's core interaction (its hotkey). Best CTA of the three.

### Footer
6-column sitemap (Product, Core Features, Top Extensions, Company, Community, By Raycast) w/ external-link arrows, red artwork band above it, newsletter row at the bottom (email input + subscribe + consent small print).

### Motion
Scroll-triggered fade/translate reveals on nearly every section (screenshots froze mid-fade). Category switchers swap grids. Product windows appear to parallax. Headlines and captions do NOT animate letter-by-letter — whole blocks.

### What makes it feel expensive
1. Custom poster artwork reused as a recurring motif (hero, AI, community, footer, CTA) — one texture, many appearances.
2. The two-tone headline system applied with 100% consistency.
3. Whole sub-design-language (blueprint/mono) for the developer section.
4. Glowing-keyboard CTA: product mechanic as hero image.
5. Monospace micro-labels + hard numbers everywhere (99.8%, 37k, homebrew hint).
Light-page translation: two-tone headlines → near-black + gray-500; keep one accent; mono micro-labels; real window chrome on screenshots.

---

## MINTLIFY.COM — light, editorial, "engineered document"
Page height: 8,401px. Warm off-white (#FAFAF7-ish), near-black ink, ONE brand green.

### Structural signature
Full-height 1px vertical hairlines ~176px in from each edge frame the whole page like a ledger/drafting sheet; sections divided by full-width horizontal hairlines. Content sits inside the frame; some visuals break out of it. This single device makes the page feel drawn, not assembled.

### Type system (three faces, strict roles)
- SERIF for all display headlines ("The knowledge infrastructure agents build on", "Powering businesses of all sizes.", "The knowledge platform built for agents") — editorial, expensive.
- Sans for body/UI. 
- MONOSPACE for every number: stats, live counters, the hero kicker. Numbers are green-tinted chips.

### Nav
Plain white bar: logo, 3 dropdowns + Pricing, right: ghost "Sign in" + solid black "Contact sales". Black (not brand green) primary buttons throughout.

### Hero
- Left-aligned text col; product screenshot bleeding off the right edge.
- Kicker: bordered pill "Agent traffic 64.5992% ↗" — a live product metric as decoration, mono green number.
- H1 serif ~56–64px, 3 lines, 6 words: "The knowledge infrastructure agents build on".
- Sub: ONE sentence, 9 words, with inline BOLD keywords: "Self-updating documentation for **startups**, **enterprises**, and **agents**."
- Buttons: black "Get started →" + white bordered "Sign up with Google" (Google logo).
- Art: fine contour/wave line-art in green gradients flowing behind the screenshot. The docs screenshot is real product, light chrome, slightly cropped by viewport edge.

### Logos
Not a gray strip: 2x4 grid of individually BORDERED off-white tiles, full-color logos (HubSpot, IBM, Okta, Kraken, Decagon, Zapier, Replit, Granola). Left column: "Join **20,000+** of the world's most ambitious companies building for agents." + black "Read customer stories →" button. Logos treated as inventory cards.

### Live counters strip
Hairline-bounded band: "Agents at work today" + ticker of mono metrics in green chips: AI requests 21,205 / Feedback provided 2,809 / Content updates 21,553 / Pages read 10,759,916. Quantified aliveness; scrolls horizontally.

### Bento features
Headline row: serif H2 two-tone (black first line, gray second) + "Get started" button right-aligned ON THE SAME ROW (headline-left/CTA-right rows recur). 5 cards (2 wide, 3 narrow): illustration top, 3–6 word label bottom ("Agent-native platform", "Self-updating knowledge", "Control who has access", "Connect with your systems", "Collaborate with your team & agents"). Illustration system: ghosted UI skeletons (gray placeholder bars in real component shapes) + green contour lines + a few real chips ("Editor", "Admin") + multiplayer cursors labeled "Agent 130 / Agent 152 / User 007". Captions minimal; drawings carry meaning.

### Case studies — customer-brand color blocking
Carousel "Powering businesses of all sizes." (serif + gray second line; arrows + "For enterprises →" right). The Anthropic card is FULL Anthropic-orange with white serif headline "…accelerates AI adoption with Mintlify", two big stats (2M monthly active developers / 4+ products serviced) and a white "Read the story →" button, paired with a photo tile; Coinbase card is periwinkle. Accent variety is borrowed from customer brands — Mintlify stays green.

### Stats row
3 columns, small icons, big mono-ish numbers: 300M+ visitors past year / 2B+ agents in the past year / 99.99% uptime. Label small gray under number.

### Startups band
"Enabling the next generation of startups. / Powering a quarter of the last YC batch to 40% of the Forbes AI 50." — proof INSIDE the subhead. Vivid gradient tiles (magenta/green/indigo/salmon) per startup w/ "Read Lovable's story →" links.

### Testimonials
"Trusted by teams building for agents." + black "Read more". 2x3 bordered cards: avatar/name/role TOP, quote below, 30–45 words, real named people (Anthropic MTS, Greptile CEO, Replit dev-rel, Prove docs lead). Flat cards, no shadows — borders only.

### Updates + CTA + footer
- Latest updates: 3 dark art tiles w/ tag chips ("Virtual Event", "Announcements", "Agent Score") + dates.
- Pre-footer CTA: a hairline-framed BAND, serif H2 left + two buttons right (ghost "Talk to sales" / black "Get started →") — one row, not a centered stack. Green line-art in the corner.
- Footer: white, 5 link columns, and a live status chip "● All systems normal" next to the logo. Dot-matrix pattern art at the margins.

### What makes it feel expensive
1. The full-height hairline frame + hairline section rules.
2. Serif display / sans body / mono data — strict three-face system.
3. Live product metrics as ornament (64.5992% kicker, ticker, status chip).
4. One-color custom illustration system (contour lines + ghosted UI skeletons + agent cursors).
5. Customer-brand-colored case tiles with big stats.

---

## CURSOR.COM — light, warm, quietly confident
Page height: 8,277px. Cream (#FAF9F5-ish) + warm gray section panels + near-black ink. ONE accent: orange, used ONLY for text links/arrows — never buttons (buttons are black pills).

### Nav
Minimal, borderless: caps wordmark + cube glyph left, 4 links center, right: "Sign in" text, outlined "Contact sales" pill, black "Download" pill.

### Hero — the modesty play
- Left-aligned. H1 only ~32–36px (small!), 2 lines, 10 words: "Cursor is your coding agent for building ambitious software." No kicker, no badge.
- Buttons: black "Download for macOS ↓" + light-gray "Request a demo →".
- THE PRODUCT SHOT IS THE HERO: giant window titled "Cursor Desktop" (traffic lights + title bar) showing a real 3-pane session (review queue, agent plan "Build Landing Page… make a landing page based on attached docs", localhost:3000 preview of the result), floating over a full-bleed ROMANTIC LANDSCAPE PAINTING (Hudson-River-School sky/valley). The painting recurs behind later sections — fine art as brand texture. Overlapping second window (Cursor CLI) creates staged z-depth.
- Screenshot content tells a story relevant to the viewer (agent builds a landing page; diff stats +52 -0; "280ms first paint").

### Logos
One small gray caption line ("Trusted every day by teams that build world-class software") + 8 bordered logo tiles: Stripe, OpenAI, Linear, Datadog, NVIDIA, Figma, Ramp, Adobe.

### Feature rows (alternating sides, all follow one recipe)
Text block = bold lead line (4–7 words) + 2–3 gray lines (~15–25 words) + orange text link. Visual = large real screenshot in a warm-gray rounded panel or over the painting. Examples:
- "Agents turn ideas into code" → plan UI + PRD side-doc; model picker chips visible ("Composer 2.5", "Opus 4.8").
- "Works autonomously, runs in parallel" → browser window at cursor.com/agent: task sidebar (Acme Research Dashboard, Live Telemetry Pipeline…), transcript "Worked for 14m 22s / Processed screen recording / Done! Here's a walkthrough of the dashboard." + orange "Learn about cloud agents →". The screenshot narrates an outcome.
- "In every tool, at every step" → REAL SLACK THREAD screenshot: #feature-realtime-sync, 8 members, user asks, Cursor bot replies, green "View PR" button; terminal window overlaps it; both float on the painting. Also: install command rendered as an inline code chip with copy button (`curl https://cursor.com/install -fsS | b…`). ← This is the exact pattern for driftwood's LinkedIn-thread case study: real chat chrome, real names/timestamps, floating on texture, minimal caption.
- "Automate repetitive work" → automation-config UI (triggers: "Every hour", "New message in #build-reliability", agent instructions) over painting.

### Testimonial wall
Centered H2 "The new way to build software." (~36–40px). 3x2 bordered flat cards on cream: quote FIRST (35–55 words), avatar+name+role bottom. Quotes contain hard numbers and specifics from famous people: Diana Hu (YC) "single digits to over 80%", Jensen Huang "some 40,000 [engineers]… productivity has gone up incredibly", Karpathy's "autonomy slider", Stripe's Patrick Collison, dbabbs, Greg Brockman. No star ratings, no logos-in-quotes — density of named authority does the work.

### Velocity strip
"Stay on the frontier" 3-col mini-features (model-picker dropdown listing Composer 2.5 / GPT-5.6 Sol / Opus 4.8 / Gemini 3.1 Pro / Grok 4.5; codebase-search vignette; enterprise photo). Then a Changelog band: 4 cards each with an outlined version chip (3.11 / 3.10 / 3.9), date, 1-line title, + "See what's new in Cursor →". Shipping cadence as social proof.

### Research section
Full-bleed warm team photo (blackboard, plants, filmic grain) with overlay text "Cursor is an applied research team focused on building the future of software development" + orange "Join us →". Then "Recent highlights": 4-col blog list w/ "Mar 27, 2026 · Research" metadata and author chips (avatar + "Sasha Rush · 3 min read").

### Final CTA — the inversion
Enormous "Try Cursor now." at ~90–100px — the LARGEST type on the entire page (3x the hero H1) — centered on cream, with ONE black pill button ("Download for macOS ↓"). Modest hero → giant closer. Very effective rhythm.

### Footer
Flat warm-gray, 5 columns, "© 2026 Anysphere, Inc. ✓ SOC 2 Certified", theme toggle (auto/light/dark) + language picker bottom right. Quiet, no art.

### What makes it feel expensive
1. Fine-art painting as the recurring backdrop — instantly non-templated, gives a light page warmth and depth.
2. 10-word hero + 3-word giant closer — total confidence in type-scale inversion.
3. Screenshots that tell verifiable stories (Slack thread w/ View PR; "Worked for 14m 22s"); no lorem-ipsum blur.
4. Orange reserved exclusively for links/arrows; all buttons black — discipline reads as taste.
5. Real named testimonials with numbers inside the quotes.

---

## Cross-site patterns (all three)
- ONE accent color each (red / green / orange), never used on primary buttons two of three times (buttons black/white).
- Headlines are sentence case and END WITH PERIODS (Raycast + Cursor) — declarative, not Title Case marketing.
- Sub-25-word heroes. Copy blocks almost never exceed ~25 words; testimonial quotes are the only long text.
- Screenshots always carry real chrome (title bars, traffic lights, menu bars, Slack/browser frames) and real content.
- Monospace = credibility channel (numbers, install commands, labels) on Raycast + Mintlify.
- Social proof = specific numbers + named humans, not logo soup alone; logos get bordered tiles (Mintlify, Cursor), not gray floating rows.
- Section rhythm relies on background VALUE shifts (cream↔warm-gray at Cursor; black↔artwork at Raycast; hairline rules at Mintlify), not colored bands.
- Footers are dense sitemaps + one live/trust signal (status chip, SOC 2, newsletter).

## Driftwood section mapping (quick take)
- Hero: Cursor's recipe — ≤12-word claim, small H1, and let a real built-demo window (with browser chrome + prospect URL bar) BE the hero, floating on one signature texture.
- LinkedIn-thread case study: clone Cursor's Slack-thread treatment — real LinkedIn chrome, avatars, timestamps, floating over texture, ≤20-word caption + one orange-style link; add Mintlify's customer-brand-colored stat tile (reply rate, meetings booked) beside it.
- How-it-works: Raycast's two-tone caption pattern under each animation step; mono step labels (FIG_01-style).
- Dashboard: full window chrome, title bar naming the product, warm-gray framing panel.
- CTA: Cursor's giant-type closer, or Raycast's mechanic-as-visual if driftwood has a signature interaction; include a mono micro-line under buttons.
- Live counters (Mintlify): "demos built this week: N" ticker would fit driftwood's promise perfectly.
