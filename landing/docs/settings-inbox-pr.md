# Settings and Inbox: first dashboard PR

Based on main at d330ae65, independently of the full local dashboard redesign.
The original full review branch and its Git bundle remain intact.

Settings now lives in the sidebar footer and groups send schedule, sending
accounts, approval policy, product/brand assets, team and Face Cloning. Existing
send schedule and account-management behavior is preserved. Review navigation
moves to the admin sidebar; this navigation change is not an API authorization
migration. Metrics, leads, companies, Triggers and Demos retain their main-branch
surfaces. Broader navigation cleanup is deferred.

Inbox has Queued, Pending, Sent and Replies. Pending identifies the responsible
reviewer and supports single/visible-batch customer approval with confirmation.
Auto means Driftwood human review; Manual means customer owner/admin review;
Hybrid assigns the reviewer per campaign, defaulting unassigned campaigns and
non-campaign messages to Driftwood. Inbox links directly to approval settings.

## Merge blockers

This is a draft frontend PR. Approval policy is currently implemented only by
mock fixtures. Before release the backend needs durable workspace-scoped
GET/PUT /api/v1/dashboard/org/approval-policy with expected_version concurrency
checks. Pending reviews must expose reviewer, can_decide, campaign_id and
approval_policy_version. The existing reviews/decide handler must atomically
enforce workspace/role, assignment and If-Match policy version before scheduling
through the existing approved-review send path. Internal review controls must
respect assignment too. No approval bypass or alternate sender is introduced.
Missing policy or permissions leaves customer approval disabled.

Verify production availability of sends?view=sent, channel-metrics reply bodies
and customer-scoped pending reviews before merging. Unsupported sent-history
responses are reported as unavailable. Replies cover the last 30 days and use
existing records, not invented mailbox threads. Reply composition opens the
email client and does not guarantee provider thread linkage.

Local UI tests use sample data only; no emails are sent. Mock policy and
approval decisions persist in sessionStorage, not the backend. Marketing
screenshot refresh is deferred until this draft's UI and backend are final.

## Verification

- npm run build (including main's required ASR assets)
- npm run lint
- npm test
- node scripts/inbox-review-qa.mjs
- node scripts/approval-review-qa.mjs
- node scripts/settings-inbox-navigation-qa.mjs

Browser scripts expect the local Vite server on port 5191. They cover desktop
Chromium and iPhone WebKit, settings navigation, preserved send schedule,
sending accounts, approval assignment, individual/batch decisions, member
restrictions, sent/queued/reply previews and mobile overflow. All writes use
mock fixtures. Backend enforcement is not verified by these browser tests.
