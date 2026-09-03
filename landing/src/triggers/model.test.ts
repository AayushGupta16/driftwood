import assert from "node:assert/strict";
import test from "node:test";

import {
  addToList,
  counterCell,
  countsLine,
  DEFAULT_SCHEDULE,
  deriveTriggerName,
  fireHourLabel,
  formatDay,
  formatMoment,
  formatUsd,
  hasListSeparator,
  hostFromUrl,
  isSiteUrl,
  joinLocations,
  lastCheck,
  lastCheckFact,
  lastCheckLine,
  postedCell,
  postingLocation,
  postingStatusLabel,
  postingStatusTone,
  pullLabel,
  runIsOpen,
  runStateLabel,
  runTriggerLabel,
  scheduleLabel,
  sortPostings,
  spendCell,
  splitList,
  thenLine,
  triggerTitle,
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
    "a new caregiver or CNA job posting from a home care agency appears on mycnajobs.com in Atlanta · Phoenix · Dallas · Chicago · Tampa",
  );
});

test("places keep their commas, so a list of them joins on a middle dot", () => {
  assert.equal(joinLocations(["Atlanta, GA", "Phoenix, AZ", "Dallas, TX"]), "Atlanta, GA · Phoenix, AZ · Dallas, TX");
  assert.equal(joinLocations(["Florida", " Georgia "]), "Florida · Georgia");
  assert.equal(joinLocations(["Tampa"]), "Tampa");
  assert.equal(joinLocations([]), "");
  assert.equal(
    whenLine({
      watch: "A new CNA posting",
      sourceHost: "mycnajobs.com",
      sourceUrl: null,
      sourceKind: "custom_url",
      filters: filters({ locations: ["Atlanta, GA", "Phoenix, AZ", "Dallas, TX"] }),
    }),
    "a new CNA posting appears on mycnajobs.com in Atlanta, GA · Phoenix, AZ · Dallas, TX",
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
    "a live-in caregiver posting appears on jobs.example.com in Florida · Georgia",
  );
  assert.equal(
    whenLine({ watch: null, sourceHost: null, sourceUrl: null, sourceKind: "something_else", filters: filters() }),
    "a new posting appears anywhere on the web",
  );
  assert.equal(
    whenLine({ watch: null, sourceHost: "indeed.com", sourceUrl: null, sourceKind: "custom_url", filters: filters({ locations: ["All US", "Atlanta, GA", "Phoenix"] }) }),
    "a new posting appears on indeed.com in Atlanta, GA · Phoenix",
  );
});

test("a trigger with no site appears anywhere on the web", () => {
  const web = { sourceHost: null, sourceUrl: null, sourceKind: "custom_url" };
  assert.equal(
    whenLine({ ...web, watch: "Home care agencies hiring live-in caregivers", filters: filters({ locations: ["All US"] }) }),
    "home care agencies hiring live-in caregivers appears anywhere on the web in the US",
  );
  assert.equal(
    whenLine({ ...web, watch: "A new CNA posting", filters: filters({ locations: ["Atlanta", "Tampa"] }) }),
    "a new CNA posting appears anywhere on the web in Atlanta · Tampa",
  );
  assert.equal(
    whenLine({ ...web, watch: "A new CNA posting", filters: filters() }),
    "a new CNA posting appears anywhere on the web",
  );
});

test("a trigger is named after its site, or the first three words of the sentence", () => {
  assert.equal(deriveTriggerName("Home care agencies hiring live-in caregivers", "mycnajobs.com"), "mycnajobs.com");
  assert.equal(deriveTriggerName("Home care agencies hiring live-in caregivers", null), "Home care agencies");
  assert.equal(deriveTriggerName("  A new   CNA, posting ", null), "A new CNA");
  assert.equal(deriveTriggerName("Caregivers", null), "Caregivers");
  assert.equal(deriveTriggerName("", null), "New trigger");
});

test("the title is a typed name, else the site, else five words of the sentence", () => {
  const sentence = "A new caregiver or CNA job posting from a home care agency in the Southeast";
  // The backend named a no-site trigger after its whole sentence.
  assert.equal(triggerTitle({ name: sentence, sourceHost: null, watch: sentence }), "A new caregiver or CNA…");
  assert.equal(triggerTitle({ name: `${sentence}.`, sourceHost: null, watch: sentence }), "A new caregiver or CNA…");
  assert.equal(triggerTitle({ name: "", sourceHost: null, watch: sentence }), "A new caregiver or CNA…");
  // With a site, the site.
  assert.equal(triggerTitle({ name: sentence, sourceHost: "mycnajobs.com", watch: sentence }), "mycnajobs.com");
  assert.equal(triggerTitle({ name: "mycnajobs.com", sourceHost: "mycnajobs.com", watch: sentence }), "mycnajobs.com");
  // A name the customer typed wins, site or not.
  assert.equal(triggerTitle({ name: "Southeast agencies", sourceHost: "indeed.com", watch: sentence }), "Southeast agencies");
  assert.equal(triggerTitle({ name: "Home care agencies", sourceHost: null, watch: sentence }), "Home care agencies");
  // A name that is itself a long sentence is not a name.
  assert.equal(
    triggerTitle({ name: "Home care agencies hiring live-in caregivers across the whole Southeast region", sourceHost: null, watch: sentence }),
    "A new caregiver or CNA…",
  );
  // Short sentences need no ellipsis; nothing at all is still a title.
  assert.equal(triggerTitle({ name: "", sourceHost: null, watch: "Home care agencies hiring." }), "Home care agencies hiring");
  assert.equal(triggerTitle({ name: "", sourceHost: null, watch: "Five words and no more" }), "Five words and no more");
  assert.equal(triggerTitle({ name: "", sourceHost: null, watch: null }), "Trigger");
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
  assert.equal(pullLabel({ method: "api", label: "Google Jobs" }), "Google Jobs");
  assert.equal(pullLabel({ method: "api", label: "  " }), "Job board search");
  // A label that only echoes the method key is no label.
  assert.equal(pullLabel({ method: "api", label: "API" }), "Job board search");
  assert.equal(pullLabel({ method: "something_new" as "api", label: "something_new" }), null);
  assert.equal(pullLabel({ method: "something_new" as "api", label: "Something new" }), "Something new");
  assert.equal(pullLabel({ method: "firecrawl_pages", label: "" }), "Page watch");
  assert.equal(pullLabel({ method: "firecrawl_search", label: "" }), "Web search");
  assert.equal(pullLabel({ method: "firecrawl_search", label: "Web search" }), "Web search");
  assert.equal(pullLabel({ method: "needs_puller", label: "" }), "Building");
  assert.equal(pullLabel({ method: "unsupported", label: "" }), "Not supported yet");
  assert.equal(pullLabel(null), null);
  assert.equal(pullLabel(undefined), null);
});

test("posting statuses say who has the posting, with a tone", () => {
  assert.equal(postingStatusLabel("new"), "Waiting for your agent");
  assert.equal(postingStatusLabel("in_progress"), "Your agent is working on it");
  assert.equal(postingStatusLabel("something_new"), "Your agent is working on it");
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

test("the runs log names what started a run: the schedule, a press, or setup", () => {
  assert.equal(runTriggerLabel("schedule"), "Scheduled");
  assert.equal(runTriggerLabel("manual"), "Check now");
  assert.equal(runTriggerLabel("setup"), "First check");
  assert.equal(runTriggerLabel("something_else"), "Scheduled");
});

test("spend shows dollars only when metered and non-zero, next to credits", () => {
  assert.equal(formatUsd(0.05), "$0.05");
  assert.equal(formatUsd(1.2), "$1.20");
  assert.equal(formatUsd(1234.5), "$1,234.50");
  assert.equal(formatUsd(0.004), "Under $0.01");
  assert.equal(formatUsd(0), null);
  assert.equal(formatUsd(-1), null);
  assert.equal(formatUsd(null), null);
  assert.equal(formatUsd(undefined), null);
  assert.equal(formatUsd(Number.NaN), null);
  assert.equal(spendCell({ creditsUsed: 12, costUsd: 0.05 }), "12 credits · $0.05");
  assert.equal(spendCell({ creditsUsed: 1, costUsd: null }), "1 credit");
  assert.equal(spendCell({ creditsUsed: 12, costUsd: 0 }), "12 credits");
  assert.equal(spendCell({ creditsUsed: null, costUsd: 0.05 }), "$0.05");
  assert.equal(spendCell({ creditsUsed: null, costUsd: null }), "—");
});

test("postings sort newest first by posting date, undated last, then by when we found them", () => {
  const rows = [
    { id: "undated-old", postedAt: null, createdAt: "2026-08-20T00:00:00Z" },
    { id: "aug-30", postedAt: "2026-08-30T00:00:00Z", createdAt: "2026-08-31T00:00:00Z" },
    { id: "aug-31-found-late", postedAt: "2026-08-31T00:00:00Z", createdAt: "2026-09-02T00:00:00Z" },
    { id: "undated-new", postedAt: null, createdAt: "2026-09-01T00:00:00Z" },
    { id: "aug-31-found-early", postedAt: "2026-08-31T00:00:00Z", createdAt: "2026-09-01T00:00:00Z" },
    { id: "bad-date", postedAt: "not a date", createdAt: "2026-08-25T00:00:00Z" },
  ];
  const sorted = sortPostings(rows);
  assert.deepEqual(
    sorted.map((row) => row.id),
    ["aug-31-found-late", "aug-31-found-early", "aug-30", "undated-new", "bad-date", "undated-old"],
  );
  // The input is left alone.
  assert.equal(rows[0].id, "undated-old");
  assert.deepEqual(sortPostings([]), []);
});

test("run counters show a dash when the row predates them", () => {
  assert.equal(counterCell(0), "0");
  assert.equal(counterCell(1234), "1,234");
  assert.equal(counterCell(null), "—");
  assert.equal(counterCell(undefined), "—");
});

test("the counts line is the lifetime tally, labelled as such, never one check's result", () => {
  const zero = { postings: 0, new: 0, agenciesAdded: 0, leads: 0, demos: 0, enrolled: 0, held: 0 };
  assert.equal(countsLine(zero), "");
  // "new" is a status count, not a per-check figure, so it stays off the line.
  assert.equal(
    countsLine({ ...zero, postings: 40, new: 21, agenciesAdded: 34, leads: 13, demos: 13 }),
    "So far: 40 postings · 34 agencies added · 13 contacts · 13 demos",
  );
  assert.equal(countsLine({ ...zero, postings: 40, new: 40 }), "So far: 40 postings");
  assert.equal(
    countsLine({ ...zero, postings: 1, agenciesAdded: 1, leads: 1, demos: 1, enrolled: 1, held: 1 }),
    "So far: 1 posting · 1 agency added · 1 contact · 1 demo · 1 enrolled · 1 held for review",
  );
  assert.equal(countsLine({ ...zero, postings: 1234, agenciesAdded: 1000 }), "So far: 1,234 postings · 1,000 agencies added");
});

test("last check reads Checking now while a run is open, even before the first ever finished", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  const never = { lastRunAt: null, lastRunState: null };
  const running = { lastRunAt: null, lastRunState: "running" };
  const done = { lastRunAt: "2026-08-31T13:02:00Z", lastRunState: "done" };
  const failed = { lastRunAt: "2026-08-31T13:02:00Z", lastRunState: "failed" };

  // From the row alone (the list call carries no runs).
  assert.deepEqual(lastCheck(never), { kind: "never" });
  assert.deepEqual(lastCheck(running), { kind: "checking" });
  assert.deepEqual(lastCheck({ lastRunAt: null, lastRunState: "queued" }), { kind: "checking" });
  assert.deepEqual(lastCheck(done), { kind: "checked", at: "2026-08-31T13:02:00Z", failed: false });
  assert.deepEqual(lastCheck(failed), { kind: "checked", at: "2026-08-31T13:02:00Z", failed: true });

  // With the newest run, the run wins: its state, and its finish time.
  const openRun = { state: "queued", finishedAt: null, startedAt: null, createdAt: "2026-09-02T11:59:00Z" };
  const doneRun = { state: "done", finishedAt: "2026-09-02T11:58:00Z", startedAt: "2026-09-02T11:57:00Z", createdAt: "2026-09-02T11:57:00Z" };
  const failedRun = { state: "failed", finishedAt: null, startedAt: "2026-09-02T11:57:00Z", createdAt: "2026-09-02T11:57:00Z" };
  assert.deepEqual(lastCheck(done, openRun), { kind: "checking" });
  assert.deepEqual(lastCheck(never, openRun), { kind: "checking" });
  assert.deepEqual(lastCheck(done, doneRun), { kind: "checked", at: "2026-09-02T11:58:00Z", failed: false });
  assert.deepEqual(lastCheck(never, failedRun), { kind: "checked", at: "2026-09-02T11:57:00Z", failed: true });
  assert.deepEqual(lastCheck(never, null), { kind: "never" });

  assert.equal(lastCheckLine(never, null, now), "Has not checked yet");
  assert.equal(lastCheckLine(running, null, now), "Checking now…");
  assert.equal(lastCheckLine(done, null, now), "Last check Aug 31");
  assert.equal(lastCheckLine(failed, null, now), "Last check Aug 31 failed");
  assert.equal(lastCheckLine(done, openRun, now), "Checking now…");

  assert.equal(lastCheckFact(never), "Has not checked yet");
  assert.equal(lastCheckFact(running), "Checking now…");
  assert.equal(lastCheckFact(done, openRun), "Checking now…");
  assert.equal(lastCheckFact(done, doneRun), formatMoment("2026-09-02T11:58:00Z"));
  assert.equal(lastCheckFact(failed), `${formatMoment("2026-08-31T13:02:00Z")}, failed`);
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

test("the posted cell is the posting's day, or the day we found an undated one", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  assert.equal(postedCell({ postedAt: "2026-08-31T13:02:00Z", createdAt: "2026-09-01T13:02:00Z" }, now), "Aug 31");
  assert.equal(postedCell({ postedAt: null, createdAt: "2026-09-01T13:02:00Z" }, now), "Found Sep 1");
  assert.equal(postedCell({ postedAt: "not a date", createdAt: "2025-09-01T13:02:00Z" }, now), "Found Sep 1, 2025");
  assert.equal(postedCell({ postedAt: null, createdAt: "not a date" }, now), "Unknown");
});

test("posting location prefers city and state, then the raw text", () => {
  assert.equal(postingLocation({ city: "Tucson", state: "AZ", locationText: null }), "Tucson, AZ");
  assert.equal(postingLocation({ city: null, state: null, locationText: "Remote (US)" }), "Remote (US)");
  assert.equal(postingLocation({ city: null, state: null, locationText: null }), "Location not listed");
});
