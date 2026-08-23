/* Pure model for the admin drift graph: classify a run's judgments into the
   stages its task's flow manifest names, build the node/edge graph (agent →
   task hub → run → stage chain → terminal), and lay it out with a small
   deterministic force simulation. No DOM, no fetch — everything here is
   node:test-able (model.test.ts), mirroring seo-geo/trend.ts. */

export type JudgmentLite = {
  label: string;
  passed: boolean | null;
  created_at: string;
};

export type DriftRun = {
  id: string;
  agent_id: string;
  task: string;
  state: string;
  parameters: Record<string, unknown>;
  result: Record<string, unknown> | null;
  created_at: string;
  claimed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  judgments: JudgmentLite[];
};

export type FlowStage = {
  id: string;
  name: string;
  sub?: string;
  gate?: boolean;
  judge_prefixes?: string[];
  emit_prefixes?: string[];
  exclude_prefixes?: string[];
};

export type FlowTerminal = { label: string; tone?: string; at?: string };

export type FlowManifest = {
  stages: FlowStage[];
  terminals?: Record<string, FlowTerminal>;
};

export type StageStatus = "passed" | "retried" | "failed" | "emitted" | "unreached";

export type StageResult = {
  stage: FlowStage;
  status: StageStatus;
  rows: JudgmentLite[];
  judgeCount: number;
};

const BACKEND_FAILURES = new Set([
  "launch_failed",
  "runner_error",
  "vanished",
  "timed_out",
]);

export function terminalFor(run: DriftRun, manifest: FlowManifest | null): FlowTerminal {
  const named = manifest?.terminals?.[run.state];
  if (named) return named;
  if (run.state === "done" || run.state === "already_done")
    return { label: run.state.replace(/_/g, " "), tone: "good" };
  if (BACKEND_FAILURES.has(run.state))
    return { label: run.state.replace(/_/g, " "), tone: "bad" };
  // Unknown per-task vocabulary: show it verbatim, neutral.
  return { label: run.state.replace(/_/g, " ") };
}

function matches(label: string, prefixes: string[] | undefined, excludes?: string[]): boolean {
  if (!prefixes?.some((p) => label.startsWith(p))) return false;
  return !excludes?.some((p) => label.startsWith(p));
}

/* One run's judgments bucketed into the manifest's stages, in order. Stages
   with no rows are "unreached". A gate with at least one passing judge is
   "passed" ("retried" when it also failed along the way); a gate with only
   failures is "failed". */
export function classifyRun(run: DriftRun, manifest: FlowManifest): StageResult[] {
  return manifest.stages.map((stage) => {
    // exclude_prefixes narrows only the emit match — a stage's own judge
    // labels are never excluded from it (flow.json's "published" stage
    // excludes "demo-page-judge-" from "demo-page-" without eating the
    // page gate's rows).
    const rows = run.judgments.filter(
      (j) =>
        matches(j.label, stage.judge_prefixes) ||
        matches(j.label, stage.emit_prefixes, stage.exclude_prefixes),
    );
    const judges = rows.filter((j) => matches(j.label, stage.judge_prefixes));
    let status: StageStatus;
    if (!rows.length) status = "unreached";
    else if (!stage.gate) status = "emitted";
    else if (judges.some((j) => j.passed === true))
      status = judges.some((j) => j.passed === false) ? "retried" : "passed";
    else status = "failed";
    return { stage, status, rows, judgeCount: judges.length };
  });
}

/* Fallback when a task has no manifest: every judgment is its own emitted/
   gated stage, labels cleaned of the run slug and -scores/-transcript tails. */
export function fallbackStages(run: DriftRun): StageResult[] {
  const slug = String(run.parameters?.slug ?? "");
  return run.judgments.map((j, i) => {
    const name = j.label
      .replace(/-scores$/, "")
      .replace(/-transcript$/, "")
      .replace(slug ? `-${slug}` : /$^/, "");
    const gate = j.passed !== null;
    return {
      stage: { id: `j${i}`, name, gate },
      status: gate ? (j.passed ? "passed" : "failed") : "emitted",
      rows: [j],
      judgeCount: gate ? 1 : 0,
    } as StageResult;
  });
}

export type GraphNode = {
  id: string;
  label: string;
  type: "agent" | "task" | "run" | "stage" | "end";
  r: number;
  run?: DriftRun;
  stageResult?: StageResult;
  tone?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type GraphEdge = { a: string; b: string; spine: boolean };

export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; byId: Map<string, GraphNode> };

export function buildGraph(
  agentId: string,
  task: string,
  runs: DriftRun[],
  manifest: FlowManifest | null,
): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const byId = new Map<string, GraphNode>();
  const add = (n: Omit<GraphNode, "x" | "y" | "vx" | "vy">) => {
    const node = { ...n, x: 0, y: 0, vx: 0, vy: 0 };
    nodes.push(node);
    byId.set(node.id, node);
    return node;
  };
  add({ id: "agent", label: agentId, type: "agent", r: 24 });
  add({ id: "task", label: task, type: "task", r: 17 });
  edges.push({ a: "agent", b: "task", spine: true });

  for (const run of runs) {
    const runId = `run:${run.id}`;
    const slug = String(run.parameters?.slug ?? "") || "(no slug)";
    add({ id: runId, label: slug, type: "run", r: 11, run, tone: terminalFor(run, manifest).tone });
    edges.push({ a: "task", b: runId, spine: true });

    let prev = runId;
    const staged = manifest ? classifyRun(run, manifest) : fallbackStages(run);
    for (const sr of staged) {
      if (sr.status === "unreached") continue;
      const nid = `${runId}:${sr.stage.id}`;
      const retries = sr.judgeCount > 1 ? ` ×${sr.judgeCount}` : "";
      add({ id: nid, label: sr.stage.name + retries, type: "stage", r: 7, run, stageResult: sr });
      edges.push({ a: prev, b: nid, spine: false });
      prev = nid;
    }
    const t = terminalFor(run, manifest);
    add({ id: `${runId}:end`, label: t.label, type: "end", r: 8, run, tone: t.tone });
    edges.push({ a: prev, b: `${runId}:end`, spine: false });
  }
  return { nodes, edges, byId };
}

/* Deterministic radial layout: the task hub sits at the origin with the
   agent beside it, every run takes its own evenly-spaced spoke (newest first,
   starting at 12 o'clock), and the run's stage chain walks outward along the
   spoke to its terminal. No force simulation — the shape is stable at any
   run count and never tangles. Mutates node positions; coordinates are
   centered on (0,0) so the view fits them afterwards (fitView). */
const RUN_RADIUS = 190;
const STAGE_STEP = 58;

export function layoutRadial(graph: Graph): void {
  const { nodes, byId } = graph;
  const agent = byId.get("agent");
  const task = byId.get("task");
  if (task) {
    task.x = 0;
    task.y = 0;
  }
  if (agent) {
    agent.x = -92;
    agent.y = 0;
  }
  const runNodes = nodes.filter((n) => n.type === "run");
  runNodes.forEach((runNode, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(1, runNodes.length)) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    runNode.x = dx * RUN_RADIUS;
    runNode.y = dy * RUN_RADIUS;
    // Chain members share the run's id prefix and were added in chain order.
    const chain = nodes.filter(
      (n) => n.id.startsWith(runNode.id + ":") && (n.type === "stage" || n.type === "end"),
    );
    chain.forEach((n, k) => {
      n.x = dx * (RUN_RADIUS + STAGE_STEP * (k + 1));
      n.y = dy * (RUN_RADIUS + STAGE_STEP * (k + 1));
    });
  });
}

/* The pan/zoom transform that centers the laid-out graph in a viewport with
   some breathing room. Pure so the initial view is testable. */
export function fitView(
  graph: Graph,
  width: number,
  height: number,
  padding = 40,
): { x: number; y: number; k: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of graph.nodes) {
    minX = Math.min(minX, n.x - n.r);
    maxX = Math.max(maxX, n.x + n.r);
    minY = Math.min(minY, n.y - n.r);
    maxY = Math.max(maxY, n.y + n.r);
  }
  if (!Number.isFinite(minX)) return { x: width / 2, y: height / 2, k: 1 };
  const k = Math.min(
    (width - padding * 2) / Math.max(1, maxX - minX),
    (height - padding * 2) / Math.max(1, maxY - minY),
    1.4,
  );
  return {
    x: width / 2 - ((minX + maxX) / 2) * k,
    y: height / 2 - ((minY + maxY) / 2) * k,
    k,
  };
}

export function runDuration(run: DriftRun): string | null {
  if (!run.started_at || !run.finished_at) return null;
  const secs = Math.round(
    (new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000,
  );
  if (secs < 1 || Number.isNaN(secs)) return null;
  return secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
}
