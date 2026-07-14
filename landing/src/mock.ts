/* Preview-branch mock: `?mock=1` serves canned dashboard data so the
   redesigned dashboard can be seen (and screenshotted) without the backend.
   Numbers mirror the real Autosana account. Dev/preview aid only. */
const params = new URLSearchParams(location.search);
if (params.has("mock")) {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
  const me = {
    id: "mock",
    email: "yuvan@autosana.ai",
    name: "Yuvan Sundrani",
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
    funnel: { active: 67, contacted: 34, replied: 1, meetings: 1 },
    results: {
      meetings: 1,
      meetings_delta_7d: 1,
      replies: 1,
      replies_delta_7d: 1,
      reply_rate: 0.0294,
    },
    lists: { leads: 67, blacklist: 2 },
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
  const routes: [string, unknown][] = [
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
