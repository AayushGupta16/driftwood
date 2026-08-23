/// <reference types="node" />

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agentStateLabel,
  agentStateTone,
  customerLabel,
  pipelineSummary,
  type FleetRow,
} from "./model.ts";

function row(overrides: Partial<FleetRow> = {}): FleetRow {
  return {
    customer: {
      user_id: "u1",
      email: "jane@fiton.com",
      name: "Jane Doe",
      avatar_url: null,
      is_approved: true,
      created_at: "2026-08-01T00:00:00Z",
    },
    agent: {
      agent_id: "fiton",
      paused: false,
      customer_health: 3,
      is_running: true,
      attention_required: false,
      attention_reasons: [],
      current_assignment: null,
      status_updated_at: null,
      last_activity_at: null,
    },
    agent_slack_channel_id: "C1",
    customer_slack_channel_id: "C2",
    pipeline: { live: 12, contacted: 4, replied: 0, booked: 0, pending_reviews: 2 },
    attention_required: false,
    attention_reasons: [],
    ...overrides,
  };
}

test("customerLabel prefers name, falls back to email", () => {
  assert.equal(customerLabel(row()), "Jane Doe");
  assert.equal(
    customerLabel(row({ customer: { ...row().customer, name: "  " } })),
    "jane@fiton.com",
  );
});

test("agentStateLabel: paused beats running; missing agent flags approval", () => {
  assert.equal(agentStateLabel(row()), "running");
  assert.equal(agentStateTone(row()), "good");
  const paused = row();
  paused.agent!.paused = true;
  paused.agent!.is_running = true;
  assert.equal(agentStateLabel(paused), "paused");
  assert.equal(agentStateTone(paused), "bad");
  const idle = row();
  idle.agent!.is_running = false;
  assert.equal(agentStateLabel(idle), "idle");
  assert.equal(agentStateTone(idle), "muted");
  const unprovisioned = row({ agent: null });
  assert.equal(agentStateLabel(unprovisioned), "not provisioned");
  assert.equal(agentStateTone(unprovisioned), "bad");
  const unapproved = row({
    agent: null,
    customer: { ...row().customer, is_approved: false },
  });
  assert.equal(agentStateLabel(unapproved), "no agent");
  assert.equal(agentStateTone(unapproved), "muted");
});

test("pipelineSummary drops zero segments and names the empty case", () => {
  assert.equal(pipelineSummary(row().pipeline), "12 live · 4 contacted · 2 in review");
  assert.equal(
    pipelineSummary({ live: 0, contacted: 0, replied: 0, booked: 0, pending_reviews: 0 }),
    "empty pipeline",
  );
});
