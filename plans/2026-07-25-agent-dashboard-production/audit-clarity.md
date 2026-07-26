# Agent dashboard clarity audit

## Page purpose

- Job: display fleet status for one administrator
- Success: answer “what is this agent doing, and what do I need to do?” in five seconds
- Marketing intent: none
- Preserved: Driftwood typography, neutral palette, three-column workbench, health and archive controls
- Effect layer: none; this is a dense operational surface
- Motion: 0/3; native scrolling and functional hover/focus only

## Screenshot findings

1. Invalid free-text deadlines collide with the “Current goal” label.
2. “Needs attention” is both vague and redundant with the action box.
3. Raw filenames, acronyms, implementation details, and internal labels make cards hard to compare.
4. Progress text is allowed to grow until cards become documents.
5. Only the agent name opens details, even though the whole card reads as one object.
6. Review URLs appear as prose instead of as usable actions.

## Keep

- Neutral surface and one restrained accent
- Name, short status, current goal, freshness, health, archive
- Detail dialog for the full goal history

## Change

- Replace the generic attention label with explicit states.
- Make the non-control area of every card open details.
- Keep the card summary to two short sentences and one compact goal update.
- Turn review and output URLs into links; never show workspace paths as manager copy.
- Ignore malformed deadlines instead of rendering them into the layout.
