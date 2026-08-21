# Engineering review guide

This pull request reshapes the customer dashboard into a persistent growth
workspace and pairs with the backend pull request that owns the API, Neon
migration, Orange Slice credential, and private blob storage.

## Product decisions

- The dashboard uses a persistent left sidebar. Customer navigation includes
  only customer work; Agents and Search visibility are isolated in the
  admin-only shell with the existing impersonation controls.
- An audience is a reusable saved lead list. The Leads table displays and
  filters audience membership, but the database keeps membership normalized so
  one lead can belong to many lists.
- Orange Slice is integrated through a native server-backed discovery UI, not
  an iframe. This keeps credentials, tenant policy, provider failures, and
  selected-only persistence under Driftwood's control.
- Campaigns are versioned plans. Activated versions are immutable and cannot
  send; a revision creates the next editable draft.
- Assets are customer-approved reference material for agents. Files stay
  private and links retain explicit external-link behavior.
- Metrics show only observable facts. Contacted, replied, and booked can be
  drilled down to people; open/click remain visibly unavailable.
- Review Queue and other internal cards stay in the current dashboard tab.
- The overview is an operating brief rather than a duplicate navigation page:
  one computed next action, an honest pipeline ledger, readiness across the
  audience/campaign/asset/review path, recent campaigns, activity, compact
  channel controls, and secondary manual-import tools.

## Reviewer map

| Area | Primary files | Review focus |
| --- | --- | --- |
| App shell and routing | `src/dashboard/`, `src/main.tsx`, `src/admin-main.tsx`, `dashboard.html`, `admin.html`, `vercel.json` | Customer/admin separation, legacy route aliases, responsive focus management, lean entry documents. |
| Overview brief | `src/Dashboard.tsx`, `src/dashboard/overview-model.ts`, `src/dashboard/overview.css` | Priority ordering, partial-data states, real inventory counts, preserved channel/import controls, responsive hierarchy. |
| Audiences and lead database | `src/audiences/`, `src/Leads.tsx` | Discovery states, selected-only saves, membership filters, empty/error handling. |
| Campaign workbench | `src/campaigns/` | Autosave, sequence ordering, lifecycle lock, audience application, activation disclosure. |
| Assets | `src/assets/` | Upload/link validation states, authenticated previews, deletion and mobile layout. |
| Metrics | `src/analytics/` | UTC window, available-vs-zero semantics, channel/person filters, data-quality messages. |
| Existing surface integration | `Dashboard.tsx`, `Companies.tsx`, `Review.tsx`, `Agents.tsx`, `SeoGeo.tsx`, `Conversation.tsx` | Shared shell without losing existing behavior; internal links remain same-tab. |
| Safe fixture mode | `src/mock.ts` | Deterministic API shapes only under explicit `?mock=1`; no external writes. |

## End-to-end contract

1. Open Overview and verify its priority is derived from the actual review,
   audience, campaign, and asset state.
2. Search Orange Slice through the backend and select people.
3. Save an audience; only selected candidates become canonical companies/leads
   and normalized membership edges.
4. See that audience in the lead database and apply it to a draft campaign.
5. Edit/reorder a sequence and persist it through authenticated autosave.
6. Activate the campaign; verify it freezes while all send ledgers remain
   untouched.
7. Upload an image and save a link; verify the customer agent sees only its
   workspace assets.
8. Open channel metrics and inspect the exact person behind a reply or booking.
9. Open Review Queue without creating another browser tab.

Mock browser QA exercises the complete presentation flow. Database and API
evidence comes separately from an ephemeral Neon child branch; production Neon,
GCS, Orange Slice settings, Cardinal, Autosana, and outreach providers are not
mutated during review.

## Deployment and rollback

Deploy in this order: additive backend migration, backend service, then site.
The site should not precede the API because the new pages require the new
contracts. Rolling the site and API back is safe while leaving the additive
tables in place; delay schema downgrade until retained audience, campaign, and
asset metadata has been assessed.

The backend change requires no historical backfill. Existing activity powers
metrics immediately; existing leads simply have no audience memberships until
users save them into lists.
