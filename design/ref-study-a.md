# Reference design study: linear.app, stripe.com, vercel.com
Captured 2026-07-13, viewport 1440x900, playwright chromium. Full-page + scroll shots in /tmp/{linear,stripe,vercel}-vp-*.png (+.jpg). No bot-blocking encountered; all three rendered fully.

---

## LINEAR.APP (page height ~10,900px, dark theme throughout)

### Nav
- Near-black bg (#0b0b0c-ish), slim bar ~64-70px. Logo left. Links (Product, Resources, Customers, Pricing, Now, Contact) 13-14px, mid-gray, generous letter spacing. Thin 1px vertical hairline separates nav links from auth cluster. "Log in" plain text + "Sign up" WHITE fully-rounded pill (dark text) — the highest-contrast element on screen.

### Hero (y0)
- Headline: "The product development system for teams and agents" — 2 lines, LEFT-aligned, ~68-76px, weight ~500 (medium, not bold), white, very tight leading (~1.05), tight tracking. Occupies left ~55% of width.
- Subline: ONE sentence, 12 words, 16px, mid-gray. On the same line, right-aligned: "New | Coding Sessions →" announcement link. No hero CTA buttons at all — nav Sign up pill carries it.
- Product shot: full-width dark app screenshot begins mid-viewport and bleeds off the bottom. Rounded ~12px, 1px faint light border. CRITICAL DETAIL: a floating agent-chat panel is layered ON TOP of the screenshot (own shadow, own rounded corners), overlapping its edge — creates real depth, not a flat pasted image. Screenshot content is real and dense (issue view, activity feed, assignees).

### Logo bar (y~1100)
- Below the hero shot: single row of 8 monochrome logos (Vercel, Cursor, Oscar, OpenAI, Coinbase, Cash App, Boom, Ramp) — all forced to white/gray on black, evenly spaced, no heading above them.

### Statement section
- Big two-tone paragraph, ~32-36px: "A new species of product tool." in WHITE, remainder ("Purpose-built for modern teams…") in GRAY. One paragraph = whole section. Signature device: lead sentence bright, continuation dimmed.

### 3-up feature cards (y~1800)
- Three columns separated by 1px vertical hairlines (no card backgrounds). Each: large custom LINE-ART isometric illustration (1px gray strokes on black, no fill), then 15px white heading ("Built for purpose", "Powered by AI agents", "Designed for speed"), then 2 lines of gray body (~15-20 words). Extremely restrained; illustration does the work.

### Numbered chapter system (the page spine)
- Product story is organized as numbered chapters like a document: 2.0 Plan, 3.0 Build, 4.0 Diffs, 5.0 Monitor. Each chapter block:
  - Left: huge 2-line headline ~56-64px medium ("Define the product direction", "Move work forward across teams and agents", "Understand progress at scale").
  - Right column: 3-line gray description, ~25-30 words, 20-24px.
  - Below it: mono-style label link "2.0 Plan →" in dim gray.
  - Then a full-width product visual; then a sub-TOC grid of numbered links "2.1 Projects | 2.2 Documents / 2.3 Initiatives | 2.4 Visual planning" in two columns split by a 1px hairline. Number in dim gray, label in lighter gray.
- Chapters separated by full-width 1px hairlines; background stays uniform black (no tint shifts — separation is done with hairlines + whitespace only).

### Product visuals inside chapters
- All UI mocks are dark-theme so they FUSE with the page bg; edges defined by faint 1px borders and rounded corners only where framed. Mix of: full app screenshots (roadmap timeline w/ colored initiative icons), floating popovers cropped tight (assignee picker listing humans AND agents: Cursor, GitHub Copilot w/ "Agent" badge), a Slack-style thread panel, a full side-by-side CODE DIFF with red/green line highlights and filename header bar — real, readable content everywhere. Small pops of functional color (icon tints, status dots, diff red/green) are the only color on the page.

### Changelog section (y~8100)
- "Changelog" ~64px white. Horizontal timeline rule with node dots (first dot red — single accent). 4 columns: entry title 15px white, 2-line gray excerpt, mono date "JUN 30, 2026" in caps. "View all →" below. Ships-constantly signal as a designed artifact.

### Testimonials (y~9000)
- The ONLY saturated color on the page: two large quote CARDS side by side (~2:1 width split). Card 1: soft periwinkle/lavender gradient, giant watermark of customer logo behind text. Card 2: acid chartreuse (#e3ff33-ish) flat. Quote set ~32px in near-black on the light cards (inversion!), attribution row bottom: small logo + name bold + role gray. Below cards: "Linear powers over 33,000 product teams." with the number in bold; right-aligned "Customer stories →".
- Rounded ~16px corners; cards feel like posters.

### Final CTA + footer
- Centered: "Built for the future. / Available today." ~64px, 2 lines. Two pills: "Get started" (white bg, dark text) + "Contact sales" (dark w/ 1px border). Nothing else.
- Footer: black, tiny logo mark, 5 columns of 13px gray links (Product/Features/Company/Resources/Connect). Quiet.

### Craft details (what makes it expensive)
1. Numbered chapter system (2.0/2.1…) turns the landing page into a "document" — unique information architecture, impossible to mistake for a template.
2. 1px hairlines EVERYWHERE as the only separator (columns, sections, TOCs) — no boxes, no bg shifts.
3. Overlapping layered panels on top of screenshots (chat window over app window) = depth.
4. Custom 1px line-art isometric illustrations, consistent stroke weight, no fills.
5. Accent color quarantined to a single testimonial moment; rest is grayscale — makes the chartreuse card detonate.
6. Two-tone sentences (white lead + gray tail) instead of headline/subhead pairs.
7. Real, dense, readable product data in every mock (real names, real code diff).

---

## STRIPE.COM (page height ~14,670px, light theme + one dark developer act)

### Nav
- White, logo + 5 dropdown items 15px. Right: "Sign in" white button w/ subtle shadow + "Contact sales" solid purple #635bff rounded-lg (~20px radius) with chevron. Purple = the one accent everywhere.

### Hero (y0)
- White bg with a HUGE diagonal aurora-gradient ribbon (orange→pink→magenta→purple→blue, photographic mesh quality) sweeping from top-center off the right edge. Art is behind/interleaved with the text.
- Eyebrow: "Global GDP running on Stripe: 1.68043986%" — tiny live-data ticker. Personality via real numbers.
- Headline: ~56-64px medium, dark navy #0a2540, 4 lines, ~25 words, and TWO-TONE: key phrases in navy, connective tissue in lighter blue-gray/lavender ("Financial infrastructure to grow **your revenue**…"). Headline and subhead merged into one long graded sentence.
- Buttons: "Get started →" purple pill + "Sign up with Google" white 1px-border button. Left-aligned, ~40px tall.

### Logo bar
- 7 FULL-COLOR logos (Amazon, NVIDIA, Ford, Coinbase, Google, Shopify, Mindbody), hairline border above. Stripe is confident enough to allow brand colors here.

### Bento product grid (y~900-3000)
- Intro: two-tone ~36px paragraph ("Flexible solutions for every business model." navy + gray tail).
- Cards: white, 1px #e6e6e6 border, ~8px radius, barely-there shadow, expand icon top-right. Layout 2/3+1/3 then thirds. Inside each: product UI composited over soft peach/lilac gradients — device mock of payment terminal (photoreal phone), full browser-chrome checkout with padlock URL bar "roastery.com/checkout", billing dashboard cards w/ bar chart, AI-commerce chat with product cards, VISA card render, dotted world-map globe with a "$102.23 USDC" tooltip pinned to an arc. Card headings ~24px navy. Every mock is coherent (same fictional merchants: Roastery, Zenflow, Quiet Fire Yoga — a consistent fictional universe across the page!).

### Stats band (y~3600)
- Centered "The backbone of global commerce" ~48px. Then 4-stat row: 135+, $1.9T, 99.999%, 200M+ set ~48-56px LIGHT weight; first stat dark navy (active), others in lighter gray-violet; 2-line gray captions under each; hairline rules frame the band. Below: full-width particle "fireworks" data-viz illustration (thin radiating lines, blue/orange dots) — generative-art quality.

### Enterprise + case studies (y~4500-6300)
- Two-tone lead-in ("Powering businesses of all sizes." + gray). Two-col: left headline + purple button "Stripe for enterprises →", right a 40-word stat-prose block ("50% of Fortune 100 companies…").
- Hertz case: logo chip + one-line claim "Hertz unifies commerce with Stripe." + right-aligned "Read the story →" outline button; full-width aerial PHOTOGRAPH (yellow car in traffic — brand color hidden in photo!); beneath: stat strip "160 countries | 11K+ locations | Products used: Payments, Terminal, Connect…".
- Then 3 collapsed accordion rows: logo square + one-line result ("URBN consolidates $5 billion…") + purple "+" button, hairline dividers. Case studies as one-liners with receipts.
- "Realize value faster with dedicated experts": 3 cols, icon in 1px-border square, bold lead-in phrase + gray body (~20 words), purple "View services →".

### Startups act (y~6300-7800)
- Same two-col intro pattern + carousel arrows top-right. 4 story cards: full-bleed ART images (each visually wild/different), customer logo overlaid bottom-left in white, 2-line caption below + purple "Read X's story →". Then 2 promo cards (Startups program, Atlas) with angular gradient art on the right third.

### Platforms act (y~8100-9000)
- Two-col intro again. Big composite: dashboard UI over vivid magenta→orange gradient, with floating CODE SNIPPET cards physically annotating parts of the UI ("Payouts — stripeConnectInstance.create('payouts');") — code and UI shown as one object. 3 icon-led columns below with purple "Read the guide →".

### Centered testimonial (y~8700)
- Classical: 48px circular avatar photo, quote ~28px navy across ~3 lines, "Kurtis Moyer," bold + role gray, "Read the story →". Whitespace does everything.

### Developer act — DARK pivot (y~9000-11500)
- Background flips to deep navy (#0e1a38-ish) for the developer story. Two-tone continues (white lead + light-periwinkle tail). Buttons: purple filled + outlined "View Stripe's GitHub".
- Architecture diagram: glowing chip nodes (ERP, CRM, Subscriptions…, SDK, Event Destinations, App Marketplace, Data Pipeline) connected by dotted lines over a dot-grid, real partner logos (Salesforce, SAP, NetSuite, Snowflake) as tiles.
- "Scale with confidence" + woven light-wave render + 3 stats in GRADIENT text (500M+, 10K+, 150K+) ~56px, captions gray.
- 3 integration-path cards: QR-payment mock, grid of platform app icons (Wix, HubSpot, Webflow…), and a live-feeling code editor w/ autocomplete dropdown open + terminal output "> Ready! Waiting for requests…". 

### Editorial coda (y~11700-13500) — back to light
- "What's happening / See the latest from Stripe." + carousel of billboard cards (purple silk "Annual letter 2025" + film-like thumbnails), then 40-word prose + "Read the letter →" outline button.
- "Book of the week — Entrepreneurship starts with ideas." An actual BOOK: cover on deep-teal card, ~90-word review, "The Library of Stripe" engraved crest stamp. The single most hand-made thing on any of the three sites.

### CTA + footer
- CTA band on faint lavender tint: "Ready to get started?" ~40px + purple "Start now →" + outline "Contact sales"; right side two icon-led mini-columns (See what you'll pay / Start building) + "Pricing details →", "Integration options →".
- Footer: massive 5-col sitemap, 14px links, dotted hairline column separators.

### Craft details
1. Two-tone graded sentence as THE headline system, sitewide (navy lead + lavender-gray tail) — kills the headline/subhead cliché.
2. One fictional merchant universe (Roastery, Zenflow, yoga studios) reused across all mocks — coherence reads as real product.
3. Code snippets physically annotating UI screenshots — "this pixel = this API call."
4. Confined color logic: navy text + one purple for every interactive element; the wild gradients live ONLY inside art/mock backgrounds.
5. Editorial oddities (GDP ticker, Book of the week w/ crest, annual letter) — proof of humans.
6. Section separation via hairlines and ONE dark act in the middle; light-dark-light gives the long page a 3-act structure.

---

## VERCEL.COM (page height ~5,956px — the short one; pure monochrome)

### Nav
- White. Small triangle logo. 4 items (Products, Resources, Enterprise, Pricing) 14px. Right: "Get a Demo" outline button, "Log In" outline, "Sign Up" solid black. Radii ~8px. Everything black/white/gray.

### Hero (y0)
- 3-part asymmetric composition: LEFT "Agentic Infrastructure" ~80px, weight ~600, tracking ~-0.04em, near-black, 2 words on 2 lines. Below: "Deploy Now" black pill + "Talk to Sales" white pill w/ 1px border (fully rounded, ~44px tall).
- CENTER: single monumental 3D black triangle with soft radial glow/halo and floor shadow — logo as sculpture, no product shot in hero.
- RIGHT: monospace UPPERCASE stack: "FOR CODING AGENTS / TO SHIP APPS AND AGENTS / AUTOMATED BY AGENTS" ~13px, gray. Mono caps = the recurring accent texture instead of a color.
- Bottom of viewport: 7 black logos full-width (Blackbox.ai, Charles Schwab, DoorDash, OpenAI, Supreme, Weather Co, Polymarket).

### Customer-proof sections ×3 (y~900, 1800, 2700) — the whole middle of the page
- Repeating template, alternating alignment: giant 2-line headline ~64px semibold ("Build agents on infrastructure that thinks like them" / "Ship apps that scale from zero to millions instantly" / "Host platforms that serve every customer").
- Product visual = A SCREENSHOT OF THE CUSTOMER'S PRODUCT (Notion AI chat w/ floating panel; Zapier's own homepage incl. its stats 450K+/9,000+/3.39M+; Mintlify docs site), desaturated/near-grayscale, in a light card w/ 1px border, cropped at section edge.
- Side caption: "Notion powers millions of agent conversations daily on Vercel." — customer name in GRAY, claim in BLACK (two-tone, inverted emphasis). ~10-14 words total.
- Below caption: mono label "Features" + UPPERCASE mono list: "DURABLE ORCHESTRATION / SANDBOXED ENVIRONMENTS / AI MODEL GATEWAY / FLUID COMPUTE". Specs as design.
- Case study IS the feature section; zero abstract marketing copy. ~40 words per section max.

### "Recently shipped" (y~3600)
- ~64px headline. Bento: 1 large card left (eve framework, thin line-art + logo + one-liner "A framework for building durable agents."), 2 stacked cards right: Passport (dark panel typographic art "PASSPORT / PASAPORTE / PASSAPORTO / パスポート") and Containers (mock CLI: "▲ vercel deploy … ✓ Deployed to Fluid compute / Production: https://my-server.vercel.app" in mono w/ checkmarks). Cards: very light gray bg, 1px border, ~12px radius, no shadows.

### Final CTA (y~4500)
- Centered "Built by you, or your agents" ~64px. Under it, the CTA is a compound TERMINAL control: black "Deploy" pill + attached segmented control [Plugin ▾ | $ npx plugins add vercel/vercel-plugin | copy-icon] in mono. The call-to-action is literally a copyable command.

### Footer
- White, ~12 columns over 2 rows of 13px links grouped (Agent Stack, Core Platform, Security, Tools, Frameworks, SDKs, Build, Learn, Explore, Company, Legal, Social) with tiny "NEW" badge chips. Bottom: triangle mark + mono "● ALL SYSTEMS NORMAL." with GREEN dot — the only color on the entire page — + theme switcher.

### Craft details
1. Absolute monochrome discipline; the single green status dot in the footer is the punchline.
2. Monospace-uppercase micro-labels as texture/ornament (hero right stack, Features lists, status line).
3. Customers' actual products as the hero visuals — proof > promise, and it keeps the page gray.
4. CTA as a working CLI command with copy button.
5. Only ~5 sections + footer; one idea per viewport; headline scale (64-80px) carries hierarchy instead of decoration.
6. The 3D triangle: one expensive rendered brand object instead of any illustration system.

---

## Cross-site patterns (all three)
- Headlines 56-80px, weight 500-600 (never black/900), tracking slightly negative, 2 lines max, mostly LEFT-aligned; body copy is 1-3 sentences per section, 10-40 words.
- One accent color max (Stripe purple / Linear chartreuse-once / Vercel green-dot-once); product mocks carry any additional color.
- 1px hairlines + whitespace do all separation; almost no drop shadows (shadows only on layered/floating panels).
- Every product visual has real, coherent, readable content — no lorem, no blurred fakes; fictional-but-consistent companies.
- Buttons: pill or ~8px radius, 40-44px tall, high-contrast solid + quiet outline pair, verb-first labels ("Get started", "Deploy Now", "Contact sales").
- Social proof = logo row immediately after hero (7-8 logos, one row) + named quotes with faces/roles + big specific numbers (33,000 teams, $1.9T, 100M visits).
- Mono/uppercase micro-labels for eyebrows and metadata (Linear "2.0 PLAN", dates; Vercel FEATURES lists; Stripe code annotations).
- Each site has a signature "document system": Linear numbered chapters, Stripe two-tone graded sentences + 3-act light/dark/light, Vercel customer-screenshot proof template.

## Driftwood mapping (quick)
- Hero: Linear's layout (huge left 2-line headline, 12-word subline, product bleeding off-fold with a floating overlay panel = the agent's chat over the demo it built).
- Case study/LinkedIn thread: Vercel's move — the REAL thread screenshot IS the section; caption two-tone "«Prospect» replied in 41 minutes." + mono metadata (dates, reply time).
- How-it-works: Linear's numbered chapters (1.0 Scrape → 2.0 Build → 3.0 Send) with mono labels + hairlines.
- Dashboard shot: dark UI on dark bg Linear-style, or light card w/ 1px border Vercel-style; add one floating annotation card Stripe-style.
- CTA: Linear's centered 2-line + white pill; or Vercel's compound command if there's a CLI/agent hook.
- Stats: Stripe's 4-stat hairline band with light-weight 48px numbers (demos built, reply rate, meetings booked).
