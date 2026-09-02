import assert from "node:assert/strict";
import test from "node:test";

import {
  addToList,
  counterCell,
  countsLine,
  DEFAULT_SCHEDULE,
  fireHourLabel,
  formatDay,
  hasListSeparator,
  hostFromUrl,
  isSiteUrl,
  postingLocation,
  postingStatusLabel,
  postingStatusTone,
  pullLabel,
  runIsOpen,
  runStateLabel,
  scheduleLabel,
  splitList,
  thenLine,
  triggerView,
  viewLabel,
  viewNotice,
  whenLine,
  withoutAllUs,
  type TriggerFilters,
} from "./model.ts";

const filters = (over: Partial<TriggerFilters> = {}): TriggerFilters => ({
  keywords: [],
  locations: [],
  excludeEmployerTerms: [],
  url: null,
  ...over,
});

test("hosts come out of any pasted address, bare or with www", () => {
  assert.equal(hostFromUrl("https://www.mycnajobs.com/jobs?city=Atlanta"), "mycnajobs.com");
  assert.equal(hostFromUrl("http://Jobs.Example.org"), "jobs.example.org");
  assert.equal(hostFromUrl("mycnajobs.com"), "mycnajobs.com");
  assert.equal(hostFromUrl("  "), null);
  assert.equal(hostFromUrl(null), null);
  assert.equal(hostFromUrl("not a url"), null);
  assert.equal(hostFromUrl("localhost"), null);
});

test("a site address must be a full https address", () => {
  assert.equal(isSiteUrl("https://www.mycnajobs.com"), true);
  assert.equal(isSiteUrl("http://jobs.example.test/list"), true);
  assert.equal(isSiteUrl("mycnajobs.com"), false);
  assert.equal(isSiteUrl("https://nodot"), false);
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
  assert.equal(scheduleLabel({ cadence: "daily", fireHour: 0, intervalHours: null }), "Every night, 12 AM PT");
  assert.equal(scheduleLabel({ cadence: "daily", fireHour: 6, intervalHours: null }), "Every morning, 6 AM PT");
  assert.equal(scheduleLabel({ cadence: "daily", fireHour: 11, intervalHours: null }), "Every morning, 11 AM PT");
  assert.equal(scheduleLabel({ cadence: "daily", fireHour: 15, intervalHours: null }), "Daily, 3 PM PT");
  assert.equal(scheduleLabel({ cadence: "weekly", fireHour: 6, intervalHours: null }), "Weekly");
  assert.equal(scheduleLabel({ cadence: "every_n_hours", fireHour: 0, intervalHours: 4 }), "Every 4 hours");
  assert.equal(scheduleLabel({ cadence: "every_n_hours", fireHour: 0, intervalHours: 1 }), "Every hour");
  assert.equal(scheduleLabel({ cadence: "every_n_hours", fireHour: 0, intervalHours: null }), "Every few hours");
  assert.equal(scheduleLabel(null), "On a schedule");
});

test("the when line is the founder's sentence, built from watch, host and locations", () => {
  assert.equal(
    whenLine({
      watch: "A new caregiver or CNA job posting from a home care agency",
      sourceHost: "mycnajobs.com",
      sourceUrl: "https://www.mycnajobs.com",
      sourceKind: "custom_url",
      filters: filters({ locations: ["Atlanta", "Phoenix", "Dallas", "Chicago", "Tampa"] }),
    }),
    "a new caregiver or CNA job posting from a home care agency appears on mycnajobs.com in Atlanta, Phoenix, Dallas, Chicago or Tampa",
  );
});

test("the when line falls back to keywords, the legacy source and All US", () => {
  assert.equal(
    whenLine({
      watch: null,
      sourceHost: null,
      sourceUrl: null,
      sourceKind: "mycnajobs",
      filters: filters({ keywords: ["caregiver", "CNA"], locations: ["All US"] }),
    }),
    "a new caregiver or CNA posting appears on mycnajobs.com anywhere in the US",
  );
  assert.equal(
    whenLine({
      watch: "A live-in caregiver posting.",
      sourceHost: null,
      sourceUrl: null,
      sourceKind: "custom_url",
      filters: filters({ url: "https://www.jobs.example.com/list", locations: ["Florida", "Georgia"] }),
    }),
    "a live-in caregiver posting appears on jobs.example.com in Florida or Georgia",
  );
  assert.equal(
    whenLine({ watch: null, sourceHost: null, sourceUrl: null, sourceKind: "something_else", filters: filters() }),
    "a new posting appears",
  );
  assert.equal(
    whenLine({ watch: null, sourceHost: "indeed.com", sourceUrl: null, sourceKind: "custom_url", filters: filters({ locations: ["All US", "Atlanta, GA", "Phoenix"] }) }),
    "a new posting appears on indeed.com in Atlanta, GA or Phoenix",
  );
});

test("All US only means something on its own", () => {
  assert.deepEqual(withoutAllUs(["All US"]), ["All US"]);
  assert.deepEqual(withoutAllUs(["All US", "Atlanta, GA"]), ["Atlanta, GA"]);
  assert.deepEqual(withoutAllUs(["Atlanta, GA", "united states", "Phoenix"]), ["Atlanta, GA", "Phoenix"]);
  assert.deepEqual(withoutAllUs([]), []);
});

test("the then line lists the ticked actions and names the campaign", () => {
  const all = { addCompany: true, findContact: true, buildDemo: true, enroll: true };
  assert.equal(
    thenLine(all, "MochaCare intro"),
    'add the agency as a company, find the owner or administrator, build a demo and enroll them in "MochaCare intro"',
  );
  assert.equal(thenLine({ ...all, enroll: false }, null), "add the agency as a company, find the owner or administrator and build a demo");
  assert.equal(thenLine({ ...all, buildDemo: false, findContact: false }, null), 'add the agency as a company and enroll them in a campaign');
  assert.equal(thenLine({ addCompany: true, findContact: false, buildDemo: false, enroll: false }, null), "add the agency as a company");
  assert.equal(thenLine({ addCompany: false, findContact: false, buildDemo: false, enroll: false }, null), "record the posting");
});

test("the view folds status and pull into one chip: active, paused, building, not supported", () => {
  assert.equal(triggerView({ status: "active", pull: { method: "api", label: "Job board search" } }), "active");
  assert.equal(triggerView({ status: "active", pull: null }), "active");
  assert.equal(triggerView({ status: "paused", pull: null }), "paused");
  assert.equal(triggerView({ status: "needs_setup", pull: { method: "needs_puller", label: "Building" } }), "building");
  assert.equal(triggerView({ status: "needs_setup", pull: null }), "building");
  assert.equal(triggerView({ status: "needs_setup", pull: { method: "unsupported", label: "Not supported yet" } }), "unsupported");
  assert.equal(triggerView({ status: "active", pull: { method: "unsupported", label: "" } }), "unsupported");
  assert.equal(viewLabel("active"), "Active");
  assert.equal(viewLabel("paused"), "Paused");
  assert.equal(viewLabel("building"), "Building");
  assert.equal(viewLabel("unsupported"), "Not supported");
  assert.equal(viewNotice("active"), null);
  assert.equal(viewNotice("paused"), null);
  assert.equal(viewNotice("building"), "Your agent is setting up the pull for this site.");
  assert.equal(viewNotice("unsupported"), "We cannot watch this site yet. It needs a sign-in, or it is not a list of items we can read.");
});

test("the source fact takes the backend's label, then a plain name per method, never the key", () => {
  assert.equal(pullLabel({ method: "api", label: "Job board search" }), "Job board search");
  assert.equal(pullLabel({ method: "api", label: "  " }), "Job board search");
  assert.equal(pullLabel({ method: "firecrawl_pages", label: "" }), "Page watch");
  assert.equal(pullLabel({ method: "needs_puller", label: "" }), "Building");
  assert.equal(pullLabel({ method: "unsupported", label: "" }), "Not supported yet");
  assert.equal(pullLabel(null), null);
  assert.equal(pullLabel(undefined), null);
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

test("run counters show a dash when the row predates them", () => {
  assert.equal(counterCell(0), "0");
  assert.equal(counterCell(1234), "1,234");
  assert.equal(counterCell(null), "—");
  assert.equal(counterCell(undefined), "—");
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

test("keywords and employer terms split on commas, locations on semicolons so a city keeps its state", () => {
  assert.deepEqual(splitList("caregiver, CNA", "keywords"), ["caregiver", "CNA"]);
  assert.deepEqual(splitList("senior living, hospice", "terms"), ["senior living", "hospice"]);
  assert.deepEqual(splitList("Atlanta, GA; Phoenix, AZ", "locations"), ["Atlanta, GA", "Phoenix, AZ"]);
  assert.deepEqual(splitList("Atlanta, GA\nPhoenix, AZ", "locations"), ["Atlanta, GA", "Phoenix, AZ"]);
  assert.deepEqual(splitList("  cna ,, CNA , home  health aide ", "keywords"), ["cna", "home health aide"]);
  assert.deepEqual(splitList("", "keywords"), []);
});

test("chip fields turn typed text into chips at the separator and never repeat one", () => {
  assert.equal(hasListSeparator("caregiver,", "keywords"), true);
  assert.equal(hasListSeparator("caregiver", "keywords"), false);
  assert.equal(hasListSeparator("Atlanta, GA", "locations"), false);
  assert.equal(hasListSeparator("Atlanta, GA;", "locations"), true);
  assert.deepEqual(addToList(["CNA"], ["cna", "caregiver"]), ["CNA", "caregiver"]);
  assert.deepEqual(addToList([], ["Atlanta, GA", "atlanta, ga"]), ["Atlanta, GA"]);
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
