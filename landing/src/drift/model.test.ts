/// <reference types="node" />

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGraph,
  classifyRun,
  fallbackStages,
  layoutGraph,
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

test("layoutGraph is deterministic and keeps coordinates finite", () => {
  const make = () =>
    buildGraph("acme", "demo", [run("done", [["research-judge-acme-co", true]])], MANIFEST);
  const g1 = make();
  const g2 = make();
  layoutGraph(g1, 1200, 800, 120);
  layoutGraph(g2, 1200, 800, 120);
  for (let i = 0; i < g1.nodes.length; i++) {
    assert.ok(Number.isFinite(g1.nodes[i].x) && Number.isFinite(g1.nodes[i].y));
    assert.equal(g1.nodes[i].x, g2.nodes[i].x);
    assert.equal(g1.nodes[i].y, g2.nodes[i].y);
  }
  // agent stays pinned at center
  assert.equal(g1.byId.get("agent")!.x, 600);
  assert.equal(g1.byId.get("agent")!.y, 400);
});

test("runDuration formats and rejects missing timestamps", () => {
  assert.equal(runDuration(run("done", [])), "2m 30s");
  assert.equal(runDuration({ ...run("done", []), finished_at: null }), null);
});
