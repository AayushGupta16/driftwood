/// <reference types="node" />

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGraph,
  classifyRun,
  fallbackStages,
  fitView,
  layoutRadial,
  relaxGraph,
  runDuration,
  terminalFor,
  type DriftRun,
  type FlowManifest,
} from "./model.ts";

const MANIFEST: FlowManifest = {
  stages: [
    {
      id: "research",
      name: "Research",
      gate: true,
      judge_prefixes: ["research-judge-"],
      emit_prefixes: ["research-transcript-"],
    },
    { id: "brief", name: "Brief", emit_prefixes: ["accepted-"] },
    {
      id: "page",
      name: "Page",
      gate: true,
      judge_prefixes: ["page-judge-"],
      emit_prefixes: ["page-"],
      exclude_prefixes: ["page-judge-"],
    },
  ],
  terminals: {
    done: { label: "done", tone: "good" },
    quarantined: { label: "quarantined", tone: "bad", at: "page" },
  },
};

function run(state: string, judgments: [string, boolean | null][]): DriftRun {
  return {
    id: "r1",
    agent_id: "acme",
    task: "demo",
    state,
    parameters: { slug: "acme-co" },
    result: null,
    created_at: "2026-08-22T10:00:00Z",
    claimed_at: null,
    started_at: "2026-08-22T10:01:00Z",
    finished_at: "2026-08-22T10:03:30Z",
    judgments: judgments.map(([label, passed], i) => ({
      label,
      passed,
      created_at: `2026-08-22T10:0${i}:00Z`,
    })),
  };
}

test("classifyRun buckets by prefix and grades gates", () => {
  const staged = classifyRun(
    run("quarantined", [
      ["research-transcript-acme-co", null],
      ["research-judge-acme-co", false],
      ["research-judge-acme-co", true],
      ["accepted-acme-co", null],
      ["page-judge-acme-co", false],
    ]),
    MANIFEST,
  );
  assert.equal(staged[0].status, "retried"); // failed once, then passed
  assert.equal(staged[0].judgeCount, 2);
  assert.equal(staged[1].status, "emitted");
  assert.equal(staged[2].status, "failed"); // judge never passed
});

test("exclude_prefixes keeps judge rows out of emit stages", () => {
  const staged = classifyRun(run("done", [["page-judge-x", true]]), MANIFEST);
  // page stage matches via judge_prefixes only; a pure-emit stage with the
  // same base prefix would exclude the judge label.
  assert.equal(staged[2].rows.length, 1);
});

test("unreached stages stay unreached and terminals resolve", () => {
  const r = run("quarantined", [["research-judge-acme-co", false]]);
  const staged = classifyRun(r, MANIFEST);
  assert.equal(staged[1].status, "unreached");
  assert.equal(terminalFor(r, MANIFEST).tone, "bad");
  assert.equal(terminalFor(run("done", []), MANIFEST).tone, "good");
  assert.equal(terminalFor(run("runner_error", []), null).tone, "bad");
  assert.equal(terminalFor(run("weird_state", []), MANIFEST).tone, undefined);
});

test("fallbackStages makes one stage per judgment with cleaned names", () => {
  const staged = fallbackStages(
    run("done", [
      ["probe-transcript", null],
      ["probe-judge-acme-co-scores", true],
    ]),
  );
  assert.equal(staged.length, 2);
  assert.equal(staged[0].status, "emitted");
  assert.equal(staged[1].status, "passed");
  assert.equal(staged[1].stage.name, "probe-judge");
});

test("buildGraph chains reached stages between run and terminal", () => {
  const g = buildGraph(
    "acme",
    "demo",
    [
      run("quarantined", [
        ["research-judge-acme-co", true],
        ["accepted-acme-co", null],
        ["page-judge-acme-co", false],
      ]),
    ],
    MANIFEST,
  );
  // agent + task + run + 3 stages + terminal
  assert.equal(g.nodes.length, 7);
  const chain = g.edges.filter((e) => !e.spine).map((e) => e.b);
  assert.deepEqual(chain, ["run:r1:research", "run:r1:brief", "run:r1:page", "run:r1:end"]);
  assert.equal(g.byId.get("run:r1:end")!.tone, "bad");
});

test("layoutRadial puts each run on its own spoke, chain walking outward", () => {
  const runs = [
    run("done", [["research-judge-acme-co", true]]),
    { ...run("quarantined", [["research-judge-acme-co", false]]), id: "r2" },
  ];
  const g = buildGraph("acme", "demo", runs, MANIFEST);
  layoutRadial(g);
  // hub at origin, agent beside it
  assert.deepEqual([g.byId.get("task")!.x, g.byId.get("task")!.y], [0, 0]);
  assert.ok(g.byId.get("agent")!.x < 0);
  // first run at 12 o'clock, second at 6 o'clock (two spokes)
  const r1 = g.byId.get("run:r1")!;
  const r2 = g.byId.get("run:r2")!;
  assert.ok(Math.abs(r1.x) < 1e-9 && r1.y < 0);
  assert.ok(Math.abs(r2.x) < 1e-9 && r2.y > 0);
  // r1's chain extends along the same ray, monotonically farther out
  const stage = g.byId.get("run:r1:research")!;
  const end = g.byId.get("run:r1:end")!;
  assert.ok(stage.y < r1.y && end.y < stage.y);
  for (const n of g.nodes) assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
});

test("fitView centers and scales the layout into the viewport", () => {
  const g = buildGraph("acme", "demo", [run("done", [["research-judge-acme-co", true]])], MANIFEST);
  layoutRadial(g);
  const v = fitView(g, 1200, 720);
  assert.ok(v.k > 0 && v.k <= 1.4);
  for (const n of g.nodes) {
    const sx = n.x * v.k + v.x;
    const sy = n.y * v.k + v.y;
    assert.ok(sx >= 0 && sx <= 1200 && sy >= 0 && sy <= 720, `${n.id} at ${sx},${sy}`);
  }
});

test("runDuration formats and rejects missing timestamps", () => {
  assert.equal(runDuration(run("done", [])), "2m 30s");
  assert.equal(runDuration({ ...run("done", []), finished_at: null }), null);
});

test("relaxGraph springs a dragged node's chain and settles back home", () => {
  const g = buildGraph("acme", "demo", [run("done", [["research-judge-acme-co", true]])], MANIFEST);
  layoutRadial(g);
  const runNode = g.byId.get("run:r1")!;
  const stage = g.byId.get("run:r1:research")!;
  const stageHome = { x: stage.hx, y: stage.hy };
  // Hold the run node far off its spoke: its chain must get pulled along.
  runNode.x += 150;
  runNode.y += 150;
  for (let i = 0; i < 30; i++) relaxGraph(g, runNode.id);
  assert.ok(
    Math.hypot(stage.x - stageHome.x, stage.y - stageHome.y) > 10,
    "chain neighbor did not react to the drag",
  );
  // Release: everything relaxes back to the radial home.
  let moving = Infinity;
  for (let i = 0; i < 600 && moving > 0.05; i++) moving = relaxGraph(g, null);
  assert.ok(moving <= 0.05, "graph never settled");
  for (const n of g.nodes) {
    assert.ok(
      Math.hypot(n.x - n.hx, n.y - n.hy) < 8,
      `${n.id} ended ${Math.hypot(n.x - n.hx, n.y - n.hy).toFixed(1)}px from home`,
    );
  }
});
