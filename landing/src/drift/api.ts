/* Fetch + payload types for the admin drift endpoints. Same-origin relative
   paths (Vercel/Vite proxy make the backend first-party); raw payloads are
   passed to the pure model in model.ts. */

import type { DriftRun, FlowManifest, JudgmentLite } from "./model";

export type DriftAgentTally = {
  agent_id: string;
  states: Record<string, number>;
  total: number;
  in_flight: number;
};

export type DriftOverview = {
  refreshed_at: string;
  agents: DriftAgentTally[];
  flows: Record<string, FlowManifest>;
  tasks: string[];
};

export type DriftAgentRunsPage = {
  agent_id: string;
  refreshed_at: string;
  runs: DriftRun[];
};

export type JudgmentFull = JudgmentLite & {
  detail: Record<string, unknown> | null;
};

export type DriftRunDetail = Omit<DriftRun, "judgments"> & {
  judgments: JudgmentFull[];
};

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { credentials: "include" });
    if (!res.ok) return null;
    const parsed = (await res.json()) as T;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export const fetchOverview = () => get<DriftOverview>("/api/v1/admin/drift/overview");

export const fetchAgentRuns = (agentId: string, limit = 25) =>
  get<DriftAgentRunsPage>(
    `/api/v1/admin/drift/agents/${encodeURIComponent(agentId)}/runs?limit=${limit}`,
  );

export const fetchRunDetail = (runId: string) =>
  get<DriftRunDetail>(`/api/v1/admin/drift/runs/${encodeURIComponent(runId)}`);
