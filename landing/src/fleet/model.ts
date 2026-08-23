/* Pure model for the admin fleet switchboard: payload types mirroring
   GET /api/v1/admin/agents/fleet (app/schemas/agent_status.py FleetPage)
   plus the small presentation transforms, kept DOM-free for model.test.ts. */

export type FleetCustomer = {
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  created_at: string;
};

export type FleetPipeline = {
  live: number;
  contacted: number;
  replied: number;
  booked: number;
  pending_reviews: number;
};

export type FleetAgentCard = {
  agent_id: string;
  paused: boolean;
  customer_health: number | null;
  is_running: boolean;
  attention_required: boolean;
  attention_reasons: string[];
  current_assignment: string | null;
  status_updated_at: string | null;
  last_activity_at: string | null;
};

export type FleetRow = {
  customer: FleetCustomer;
  agent: FleetAgentCard | null;
  agent_slack_channel_id: string | null;
  customer_slack_channel_id: string | null;
  pipeline: FleetPipeline;
  attention_required: boolean;
  attention_reasons: string[];
};

export type FleetPage = {
  refreshed_at: string;
  rows: FleetRow[];
};

export function customerLabel(row: FleetRow): string {
  return row.customer.name?.trim() || row.customer.email;
}

/* One-line agent state for the table cell: paused beats running beats idle,
   with "no agent" reserved for unprovisioned customers. */
export function agentStateLabel(row: FleetRow): string {
  if (!row.agent) return row.customer.is_approved ? "not provisioned" : "no agent";
  if (row.agent.paused) return "paused";
  return row.agent.is_running ? "running" : "idle";
}

export function agentStateTone(row: FleetRow): "good" | "bad" | "muted" {
  if (!row.agent) return row.customer.is_approved ? "bad" : "muted";
  if (row.agent.paused) return "bad";
  return row.agent.is_running ? "good" : "muted";
}

/* "12 live · 4 contacted · 2 replied" — zero-count segments are dropped so
   the busy rows read dense and the empty ones read quiet. */
export function pipelineSummary(p: FleetPipeline): string {
  const parts = [
    [p.live, "live"],
    [p.contacted, "contacted"],
    [p.replied, "replied"],
    [p.booked, "booked"],
    [p.pending_reviews, "in review"],
  ] as const;
  const shown = parts.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}`);
  return shown.length ? shown.join(" · ") : "empty pipeline";
}
