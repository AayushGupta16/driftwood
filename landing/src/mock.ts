import { initializeMockMode, mockBlockedResponse } from "./mock-mode.ts";

/* Preview-branch mock: `?mock=1` serves canned dashboard data so the
   redesigned dashboard can be seen (and screenshotted) without the backend.
   Numbers mirror the real Autosana account. Dev/preview aid only. */

/* The CSV import fixture mirrors the backend contract: an upload creates a
   `csv_upload` audience named after the file, and re-uploading the same file
   reports every row as already imported. These two helpers are pure and
   exported so node tests can pin the mocked upload's response shape. */
export function mockAudienceNameFromFile(fileName: string): string {
  const name = fileName
    .replace(/\.[^.]*$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return name || "uploaded leads";
}

export type MockLeadImportResult = {
  added: number;
  skipped_duplicate: number;
  skipped_suppressed: number;
  errors: Array<{ row: number; reason: string }>;
  audience: { id: string; name: string; member_count: number; created: boolean };
};

export function mockLeadImportResult(
  fileName: string,
  existing: { id: string; memberCount: number } | null,
): MockLeadImportResult {
  const name = mockAudienceNameFromFile(fileName);
  if (existing) {
    return {
      added: 0,
      skipped_duplicate: existing.memberCount,
      skipped_suppressed: 0,
      errors: [],
      audience: { id: existing.id, name, member_count: existing.memberCount, created: false },
    };
  }
  return {
    added: 1,
    skipped_duplicate: 0,
    skipped_suppressed: 0,
    errors: [],
    audience: { id: crypto.randomUUID(), name, member_count: 1, created: true },
  };
}

// Guarded so importing this module under node (tests) stays a no-op.
const search = typeof location === "undefined" ? "" : location.search;
const params = new URLSearchParams(search);
const mockMode = typeof location === "undefined" ? null : initializeMockMode(search, location.pathname);
if (mockMode) {
  params.set("mock", mockMode);
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
  const me = {
    id: "mock",
    email: "marc@a16z.com",
    name: "Marc Andreessen",
    avatar_url: null,
    is_approved: true,
    linkedin_connected: true,
    email_connected: true,
    impersonating: params.get("impersonating") === "1",
    // ?mock=admin flips the admin chrome on (God mode + the SEO / GEO pill)
    // for QA'ing admin-only pages like /dashboard/admin/search-visibility. Plain ?mock=1
    // stays the customer view the baked marketing screenshots are shot from.
    is_admin: mockMode === "admin",
    org: {
      name: "Example workspace",
      role: mockMode === "member" ? "member" : "owner",
    },
    // ?x=pending|connected|locked walks the X card's later states without a
    // real Kernel profile. "locked" is the one worth looking at: connected,
    // but sitting behind X's chat PIN wall so DMs can't go out. Omit for
    // the default "Connect your X account".
    twitter_connected: ["connected", "locked"].includes(params.get("x") ?? ""),
    twitter_pending: params.get("x") === "pending",
    twitter_chat_locked: params.get("x") === "locked",
  };
  const summary = {
    linkedin_connected: true,
    sending: {
      invites_sent: 0,
      invites_cap: 20,
      messages_sent: 0,
      messages_cap: 25,
      within_limits: true,
      last_action_at: hoursAgo(3),
    },
    email_sending: {
      emails_sent: 7,
      emails_cap: 40,
      within_limits: true,
    },
    funnel: { active: 6, contacted: 6, replied: 2, meetings: 1 },
    results: {
      meetings: 1,
      meetings_delta_7d: 1,
      replies: 2,
      replies_delta_7d: 1,
      reply_rate: 0.333,
    },
    lists: { leads: 6, blacklist: 2 },
    companies: { qualified: 6, screened_out: 0, unknown: 0 },
    pending_reviews: 3,
    queued_sends: 5,
  };
  const activity = {
    events: [
      { at: hoursAgo(2), kind: "stage", lead_id: "m1", lead_name: "Dana Whitfield", company_name: "Meridian", detail: "booked" },
      { at: hoursAgo(2.4), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(6), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "email" },
      { at: hoursAgo(7), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "message" },
      { at: hoursAgo(9), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(17), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "connection_request" },
    ],
  };
  // Managed inboxes (GET /mailboxes/overview) are opt-in via ?mock=1&inboxes=1
  // so the default mock view — the one the baked marketing screenshots are
  // shot from — stays exactly as it was. Without the flag the fixture serves
  // an empty pool, which keeps the panel absent (and keeps mock mode from
  // ever reaching the real backend on this path). Capacity counts the managed
  // pool only; the UI adds 20/day for the connected mailbox. Each managed
  // inbox ramps to 20/day over 14 days: 20 active + 20 ready + 10 + 10
  // warming = 60 now, 80 when warm (the paused inbox carries nothing).
  const inboxesFlag = params.get("inboxes");
  const managedInboxes = inboxesFlag && !["0", "off", "false"].includes(inboxesFlag.toLowerCase())
    ? {
        capacity: { current_per_day: 60, projected_per_day: 80 },
        domains: [
          { name: "autosana-ai.com", status: "active", registered_at: hoursAgo(24 * 40) },
          { name: "autosanahq.com", status: "active", registered_at: hoursAgo(24 * 6) },
          { name: "useautosana.com", status: "active", registered_at: hoursAgo(24 * 40) },
        ],
        mailboxes: [
          { address: "yuvan@autosana-ai.com", domain: "autosana-ai.com", status: "active", warming_day: null, warming_days_total: 14, todays_cap: 20, sent_today: 14, health: "good", paused_reason: null },
          { address: "yuvan.sundrani@autosana-ai.com", domain: "autosana-ai.com", status: "ready", warming_day: null, warming_days_total: 14, todays_cap: 20, sent_today: 0, health: "good", paused_reason: null },
          { address: "yuvan@autosanahq.com", domain: "autosanahq.com", status: "warming", warming_day: 5, warming_days_total: 14, todays_cap: 10, sent_today: 8, health: "good", paused_reason: null },
          { address: "yuvan.sundrani@autosanahq.com", domain: "autosanahq.com", status: "warming", warming_day: 5, warming_days_total: 14, todays_cap: 10, sent_today: 7, health: "unknown", paused_reason: null },
          { address: "yuvan@useautosana.com", domain: "useautosana.com", status: "paused", warming_day: null, warming_days_total: 14, todays_cap: 0, sent_today: 0, health: "warning", paused_reason: "Paused Aug 24 after a bounce spike on this address. Sending resumes automatically once bounce rates settle." },
        ],
      }
    : { capacity: { current_per_day: 0, projected_per_day: 0 }, domains: [], mailboxes: [] };
  // The add-inboxes flow's two endpoints. Availability marks everything
  // available except getautosana.com, so the domain search lists whatever
  // gets typed (the Autosana slate included) and the taken path is
  // demoable by searching getautosana.com exactly. Purchase always
  // succeeds, echoing the requested domains back in their registering
  // state — the tile's optimistic merge takes it from there.
  const mailboxAvailability = (_init?: RequestInit, url?: string) => {
    const domain = new URL(url ?? "", location.origin).searchParams.get("domain") ?? "";
    return { domain, available: domain !== "getautosana.com" };
  };
  const mailboxPurchase = (init?: RequestInit) => {
    try {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        domains?: string[];
        senders?: { username: string }[];
      };
      const domains = body.domains ?? [];
      const senders = body.senders ?? [];
      return {
        domains: domains.map((name) => ({ name, status: "registering" })),
        mailboxes_planned: domains.length * senders.length,
      };
    } catch {
      return { domains: [], mailboxes_planned: 0 };
    }
  };
  const daysAhead = (d: number) =>
    new Date(Date.now() + d * 86400e3).toISOString();
  const dateAhead = (d: number) =>
    new Date(Date.now() + d * 86400e3).toISOString().slice(0, 10);
  const lead = (name: string, title: string, company: string) => ({
    lead_id: name, name, title, company,
    linkedin_url: `https://www.linkedin.com/in/${name.toLowerCase().replace(/\s+/g, "-")}`,
    stage: "new", prior_sends: 0, last_sent_at: null,
  });
  const sentLedger = [
    {
      id: "sl1", batch_id: "sb0", kind: "email",
      note: "hi dana \u2014 built meridian a working demo of the same-day booking fix. 19 seconds, real data: https://driftwood.sh/d/meridian-demo. worth a look?",
      subject: "same-day booking fix \u2014 live demo",
      attachment_slug: null, lead: lead("Dana Whitfield", "VP Ops", "Meridian"),
      status: "sent", error: null, error_class: null,
      due_at: hoursAgo(30), projected_date: null, created_at: hoursAgo(31),
      sent_at: hoursAgo(28),
    },
    {
      id: "sl2", batch_id: "sb0", kind: "message",
      note: "hey jordan, the brex one-pager is live \u2014 entity-by-entity rollout and the yield math. link below.",
      subject: null, attachment_slug: null,
      lead: lead("Jordan Reyes", "Head of Growth", "Brex"),
      status: "sent", error: null, error_class: null,
      due_at: hoursAgo(50), projected_date: null, created_at: hoursAgo(52),
      sent_at: hoursAgo(49),
    },
  ];
  const reviews = {
    counts: {
      pending: 5,
      pending_sends: 4,
      pending_system: 1,
      approved_7d: 12,
      denied_7d: 2,
    },
    pending: [
      {
        id: "rb1", batch_id: "b9", agent_id: "demo", kind: "bug_validation",
        title: "Meridian — booking flow bug",
        body: "Selecting a same-day slot on meridian.com/book throws a 500 and drops the reservation.",
        lead: null, attachment_slug: null,
        evidence: { device: "Pixel 9", video_timestamp: "0:12" },
        status: "pending", decision_reason: null, decided_at: null,
        scheduled_batch_id: null, created_at: hoursAgo(1.2),
      },
      {
        id: "r1", batch_id: "b1", agent_id: "demo", kind: "send_message",
        title: "Brex \u2014 Jordan Reyes (message)",
        body: "hey jordan, notion is one of ramp's flagship case studies. built the one-pager brex could send notion's finance team to flip it: entity-by-entity rollout, the yield math, live page linked below. worth a look?",
        lead: lead("Jordan Reyes", "Head of Growth", "Brex"),
        attachment_slug: null, evidence: null, status: "pending",
        decision_reason: null, decided_at: null, scheduled_batch_id: null,
        created_at: hoursAgo(0.15),
      },
      {
        id: "r2", batch_id: "b1", agent_id: "demo", kind: "send_message",
        title: "Northstar \u2014 Priya Patel (message)",
        body: "hey priya, found a dead link on northstar's pricing page. built you a working demo of the fix, 19 seconds, link below. worth a look?",
        lead: lead("Priya Patel", "Head of Growth", "Northstar"),
        attachment_slug: null, evidence: null, status: "pending",
        decision_reason: null, decided_at: null, scheduled_batch_id: null,
        created_at: hoursAgo(0.4),
      },
      {
        id: "r3", batch_id: "b2", agent_id: "demo", kind: "send_connection",
        title: "Ledgerline \u2014 Sam Okafor (connect)",
        body: "fellow yc founder! building in the fintech tooling space too.",
        lead: lead("Sam Okafor", "CTO", "Ledgerline"),
        attachment_slug: null, evidence: null, status: "pending",
        decision_reason: null, decided_at: null, scheduled_batch_id: null,
        created_at: hoursAgo(1.1),
      },
      {
        id: "r4", batch_id: "b3", agent_id: "demo", kind: "send_email",
        title: "Autosana — Yuvan Kumar (email)",
        subject: "Two outreach fixes from this week",
        body: "Hey Yuvan,\n\nI pulled the two workflow changes into one short walkthrough.\n\n[![Autosana outreach workflow](https://driftwood.sh/case-autosana-poster.webp)](https://driftwood.sh/customers/autosana)\n\nWorth a look before our next check-in?\n\nBest,\nAayush",
        lead: lead("Yuvan Kumar", "CEO", "Autosana"),
        attachment_slug: null, evidence: null, status: "pending",
        decision_reason: null, decided_at: null, scheduled_batch_id: null,
        created_at: hoursAgo(1.4),
      },
    ],
    decided: [], total_pending: 4, limit: 25, offset: 0,
    queue_stats: [
      { kind: "connection_request", queued: 2, sent_24h: 3, cap: 20, runs_through: dateAhead(2), failed: 2 },
      { kind: "message", queued: 3, sent_24h: 6, cap: 25, runs_through: dateAhead(2), failed: 0 },
      { kind: "email", queued: 1, sent_24h: 2, cap: 20, runs_through: dateAhead(1), failed: 0 },
    ],
  };
  // Approved-but-undelivered ScheduledSends (the review page's Queued tab),
  // due_at asc = the send order. One sending, two failed (one classified,
  // one pre-classification null), the rest pending.
  const sends = {
    sends: [
      {
        id: "s1", batch_id: "sb1", kind: "connection_request",
        note: "fellow yc founder! building in the fintech tooling space too.",
        attachment_slug: null, lead: lead("Riley Chen", "Cofounder", "Anchorpoint"),
        status: "failed", error_class: "already_connected",
        error: "Unipile 422 unprocessable_entity: cannot_resend_yet — an invitation was already sent to this recipient recently; provider allows a new invite after the previous one is withdrawn for 3 weeks",
        due_at: hoursAgo(20), projected_date: null, created_at: hoursAgo(26),
      },
      {
        id: "s7", batch_id: "sb1", kind: "connection_request",
        note: "hey marcus — saw the tidewater incident postmortem on your blog. building agents that do outbound the way founders do it by hand. would love to connect.",
        attachment_slug: null, lead: lead("Marcus Hale", "Cofounder", "Tidewater"),
        status: "failed", error_class: null,
        error: "Unipile 422 unprocessable_entity: provider rejected the invitation (raw error body not captured)",
        due_at: hoursAgo(18), projected_date: null, created_at: hoursAgo(25),
      },
      {
        id: "s2", batch_id: "sb1", kind: "message",
        note: "hey dana, congrats on the meridian launch. the booking flow demo is live at the link below — 19 seconds, real data. worth a look?",
        attachment_slug: null, lead: lead("Dana Whitfield", "VP Engineering", "Meridian"),
        status: "sending", error: null, error_class: null,
        due_at: hoursAgo(0.05), projected_date: dateAhead(0), created_at: hoursAgo(22),
      },
      {
        id: "s3", batch_id: "sb2", kind: "message",
        note: "hey priya, found a dead link on northstar's pricing page. built you a working demo of the fix, 19 seconds, link below. worth a look?",
        attachment_slug: "northstar-pricing-fix", lead: lead("Priya Patel", "Head of Growth", "Northstar"),
        status: "pending", error: null, error_class: null,
        due_at: daysAhead(0.2), projected_date: dateAhead(0), created_at: hoursAgo(21),
      },
      {
        id: "s4", batch_id: "sb2", kind: "connection_request",
        note: "hey sam — saw ledgerline's reconciliation launch on hn. we're building agents that do outbound the way founders do it by hand. would love to connect.",
        attachment_slug: null, lead: lead("Sam Okafor", "CTO", "Ledgerline"),
        status: "pending", error: null, error_class: null,
        due_at: daysAhead(1), projected_date: dateAhead(1), created_at: hoursAgo(21),
      },
      {
        id: "s5", batch_id: "sb2", kind: "message",
        note: "hey jordan, notion is one of ramp's flagship case studies. built the one-pager brex could send notion's finance team to flip it: entity-by-entity rollout, the yield math against their current sweep setup, and the migration path their controllers would actually sign off on. live page linked below — took a real pass at the numbers, not a template. if it's useful, i can rework it against whatever deck your team already runs with. worth a look?",
        attachment_slug: null, lead: lead("Jordan Reyes", "Head of Growth", "Brex"),
        status: "pending", error: null, error_class: null,
        due_at: daysAhead(2), projected_date: dateAhead(2), created_at: hoursAgo(20),
      },
      {
        id: "s6", batch_id: "sb3", kind: "connection_request",
        note: "hey — loved your talk on mobile release trains. building in the qa tooling space, would love to swap notes.",
        attachment_slug: null, lead: null,
        status: "pending", error: null, error_class: null,
        due_at: daysAhead(2.5), projected_date: null, created_at: hoursAgo(4),
      },
      {
        id: "s8", batch_id: "sb4", kind: "email",
        subject: "Two outreach fixes from this week",
        note: "Hey Yuvan,\n\nI pulled the two workflow changes into one short walkthrough.\n\n[![Autosana outreach workflow](https://driftwood.sh/case-autosana-poster.webp)](https://driftwood.sh/customers/autosana)\n\nWorth a look before our next check-in?\n\nBest,\nAayush",
        attachment_slug: null, lead: lead("Yuvan Kumar", "CEO", "Autosana"),
        status: "pending", error: null, error_class: null,
        due_at: daysAhead(1.5), projected_date: dateAhead(1), created_at: hoursAgo(8),
      },
    ],
    total: 8, limit: 100, offset: 0,
    counts: { pending: 5, sending: 1, failed: 2, sent: 2 },
  };
  // Bodies may be functions of the request init so POST results can echo the
  // request (e.g. cancel reports how many ids it was sent).
  const cancelSends = (init?: RequestInit) => {
    let n = 0;
    try {
      const parsed = JSON.parse(typeof init?.body === "string" ? init.body : "{}") as { send_ids?: unknown[] };
      n = Array.isArray(parsed.send_ids) ? parsed.send_ids.length : 0;
    } catch { /* malformed body — report 0 canceled */ }
    return { canceled: n, skipped: [], agent_woken: true };
  };
  const dismissSends = (init?: RequestInit) => {
    let n = 0;
    try {
      const parsed = JSON.parse(typeof init?.body === "string" ? init.body : "{}") as { send_ids?: unknown[] };
      n = Array.isArray(parsed.send_ids) ? parsed.send_ids.length : 0;
    } catch { /* malformed body — report 0 dismissed */ }
    return { dismissed: n, skipped: [] };
  };
  const decideReviews = (init?: RequestInit) => {
    let approved = 0, denied = 0;
    try {
      const parsed = JSON.parse(typeof init?.body === "string" ? init.body : "[]") as { decision?: string }[];
      if (Array.isArray(parsed))
        for (const d of parsed) {
          if (d.decision === "approve") approved++;
          else if (d.decision === "deny") denied++;
        }
    } catch { /* malformed body — report nothing decided */ }
    const queued = approved
      ? [`queued ${approved} message${approved === 1 ? "" : "s"}: delivery over ~${Math.max(approved * 2, 1)} min`]
      : [];
    return { approved, denied, skipped: [], queued, agent_woken: true };
  };
  // /api/v1/admin/probes/dashboard deliberately mocks a 404, not data: that
  // exercises the SEO/GEO page's run-zero empty state (its launch state)
  // through the real no-data code path, without the network-error console
  // noise an actually-missing backend would add.
  const probesNotFound = () =>
    new Response(JSON.stringify({ detail: "no probe runs yet" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  const status = (
    whats_happening: string,
    outcome: string,
    next_action: string,
    steps: { text: string; status: string; evidence?: string }[],
    latest_output: { title: string; summary: string; url: string } | null = null,
    needs_human: (string | { id?: string; kind?: string; question: string; url?: string; link_label?: string; options?: { id: string; label: string; consequence?: string }[] })[] = [],
  ) => ({
    state: needs_human.length
      ? "waiting_for_review"
      : steps.length > 0 && steps.every((step) => step.status === "done")
        ? "complete"
        : steps.some((step) => step.status === "blocked")
          ? "blocked"
          : "running",
    whats_happening,
    goals: [{
      id: outcome.toLowerCase().replace(/\W+/g, "-").slice(0, 48), outcome, status: "active", priority: "P1",
      // A calendar date, exactly as the update_status tool requires it.
      deadline: dateAhead(1),
      next_action, steps,
    }],
    needs_human, subagents: [], latest_output,
  });
  const agentDashboard = {
    refreshed_at: new Date().toISOString(),
    agents: [
      {
        agent_id: "autosana", paused: false, customer_health: 3, is_running: true,
        attention_required: true, attention_reasons: [],
        current_assignment: "Report target review, bug hunts, demo readiness, and blockers from current pipeline data.",
        status: status(
          "It has 35 demo runs ready, but work is stalled until you review its target batches and roughly 107 pending connections.",
          "Keep the target-review and bug-hunt pipeline moving",
          "Run bug hunts on the targets Aayush approves",
          [
            { text: "Publish the daily pipeline checkpoint", status: "done", evidence: "35 take-ready runs" },
            { text: "Review the pending target batches", status: "blocked" },
            { text: "Run bug hunts on approved targets", status: "todo" },
          ],
          { title: "Taste re-screen", summary: "Promoted and maybe companies awaiting review.", url: "https://driftwood.sh/d/autosana-taste-rescreen" },
          [
            { id: "target-batches", kind: "review", question: "Approve or reject the pending target batches.", url: "https://driftwood.sh/d/autosana-taste-rescreen", link_label: "Open target review" },
            {
              id: "sprocket-breakaway", kind: "decision",
              question: "Sprocket Sports and BreakAway Data look strong — add both to this week's wave?",
              options: [
                { id: "both", label: "Add both", consequence: "Connection requests queue tonight" },
                { id: "hold", label: "Hold for now", consequence: "They stay in the sourcing list" },
              ],
            },
            { id: "stale-batch", kind: "question", question: "The oldest connection batch is 10 days old — drop it or send as-is?" },
          ],
        ),
        status_updated_at: hoursAgo(0.3), last_activity_at: hoursAgo(0.05),
      },
      {
        agent_id: "autosana_demo", paused: false, customer_health: 3, is_running: false,
        attention_required: true, attention_reasons: ["Started a turn hours ago and never reported finishing"], current_assignment: null,
        status: status(
          "Its warm outreach wave cannot start because LinkedIn is disconnected.",
          "Submit the warm wave after LinkedIn reconnects", "Recheck LinkedIn",
          [{ text: "Reconnect LinkedIn", status: "blocked" }, { text: "Submit the warm wave", status: "todo" }],
          null, [{ id: "reconnect-linkedin", kind: "question", question: "Reconnect LinkedIn for this account?" }],
        ),
        status_updated_at: hoursAgo(3), last_activity_at: hoursAgo(3),
      },
      {
        agent_id: "cyberneticphysics", paused: false, customer_health: 3, is_running: false,
        attention_required: true, attention_reasons: [], current_assignment: null,
        status: status(
          "The corrected robot comparison is finished and waiting for your review.",
          "Deliver the corrected robot comparison", "Collect review feedback",
          [{ text: "Restore all three opening swings", status: "done" }, { text: "Review the corrected cut", status: "blocked" }],
          { title: "Ngannou robot side-by-side", summary: "Corrected cut with all three swings.", url: "https://driftwood.sh/d/cyberneticphysics-ngannou-ko-sbs" },
          [{ id: "robot-video", kind: "review", question: "Review the corrected side-by-side.", url: "https://driftwood.sh/d/cyberneticphysics-ngannou-ko-sbs", link_label: "Open video", options: [{ id: "approve", label: "Good to send", consequence: "Goes to the customer today" }, { id: "another-pass", label: "One more pass", consequence: "Agent does another round first" }] }],
        ),
        status_updated_at: hoursAgo(22), last_activity_at: hoursAgo(22),
      },
      {
        agent_id: "driftwood", paused: false, customer_health: 3, is_running: false,
        attention_required: true, attention_reasons: [], current_assignment: null,
        status: status(
          "It stopped sourcing to avoid duplicates because roughly 449 outreach items are already in your review queue.",
          "Keep the connection-request queue supplied without duplicates", "Wait for review backlog to clear",
          [{ text: "Verify the review backlog", status: "done" }, { text: "Review existing outreach waves", status: "blocked" }],
          null, ["Review the existing outreach waves."],
        ),
        status_updated_at: hoursAgo(8), last_activity_at: hoursAgo(8),
      },
      {
        agent_id: "gracegong", paused: false, customer_health: 3, is_running: false,
        attention_required: false, attention_reasons: [], current_assignment: null,
        status: status(
          "It finished the hosted outreach brief and has nothing else assigned.",
          "Finish the hosted outreach brief", "No next action until redirected",
          [{ text: "Publish the hosted brief", status: "done" }, { text: "Apply the show-not-tell revision", status: "done" }],
          { title: "Grace Gong outreach brief", summary: "The hosted full draft.", url: "https://driftwood.sh/d/smartventure-truell-brief" },
        ),
        status_updated_at: hoursAgo(26), last_activity_at: hoursAgo(26),
      },
      {
        agent_id: "madhumita_krishnan", paused: true, customer_health: 2, is_running: false,
        attention_required: false, attention_reasons: [], current_assignment: null,
        status: status("Paused with no assignment in flight.", "Await the next assignment", "Resume when restored", []),
        status_updated_at: hoursAgo(48), last_activity_at: hoursAgo(48),
      },
      {
        agent_id: "oruk", paused: false, customer_health: 3, is_running: true,
        attention_required: false, attention_reasons: [],
        current_assignment: "Redo the remaining demos with a verified Oruk emotion tag for every caption cue.",
        status: status(
          "It is actively rebuilding caption demos. Disney and Paramount passed; Comcast and the remaining cuts are in progress.",
          "Rebuild every demo with verified Oruk emotion tags", "Finish Comcast and the remaining rebuilds",
          [
            { text: "Pass Disney and Paramount strict QA", status: "done", evidence: "Disney 21/21; Paramount 22/22" },
            { text: "Finish Comcast and remaining rebuilds", status: "doing" },
            { text: "Update the action-items artifact", status: "todo" },
          ],
          { title: "Oruk action items", summary: "Standing review surface for the caption rebuilds.", url: "https://driftwood.sh/d/oruk-action-items" },
        ),
        status_updated_at: hoursAgo(0.1), last_activity_at: hoursAgo(0.01),
      },
    ],
  };
  // A second goal on a no-ask agent, so the card's goals-list state (shown
  // when nothing waits on the founder) is visible with canned data.
  agentDashboard.agents
    .find((agent) => agent.agent_id === "oruk")
    ?.status.goals.push({
      id: "hit-100-caption-demos", outcome: "Hit 100 caption demos this week", status: "active", priority: "P2",
      deadline: dateAhead(5),
      next_action: "Queue the next batch after the emotion-tag rebuilds",
      steps: [
        { text: "Ship the first 40 demos", status: "done" },
        { text: "Ship the remaining 60", status: "doing" },
      ],
    });
  // One canned exchange, close to what a real founder channel holds: prose,
  // a Slack-syntax link, and a mention the page has to unwrap.
  const conversationLog = [
    { role: "founder", text: "we need to get something out to nathan tonight", at: 5.5 },
    {
      role: "agent",
      text: "Plan for tonight, working now: fix Zootopia and Studio first, since they unlock the six send-ready rows that already have verified captions. ETA about 40 minutes for both.",
      at: 5.4,
    },
    { role: "founder", text: "why is the ETA so long? should be 20 minutes max if you run them in parallel", at: 4.2 },
    {
      role: "agent",
      text: "Fair push. The caption edit itself is minutes; the rest was product-side QA I was serialising for no good reason. Running them in parallel now.",
      at: 4.1,
    },
    {
      role: "agent",
      text: "All four demos are rebuilt and republished with your tags verbatim. Latest cut is up at <https://driftwood.sh/d/oruk-caption-demos|the demo page> if you want to check before it goes out.",
      at: 0.6,
    },
    { role: "founder", text: "Flash should not have a disappointed tag. otherwise ready to send", at: 0.2 },
  ];
  const answerAsks = (init?: RequestInit, url?: string) => {
    const agentId = decodeURIComponent(url?.match(/\/agents\/([^/]+)\/asks/)?.[1] ?? "");
    const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
    const agent = agentDashboard.agents.find((row) => row.agent_id === agentId);
    const slugs = (body.answers ?? []).map((a: { slug: string }) => a.slug);
    if (agent?.status) {
      agent.status.needs_human = agent.status.needs_human.filter(
        (need) => typeof need === "string" || !slugs.includes(need.id ?? ""),
      );
    }
    return (body.answers ?? []).map((a: { slug: string; text: string }) => ({
      slug: a.slug, state: "resolved", resolved_by: "founder", answer: a.text,
    }));
  };
  const conversation = (init?: RequestInit, url?: string) => {
    const agentId = decodeURIComponent(url?.match(/\/agents\/([^/]+)\/conversation/)?.[1] ?? "oruk");
    const agent = agentDashboard.agents.find((row) => row.agent_id === agentId);
    if (url?.includes("/backfill")) return { agent_id: agentId, scanned: 200, imported: 167 };
    if (init?.method === "POST") {
      const body = JSON.parse(typeof init.body === "string" ? init.body : "{}");
      conversationLog.push({ role: "founder", text: String(body.text ?? ""), at: 0 });
    }
    return {
      agent_id: agentId,
      paused: Boolean(agent?.paused),
      online: !agent?.paused,
      can_send: true,
      has_more: true,
      oldest_at: hoursAgo(conversationLog[0].at),
      messages: conversationLog.map((row, index) => ({
        id: `m${index}`,
        role: row.role,
        text: row.text,
        source: "slack",
        created_at: hoursAgo(row.at),
      })),
    };
  };
  const mutateAgent = (init?: RequestInit, url?: string) => {
    if (url?.includes("/asks/answers")) return answerAsks(init, url);
    if (url?.includes("/conversation")) return conversation(init, url);
    const match = url?.match(/\/api\/v1\/admin\/agents\/([^/]+)\/(pause|health)$/);
    if (!match) return {};
    const agent = agentDashboard.agents.find((row) => row.agent_id === decodeURIComponent(match[1]));
    const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
    if (agent && match[2] === "pause") agent.paused = Boolean(body.paused);
    if (agent && match[2] === "health") agent.customer_health = Number(body.score);
    return { agent_id: agent?.agent_id, paused: agent?.paused, customer_health: agent?.customer_health };
  };
  type MockCampaignContact = {
    id: string; name: string; company: string; role: string; stage: string;
    selected: boolean; selectable: boolean; enrollment_status: string | null;
    current_step: number | null; next_action_at: string | null;
  };
  const mockCampaignContacts: MockCampaignContact[] = [
    ["c78e9104-eedd-4962-8779-d6ba9541da19", "Mara Okafor", "Ternary Labs", "VP Operations"],
    ["235d4c45-7d22-4498-b252-2a673a390e39", "Anika Shah", "Northstar Health", "Head of QA"],
    ["4238a3f1-b9d2-4b12-9eb0-b491bc0c9ecb", "Luca Moretti", "Clearline", "Founder"],
    ["64d728a7-cd39-4758-99cb-6d319f5c517f", "Ines Duarte", "Relayworks", "Product lead"],
    ["20f90c58-aa21-4c24-a7f8-aae18c1b4bf8", "Owen Brooks", "Juniper Systems", "Engineering director"],
    ["69fac83b-6ce8-472f-a095-a1ca4a4ff680", "Nadia Rahman", "Fieldnote", "COO"],
  ].map(([id, name, company, role], index) => ({
    id, name, company, role, stage: "new", selected: index < 3, selectable: true,
    enrollment_status: index < 3 ? "draft" : null, current_step: null, next_action_at: null,
  }));
  type MockCampaign = {
    id: string; series_id: string; version: number; name: string; description: string;
    audience_name: string; audience_id: string | null; lock_version: number;
    status: string; step_count: number; contact_count: number;
    created_at: string; updated_at: string; steps: Record<string, unknown>[];
    contacts: MockCampaignContact[];
  };
  const campaignSummary = (campaign: MockCampaign) => ({
    id: campaign.id, series_id: campaign.series_id, version: campaign.version,
    name: campaign.name, description: campaign.description, audience_name: campaign.audience_name,
    audience_id: campaign.audience_id, lock_version: campaign.lock_version,
    status: campaign.status, step_count: campaign.steps.length,
    contact_count: campaign.contacts.filter((contact) => contact.selected).length,
    created_at: campaign.created_at, updated_at: campaign.updated_at,
  });
  const mockCampaigns: MockCampaign[] = [{
    id: "founder-led-qa",
    series_id: "8f909c22-8785-4877-a1ae-cc659b389de3",
    version: 1,
    name: "Founder-led QA teams",
    description: "Lead with a tailored workflow demo, then follow up on LinkedIn.",
    audience_name: "Qualified QA leaders",
    audience_id: "audience-qualified-qa",
    lock_version: 0,
    status: "draft",
    step_count: 2,
    contact_count: 3,
    created_at: hoursAgo(72),
    updated_at: hoursAgo(1),
    steps: [
      {
        id: "0b088b8b-cbc8-40fe-b167-59d2e80db846", position: 1, kind: "email",
        label: "Tailored intro", subject: "Built this for {{company}}",
        body: "Hi {{first_name}},\n\nI put together a short, tailored look at how this could work for {{company}}.",
        delay_days: 0, send_window: "business-hours", stop_on_reply: true, attachment_slug: null,
      },
      {
        id: "2d095dbf-517f-43df-87f7-b09fc96de314", position: 2, kind: "wait",
        label: "Wait", subject: null, body: "", delay_days: 3,
        send_window: "business-hours", stop_on_reply: false, attachment_slug: null,
      },
    ],
    contacts: mockCampaignContacts,
  }, {
    // Paused fixture: resuming it previews an overlap with the active
    // "Expansion outreach" campaign below (Ines Duarte and Owen Brooks).
    id: "warm-intro-revival",
    series_id: "3d1a06a4-19cf-4f2a-9f8e-1f0a3f6f9c21",
    version: 1,
    name: "Warm intro revival",
    description: "Follow up with product leaders who went quiet after the first touch.",
    audience_name: "Product-led teams",
    audience_id: null,
    lock_version: 2,
    status: "paused",
    step_count: 2,
    contact_count: 3,
    created_at: hoursAgo(120),
    updated_at: hoursAgo(6),
    steps: [
      {
        id: "8f4de0cb-6cf0-4a34-9f0f-6a4f6f5cfd1a", position: 1, kind: "email",
        label: "Reintro email", subject: "Picking this back up for {{company}}",
        body: "Hi {{first_name}},\n\nCircling back with the tailored walkthrough I promised for {{company}}.",
        delay_days: 0, send_window: "business-hours", stop_on_reply: true, attachment_slug: null,
      },
      {
        id: "b0a4c7de-30a4-4f56-8e0e-2a7f3c1d9b42", position: 2, kind: "wait",
        label: "Wait", subject: null, body: "", delay_days: 4,
        send_window: "business-hours", stop_on_reply: false, attachment_slug: null,
      },
    ],
    contacts: mockCampaignContacts.map((contact, index) => ({
      ...contact,
      selected: index >= 3,
      enrollment_status: index >= 3 ? "waiting" : null,
      current_step: index >= 3 ? 1 : null,
      next_action_at: null,
    })),
  }, {
    id: "expansion-outreach",
    series_id: "5be0f7d3-4a91-4dd1-a2b4-8c50c3f8ab77",
    version: 1,
    name: "Expansion outreach",
    description: "Active sequence for operations leaders at growth-stage teams.",
    audience_name: "Operations leaders",
    audience_id: null,
    lock_version: 3,
    status: "active",
    step_count: 1,
    contact_count: 2,
    created_at: hoursAgo(96),
    updated_at: hoursAgo(2),
    steps: [
      {
        id: "e1c9a2f6-7b8d-4c3e-9a51-0d2f4b6c8e13", position: 1, kind: "email",
        label: "Send email", subject: "An operations idea for {{company}}",
        body: "Hi {{first_name}},\n\nSharing a short workflow idea built around {{company}}.",
        delay_days: 0, send_window: "business-hours", stop_on_reply: true, attachment_slug: null,
      },
    ],
    contacts: mockCampaignContacts.map((contact, index) => ({
      ...contact,
      selected: index === 3 || index === 4,
      enrollment_status: index === 3 || index === 4 ? "ready" : null,
      current_step: index === 3 || index === 4 ? 1 : null,
      next_action_at: index === 3 || index === 4 ? hoursAgo(-4) : null,
    })),
  }];
  const mockFixtureCampaignIds = new Set(mockCampaigns.map((campaign) => campaign.id));
  const mockCampaignStorageKey = "driftwood.dashboard.mock-campaigns";
  try {
    const stored = JSON.parse(sessionStorage.getItem(mockCampaignStorageKey) ?? "[]") as MockCampaign[];
    for (const campaign of stored) {
      if (
        campaign && typeof campaign.id === "string" &&
        Array.isArray(campaign.steps) && Array.isArray(campaign.contacts) &&
        !mockCampaigns.some((item) => item.id === campaign.id)
      ) {
        mockCampaigns.unshift(campaign);
      }
    }
  } catch {
    sessionStorage.removeItem(mockCampaignStorageKey);
  }
  const persistMockCampaigns = () => {
    try {
      sessionStorage.setItem(
        mockCampaignStorageKey,
        JSON.stringify(mockCampaigns.filter((campaign) => !mockFixtureCampaignIds.has(campaign.id))),
      );
    } catch {
      // The preview remains usable when storage is blocked; only reload persistence is lost.
    }
  };
  const campaignsApi = (init?: RequestInit, url?: string) => {
    const method = init?.method ?? "GET";
    const pathname = new URL(url ?? location.href, location.href).pathname;
    const suffix = pathname.replace("/api/v1/dashboard/campaigns", "").replace(/^\//, "");
    const [encodedId, action] = suffix.split("/");
    if (!encodedId) {
      if (method === "POST") {
        const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
        const audienceId = typeof body.audience_id === "string" ? body.audience_id : null;
        const audience = mockAudiences.find((item) => item.id === audienceId);
        const selectedLeadIds = new Set(
          audience?.members
            .filter((member) => member.outreach_eligible)
            .map((member) => member.lead_id) ?? [],
        );
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        const campaign: MockCampaign = {
          id, series_id: crypto.randomUUID(), version: 1,
          name: String(body.name ?? "Untitled campaign") === "Untitled campaign" && audience
            ? `${audience.name} campaign`
            : String(body.name ?? "Untitled campaign"),
          description: "Build a deliberate sequence for a focused group of leads.",
          audience_name: audience?.name ?? "Choose an audience",
          audience_id: audience?.id ?? null,
          lock_version: 0,
          status: "draft", step_count: 2, contact_count: selectedLeadIds.size,
          created_at: now, updated_at: now,
          steps: [
            {
              id: crypto.randomUUID(), position: 1, kind: "email", label: "Send email",
              subject: "A quick idea for {{company}}",
              body: "Hi {{first_name}},\n\nI put together a short, tailored look at how this could work for {{company}}.",
              delay_days: 0, send_window: "business-hours", stop_on_reply: true, attachment_slug: null,
            },
            {
              id: crypto.randomUUID(), position: 2, kind: "wait", label: "Wait", subject: null,
              body: "", delay_days: 3, send_window: "business-hours", stop_on_reply: false,
              attachment_slug: null,
            },
          ],
          contacts: mockCampaignContacts.map((contact) => ({
            ...contact,
            selected: selectedLeadIds.has(contact.id),
            enrollment_status: selectedLeadIds.has(contact.id) ? "draft" : null,
            current_step: null,
            next_action_at: null,
          })),
        };
        mockCampaigns.unshift(campaign);
        persistMockCampaigns();
        return campaign;
      }
      return { campaigns: mockCampaigns.map(campaignSummary) };
    }
    const id = decodeURIComponent(encodedId);
    const campaign = mockCampaigns.find((row) => row.id === id);
    if (!campaign) return new Response(JSON.stringify({ error: { detail: "Campaign not found" } }), { status: 404, headers: { "Content-Type": "application/json" } });
    if (method === "GET" && action === "contacts") {
      const query = new URL(url ?? location.href, location.href).searchParams;
      const search = (query.get("q") ?? "").trim().toLowerCase();
      const limit = Math.max(1, Number(query.get("limit") ?? 50));
      const offset = Math.max(0, Number(query.get("offset") ?? 0));
      const contacts = search
        ? campaign.contacts.filter((contact) =>
          [contact.name, contact.company, contact.role].some((value) => value.toLowerCase().includes(search)),
        )
        : campaign.contacts;
      return {
        contacts: contacts.slice(offset, offset + limit),
        total: contacts.length,
        limit,
        offset,
      };
    }
    const activeOverlaps = () => {
      const selectedIds = new Set(
        campaign.contacts.filter((contact) => contact.selected).map((contact) => contact.id),
      );
      const conflicts = mockCampaigns.flatMap((other) => {
        if (other.id === campaign.id || other.status !== "active") return [];
        return other.contacts.flatMap((contact) =>
          contact.selected && selectedIds.has(contact.id)
            ? [{
              lead_id: contact.id,
              lead_name: contact.name,
              campaign_id: other.id,
              campaign_name: other.name,
            }]
            : [],
        );
      });
      return {
        lead_count: new Set(conflicts.map((conflict) => conflict.lead_id)).size,
        campaign_count: new Set(conflicts.map((conflict) => conflict.campaign_id)).size,
        conflicts,
      };
    };
    if (method === "GET" && action === "overlaps") return activeOverlaps();
    if (method === "PUT") {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      campaign.name = String(body.name ?? campaign.name);
      campaign.description = String(body.description ?? campaign.description);
      campaign.audience_name = String(body.audience_name ?? campaign.audience_name);
      campaign.audience_id = typeof body.audience_id === "string" ? body.audience_id : null;
      campaign.lock_version += 1;
      campaign.steps = (body.steps ?? []).map((step: Record<string, unknown>, index: number) => ({ ...step, position: index + 1 }));
      const selectedIds = new Set<string>(body.lead_ids ?? []);
      campaign.contacts = campaign.contacts.map((contact) => ({
        ...contact, selected: selectedIds.has(contact.id),
        enrollment_status: selectedIds.has(contact.id) ? "draft" : null,
      }));
      campaign.updated_at = new Date().toISOString();
      persistMockCampaigns();
      return campaign;
    }
    if (method === "POST" && action === "activate") {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      const confirmed = new Set<string>(body.confirmed_overlap_lead_ids ?? []);
      const overlaps = activeOverlaps();
      if (overlaps.conflicts.some((conflict) => !confirmed.has(conflict.lead_id))) {
        return new Response(
          JSON.stringify({ error: { code: "campaign_lead_overlap", detail: "Confirm the active campaign overlap before continuing." } }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
      campaign.status = "active";
      campaign.lock_version += 1;
      campaign.contacts = campaign.contacts.map((contact) => ({
        ...contact,
        enrollment_status: contact.selected ? "ready" : null,
        current_step: contact.selected ? 1 : null,
        next_action_at: contact.selected ? new Date().toISOString() : null,
      }));
      campaign.updated_at = new Date().toISOString();
      persistMockCampaigns();
      return { campaign, outreach_queued: false, message: "Campaign version frozen. No outreach was queued or sent." };
    }
    if (method === "POST" && (action === "pause" || action === "resume")) {
      if (action === "resume") {
        const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
        const confirmed = new Set<string>(body.confirmed_overlap_lead_ids ?? []);
        const overlaps = activeOverlaps();
        if (overlaps.conflicts.some((conflict) => !confirmed.has(conflict.lead_id))) {
          return new Response(
            JSON.stringify({ error: { code: "campaign_lead_overlap", detail: "Confirm the active campaign overlap before continuing." } }),
            { status: 409, headers: { "Content-Type": "application/json" } },
          );
        }
      }
      campaign.status = action === "pause" ? "paused" : "active";
      campaign.updated_at = new Date().toISOString();
      persistMockCampaigns();
      return campaign;
    }
    if (method === "POST" && action === "revisions") {
      const revision: MockCampaign = JSON.parse(JSON.stringify(campaign));
      revision.id = crypto.randomUUID();
      revision.version += 1;
      revision.status = "draft";
      revision.lock_version = 0;
      revision.created_at = new Date().toISOString();
      revision.updated_at = revision.created_at;
      revision.steps = revision.steps.map((step) => ({ ...step, id: crypto.randomUUID() }));
      revision.contacts = revision.contacts.map((contact) => ({
        ...contact, enrollment_status: contact.selected ? "draft" : null,
        current_step: null, next_action_at: null,
      }));
      mockCampaigns.unshift(revision);
      persistMockCampaigns();
      return revision;
    }
    return campaign;
  };
  type MockAsset = {
    id: string; kind: "image" | "video" | "audio" | "link"; name: string; description: string;
    tags: string[]; original_filename: string | null; content_type: string | null;
    byte_size: number | null; external_url: string | null; content_url: string | null;
    created_at: string; updated_at: string;
    assignment_mode: "all" | "selected"; assigned_agent_ids: string[];
  };
  const mockAssetAgents = [
    { id: "outbound", label: "Outbound agent", paused: false },
    { id: "demo", label: "Demo agent", paused: false },
    { id: "research", label: "Research agent", paused: true },
  ];
  const assetPreview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='420' viewBox='0 0 720 420'%3E%3Crect width='720' height='420' fill='%23eaf1f7'/%3E%3Cpath d='M0 330L190 170l108 96 105-82 317 236H0z' fill='%2315557e' opacity='.72'/%3E%3Ccircle cx='555' cy='100' r='40' fill='%23fff' opacity='.8'/%3E%3C/svg%3E";
  const mockAssets: MockAsset[] = [
    { id: "asset-product", kind: "image", name: "Product workflow", description: "Approved overview visual for outbound demos.", tags: ["product", "approved"], original_filename: "workflow.png", content_type: "image/png", byte_size: 184200, external_url: null, content_url: assetPreview, created_at: hoursAgo(72), updated_at: hoursAgo(4), assignment_mode: "all", assigned_agent_ids: [] },
    { id: "asset-proof", kind: "link", name: "Enterprise customer story", description: "Use when a prospect asks for implementation proof.", tags: ["proof", "enterprise"], original_filename: null, content_type: null, byte_size: null, external_url: "https://driftwood.sh/", content_url: null, created_at: hoursAgo(96), updated_at: hoursAgo(28), assignment_mode: "selected", assigned_agent_ids: ["outbound", "demo"] },
  ];
  const assetsApi = (init?: RequestInit, url?: string) => {
    const method = init?.method ?? "GET";
    const pathname = new URL(url ?? location.href, location.href).pathname;
    const suffix = pathname.replace("/api/v1/dashboard/assets", "").replace(/^\//, "");
    if (suffix === "agents" && method === "GET") return { agents: mockAssetAgents };
    const assignmentMatch = suffix.match(/^([^/]+)\/assignments$/);
    if (assignmentMatch && method === "PUT") {
      const asset = mockAssets.find((item) => item.id === decodeURIComponent(assignmentMatch[1]));
      if (!asset) return new Response(JSON.stringify({ detail: "Asset not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      asset.assignment_mode = body.assignment_mode === "selected" ? "selected" : "all";
      asset.assigned_agent_ids = asset.assignment_mode === "all" ? [] : Array.isArray(body.agent_ids) ? body.agent_ids : [];
      asset.updated_at = new Date().toISOString();
      return asset;
    }
    if (!suffix && method === "GET") return { assets: mockAssets };
    if (suffix === "link" && method === "POST") {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      const now = new Date().toISOString();
      const asset: MockAsset = { id: crypto.randomUUID(), kind: "link", name: String(body.name), description: String(body.description ?? ""), tags: Array.isArray(body.tags) ? body.tags : [], original_filename: null, content_type: null, byte_size: null, external_url: String(body.url), content_url: null, created_at: now, updated_at: now, assignment_mode: "all", assigned_agent_ids: [] };
      mockAssets.unshift(asset);
      return asset;
    }
    if (suffix === "upload" && method === "POST") {
      const form = init?.body instanceof FormData ? init.body : new FormData();
      const file = form.get("file");
      const now = new Date().toISOString();
      const isFile = file instanceof File;
      const kind = isFile && file.type.startsWith("audio/")
        ? "audio"
        : isFile && file.type.startsWith("video/")
          ? "video"
          : "image";
      const asset: MockAsset = { id: crypto.randomUUID(), kind, name: String(form.get("name") || (isFile ? file.name : "Uploaded asset")), description: String(form.get("description") ?? ""), tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean), original_filename: isFile ? file.name : null, content_type: isFile ? file.type : null, byte_size: isFile ? file.size : null, external_url: null, content_url: kind === "image" ? assetPreview : null, created_at: now, updated_at: now, assignment_mode: "all", assigned_agent_ids: [] };
      mockAssets.unshift(asset);
      return asset;
    }
    if (method === "DELETE") {
      const index = mockAssets.findIndex((asset) => asset.id === decodeURIComponent(suffix));
      if (index >= 0) mockAssets.splice(index, 1);
      return {};
    }
    return { assets: mockAssets };
  };
  const metricPeople = [
    { lead_id: "lead-1", name: "Mara Okafor", title: "VP Operations", email: "mara@example.test", company_name: "Ternary Labs", channel: "email", status: "contacted", occurred_at: hoursAgo(30), source: "confirmed_send" },
    { lead_id: "lead-2", name: "Anika Shah", title: "Head of QA", email: "anika@example.test", company_name: "Northstar Health", channel: "linkedin", status: "contacted", occurred_at: hoursAgo(28), source: "confirmed_send" },
    { lead_id: "lead-3", name: "Luca Moretti", title: "Founder", email: "luca@example.test", company_name: "Clearline", channel: "email", status: "contacted", occurred_at: hoursAgo(26), source: "confirmed_send" },
    { lead_id: "lead-4", name: "Ines Duarte", title: "Product lead", email: "ines@example.test", company_name: "Relayworks", channel: "linkedin", status: "contacted", occurred_at: hoursAgo(24), source: "confirmed_send" },
    { lead_id: "lead-5", name: "Owen Brooks", title: "Engineering director", email: "owen@example.test", company_name: "Juniper Systems", channel: "linkedin", status: "contacted", occurred_at: hoursAgo(20), source: "confirmed_send" },
    { lead_id: "lead-6", name: "Nadia Rahman", title: "COO", email: "nadia@example.test", company_name: "Fieldnote", channel: "x", status: "contacted", occurred_at: hoursAgo(18), source: "confirmed_send" },
    { lead_id: "lead-1", name: "Mara Okafor", title: "VP Operations", email: "mara@example.test", company_name: "Ternary Labs", channel: "email", status: "replied", occurred_at: hoursAgo(3), source: "email_reply" },
    { lead_id: "lead-2", name: "Anika Shah", title: "Head of QA", email: "anika@example.test", company_name: "Northstar Health", channel: "linkedin", status: "replied", occurred_at: hoursAgo(9), source: "linkedin_reply" },
    { lead_id: "lead-3", name: "Luca Moretti", title: "Founder", email: "luca@example.test", company_name: "Clearline", channel: "email", status: "demos_booked", occurred_at: hoursAgo(26), source: "lead_stage" },
  ];
  const channelMetricsApi = (_init?: RequestInit, url?: string) => {
    const query = new URL(url ?? location.href, location.href).searchParams;
    const status = query.get("status") ?? "replied";
    const channel = query.get("channel");
    const people = metricPeople.filter((person) => person.status === status && (!channel || person.channel === channel));
    return {
      window: { start: query.get("start"), end: query.get("end") },
      channels: [
        { channel: "linkedin", contacted: { count: 3, available: true }, opened: { count: null, available: false }, clicked: { count: null, available: false }, replied: { count: 1, available: true }, demos_booked: { count: 0, available: true } },
        { channel: "email", contacted: { count: 2, available: true }, opened: { count: null, available: false }, clicked: { count: null, available: false }, replied: { count: 1, available: true }, demos_booked: { count: 1, available: true } },
        { channel: "x", contacted: { count: 1, available: true }, opened: { count: null, available: false }, clicked: { count: null, available: false }, replied: { count: null, available: false }, demos_booked: { count: 0, available: true } },
      ],
      definitions: [
        { id: "contacted", label: "Contacted", available: true, definition: "Distinct leads with a confirmed outbound send.", note: null },
        { id: "opened", label: "Opened", available: false, definition: "Distinct leads with a provider open event.", note: "Provider open events are not stored yet." },
        { id: "clicked", label: "Clicked", available: false, definition: "Distinct leads with a provider click event.", note: "Provider click events are not stored yet." },
        { id: "replied", label: "Replied", available: true, definition: "Distinct leads matched to an inbound reply.", note: null },
        { id: "demos_booked", label: "Demos booked", available: true, definition: "Distinct booked leads attributed to the latest prior send.", note: null },
      ],
      people,
      people_status: status,
      people_channel: channel,
      people_total: people.length,
      limit: 100,
      offset: 0,
      unmatched_replies: { linkedin: 0, email: 0, x: 0 },
      unattributed_demos_booked: 0,
    };
  };
  type MockLead = {
    id: string; name: string; company: string; company_id: string; title: string;
    email: string | null; linkedin_url: string; stage: string; origin: string;
    source: string; audiences: string[]; demo_idea: string | null;
    demo_artifact_id: string | null; created_at: string; updated_at: string;
  };
  const mockLeads: MockLead[] = mockCampaignContacts.map((contact, index) => ({
    id: contact.id,
    name: contact.name,
    company: contact.company,
    company_id: `company-${index + 1}`,
    title: contact.role,
    email: `${contact.name.toLowerCase().replace(/\s+/g, ".")}@example.test`,
    linkedin_url: `https://www.linkedin.com/in/${contact.name.toLowerCase().replace(/\s+/g, "-")}`,
    stage: contact.stage,
    origin: "generated",
    source: index < 3 ? "orange-slice:ocean" : "workspace",
    audiences: index < 3 ? ["Qualified QA leaders"] : index === 3 ? ["Product-led teams"] : [],
    demo_idea: null,
    demo_artifact_id: null,
    created_at: hoursAgo(48 + index),
    updated_at: hoursAgo(2 + index),
  }));
  const leadImportsApi = (init?: RequestInit) => {
    if ((init?.method ?? "GET") !== "POST") return { detail: "Method not allowed" };
    const form = init?.body instanceof FormData ? init.body : null;
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ detail: "Choose a CSV file." }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }
    const typedName = form?.get("audience_name");
    // A typed name beats the filename-derived default, like the real API.
    const audienceName =
      typeof typedName === "string" && typedName.trim()
        ? typedName.trim()
        : mockAudienceNameFromFile(file.name);
    const existing = mockAudiences.find(
      (item) => item.source_provider === "csv_upload" && item.name === audienceName,
    );
    const result = mockLeadImportResult(
      file.name,
      existing ? { id: existing.id, memberCount: existing.members.length } : null,
    );
    const now = new Date().toISOString();
    if (existing) {
      existing.updated_at = now;
      return result;
    }
    const id = crypto.randomUUID();
    const lead: MockLead = {
      id,
      name: "Camille Rivera",
      company: "Atlas Relay",
      company_id: `company-${id}`,
      title: "Revenue operations lead",
      email: `camille.rivera.${id.slice(0, 6)}@example.test`,
      linkedin_url: "https://www.linkedin.com/in/camille-rivera",
      stage: "new",
      origin: "uploaded",
      source: "uploaded:csv",
      audiences: [audienceName],
      demo_idea: null,
      demo_artifact_id: null,
      created_at: now,
      updated_at: now,
    };
    mockLeads.push(lead);
    summary.lists.leads = mockLeads.length;
    mockAudiences.unshift({
      id: result.audience.id,
      name: audienceName,
      description: `Imported from ${file.name}`,
      source_provider: "csv_upload",
      discovery_filters: {},
      members: [memberFromLead(lead)],
      created_at: now,
      updated_at: now,
    });
    return result;
  };
  const dashboardLeadsApi = (init?: RequestInit, url?: string) => {
    const method = init?.method ?? "GET";
    const parsed = new URL(url ?? location.href, location.href);
    const suffix = parsed.pathname.replace("/api/v1/dashboard/leads", "").replace(/^\//, "");
    if (method === "DELETE" && suffix) {
      const index = mockLeads.findIndex((item) => item.id === decodeURIComponent(suffix));
      if (index >= 0) mockLeads.splice(index, 1);
      return { lead_id: suffix, blacklisted: true };
    }
    const limit = Math.max(1, Number(parsed.searchParams.get("limit") ?? 25));
    const offset = Math.max(0, Number(parsed.searchParams.get("offset") ?? 0));
    return { leads: mockLeads.slice(offset, offset + limit), total: mockLeads.length, limit, offset };
  };
  const mockCompanies = mockCampaignContacts.map((contact, index) => ({
    id: `company-${index + 1}`,
    name: contact.company,
    domain: `${contact.company.toLowerCase().replace(/\s+/g, "")}.example`,
    linkedin_slug: null,
    icp_status: "qualified",
    disqualify_reason: null,
    qa_headcount: null,
    employee_count: 80 + index * 25,
    funding_stage: index < 3 ? "Series A" : "Seed",
    location: "United States",
    source: index < 3 ? "orange-slice:ocean" : "workspace",
    lead_count: 1,
    contacted_lead_count: index < 3 ? 1 : 0,
    last_sent_at: index < 3 ? hoursAgo(6 + index * 3) : null,
    last_verified_at: hoursAgo(24 + index),
    created_at: hoursAgo(72 + index),
    updated_at: hoursAgo(4 + index),
  }));
  const dashboardCompaniesApi = (init?: RequestInit, url?: string) => {
    const method = init?.method ?? "GET";
    const parsed = new URL(url ?? location.href, location.href);
    const suffix = parsed.pathname.replace("/api/v1/dashboard/companies", "").replace(/^\//, "");
    if (method === "DELETE" && suffix) {
      const index = mockCompanies.findIndex((item) => item.id === decodeURIComponent(suffix));
      if (index >= 0) mockCompanies.splice(index, 1);
      return { company_id: suffix, blacklisted_contacts: 1 };
    }
    const status = parsed.searchParams.get("icp_status");
    const filtered = status ? mockCompanies.filter((item) => item.icp_status === status) : mockCompanies;
    const limit = Math.max(1, Number(parsed.searchParams.get("limit") ?? 25));
    const offset = Math.max(0, Number(parsed.searchParams.get("offset") ?? 0));
    return { companies: filtered.slice(offset, offset + limit), total: filtered.length, limit, offset };
  };
  type MockAudience = {
    id: string; name: string; description: string; source_provider: string;
    discovery_filters: Record<string, string>; members: Array<{
      lead_id: string; name: string; title: string; company: string;
      email: string | null; linkedin_url: string; stage: string; contactable: boolean;
      outreach_eligible: boolean;
    }>; created_at: string; updated_at: string;
  };
  const audienceSummary = (audience: MockAudience) => ({
    id: audience.id,
    name: audience.name,
    description: audience.description,
    source_provider: audience.source_provider,
    member_count: audience.members.length,
    created_at: audience.created_at,
    updated_at: audience.updated_at,
  });
  const memberFromLead = (item: MockLead) => ({
    lead_id: item.id, name: item.name, title: item.title, company: item.company,
    email: item.email, linkedin_url: item.linkedin_url, stage: item.stage,
    contactable: true, outreach_eligible: true,
  });
  const mockAudiences: MockAudience[] = [{
    id: "audience-qualified-qa",
    name: "Qualified QA leaders",
    description: "QA and operations leaders at teams with a live release workflow.",
    source_provider: "orange_slice",
    discovery_filters: { prompt: "QA and operations leaders at teams with a live release workflow" },
    members: mockLeads.slice(0, 3).map(memberFromLead),
    created_at: hoursAgo(72),
    updated_at: hoursAgo(2),
  }, {
    id: "audience-product-led",
    name: "Product-led teams",
    description: "Product leaders evaluating a hands-on launch workflow.",
    source_provider: "workspace",
    discovery_filters: { prompt: "Product leaders evaluating a hands-on QA workflow" },
    members: [memberFromLead(mockLeads[3])],
    created_at: hoursAgo(120),
    updated_at: hoursAgo(24),
  }];
  const discoveryCandidates = [
    { provider_record_id: "orange-person-1", lead_id: null, name: "Talia Morgan", title: "VP Quality", company: "Proofline", email: null, linkedin_url: "https://www.linkedin.com/in/talia-morgan", stage: "new" },
    { provider_record_id: "orange-person-2", lead_id: null, name: "Ravi Menon", title: "Director of Engineering", company: "SignalNest", email: null, linkedin_url: "https://www.linkedin.com/in/ravi-menon", stage: "new" },
    { provider_record_id: "orange-person-3", lead_id: null, name: "Elena Park", title: "Founder", company: "Releasewise", email: null, linkedin_url: "https://www.linkedin.com/in/elena-park", stage: "new" },
  ];
  const audiencesApi = (init?: RequestInit, url?: string) => {
    const method = init?.method ?? "GET";
    const pathname = new URL(url ?? location.href, location.href).pathname;
    const suffix = pathname.replace("/api/v1/dashboard/audiences", "").replace(/^\//, "");
    if (suffix === "discovery-status" && method === "GET") {
      return {
        default_provider: "orange_slice",
        providers: [
          { provider: "orange_slice", label: "Orange Slice", configured: true },
          { provider: "workspace", label: "Workspace leads", configured: true },
        ],
      };
    }
    if (suffix === "discover" && method === "POST") {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      if (body.source_provider === "workspace") {
        return {
          provider: "workspace",
          provider_label: "Workspace leads",
          candidates: mockLeads.slice(0, 4).map((lead) => ({
            provider_record_id: lead.id,
            lead_id: lead.id,
            name: lead.name,
            title: lead.title,
            company: lead.company,
            email: lead.email,
            linkedin_url: lead.linkedin_url,
            stage: lead.stage,
          })),
        };
      }
      return { provider: "orange_slice", provider_label: "Orange Slice", candidates: discoveryCandidates };
    }
    if (!suffix && method === "GET") return { audiences: mockAudiences.map(audienceSummary) };
    if (!suffix && method === "POST") {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      const selectedProviderIds = Array.isArray(body.provider_record_ids) ? body.provider_record_ids : [];
      const selectedLeadIds = Array.isArray(body.lead_ids) ? body.lead_ids : [];
      const newlyDiscoveredLeadIds = new Set<string>();
      for (const providerId of selectedProviderIds) {
        const candidate = discoveryCandidates.find((item) => item.provider_record_id === providerId);
        if (!candidate) continue;
        const id = crypto.randomUUID();
        mockLeads.unshift({
          id, name: candidate.name, company: candidate.company, company_id: crypto.randomUUID(),
          title: candidate.title, email: null, linkedin_url: candidate.linkedin_url,
          stage: candidate.stage, origin: "generated", source: "orange-slice:ocean",
          audiences: [], demo_idea: null, demo_artifact_id: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
        selectedLeadIds.push(id);
        newlyDiscoveredLeadIds.add(id);
      }
      const memberLeads = selectedLeadIds.flatMap((id: string) => {
        const item = mockLeads.find((leadItem) => leadItem.id === id);
        return item ? [item] : [];
      });
      const now = new Date().toISOString();
      const created: MockAudience = {
        id: crypto.randomUUID(), name: String(body.name), description: String(body.description ?? ""),
        source_provider: String(body.source_provider ?? "workspace"),
        discovery_filters: body.discovery_filters ?? {},
        members: memberLeads.map((item: MockLead) => ({
          ...memberFromLead(item),
          outreach_eligible: !newlyDiscoveredLeadIds.has(item.id),
        })),
        created_at: now, updated_at: now,
      };
      for (const item of memberLeads) {
        if (!item.audiences.includes(created.name)) item.audiences.push(created.name);
      }
      mockAudiences.unshift(created);
      return { ...audienceSummary(created), discovery_filters: created.discovery_filters, members: created.members };
    }
    if (suffix.endsWith("/similar")) {
      return {
        provider: "orange_slice",
        provider_label: "Orange Slice",
        candidates: [
          {
            provider_record_id: "sim-1", lead_id: null, name: "Robin Lookalike",
            title: "Fleet Operations Lead", company: "Parallel Rentals",
            company_domain: "parallelrentals.example", email: null,
            linkedin_url: "https://www.linkedin.com/in/robin-lookalike", stage: "new",
          },
          {
            provider_record_id: "sim-2", lead_id: null, name: "Jules Adjacent",
            title: "Head of Growth", company: "Nearmiss Mobility",
            company_domain: "nearmiss.example", email: null,
            linkedin_url: "https://www.linkedin.com/in/jules-adjacent", stage: "new",
          },
        ],
      };
    }
    if (suffix.endsWith("/grow")) {
      const audienceId = decodeURIComponent(suffix.replace(/\/grow$/, ""));
      const audience = mockAudiences.find((item) => item.id === audienceId);
      if (!audience) return {};
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      const ids: string[] = Array.isArray(body.provider_record_ids) ? body.provider_record_ids : [];
      for (const rid of ids) {
        if (audience.members.some((m) => m.linkedin_url?.includes(rid))) continue;
        audience.members.push({
          lead_id: crypto.randomUUID(),
          name: rid === "sim-1" ? "Robin Lookalike" : "Jules Adjacent",
          title: rid === "sim-1" ? "Fleet Operations Lead" : "Head of Growth",
          company: rid === "sim-1" ? "Parallel Rentals" : "Nearmiss Mobility",
          email: null, linkedin_url: `https://mock/${rid}`, stage: "new",
          contactable: true, outreach_eligible: true,
        });
      }
      audience.updated_at = new Date().toISOString();
      return { ...audienceSummary(audience), discovery_filters: audience.discovery_filters, members: audience.members };
    }
    const audienceId = decodeURIComponent(suffix);
    const audience = mockAudiences.find((item) => item.id === audienceId);
    if (method === "PATCH" && audience) {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      if (typeof body.name === "string" && body.name.trim())
        audience.name = body.name.trim();
      if (typeof body.description === "string")
        audience.description = body.description;
      audience.updated_at = new Date().toISOString();
      return { ...audienceSummary(audience), discovery_filters: audience.discovery_filters, members: audience.members };
    }
    if (method === "DELETE") {
      const index = mockAudiences.findIndex((item) => item.id === audienceId);
      if (index >= 0) {
        const [removed] = mockAudiences.splice(index, 1);
        for (const item of mockLeads) item.audiences = item.audiences.filter((name) => name !== removed.name);
      }
      return {};
    }
    return audience ? { ...audienceSummary(audience), discovery_filters: audience.discovery_filters, members: audience.members } : {};
  };

  // --- admin fleet + drift fixtures (mock=admin pages) -----------------------
  const fleetPage = {
    refreshed_at: new Date().toISOString(),
    rows: agentDashboard.agents.map((agent, i) => ({
      customer: {
        user_id: `mock-user-${i}`,
        email: `${agent.agent_id}@example.com`,
        name: agent.agent_id.charAt(0).toUpperCase() + agent.agent_id.slice(1),
        avatar_url: null,
        is_approved: true,
        created_at: new Date(Date.now() - 86400000 * (14 + i)).toISOString(),
      },
      agent,
      agent_slack_channel_id: `C0AGENT${i}`,
      customer_slack_channel_id: `C0CUST${i}`,
      pipeline: { live: 40 - i * 9, contacted: 18 - i * 4, replied: 5 - i, booked: i === 0 ? 2 : 0, pending_reviews: agent.attention_required ? 3 : 0 },
      attention_required: agent.attention_required,
      attention_reasons: agent.attention_required ? ["waiting on founder review"] : [],
    })),
  };
  const driftFlow = {
    task: "behavior_ci_demo",
    stages: [
      { id: "research", name: "Flagship research", sub: "agent browse + judge", gate: true, judge_prefixes: ["official-flagship-robot-research-judge-"], emit_prefixes: ["official-robot-research-"] },
      { id: "accepted", name: "Research accepted", emit_prefixes: ["accepted-research-"] },
      { id: "still", name: "Still generation", gate: true, judge_prefixes: ["still-customization-judge-"] },
      { id: "page", name: "Demo page", gate: true, judge_prefixes: ["demo-page-judge-"] },
      { id: "published", name: "Page published", emit_prefixes: ["demo-page-"], exclude_prefixes: ["demo-page-judge-"] },
    ],
    terminals: {
      done: { label: "done", tone: "good" },
      research_exhausted: { label: "research exhausted", tone: "bad", at: "research" },
      quarantined: { label: "quarantined", tone: "bad", at: "still" },
      runner_error: { label: "runner error", tone: "bad" },
    },
  };
  const driftJudgment = (label: string, passed: boolean | null, minutesAgo: number) => ({
    label, passed, created_at: new Date(Date.now() - minutesAgo * 60000).toISOString(),
  });
  const driftRunRows = [
    {
      id: "11111111-1111-4111-8111-111111111111", agent_id: "autosana", task: "behavior_ci_demo",
      state: "done", parameters: { slug: "agility-robotics", company_name: "Agility Robotics" },
      result: { state: "done", demo_url: "https://driftwood.sh/d/mock-demo" },
      created_at: new Date(Date.now() - 7200000).toISOString(), claimed_at: new Date(Date.now() - 7190000).toISOString(),
      started_at: new Date(Date.now() - 7140000).toISOString(), finished_at: new Date(Date.now() - 6870000).toISOString(),
      judgments: [
        driftJudgment("official-robot-research-agility-robotics-transcript", null, 120),
        driftJudgment("official-flagship-robot-research-judge-agility-robotics-scores", false, 118),
        driftJudgment("official-robot-research-agility-robotics-transcript", null, 117),
        driftJudgment("official-flagship-robot-research-judge-agility-robotics-scores", true, 116),
        driftJudgment("accepted-research-agility-robotics", null, 115),
        driftJudgment("still-customization-judge-agility-robotics-scores", true, 114),
        driftJudgment("demo-page-judge-agility-robotics-scores", true, 113),
        driftJudgment("demo-page-agility-robotics", null, 113),
      ],
    },
    {
      id: "22222222-2222-4222-8222-222222222222", agent_id: "autosana", task: "behavior_ci_demo",
      state: "quarantined", parameters: { slug: "zoox", company_name: "Zoox" },
      result: { state: "quarantined" },
      created_at: new Date(Date.now() - 5400000).toISOString(), claimed_at: new Date(Date.now() - 5390000).toISOString(),
      started_at: new Date(Date.now() - 5340000).toISOString(), finished_at: new Date(Date.now() - 4830000).toISOString(),
      judgments: [
        driftJudgment("official-robot-research-zoox-transcript", null, 88),
        driftJudgment("official-flagship-robot-research-judge-zoox-scores", true, 86),
        driftJudgment("accepted-research-zoox", null, 85),
        driftJudgment("still-customization-judge-zoox-scores", false, 83),
        driftJudgment("still-customization-judge-zoox-scores", false, 81),
      ],
    },
    {
      id: "33333333-3333-4333-8333-333333333333", agent_id: "autosana", task: "behavior_ci_demo",
      state: "running", parameters: { slug: "apptronik", company_name: "Apptronik" },
      result: null,
      created_at: new Date(Date.now() - 600000).toISOString(), claimed_at: new Date(Date.now() - 590000).toISOString(),
      started_at: new Date(Date.now() - 540000).toISOString(), finished_at: null,
      judgments: [
        driftJudgment("official-robot-research-apptronik-transcript", null, 6),
        driftJudgment("official-flagship-robot-research-judge-apptronik-scores", true, 4),
      ],
    },
  ];
  const driftOverview = {
    refreshed_at: new Date().toISOString(),
    agents: [
      { agent_id: "autosana", states: { done: 1, quarantined: 1, running: 1 }, total: 3, in_flight: 1 },
      { agent_id: "oruk", states: {}, total: 0, in_flight: 0 },
    ],
    flows: { behavior_ci_demo: driftFlow },
    tasks: ["behavior_ci_demo"],
  };
  const driftAgentRuns = (_init?: RequestInit, url?: string) => {
    const agentId = decodeURIComponent(url?.split("/agents/")[1]?.split("/")[0]?.split("?")[0] ?? "");
    return {
      agent_id: agentId,
      refreshed_at: new Date().toISOString(),
      runs: driftRunRows.filter((r) => r.agent_id === agentId),
    };
  };
  const driftRunDetail = (_init?: RequestInit, url?: string) => {
    const runId = decodeURIComponent(url?.split("/runs/")[1]?.split("?")[0] ?? "");
    const row = driftRunRows.find((r) => r.id === runId);
    if (!row) return {};
    return {
      ...row,
      judgments: row.judgments.map((j) => ({
        ...j,
        detail: j.passed === null ? null : { rows: [{ criterion: "identity", score: "6 (agree)", verdict: j.passed ? "pass" : "fail" }] },
      })),
    };
  };

  const mockOrg = {
    id: "org-1",
    name: "Example workspace",
    domain: null as string | null,
    members: [
      { membership_id: "m-1", email: "sam@example.com", name: "Sam Field", role: "admin", status: "active", invited_at: hoursAgo(400) },
      { membership_id: "m-2", email: "new-hire@example.com", name: null, role: "member", status: "invited", invited_at: hoursAgo(20) },
    ] as { membership_id: string | null; email: string; name: string | null; role: string; status: string; invited_at: string | null }[],
  };
  const orgPage = () => ({
    id: mockOrg.id,
    name: mockOrg.name,
    domain: mockOrg.domain,
    your_role: mockMode === "member" ? "member" : "owner",
    members: [
      { membership_id: null, email: "marc@example.com", name: "Marc Andreessen", role: "owner", status: "active", invited_at: null },
      ...mockOrg.members,
    ],
  });
  const orgApi = (init?: RequestInit, url?: string) => {
    const method = init?.method ?? "GET";
    const parsed = new URL(url ?? location.href, location.href);
    const path = parsed.pathname;
    if (method === "POST" && path.endsWith("/members")) {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      mockOrg.members.push({
        membership_id: crypto.randomUUID(), email: String(body.email ?? ""),
        name: null, role: String(body.role ?? "member"), status: "invited",
        invited_at: new Date().toISOString(),
      });
      return orgPage();
    }
    if (method === "DELETE" && path.includes("/members/")) {
      const id = decodeURIComponent(path.split("/members/")[1] ?? "");
      mockOrg.members = mockOrg.members.filter((m) => m.membership_id !== id);
      return orgPage();
    }
    if (method === "PUT" && path.endsWith("/domain")) {
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}");
      mockOrg.domain = typeof body.domain === "string" && body.domain.trim() ? body.domain.trim().toLowerCase() : null;
      return orgPage();
    }
    return orgPage();
  };

  // Matching is startsWith with NO method check, so more-specific paths must
  // come first — /sends/cancel and /sends/dismiss (POST) would otherwise be
  // swallowed by the /sends fixture, and /reviews/decide by /reviews.
  const routes: [string, unknown][] = [
    ["/api/v1/imports/leads", leadImportsApi],
    ["/api/v1/dashboard/org", orgApi],
    ["/api/v1/dashboard/audiences", audiencesApi],
    ["/api/v1/dashboard/leads", dashboardLeadsApi],
    ["/api/v1/dashboard/companies", dashboardCompaniesApi],
    ["/api/v1/dashboard/channel-metrics", channelMetricsApi],
    ["/api/v1/dashboard/assets", assetsApi],
    ["/api/v1/dashboard/campaigns", campaignsApi],
    ["/api/v1/admin/agents/dashboard", agentDashboard],
    ["/api/v1/admin/agents/fleet", fleetPage],
    ["/api/v1/admin/agents/", mutateAgent],
    ["/api/v1/admin/drift/overview", driftOverview],
    ["/api/v1/admin/drift/agents/", driftAgentRuns],
    ["/api/v1/admin/drift/runs/", driftRunDetail],
    ["/api/v1/admin/probes/dashboard", probesNotFound],
    ["/api/v1/dashboard/sends/cancel", cancelSends],
    ["/api/v1/dashboard/sends/dismiss", dismissSends],
    [
      "/api/v1/dashboard/sends",
      (_init?: RequestInit, url?: string) =>
        url?.includes("view=sent")
          ? { sends: sentLedger, total: sentLedger.length, limit: 100, offset: 0,
              counts: { ...sends.counts, sent: sentLedger.length } }
          : sends,
    ],
    ["/api/v1/dashboard/reviews/decide", decideReviews],
    ["/api/v1/dashboard/reviews", reviews],
    ["/auth/me", me],
    ["/api/v1/dashboard/summary", summary],
    ["/api/v1/dashboard/activity", activity],
    ["/mailboxes/availability", mailboxAvailability],
    ["/mailboxes/purchase", mailboxPurchase],
    ["/mailboxes/overview", managedInboxes],
  ];
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    for (const [path, body] of routes) {
      if (url.startsWith(path)) {
        const payload = typeof body === "function" ? (body as (i?: RequestInit, u?: string) => unknown)(init, url) : body;
        // A fixture may hand back a full Response (e.g. a synthetic 404).
        if (payload instanceof Response) return Promise.resolve(payload);
        return Promise.resolve(
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
    }
    const parsed = new URL(url, location.origin);
    if (parsed.origin === location.origin && (parsed.pathname.startsWith("/api/") || parsed.pathname.startsWith("/auth/"))) {
      return Promise.resolve(mockBlockedResponse(parsed.pathname));
    }
    return realFetch(input, init);
  };
}
export {};
