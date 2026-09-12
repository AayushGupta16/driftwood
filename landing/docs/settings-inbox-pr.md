# Combined dashboard release

The dashboard redesign is consolidated into PR #11, paired with backend PR #32.

Customer navigation: Overview, Campaigns, Audiences, Demos, Triggers, Face Cloning
and Inbox. Face Cloning remains a standalone main tab. Settings is in the footer
and groups send schedule, sending accounts, approval mode, assets and team.
Contacts and companies live under Audiences; detailed Metrics remains accessible
from Overview. Existing routes remain available.

Inbox separates Queued, Pending, Sent and Replies and displays the current
approval mode with a direct settings link. Auto means Driftwood human review;
Manual means customer owner/admin review; Hybrid assigns each campaign's
reviewer. Missing assignments default to Driftwood. Single and visible-batch
approvals require server permission and the current policy version. Internal
review controls use those same permissions and versions.

Audiences include uploaded/campaign-generated/curated filters and saved tags.
Unknown historical sources are not guessed. Overview emphasizes email volume,
remaining capacity, queued outreach and approvals. Campaigns show an audience →
demos → email preview → review/send flow, including a personalized sample email
and durable requests for the customer's existing Drift workflow.

Demo request statuses distinguish queued, handed to the agent and blocked. They
do not claim the output is complete. Requesting demos does not activate a
campaign or authorize outreach. Published outputs remain in the Demos library.
Backend eligibility and idempotency checks run before queueing; offline agents
leave requests queued. Request history survives navigation and is refreshable.

The backend must deploy before the frontend merge. This release adds no alternate
send path and preserves existing suppression, QA, scheduling and quota checks.
All browser verification uses mock data; database verification uses disposable
Postgres. No live demo generation or outbound send is part of release testing.

Checks: npm run build, npm run lint, npm test; scripts/inbox-review-qa.mjs,
scripts/approval-review-qa.mjs, scripts/settings-inbox-navigation-qa.mjs and
scripts/combined-dashboard-qa.mjs (local server on port 5191). Both desktop
Chromium and iPhone WebKit are covered. The marketing dashboard screenshot and
its hotspot coordinates are regenerated from the updated overview.
