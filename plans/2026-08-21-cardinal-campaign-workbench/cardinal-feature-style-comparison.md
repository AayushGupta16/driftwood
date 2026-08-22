# Cardinal and Driftwood product comparison

## Scope and safety

Cardinal was inspected read-only in the signed-in Autosana workspace on
August 21, 2026. The comparison covered Home, Find Leads, Contacts, the CSV
entry point, New Campaign, Inbox, and Tasks. No lists, campaigns, contacts,
settings, accounts, or provider data were changed.

## Feature comparison

| Area | Cardinal | Driftwood | Direction |
|---|---|---|---|
| Navigation | Browser-like task tabs plus a drawer grouped into Prospect, Engage, and Monitor | Persistent left sidebar with durable product destinations | Keep Driftwood's sidebar. It is easier to scan and does not duplicate browser chrome. Grouping can become quieter, but the customer/admin split should stay. |
| Home | Dismissible onboarding checklist, playbook cards, and monitor/inbox/task shortcuts | Account connection, today's sends, results, next actions, campaigns, and imports | Keep Driftwood's sends-first ordering. It answers the customer's daily questions more directly. Reusable playbooks are a worthwhile later addition after the operational state. |
| Find leads | Result table with a docked Search/Details panel | The same table/workbench anatomy with audience membership and campaign handoff | Keep the adopted anatomy. Remove the provider choice; Orange Slice is infrastructure, not a customer decision. |
| Lists and contacts | One Contacts hub with Lists, People, and Companies tabs; Add Contacts opens Find leads, individual contact, CSV, Sales Navigator, and CRM entries | Separate Audiences, All leads, and Companies destinations; imports live on Overview | Preserve the separate database concepts for now, but expose one consistent Add leads action. CSV upload belongs beside discovery, not inside a provider switch. |
| CSV | Upload CSV is an Add Contacts action | Existing `/api/v1/imports/leads` ingestion with duplicate, suppression, and row-error reporting | Reuse the existing safe import contract. Do not iframe or export credentials to the browser. |
| Campaign creation | Prompt-first composer with list references, CSV/Sales Navigator shortcuts, templates, and building blocks | Explicit audience, lead, sequence, version, and review workflow | Keep Driftwood's deterministic sequence and approval safety. Later, add starting templates and idea shortcuts above the structured builder rather than replacing it. |
| Review | Tasks uses Pending approval, Queue, and Completed tabs with a light empty state | Review queue exposes pending/queued counts, capacity runway, failures, bulk selection, and exact copy detail | Driftwood is functionally stronger. Continue reducing visual weight, but do not remove runway or exact-person decisions. Add Completed only when the backend exposes a useful history. |
| Replies | Unified inbox becomes available after account connection | Metrics identifies exactly who replied or booked, but there is no conversation inbox | This is the clearest feature gap. A reply inbox should be evaluated separately after channel ingestion is complete. |
| Monitoring | Monitors and a signal feed are first-class customer surfaces | Search visibility is correctly admin-only; customer signal monitoring is not yet a product surface | Do not expose the internal SEO/GEO tool. Consider customer buying-signal monitors only as a separately scoped feature. |

## Styling comparison

### Cardinal's useful patterns

- Thin dividers and mostly borderless data rows create a calm, dense canvas.
- A single dark primary button anchors each surface.
- Search, filters, and tabs sit directly above the data they affect.
- Empty states use one short sentence and one action.
- The Contacts and Tasks surfaces keep controls in one compact horizontal band.

### Driftwood's useful patterns

- The persistent sidebar makes the product map visible at all times.
- Tide blue provides clearer selected and focus states than Cardinal's neutral-only chrome.
- Today's sending, capacity, failures, and exact-person metrics are more operationally useful than generic shortcuts.
- Custom outlined SVGs are consistent and avoid Cardinal's mixed emoji, illustration, and provider-icon vocabulary.

### Changes to carry forward

1. Use fewer shadowed containers; prefer dividers and bounded work areas.
2. Keep one primary action per surface and place secondary imports beside the relevant data.
3. Standardize page headers, tab bars, search fields, table headers, empty states, and pagination across Audiences, Leads, Campaigns, Metrics, and Review.
4. Keep headings short and move explanations into errors, empty states, or contextual dialogs.
5. Keep Source Serif for deliberate page-level hierarchy only if it is applied consistently; do not mix serif and sans headings ad hoc.

## Immediate implementation decision

- Audience discovery always calls Orange Slice.
- Orange Slice connection state remains visible but is not interactive.
- Workspace leads is removed from the search-source UI.
- CSV upload reuses the authenticated lead import endpoint and reports imported,
  duplicate, suppressed, and invalid rows inline.
- Uploaded leads enter the canonical lead database; upload does not silently
  create or schedule a campaign.
