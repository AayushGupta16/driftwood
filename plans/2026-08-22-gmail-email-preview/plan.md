# Gmail email preview

## Scope

- Component-scope update inside `/dashboard/review`; page macrostructure is unchanged.
- Render reviewed email bodies with the same paragraph, line-break, escaping, and linked-image rules as `backend/app/composio.py::_plain_text_to_html`.
- Keep non-email review items in the existing exact-payload treatment.
- Visual direction: modern-minimal Driftwood chrome with a mail-native artifact interior; no visual effect layer; motion intensity 0/3.

## Pre-emit verification

```yaml
<design_plan>
  vibe_validity:
    anchor: "modern-minimal"
    wildcard: "mail-native"
    contradiction: false
    valid: true

  motion_personality:
    name: "Corporate"
    intensity: "0/3"
    vibe_default_match: true
    override_logged: false

  button_contrast:
    applicable: false
    reason: "Read-only preview; no button is introduced"
    link_states_planned: ["default", "hover", "focus", "active", "loading", "loaded", "error", "invalid-marker"]
    focus_ring_visible: true
    contrast_aa_pass: true

  honest_copy:
    fabricated_metrics: 0
    placeholders_required: 0
    pass: true
</design_plan>
```

## Implementation

1. Add a pure parser for the outbound mailer's deliberately narrow image-marker syntax.
2. Add a safe React preview that creates text, paragraph breaks, links, and images without `dangerouslySetInnerHTML`.
3. Use it for pending email decisions and expanded queued-email rows.
4. Cover valid markers, invalid/foreign markers, whitespace paragraph breaks, and summaries with unit tests.
5. Run tests, lint, build, and desktop/mobile browser checks; refresh `public/review-queue.webp` because the dashboard surface changed.
