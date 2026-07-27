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
    // ?mock=admin flips the admin chrome on (God mode + the SEO / GEO pill)
    // for QA'ing admin-only pages like /dashboard/seo-geo. Plain ?mock=1
    // stays the customer view the baked marketing screenshots are shot from.
    is_admin: params.get("mock") === "admin",
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
  // Matching is startsWith with NO method check, so more-specific paths must
  // come first — /sends/cancel and /sends/dismiss (POST) would otherwise be
  // swallowed by the /sends fixture, and /reviews/decide by /reviews.
  const routes: [string, unknown][] = [
    ["/api/v1/admin/agents/dashboard", agentDashboard],
    ["/api/v1/admin/agents/", mutateAgent],
    ["/api/v1/admin/probes/dashboard", probesNotFound],
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
    return realFetch(input, init);
  };
}
export {};
