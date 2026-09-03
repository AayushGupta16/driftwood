import assert from "node:assert/strict";
import test from "node:test";

import {
  BUILDING_LINES,
  buildingLine,
  buildingStage,
  counterCell,
  countsLine,
  DEFAULT_SCHEDULE,
  fireHourLabel,
  formatDay,
  formatMoment,
  foundCell,
  itemName,
  itemStatusLabel,
  itemStatusTone,
  itemTitle,
  lastCheck,
  lastCheckFact,
  lastCheckLine,
  metaLine,
  plainReason,
  plainText,
  readbackLine,
  rowFields,
  runIsOpen,
  runResult,
  runTriggerLabel,
  scheduleLabel,
  shortReason,
  sortItems,
  triggerTitle,
  triggerView,
  truncate,
  UNSUPPORTED_LINE,
  viewLabel,
  viewTone,
  type TriggerCounts,
} from "./model.ts";

const counts = (over: Partial<TriggerCounts> = {}): TriggerCounts => ({
  items: 0,
  new: 0,
  companiesAdded: 0,
  leads: 0,
  demos: 0,
  enrolled: 0,
  ...over,
});

test("fire hours read as clock times", () => {
  assert.equal(fireHourLabel(0), "12 AM");
  assert.equal(fireHourLabel(6), "6 AM");
  assert.equal(fireHourLabel(12), "12 PM");
  assert.equal(fireHourLabel(15), "3 PM");
  assert.equal(fireHourLabel(23), "11 PM");
});

test("the schedule reads as a sentence: night before 6, morning to 11, daily after", () => {
  assert.equal(scheduleLabel(DEFAULT_SCHEDULE), "Every night, 2 AM PT");
  assert.equal(scheduleLabel({ cadence: "daily", fireHour: 6, intervalHours: null }), "Every morning, 6 AM PT");
  assert.equal(scheduleLabel({ cadence: "daily", fireHour: 15, intervalHours: null }), "Daily, 3 PM PT");
  assert.equal(scheduleLabel({ cadence: "weekly", fireHour: 6, intervalHours: null }), "Weekly");
  assert.equal(scheduleLabel({ cadence: "every_n_hours", fireHour: 0, intervalHours: 4 }), "Every 4 hours");
  assert.equal(scheduleLabel({ cadence: "every_n_hours", fireHour: 0, intervalHours: 1 }), "Every hour");
  assert.equal(scheduleLabel({ cadence: "every_n_hours", fireHour: 0, intervalHours: null }), "Every few hours");
  assert.equal(scheduleLabel(null), "On a schedule");
});

test("the title is the backend's name and is never derived from the sentence", () => {
  assert.equal(triggerTitle({ name: "myCNAjobs" }), "myCNAjobs");
  assert.equal(triggerTitle({ name: "  Series A raises  " }), "Series A raises");
  // No name is a missing name, not an excuse to truncate the sentence.
  assert.equal(triggerTitle({ name: "" }), "Trigger");
});

test("the view folds status and pull into one chip: active, paused, building, not supported", () => {
  assert.equal(triggerView({ status: "active", pull: { method: "site", reason: null } }), "active");
  assert.equal(triggerView({ status: "active", pull: null }), "active");
  assert.equal(triggerView({ status: "paused", pull: null }), "paused");
  assert.equal(triggerView({ status: "needs_setup", pull: { method: "pending", reason: null } }), "building");
  assert.equal(triggerView({ status: "needs_setup", pull: null }), "building");
  assert.equal(triggerView({ status: "active", pull: { method: "unsupported", reason: null } }), "unsupported");
  assert.equal(viewLabel("active"), "Active");
  assert.equal(viewLabel("paused"), "Paused");
  assert.equal(viewLabel("building"), "Building");
  assert.equal(viewLabel("unsupported"), "Not supported");
});

test("the building line changes at an hour and again at a day, from the last change", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  assert.equal(buildingStage("2026-09-02T11:40:00Z", now), "fresh");
  assert.equal(buildingStage("2026-09-02T10:00:00Z", now), "slow");
  assert.equal(buildingStage("2026-08-31T10:00:00Z", now), "stalled");
  assert.equal(buildingStage(null, now), "fresh");
  assert.equal(buildingStage("not a date", now), "fresh");

  // An edited sentence restarts the clock, so the update wins over create.
  assert.equal(
    buildingLine({ createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-09-02T11:40:00Z" }, now),
    BUILDING_LINES.fresh,
  );
  assert.equal(
    buildingLine({ createdAt: "2026-09-02T10:00:00Z", updatedAt: null }, now),
    BUILDING_LINES.slow,
  );
  assert.equal(BUILDING_LINES.fresh, "Your agent is working out how to check this. Usually under an hour.");
  assert.equal(BUILDING_LINES.slow, "Taking longer than usual. Your agent is still on it.");
  assert.equal(BUILDING_LINES.stalled, "Could not set this up yet.");
});

test("a reason worth printing is a sentence, never an identifier out of the plumbing", () => {
  assert.equal(plainReason("This page asks for a sign-in first."), "This page asks for a sign-in first.");
  assert.equal(plainReason("  "), null);
  assert.equal(plainReason(null), null);
  assert.equal(plainReason("dataforseo_google_jobs"), null);
  assert.equal(plainReason("needs_puller"), null);
});

test("the readback is the agent's line, the reason it could not read, or how long the wait is", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  const base = { createdAt: "2026-09-02T11:40:00Z", updatedAt: null };
  assert.equal(
    readbackLine({ ...base, status: "active", pull: null, summary: "Checks mycnajobs.com every night for caregiver jobs." }, now),
    "Checks mycnajobs.com every night for caregiver jobs.",
  );
  // Still being set up and nothing written back yet.
  assert.equal(readbackLine({ ...base, status: "needs_setup", pull: null, summary: null }, now), BUILDING_LINES.fresh);
  assert.equal(readbackLine({ ...base, status: "needs_setup", pull: null, summary: "  " }, now), BUILDING_LINES.fresh);
  // A source we cannot read says why, in the agent's own words when it has them.
  assert.equal(
    readbackLine({ ...base, status: "needs_setup", pull: { method: "unsupported", reason: "It needs a sign-in." }, summary: null }, now),
    "It needs a sign-in.",
  );
  assert.equal(
    readbackLine({ ...base, status: "needs_setup", pull: { method: "unsupported", reason: null }, summary: "anything" }, now),
    UNSUPPORTED_LINE,
  );
  assert.equal(readbackLine({ ...base, status: "active", pull: null, summary: null }, now), null);
});

test("the counts line is the lifetime tally in plain words, and says nothing when empty", () => {
  assert.equal(countsLine(counts()), "");
  assert.equal(countsLine(counts({ items: 12, companiesAdded: 9 })), "12 found · 9 companies added");
  assert.equal(countsLine(counts({ items: 1, companiesAdded: 1, demos: 1, enrolled: 1 })), "1 found · 1 company added · 1 demo · 1 enrolled");
  // Leads are not a number the customer counts, so they stay off the line.
  assert.equal(countsLine(counts({ items: 40, leads: 13, demos: 13 })), "40 found · 13 demos");
  assert.equal(countsLine(counts({ items: 1234, companiesAdded: 1000 })), "1,234 found · 1,000 companies added");
});

test("the row's meta line is the schedule, then the tally when there is one", () => {
  assert.equal(
    metaLine({ schedule: DEFAULT_SCHEDULE, counts: counts({ items: 12, companiesAdded: 9 }) }),
    "Every night, 2 AM PT · 12 found · 9 companies added",
  );
  assert.equal(metaLine({ schedule: DEFAULT_SCHEDULE, counts: counts() }), "Every night, 2 AM PT");
});

test("item statuses are short, and only a win takes the accent", () => {
  assert.equal(itemStatusLabel("new"), "Waiting");
  assert.equal(itemStatusLabel("in_progress"), "Working");
  assert.equal(itemStatusLabel("something_new"), "Working");
  assert.equal(itemStatusLabel("no_lead"), "No contact found");
  assert.equal(itemStatusLabel("demo_pending"), "Building demo");
  assert.equal(itemStatusLabel("ready"), "Demo ready");
  assert.equal(itemStatusLabel("enrolled"), "Enrolled");
  assert.equal(itemStatusLabel("dismissed"), "Dismissed");
  assert.equal(itemStatusLabel("duplicate"), "Duplicate");
  assert.equal(itemStatusLabel("failed"), "Failed");
  assert.equal(itemStatusTone("ready"), "accent");
  assert.equal(itemStatusTone("enrolled"), "accent");
  // Demo ready and Dismissed used to be the same gray.
  assert.notEqual(itemStatusTone("ready"), itemStatusTone("dismissed"));
  assert.equal(itemStatusTone("dismissed"), "quiet");
  assert.equal(itemStatusTone("duplicate"), "quiet");
  assert.equal(itemStatusTone("no_lead"), "quiet");
  assert.equal(itemStatusTone("failed"), "alert");
  assert.equal(itemStatusTone("new"), "neutral");
});

test("one tone vocabulary covers the trigger's own state as well as an item's", () => {
  // The accent is the single accent, so it may only mark work in flight
  // and the wins; a paused trigger and a waiting item are the same gray.
  assert.equal(viewTone("active"), "live");
  assert.equal(viewTone("building"), "accent");
  assert.equal(viewTone("paused"), "neutral");
  assert.equal(viewTone("unsupported"), "quiet");
  assert.equal(viewTone("paused"), itemStatusTone("new"));
  assert.equal(viewTone("building"), itemStatusTone("ready"));
  // Alert is the needs-attention dot and nothing else reaches for it.
  const tones = [viewTone("active"), viewTone("paused"), viewTone("building"), viewTone("unsupported")];
  assert.equal(tones.includes("alert"), false);
});

test("a check reads as done or failed, and a retried error is not the customer's news", () => {
  assert.deepEqual(runResult({ state: "done", error: null }), { label: "Done", detail: null, tone: "neutral" });
  assert.deepEqual(
    runResult({ state: "done", error: "The source was slow to respond. We retried once and the check finished." }),
    { label: "Done", detail: null, tone: "neutral" },
  );
  // A check in flight takes the accent; a finished one does not.
  assert.deepEqual(runResult({ state: "queued", error: null }), { label: "Queued", detail: null, tone: "accent" });
  assert.deepEqual(runResult({ state: "running", error: null }), { label: "Running", detail: null, tone: "accent" });
  assert.deepEqual(runResult({ state: "failed", error: "The source did not load. Nothing was added." }), {
    label: "Failed",
    detail: "The source did not load. Nothing was added.",
    tone: "alert",
  });
  assert.deepEqual(runResult({ state: "failed", error: null }), { label: "Failed", detail: null, tone: "alert" });
  // Long prose is cut to a line; the row keeps the whole thing on hover.
  assert.equal(
    runResult({ state: "failed", error: "Stopped after ten misses in a row, and the last four pages came back empty as well." }).detail,
    "Stopped after ten misses in a row, and the last…",
  );
});

test("the checks log names what started a check", () => {
  assert.equal(runTriggerLabel("schedule"), "Scheduled");
  assert.equal(runTriggerLabel("manual"), "Check now");
  assert.equal(runTriggerLabel("setup"), "First check");
  assert.equal(runTriggerLabel("something_else"), "Scheduled");
  assert.equal(runIsOpen("queued"), true);
  assert.equal(runIsOpen("running"), true);
  assert.equal(runIsOpen("done"), false);
  assert.equal(runIsOpen(null), false);
});

test("check counters show a dash when the row predates them", () => {
  assert.equal(counterCell(0), "0");
  assert.equal(counterCell(1234), "1,234");
  assert.equal(counterCell(null), "—");
  assert.equal(counterCell(undefined), "—");
});

test("items sort newest first, undated last, then by when we found them", () => {
  const rows = [
    { id: "undated-old", foundAt: null, createdAt: "2026-08-20T00:00:00Z" },
    { id: "aug-30", foundAt: "2026-08-30T00:00:00Z", createdAt: "2026-08-31T00:00:00Z" },
    { id: "aug-31-found-late", foundAt: "2026-08-31T00:00:00Z", createdAt: "2026-09-02T00:00:00Z" },
    { id: "undated-new", foundAt: null, createdAt: "2026-09-01T00:00:00Z" },
    { id: "aug-31-found-early", foundAt: "2026-08-31T00:00:00Z", createdAt: "2026-09-01T00:00:00Z" },
    { id: "bad-date", foundAt: "not a date", createdAt: "2026-08-25T00:00:00Z" },
  ];
  assert.deepEqual(
    sortItems(rows).map((row) => row.id),
    ["aug-31-found-late", "aug-31-found-early", "aug-30", "undated-new", "bad-date", "undated-old"],
  );
  assert.equal(rows[0].id, "undated-old");
  assert.deepEqual(sortItems([]), []);
});

test("a bad extraction reads as words: markdown links and images never reach a cell raw", () => {
  assert.equal(plainText("[Skip to main content](https://jobs.boeing.com/en/job/brisbane/#content)"), "Skip to main content");
  assert.equal(plainText("![Fermilab](https://lss.fnal.gov/images/logo-fnal-blue.png)"), "Fermilab");
  assert.equal(plainText("![](https://example.test/logo.png)"), "");
  assert.equal(plainText("**Caregiver**, part time"), "Caregiver , part time");
  assert.equal(plainText("Caregiver, part   time\n"), "Caregiver, part time");
  // An address alone is not a title.
  assert.equal(plainText("https://example.test/jobs/1"), "");
  assert.equal(plainText("www.example.test"), "");
  assert.equal(plainText(null), "");
  assert.equal(itemTitle({ title: "[Read more](https://example.test/x)" }), "Read more");
  assert.equal(itemTitle({ title: "" }), "");
  assert.equal(itemName({ entityName: "**Brightpath** Home Care" }), "Brightpath Home Care");
});

test("long text is cut on a word boundary, with the rest left to a title attribute", () => {
  assert.equal(truncate("short", 20), "short");
  assert.equal(truncate("a caregiver posting from a home care agency", 20), "a caregiver posting…");
  // No sensible break: cut where the room runs out rather than leave a stub.
  assert.equal(truncate("abcdefghijklmnopqrstuvwxyz", 10), "abcdefghij…");
  assert.equal(shortReason("Dismissed: this is a hospital surgical practice, not the kind of agency this trigger watches."), "Dismissed: this is a hospital surgical practice, not the kind…");
  assert.equal(shortReason("In Companies since Aug 22"), "In Companies since Aug 22");
  assert.equal(shortReason(null), null);
  assert.equal(shortReason("   "), null);
});

test("a row shows at most two extracted fields, whatever schema the item brought", () => {
  const item = {
    entityName: "Verdant Grid",
    title: "Raises $18M to put batteries on rural feeders",
    fields: [
      { label: "Round", value: "Series A" },
      { label: "Raised", value: "$18M" },
      { label: "Lead", value: "Fieldstone" },
    ],
  };
  assert.deepEqual(rowFields(item), [
    { label: "Round", value: "Series A" },
    { label: "Raised", value: "$18M" },
  ]);
  // A job brings different keys and the row does not care.
  assert.deepEqual(
    rowFields({ entityName: "Brightpath Home Care", title: "Caregiver", fields: [{ label: "Pay", value: "$16 to $19/hr" }] }),
    [{ label: "Pay", value: "$16 to $19/hr" }],
  );
  // Nothing empty, nothing that only repeats the name or the title.
  assert.deepEqual(
    rowFields({
      entityName: "Brightpath Home Care",
      title: "Caregiver",
      fields: [
        { label: "Employer", value: "Brightpath Home Care" },
        { label: "Role", value: "Caregiver" },
        { label: "Shift", value: "" },
        { label: "", value: "nothing" },
        { label: "Where", value: "Tucson, AZ" },
      ],
    }),
    [{ label: "Where", value: "Tucson, AZ" }],
  );
  assert.deepEqual(rowFields({ entityName: "x", title: "y", fields: [] }), []);
});

test("last check reads Checking now while a check is open, even before the first ever finished", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  const never = { lastRunAt: null, lastRunState: null };
  const running = { lastRunAt: null, lastRunState: "running" };
  const done = { lastRunAt: "2026-08-31T13:02:00Z", lastRunState: "done" };
  const failed = { lastRunAt: "2026-08-31T13:02:00Z", lastRunState: "failed" };

  assert.deepEqual(lastCheck(never), { kind: "never" });
  assert.deepEqual(lastCheck(running), { kind: "checking" });
  assert.deepEqual(lastCheck(done), { kind: "checked", at: "2026-08-31T13:02:00Z", failed: false });
  assert.deepEqual(lastCheck(failed), { kind: "checked", at: "2026-08-31T13:02:00Z", failed: true });

  const openRun = { state: "queued", finishedAt: null, startedAt: null, createdAt: "2026-09-02T11:59:00Z" };
  const doneRun = { state: "done", finishedAt: "2026-09-02T11:58:00Z", startedAt: "2026-09-02T11:57:00Z", createdAt: "2026-09-02T11:57:00Z" };
  assert.deepEqual(lastCheck(done, openRun), { kind: "checking" });
  assert.deepEqual(lastCheck(done, doneRun), { kind: "checked", at: "2026-09-02T11:58:00Z", failed: false });
  assert.deepEqual(lastCheck(never, null), { kind: "never" });

  assert.equal(lastCheckLine(never, null, now), "Has not checked yet");
  assert.equal(lastCheckLine(running, null, now), "Checking now…");
  assert.equal(lastCheckLine(done, null, now), "Last check Aug 31");
  assert.equal(lastCheckLine(failed, null, now), "Last check Aug 31 failed");

  // The detail page's line carries the same thing to the minute, and says
  // what the number is: there is no label beside it any more.
  assert.equal(lastCheckFact(never), "Has not checked yet");
  assert.equal(lastCheckFact(running), "Checking now…");
  assert.equal(lastCheckFact(done, doneRun), `Last check ${formatMoment("2026-09-02T11:58:00Z")}`);
  assert.equal(lastCheckFact(failed), `Last check ${formatMoment("2026-08-31T13:02:00Z")}, failed`);
});

test("days drop the year only inside the current year", () => {
  const now = new Date("2026-09-01T12:00:00Z");
  assert.equal(formatDay("2026-08-31T13:02:00Z", now), "Aug 31");
  assert.equal(formatDay("2025-08-31T13:02:00Z", now), "Aug 31, 2025");
  assert.equal(formatDay(null, now), null);
  assert.equal(formatDay("not a date", now), null);
});

test("the when cell is always a bare day, and flags the one it had to borrow", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  assert.deepEqual(
    foundCell({ foundAt: "2026-08-31T13:02:00Z", createdAt: "2026-09-01T13:02:00Z" }, now),
    { day: "Aug 31", undated: false },
  );
  // An undated item used to render "Found Sep 1" in a column of bare
  // dates, which read as a glitch. The day stays bare and the flag
  // carries the distinction to a sub-line.
  assert.deepEqual(
    foundCell({ foundAt: null, createdAt: "2026-09-01T13:02:00Z" }, now),
    { day: "Sep 1", undated: true },
  );
  assert.deepEqual(
    foundCell({ foundAt: "not a date", createdAt: "2025-09-01T13:02:00Z" }, now),
    { day: "Sep 1, 2025", undated: true },
  );
  // No usable date at all says so outright, and needs no sub-line.
  assert.deepEqual(
    foundCell({ foundAt: null, createdAt: "not a date" }, now),
    { day: "Unknown", undated: false },
  );
});
