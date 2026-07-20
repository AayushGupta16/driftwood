/* Preview-branch mock: `?mock=1` serves canned dashboard data so the
   redesigned dashboard can be seen (and screenshotted) without the backend.
   Numbers mirror the real Autosana account. Dev/preview aid only. */
const params = new URLSearchParams(location.search);
if (params.has("mock")) {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
  const me = {
    id: "mock",
    email: "marc@a16z.com",
    name: "Marc Andreessen",
    avatar_url: null,
    is_approved: true,
    linkedin_connected: true,
    impersonating: false,
    is_admin: false,
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
    funnel: { active: 124, contacted: 77, replied: 7, meetings: 4 },
    results: {
      meetings: 4,
      meetings_delta_7d: 2,
      replies: 7,
      replies_delta_7d: 3,
      reply_rate: 0.091,
    },
    lists: { leads: 124, blacklist: 2 },
    companies: { qualified: 126, screened_out: 844, unknown: 130 },
    pending_reviews: 3,
  };
  const activity = {
    events: [
      { at: hoursAgo(2), kind: "stage", lead_id: "m1", lead_name: "Dana Whitfield", company_name: "Meridian", detail: "booked" },
      { at: hoursAgo(2.4), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(5), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(6), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "message" },
      { at: hoursAgo(7), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "message" },
      { at: hoursAgo(9), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(17), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "connection_request" },
      { at: hoursAgo(21), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
    ],
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
  const reviews = {
    pending: [
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
    ],
    decided: [], total_pending: 3, limit: 25, offset: 0,
    queue_stats: [
      { kind: "connection_request", queued: 2, sent_24h: 3, cap: 20, runs_through: dateAhead(2), failed: 2 },
      { kind: "message", queued: 3, sent_24h: 6, cap: 25, runs_through: dateAhead(2), failed: 0 },
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
    ],
    total: 7, limit: 100, offset: 0,
    counts: { pending: 4, sending: 1, failed: 2 },
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
    return { approved, denied, skipped: [], queued: [], agent_woken: true };
  };
  // Matching is startsWith with NO method check, so more-specific paths must
  // come first — /sends/cancel and /sends/dismiss (POST) would otherwise be
  // swallowed by the /sends fixture, and /reviews/decide by /reviews.
  const routes: [string, unknown][] = [
    ["/api/v1/dashboard/sends/cancel", cancelSends],
    ["/api/v1/dashboard/sends/dismiss", dismissSends],
    ["/api/v1/dashboard/sends", sends],
    ["/api/v1/dashboard/reviews/decide", decideReviews],
    ["/api/v1/dashboard/reviews", reviews],
    ["/auth/me", me],
    ["/api/v1/dashboard/summary", summary],
    ["/api/v1/dashboard/activity", activity],
  ];
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    for (const [path, body] of routes) {
      if (url.startsWith(path)) {
        const payload = typeof body === "function" ? (body as (i?: RequestInit) => unknown)(init) : body;
        return Promise.resolve(
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
    }
    return realFetch(input, init);
  };
}
export {};
