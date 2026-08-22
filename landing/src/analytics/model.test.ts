import assert from "node:assert/strict";
import test from "node:test";
import { mapChannelAnalytics } from "./api.ts";
import { analyticsDataAfterFailure, appendAnalyticsPage, analyticsWindow, channelLabel, formatMetric } from "./model.ts";

test("unavailable metrics stay distinct from observed zero", () => {
  assert.equal(formatMetric({ count: null, available: false }), "—");
  assert.equal(formatMetric({ count: 0, available: true }), "0");
});

test("analyticsWindow creates an exact trailing UTC window", () => {
  const now = new Date("2026-08-21T17:00:00.000Z");
  assert.deepEqual(analyticsWindow(7, now), {
    start: "2026-08-14T17:00:00.000Z",
    end: "2026-08-21T17:00:00.000Z",
  });
});

test("API mapping preserves people and data quality counters", () => {
  const mapped = mapChannelAnalytics({
    window: { start: "2026-08-01T00:00:00Z", end: "2026-09-01T00:00:00Z" },
    channels: [{
      channel: "linkedin",
      contacted: { count: 4, available: true },
      opened: { count: null, available: false },
      clicked: { count: null, available: false },
      replied: { count: 2, available: true },
      demos_booked: { count: 1, available: true },
    }],
    definitions: [],
    people: [{
      lead_id: "lead-1",
      name: "Mina Hart",
      title: "VP Sales",
      email: "mina@example.com",
      company_name: "Example",
      channel: "linkedin",
      status: "replied",
      occurred_at: "2026-08-20T15:00:00Z",
      source: "linkedin_replies",
    }],
    people_status: "replied",
    people_channel: null,
    people_total: 1,
    limit: 100,
    offset: 0,
    unmatched_replies: { linkedin: 1, email: 0, x: 0 },
    unattributed_demos_booked: 2,
  });

  assert.equal(mapped.channels[0].demosBooked.count, 1);
  assert.equal(mapped.people[0].companyName, "Example");
  assert.equal(mapped.unmatchedReplies.linkedin, 1);
  assert.equal(mapped.unattributedDemosBooked, 2);
  assert.equal(channelLabel(mapped.people[0].channel), "LinkedIn");
});

test("analytics pages append without duplicating an overlapping person", () => {
  const first = mapChannelAnalytics({
    window: { start: "2026-08-01T00:00:00Z", end: "2026-09-01T00:00:00Z" },
    channels: [], definitions: [],
    people: [{ lead_id: "lead-1", name: "Mina", title: null, email: null, company_name: null, channel: "email", status: "replied", occurred_at: "2026-08-20T15:00:00Z", source: "email_replies" }],
    people_status: "replied", people_channel: null, people_total: 2, limit: 1, offset: 0,
    unmatched_replies: { linkedin: 0, email: 0, x: 0 }, unattributed_demos_booked: 0,
  });
  const second = {
    ...first,
    offset: 1,
    people: [first.people[0], { ...first.people[0], leadId: "lead-2", name: "Ada" }],
  };

  assert.deepEqual(
    appendAnalyticsPage(first, second).people.map((person) => person.leadId),
    ["lead-1", "lead-2"],
  );
});

test("a failed fresh analytics query clears stale data while pagination failure preserves it", () => {
  const current = mapChannelAnalytics({
    window: { start: "2026-08-01T00:00:00Z", end: "2026-09-01T00:00:00Z" },
    channels: [], definitions: [], people: [],
    people_status: "replied", people_channel: null, people_total: 0, limit: 100, offset: 0,
    unmatched_replies: { linkedin: 0, email: 0, x: 0 }, unattributed_demos_booked: 0,
  });
  assert.equal(analyticsDataAfterFailure(current, 0), null);
  assert.equal(analyticsDataAfterFailure(current, 100), current);
});
