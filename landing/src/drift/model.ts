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

/* Deterministic force layout: seeded ring placement (index-based, no
   Math.random so tests and reloads agree), repulsion + springs + weak
   centering, agent pinned at the center. Mutates node positions. */
export function layoutGraph(graph: Graph, width: number, height: number, iterations = 320): void {
  const { nodes, edges, byId } = graph;
  const cx = width / 2;
  const cy = height / 2;
  nodes.forEach((n, i) => {
    const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    const ring = n.type === "agent" ? 0 : n.type === "task" ? 40 : n.type === "run" ? 230 + (i % 5) * 26 : 300 + (i % 7) * 24;
    n.x = cx + Math.cos(a) * ring;
    n.y = cy + Math.sin(a) * ring;
    n.vx = 0;
    n.vy = 0;
  });
  const springLen = (e: GraphEdge): number => {
    const a = byId.get(e.a)!;
    const b = byId.get(e.b)!;
    if (a.type === "agent" || b.type === "agent") return 85;
    if (a.type === "task" && b.type === "run") return 165;
    return 44;
  };
  for (let step = 0; step < iterations; step++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          d2 = 1;
          dx = ((i * 13 + j * 7) % 11) - 5;
          dy = ((i * 5 + j * 3) % 11) - 5;
        }
        const d = Math.sqrt(d2);
        const rep = (1400 / d2) * (a.type === "run" && b.type === "run" ? 4.5 : 1);
        const fx = (dx / d) * rep;
        const fy = (dy / d) * rep;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }
    for (const e of edges) {
      const a = byId.get(e.a)!;
      const b = byId.get(e.b)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const k = 0.04 * (d - springLen(e));
      a.vx += (dx / d) * k;
      a.vy += (dy / d) * k;
      b.vx -= (dx / d) * k;
      b.vy -= (dy / d) * k;
    }
    for (const n of nodes) {
      if (n.type === "agent") {
        n.x = cx;
        n.y = cy;
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx += (cx - n.x) * 0.0012;
      n.vy += (cy - n.y) * 0.0012;
      n.vx *= 0.82;
      n.vy *= 0.82;
      n.x += n.vx;
      n.y += n.vy;
    }
  }
}

export function runDuration(run: DriftRun): string | null {
  if (!run.started_at || !run.finished_at) return null;
  const secs = Math.round(
    (new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000,
  );
  if (secs < 1 || Number.isNaN(secs)) return null;
  return secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
}
