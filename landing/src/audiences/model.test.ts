import assert from "node:assert/strict";
import test from "node:test";

import {
  filterAudiences,
  outreachEligibleMembers,
  summarizeLeadImport,
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

test("campaign eligibility stays separate from reusable audience membership", () => {
  const base = {
    name: "Ari",
    title: "Founder",
    company: "Northwind",
    email: "Email not set",
    linkedinUrl: null,
    stage: "new",
    contactable: true,
  };
  const members = [
    { ...base, leadId: "qualified", outreachEligible: true },
    { ...base, leadId: "unknown-company", outreachEligible: false },
    { ...base, leadId: "suppressed", contactable: false, outreachEligible: false },
  ];
  assert.deepEqual(
    outreachEligibleMembers(members).map((member) => member.leadId),
    ["qualified"],
  );
});

test("lead import summaries report every material outcome", () => {
  assert.equal(
    summarizeLeadImport({
      added: 4,
      skipped_duplicate: 2,
      skipped_suppressed: 1,
      errors: [{ row: 7, reason: "missing company" }],
    }),
    "4 imported · 2 already added · 1 suppressed · 1 invalid row",
  );
  assert.equal(
    summarizeLeadImport({
      added: 0,
      skipped_duplicate: 0,
      skipped_suppressed: 0,
      errors: [],
    }),
    "No new leads",
  );
});
