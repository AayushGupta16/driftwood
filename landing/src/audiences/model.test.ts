import assert from "node:assert/strict";
import test from "node:test";

import {
  filterAudiences,
  stageLabel,
  toggleLead,
  type AudienceSummary,
} from "./model.ts";

const rows: AudienceSummary[] = [
  {
    id: "one",
    name: "Qualified founders",
    description: "Founder-led companies",
    sourceProvider: "workspace",
    memberCount: 3,
    createdAt: "2026-08-21T12:00:00Z",
    updatedAt: "2026-08-21T12:00:00Z",
  },
  {
    id: "two",
    name: "Sales leaders",
    description: "",
    sourceProvider: "orange_slice",
    memberCount: 5,
    createdAt: "2026-08-21T12:00:00Z",
    updatedAt: "2026-08-21T12:00:00Z",
  },
];

test("audience library search covers copy and provider", () => {
  assert.deepEqual(filterAudiences(rows, "founder").map((row) => row.id), ["one"]);
  assert.deepEqual(filterAudiences(rows, "orange").map((row) => row.id), ["two"]);
});

test("lead selection is immutable and toggles membership", () => {
  const original = new Set(["one"]);
  const added = toggleLead(original, "two");
  const removed = toggleLead(added, "one");
  assert.deepEqual([...original], ["one"]);
  assert.deepEqual([...added], ["one", "two"]);
  assert.deepEqual([...removed], ["two"]);
});

test("stage labels normalize stored enum slugs", () => {
  assert.equal(stageLabel("demo_built"), "Demo Built");
});
