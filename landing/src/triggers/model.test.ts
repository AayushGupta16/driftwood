import assert from "node:assert/strict";
import test from "node:test";

import {
  cadenceLabel,
  countsLine,
  fireHourLabel,
  formatDay,
  postingLocation,
  postingStatusLabel,
  postingStatusTone,
  runIsOpen,
  runStateLabel,
  sourceLabel,
  splitList,
  watchLine,
} from "./model.ts";

test("sources are named the way the customer picked them, never a slug", () => {
  assert.equal(sourceLabel("mycnajobs"), "myCNAjobs");
  assert.equal(sourceLabel("indeed"), "Indeed");
  assert.equal(sourceLabel("custom_url"), "Another site");
  assert.equal(sourceLabel("something_else"), "Another site");
});

test("fire hours read as clock times", () => {
  assert.equal(fireHourLabel(0), "12 AM");
  assert.equal(fireHourLabel(6), "6 AM");
  assert.equal(fireHourLabel(12), "12 PM");
  assert.equal(fireHourLabel(15), "3 PM");
  assert.equal(fireHourLabel(23), "11 PM");
});

test("cadence reads as a sentence with the Pacific fire hour", () => {
  assert.equal(cadenceLabel("daily", 6), "Every morning, 6 AM PT");
  assert.equal(cadenceLabel("daily", 14), "Every day, 2 PM PT");
  assert.equal(cadenceLabel("weekly", 6), "Weekly");
});

test("posting statuses map to plain labels and a tone", () => {
  assert.equal(postingStatusLabel("new"), "New");
  assert.equal(postingStatusLabel("in_progress"), "In progress");
  assert.equal(postingStatusLabel("no_lead"), "Held: no contact found");
  assert.equal(postingStatusLabel("demo_pending"), "Demo pending");
  assert.equal(postingStatusLabel("ready"), "Ready");
  assert.equal(postingStatusLabel("enrolled"), "Enrolled");
  assert.equal(postingStatusLabel("dismissed"), "Dismissed");
  assert.equal(postingStatusLabel("duplicate"), "Skipped: duplicate");
  assert.equal(postingStatusLabel("failed"), "Failed");
  assert.equal(postingStatusTone("enrolled"), "tide");
  assert.equal(postingStatusTone("no_lead"), "hold");
  assert.equal(postingStatusTone("duplicate"), "skip");
  assert.equal(postingStatusTone("failed"), "alert");
  assert.equal(postingStatusTone("new"), "plain");
});

test("run states label and the open check covers queued and running only", () => {
  assert.equal(runStateLabel("queued"), "Queued");
  assert.equal(runStateLabel("running"), "Running");
  assert.equal(runStateLabel("done"), "Done");
  assert.equal(runStateLabel("failed"), "Failed");
  assert.equal(runIsOpen("queued"), true);
  assert.equal(runIsOpen("running"), true);
  assert.equal(runIsOpen("done"), false);
  assert.equal(runIsOpen(null), false);
});

test("the counts line carries only what happened", () => {
  const zero = { postings: 0, new: 0, agenciesAdded: 0, leads: 0, demos: 0, enrolled: 0, held: 0 };
  assert.equal(countsLine(zero), "");
  assert.equal(
    countsLine({ ...zero, postings: 34, new: 14, agenciesAdded: 11 }),
    "14 new postings, 11 agencies added",
  );
  assert.equal(
    countsLine({ ...zero, new: 1, agenciesAdded: 1, leads: 1, demos: 1, enrolled: 1, held: 1 }),
    "1 new posting, 1 agency added, 1 lead found, 1 demo built, 1 enrolled, 1 held for review",
  );
});

test("keywords split on commas, locations on semicolons so a city keeps its state", () => {
  assert.deepEqual(splitList("caregiver, CNA", "keywords"), ["caregiver", "CNA"]);
  assert.deepEqual(splitList("Atlanta, GA; Phoenix, AZ", "locations"), ["Atlanta, GA", "Phoenix, AZ"]);
  assert.deepEqual(splitList("Atlanta, GA\nPhoenix, AZ", "locations"), ["Atlanta, GA", "Phoenix, AZ"]);
  assert.deepEqual(splitList("  cna ,, CNA , home  health aide ", "keywords"), ["cna", "home health aide"]);
  assert.deepEqual(splitList("", "keywords"), []);
});

test("the watch line reads as a sentence from the filters", () => {
  assert.equal(
    watchLine({ keywords: ["Caregiver", "CNA"], locations: ["All US"], url: null }, "mycnajobs"),
    "Caregiver and CNA postings, All US",
  );
  assert.equal(
    watchLine({ keywords: ["CNA"], locations: ["Atlanta, GA", "Phoenix, AZ", "Austin, TX"], url: null }, "indeed"),
    "CNA postings, Atlanta, GA; Phoenix, AZ and Austin, TX",
  );
  assert.equal(
    watchLine({ keywords: [], locations: [], url: "https://www.jobs.example.com/list" }, "custom_url"),
    "All postings on jobs.example.com, anywhere",
  );
});

test("days drop the year only inside the current year", () => {
  const now = new Date("2026-09-01T12:00:00Z");
  assert.equal(formatDay("2026-08-31T13:02:00Z", now), "Aug 31");
  assert.equal(formatDay("2025-08-31T13:02:00Z", now), "Aug 31, 2025");
  assert.equal(formatDay(null, now), null);
  assert.equal(formatDay("not a date", now), null);
});

test("posting location prefers city and state, then the raw text", () => {
  assert.equal(postingLocation({ city: "Tucson", state: "AZ", locationText: null }), "Tucson, AZ");
  assert.equal(postingLocation({ city: null, state: null, locationText: "Remote (US)" }), "Remote (US)");
  assert.equal(postingLocation({ city: null, state: null, locationText: null }), "Location not listed");
});
