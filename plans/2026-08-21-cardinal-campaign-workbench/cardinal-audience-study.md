# Cardinal audience-builder study

## Source and scope

- Source: authenticated `https://app.trycardinal.ai/find-leads`
- Mode: visual study of a live app surface; no settings, searches, lists, or
  customer data were saved or changed.
- Goal: adopt the interaction hierarchy, not Cardinal branding or code.

## Extracted design DNA

- Macrostructure: a data-table canvas with a fixed right-side search workbench.
- Navigation: flat app tabs above the canvas; Search and Details tabs inside the
  workbench.
- Palette: near-white paper, hairline neutral borders, charcoal ink and a dark
  solid primary action. Driftwood keeps its existing paper/tide palette.
- Typography: compact neutral sans with restrained weight changes. Driftwood
  keeps Public Sans and IBM Plex Mono.
- Density: high. Controls are 36–44 px tall, filters are single-line accordion
  rows, and the table remains visible while criteria change.
- Motion: minimal, state-driven expansion only.

## Keep from Cardinal

1. Results remain the main canvas while search criteria live in a docked panel.
2. Search and list details are neighboring tabs, not separate routes or modals.
3. One persistent save action anchors the bottom of the search workbench.

## Replace in Driftwood

1. Replace the large builder heading and detached metadata fields with a compact
   list-title bar and a Details tab.
2. Replace the horizontal filter band with an accordion stack that scales to
   more criteria.
3. Replace the below-the-fold results section with an always-visible people
   table and local result search.
4. Remove repeated instructional copy; use field labels, empty states, and
   provider status to make the flow self-explanatory.
5. Keep Orange Slice explicit and never imply a provider is connected when the
   backend reports otherwise.

## Redesign scope

Structural refresh. Preserve Driftwood navigation, permissions, API contracts,
custom icons, palette, saved-audience library, and post-save campaign handoff.
No visual effect layer is appropriate for this dense operational surface.
