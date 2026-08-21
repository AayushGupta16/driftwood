import assert from "node:assert/strict";
import test from "node:test";

import { navigationGroups } from "./navigation.ts";

test("customer navigation excludes Driftwood internal tools", () => {
  const items = navigationGroups("customer").flatMap((group) => group.items);
  assert.deepEqual(
    items.map((item) => item.label),
    ["Overview", "Audiences", "Campaigns", "Metrics", "All leads", "Companies", "Assets", "Review queue"],
  );
  assert.equal(items.some((item) => item.label === "Agents"), false);
  assert.equal(items.some((item) => item.label === "Search visibility"), false);
});

test("admin navigation contains only the current internal workstreams", () => {
  const items = navigationGroups("admin").flatMap((group) => group.items);
  assert.deepEqual(
    items.map(({ label, href }) => ({ label, href })),
    [
      { label: "Agents", href: "/dashboard/admin/agents" },
      { label: "Search visibility", href: "/dashboard/admin/search-visibility" },
    ],
  );
});
