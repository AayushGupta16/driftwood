# driftwood · design system

Brand tokens + the rules we hold UI to, so new screens stay on-brand and don't
drift into generic AI-template looks. Derived from `dashboard-wireframe.html` and
a pass through Anthropic's `frontend-design` skill.

## The one risk we're aware of

The frontend-design skill flags **"warm cream background (~#F4F1EA) + high-contrast
display + single accent"** as the #1 AI-generated default. Our paper is `#f7f4ec` —
right in that zone. That's fine *because it's the established brand*, but it means
we must differentiate on every axis the brand leaves free, and never reach for the
other tells (terracotta accent, serif-on-cream, centered gradient hero cards).

What keeps us out of the default:
- Accent is **tide blue**, not terracotta.
- Type pairs **Instrument Serif (display) + Instrument Sans (body) + IBM Plex Mono
  (data/labels)** — not a generic serif-display-on-cream.
- The **wave/tide signature** ties every screen to driftwood's world.

## Color (60 / 30 / 10)

~60% neutral structure, ~30% secondary tone, ~10% accent. Color is scarce — grays
build structure, tide carries meaning (action, "it's live").

| token | hex | use |
|---|---|---|
| `--paper` | `#f7f4ec` | page background (the 60%) |
| `--surface` | `#fffdf8` | cards, raised surfaces |
| `--ink` | `#16181d` | primary text |
| `--ink-soft` | `#494e5b` | secondary text |
| `--ink-faint` | `#8a8e9b` | tertiary / metadata / muted |
| `--tide` | `#15557e` | **the one accent** — actions, live status, funnel |
| `--tide-deep` | `#0d3c5b` | accent gradient end, deep emphasis |
| `--tide-wash` | `#e2ecf3` | accent backgrounds, funnel track |
| `--line` | `#e6e0d0` | borders (low-contrast, never harsh) |
| `--ok` | `#2a7d4f` | "done / safe" — used sparingly |
| `--warn` | `#7a5e12` | attention (e.g. blacklist overlap note) |

Status colors (`ok`/`warn`) are *meaning*, not decoration — don't use them for emphasis.

## Type

Four levels of hierarchy via **size + weight + opacity**, not size alone.

| role | face | use |
|---|---|---|
| display | **Instrument Serif** | greeting / page H1 — used with restraint |
| body | **Instrument Sans** | everything functional, buttons, copy |
| data / label | **IBM Plex Mono** | eyebrow labels, numbers, URLs, KPIs |

- Scale (~1.25 ratio off 14px base): caption 11 · body 14 · h4 16 · h3 18 · h2 22 · h1 26–30.
- Every dynamic number gets `font-variant-numeric: tabular-nums`.
- Four text tiers: primary `--ink` / secondary `--ink-soft` / tertiary `--ink-faint` / muted.

## Layout

- Narrow, focused column (~560–640px). The dashboard is a status surface, not an app shell.
- One focal point per view. Break symmetry — avoid N identical cards in a row
  (that's a tell). Group related items tightly; put real air between groups.
- 8px spacing base; vary the scale by context (component vs section vs major).
- Borders over harsh shadows. Concentric radius: `outerRadius = innerRadius + padding`.
- Information order follows what the customer actually asks:
  **Status (is it on & safe) → Results (is it working) → Pipeline (the flow) → Lists.**

## Signature

The **tide waterline** — the brand's two-wave mark, reused as a thin rule and in the
funnel. It's the one memorable element; everything else stays quiet. (Chanel rule:
before shipping a screen, remove one decoration.)

## Quality floor (don't announce it, just meet it)

Responsive to mobile · visible keyboard focus · `prefers-reduced-motion` respected ·
every interactive element has hover/active/focus/disabled · data has loading/empty/error.

## Copy

End-user's vocabulary, active voice, sentence case. Name things by what the person
controls ("Disconnect", "Replace file"), not how the system works. An action keeps
its name through the whole flow. Empty/error states give direction, not mood.
