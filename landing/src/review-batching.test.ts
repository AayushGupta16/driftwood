/* node --test (npm test) — Node 24 strips TypeScript types natively. */
/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { dayGroupLabel, groupByDay, hasScheduledDays } from "./review-batching.ts";

type Row = { id: string; scheduled_for: string | null };

const row = (id: string, day: string | null): Row => ({ id, scheduled_for: day });
const dayOf = (r: Row) => r.scheduled_for;

test("groupByDay orders dated days ascending with the undated bucket last", () => {
  const groups = groupByDay(
    [
      row("c", "2026-09-03"),
      row("z", null),
      row("a", "2026-09-01"),
      row("b", "2026-09-01"),
      row("y", null),
    ],
    dayOf,
  );
  assert.deepEqual(
    groups.map((g) => [g.day, g.items.map((i) => i.id)]),
    [
      ["2026-09-01", ["a", "b"]],
      ["2026-09-03", ["c"]],
      [null, ["z", "y"]],
    ],
  );
});

test("groupByDay keeps a fully undated list as one null group", () => {
  const groups = groupByDay([row("a", null), row("b", null)], dayOf);
  assert.deepEqual(groups.map((g) => g.day), [null]);
  assert.equal(groups[0].items.length, 2);
});

test("groupByDay of nothing is no groups", () => {
  assert.deepEqual(groupByDay([], dayOf), []);
});

test("hasScheduledDays only flips on a real date", () => {
  assert.equal(hasScheduledDays([row("a", null)], dayOf), false);
  assert.equal(hasScheduledDays([row("a", null), row("b", "2026-09-01")], dayOf), true);
});

test("dayGroupLabel names today, tomorrow, and absolute days", () => {
  const today = new Date(2026, 8, 1); // Sep 1 2026, a Tuesday
  assert.equal(dayGroupLabel(null, today), "As pacing allows");
  assert.equal(dayGroupLabel("2026-09-01", today), "Today");
  assert.equal(dayGroupLabel("2026-09-02", today), "Tomorrow");
  const absolute = dayGroupLabel("2026-09-04", today);
  assert.ok(absolute.includes("Sep"), absolute);
  assert.ok(absolute.includes("4"), absolute);
});

test("dayGroupLabel passes garbage through instead of NaN-ing", () => {
  assert.equal(dayGroupLabel("not-a-date"), "not-a-date");
});
