# Island greenery and hero story annotation

Targeted amendment to the existing `driftwood-v2` landing page. Preserve the approved page structure, typography, tide palette, canvas sea, and motion system.

## Implementation

1. Remove the castaway, chair, phone, and speech bubble from the canvas island.
2. Reuse the existing block-character illustration language to draw a three-palm grove along the island's upper ridge in muted sea-glass green, with no low shrubs.
3. Draw a large, unmistakable pixel-art galleon wreck across the lower-right tide line: offset hull halves around a jagged split, a raised sterncastle, snapped bare masts, torn square sails, dangling rigging, foam crossing the keel, and debris trailing into the water. Keep it pirate-era in silhouette but omit flags and pirate symbols, using only the existing tide, terracotta, brown, sea-glass, and surf palette.
4. Make a bold two-line “scroll to see testimonials” inscription the island's focal point, using large pixel lettering, a sand-cut contrast shadow, and an oversized terracotta block arrow positioned clear of the palms, wreck, and crab. Overlay a semantic in-page anchor matched to the inscription so mouse, touch, and keyboard activation smoothly scroll to the case-study testimonials, with a visible focus ring and reduced-motion behavior inherited from the page.
5. Give the custom “Real customer story” caption and arrow a reserved lane immediately above the GIF card; increase stacked-layout spacing so it remains clearly separated from the CTA without covering the video.
6. Build, lint, and visually verify desktop and mobile layouts with reduced-motion behavior unchanged.

## Pre-emit verification

```yaml
<design_plan>
  macrostructure_diversification:
    applicable: false
    reason: "Targeted amendment; existing page structure is unchanged"

  vibe_validity:
    anchor: "hand-crafted"
    wildcard: "nautical terminal"
    contradiction: false
    valid: true

  dial_alignment:
    applicable: false
    reason: "Existing density and spacing are preserved"

  motion_personality:
    name: "Premium"
    vibe_default_match: true
    override_logged: false

  hero_math:
    line_range_target: "1-3"
    projected_lines: 2
    universal_4plus_ban_pass: true

  bento_density:
    applicable: false

  label_sweep:
    meta_labels_found: 0
    note: "Real customer story is descriptive provenance, not a section meta-label"
    pass: true

  button_contrast:
    applicable: false
    reason: "No button styles or states change"
    focus_ring_visible: true
    contrast_aa_pass: true

  honest_copy:
    fabricated_metrics: 0
    supplied_customer_claims: ["Real customer story"]

  gsap_decision:
    intensity: "existing"
    gsap_needed: false
    skills_route: "n/a"
</design_plan>
```
