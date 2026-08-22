# Anti-slop audit — Gmail email preview (component-scope)

## Context

- Component: recipient-facing email preview
- Vibe: modern-minimal, mail-native
- Motion: 0/3

## Filter

- Applicable: universal component rules, safe rendering, contrast, and keyboard focus
- Skipped: page macrostructure, diversification, marketing, and effect-layer checks

## Results

| Check | Result | Notes |
| --- | --- | --- |
| Raw HTML injection | PASS | React text nodes; no `dangerouslySetInnerHTML` |
| Marker allowlist | PASS | Only whole-line linked images on `https://driftwood.sh/` render as media |
| Invalid marker fallback | PASS | Foreign, malformed, or trailing-text markers remain literal |
| Icon libraries / emoji | PASS | No hits in changed component files |
| Motion defaults | PASS | No motion introduced |
| Typography | PASS | Driftwood chrome is unchanged; Gmail-style Arial is scoped to the embedded artifact and logged |
| Link focus / contrast | PASS | Tide link plus explicit 2px focus outline |
| Desktop layout | PASS | 600px image cap inside a 704px preview; no raw marker visible |
| Mobile layout | PASS | 390px viewport equals 390px document width; no horizontal overflow |
| Queued expansion | PASS | Linked image renders and the raw marker stays hidden |
| Console | PASS | Clean fresh-load browser run |
| Automated gate | PASS | 47 tests, lint, TypeScript, and production build |

## Verdict

- PASS
