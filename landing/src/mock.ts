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
      { at: hoursAgo(2), kind: "stage", lead_id: "m1", lead_name: "CTO", company_name: "Superhuman", detail: "booked" },
      { at: hoursAgo(2.4), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(5), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(6), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "message" },
      { at: hoursAgo(7), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "message" },
      { at: hoursAgo(9), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
      { at: hoursAgo(17), kind: "sent", lead_id: null, lead_name: null, company_name: null, detail: "connection_request" },
      { at: hoursAgo(21), kind: "reply", lead_id: null, lead_name: null, company_name: null, detail: null },
    ],
  };
  const lead = (name: string, title: string, company: string) => ({
    lead_id: name, name, title, company, stage: "new", prior_sends: 0, last_sent_at: null,
  });
  const reviews = {
    pending: [
      {
        id: "r1", batch_id: "b1", agent_id: "demo", kind: "send_connection",
        title: "Harborlight \u2014 Maya Chen (connect)",
        body: "loved your launch post. building something adjacent, would love to connect!",
        lead: lead("Maya Chen", "Cofounder & CEO", "Harborlight"),
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
  };
  const routes: [string, unknown][] = [
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
        return Promise.resolve(
          new Response(JSON.stringify(body), {
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
