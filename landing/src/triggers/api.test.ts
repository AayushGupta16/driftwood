import assert from "node:assert/strict";
import test from "node:test";

import {
  createBody,
  createTrigger,
  getTrigger,
  listTriggers,
  mapPosting,
  mapRun,
  mapTrigger,
  runTrigger,
  TriggerApiError,
  updateBody,
  updateTrigger,
  type RawTriggerRow,
} from "./api.ts";
import type { NewTriggerInput } from "./model.ts";

const rawTrigger: RawTriggerRow = {
  id: "trg-1",
  name: "mycnajobs.com",
  source_kind: "custom_url",
  source_url: "https://www.mycnajobs.com",
  source_host: "mycnajobs.com",
  watch: "A new caregiver or CNA job posting from a home care agency",
  filters: {
    keywords: ["caregiver", "CNA"],
    locations: ["Atlanta", "Phoenix"],
    exclude_employer_terms: ["hospital", "hospice"],
    url: null,
  },
  cadence: "daily",
  fire_hour: 2,
  schedule: { cadence: "daily", fire_hour: 2, interval_hours: null },
  actions: { add_company: true, find_contact: true, build_demo: true, enroll: true },
  pull: { method: "api", label: "Job board search" },
  campaign_id: "cmp-1",
  campaign_name: "MochaCare intro",
  status: "active",
  last_run_at: "2026-09-01T13:02:00Z",
  last_run_state: "done",
  counts: { postings: 34, new: 14, agencies_added: 11, leads: 9, demos: 9, enrolled: 9, held: 2 },
  created_at: "2026-08-19T16:00:00Z",
};

/* A row written before source_url, watch, schedule, actions and pull
   existed: only the first slice's fields. */
const legacyTrigger: RawTriggerRow = {
  id: "trg-old",
  name: "myCNAjobs",
  source_kind: "mycnajobs",
  filters: { keywords: ["caregiver"], locations: ["All US"], url: null },
  cadence: "weekly",
  fire_hour: 6,
  campaign_id: "cmp-1",
  campaign_name: "Home care agency intro",
  status: "paused",
  last_run_at: null,
  last_run_state: null,
  counts: { postings: 0, new: 0, agencies_added: 0, leads: 0, demos: 0, enrolled: 0, held: 0 },
  created_at: "2026-08-19T16:00:00Z",
};

const input: NewTriggerInput = {
  name: null,
  sourceUrl: "https://www.mycnajobs.com",
  watch: "A new caregiver or CNA job posting from a home care agency",
  keywords: ["caregiver", "CNA"],
  locations: ["All US"],
  excludeEmployerTerms: ["hospital"],
  cadence: "daily",
  fireHour: 2,
  intervalHours: null,
  actions: { addCompany: true, findContact: true, buildDemo: true, enroll: true },
  campaignId: "cmp-1",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(t: { after: (fn: () => void) => void }, handler: typeof fetch) {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = handler;
}

test("trigger rows map snake_case to the page shape", () => {
  const trigger = mapTrigger(rawTrigger);
  assert.equal(trigger.sourceUrl, "https://www.mycnajobs.com");
  assert.equal(trigger.sourceHost, "mycnajobs.com");
  assert.equal(trigger.watch, "A new caregiver or CNA job posting from a home care agency");
  assert.deepEqual(trigger.filters, {
    keywords: ["caregiver", "CNA"],
    locations: ["Atlanta", "Phoenix"],
    excludeEmployerTerms: ["hospital", "hospice"],
    url: null,
  });
  assert.deepEqual(trigger.schedule, { cadence: "daily", fireHour: 2, intervalHours: null });
  assert.deepEqual(trigger.actions, { addCompany: true, findContact: true, buildDemo: true, enroll: true });
  assert.deepEqual(trigger.pull, { method: "api", label: "Job board search" });
  assert.equal(trigger.status, "active");
  assert.equal(trigger.campaignName, "MochaCare intro");
  assert.equal(trigger.lastRunAt, "2026-09-01T13:02:00Z");
  assert.deepEqual(trigger.counts, {
    postings: 34, new: 14, agenciesAdded: 11, leads: 9, demos: 9, enrolled: 9, held: 2,
  });
});

test("rows from before the when/then fields get sensible defaults", () => {
  const trigger = mapTrigger(legacyTrigger);
  assert.equal(trigger.sourceUrl, null);
  assert.equal(trigger.sourceHost, "mycnajobs.com");
  assert.equal(trigger.watch, null);
  assert.deepEqual(trigger.filters.excludeEmployerTerms, []);
  assert.deepEqual(trigger.schedule, { cadence: "weekly", fireHour: 6, intervalHours: null });
  assert.deepEqual(trigger.actions, { addCompany: true, findContact: true, buildDemo: true, enroll: true });
  assert.equal(trigger.pull, null);
  assert.equal(trigger.status, "paused");

  const bare = mapTrigger({ ...legacyTrigger, filters: null, campaign_id: null, campaign_name: null, status: "needs_setup", counts: null });
  assert.deepEqual(bare.filters, { keywords: [], locations: [], excludeEmployerTerms: [], url: null });
  assert.equal(bare.actions.enroll, false);
  assert.equal(bare.status, "needs_setup");
  assert.equal(bare.counts.postings, 0);

  const custom = mapTrigger({ ...legacyTrigger, source_kind: "custom_url", filters: { keywords: [], locations: [], url: "https://www.jobs.example.com/list" } });
  assert.equal(custom.sourceUrl, "https://www.jobs.example.com/list");
  assert.equal(custom.sourceHost, "jobs.example.com");

  const web = mapTrigger({ ...rawTrigger, source_url: null, source_host: null, pull: { method: "firecrawl_search", label: "Web search" } });
  assert.equal(web.sourceUrl, null);
  assert.equal(web.sourceHost, null);
  assert.deepEqual(web.pull, { method: "firecrawl_search", label: "Web search" });

  assert.equal(mapTrigger({ ...legacyTrigger, status: "something_new" }).status, "active");
  assert.deepEqual(mapTrigger({ ...legacyTrigger, cadence: "hourly" }).schedule.cadence, "daily");
  assert.deepEqual(
    mapTrigger({ ...legacyTrigger, schedule: { cadence: "every_n_hours", fire_hour: 0, interval_hours: 4 } }).schedule,
    { cadence: "every_n_hours", fireHour: 0, intervalHours: 4 },
  );
});

test("runs map every wire field, the pull counters null when absent", () => {
  const raw = {
    id: "run-1", state: "done", triggered_by: "manual", postings_seen: 219, postings_new: 9,
    pages_fetched: 4, credits_used: 12, cost_usd: 0.05, ids_seen: 219, ids_new: 9, ids_filtered: 31,
    error: null, created_at: "2026-09-01T13:00:00Z", started_at: "2026-09-01T13:00:05Z",
    finished_at: "2026-09-01T13:02:00Z",
  };
  const run = mapRun(raw);
  assert.equal(run.triggeredBy, "manual");
  assert.equal(run.postingsSeen, 219);
  assert.equal(run.pagesFetched, 4);
  assert.equal(run.creditsUsed, 12);
  assert.equal(run.costUsd, 0.05);
  assert.equal(run.idsSeen, 219);
  assert.equal(run.idsNew, 9);
  assert.equal(run.idsFiltered, 31);
  assert.equal(run.finishedAt, "2026-09-01T13:02:00Z");

  const oldRaw = {
    id: "run-0", state: "done", triggered_by: "schedule", postings_seen: 88, postings_new: 6,
    error: null, created_at: "2026-08-20T13:00:00Z", started_at: null, finished_at: null,
  };
  const old = mapRun(oldRaw);
  assert.equal(old.pagesFetched, null);
  assert.equal(old.creditsUsed, null);
  assert.equal(old.costUsd, null);
  assert.equal(old.idsSeen, null);
  assert.equal(old.idsNew, null);
  assert.equal(old.idsFiltered, null);
  assert.equal(mapRun({ ...oldRaw, credits_used: null, ids_seen: undefined }).idsSeen, null);
  assert.equal(mapRun({ ...oldRaw, cost_usd: null }).costUsd, null);

  /* A note is informational and separate from the error; absent -> null. */
  const note = "First check: recorded 425 postings already listed; new ones arrive from the next check.";
  assert.equal(mapRun({ ...raw, note }).note, note);
  assert.equal(mapRun({ ...raw, note }).error, null);
  assert.equal(run.note, null);
  assert.equal(old.note, null);
  assert.equal(mapRun({ ...oldRaw, note: null }).note, null);

  // The check the backend starts by itself after create is "setup"; any
  // other value it might send reads as scheduled.
  assert.equal(mapRun({ ...raw, triggered_by: "setup" }).triggeredBy, "setup");
  assert.equal(mapRun({ ...raw, triggered_by: "schedule" }).triggeredBy, "schedule");
  assert.equal(mapRun({ ...raw, triggered_by: "cron" }).triggeredBy, "schedule");
});

test("postings map every wire field", () => {
  const posting = mapPosting({
    id: "p-1", source_url: "https://example.test/jobs/1", employer_name: "Brightpath Home Care",
    title: "Caregiver, part time", city: "Tucson", state: "AZ", location_text: "Tucson, AZ",
    pay_text: "$16 to $19/hr", posted_at: "2026-08-31T00:00:00Z", status: "enrolled", note: null,
    company_id: "c-1", lead_id: "l-1", demo_url: "https://driftwood.sh/d/abc", created_at: "2026-08-31T13:02:00Z",
  });
  assert.equal(posting.employerName, "Brightpath Home Care");
  assert.equal(posting.payText, "$16 to $19/hr");
  assert.equal(posting.demoUrl, "https://driftwood.sh/d/abc");
  assert.equal(posting.status, "enrolled");
});

test("the list call reads the triggers envelope with the session cookie", async (t) => {
  stubFetch(t, (async (input, init) => {
    assert.equal(input, "/api/v1/dashboard/triggers");
    assert.equal(init?.credentials, "include");
    assert.equal(init?.method ?? "GET", "GET");
    return json({ triggers: [rawTrigger, legacyTrigger] });
  }) as typeof fetch);

  const rows = await listTriggers();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "mycnajobs.com");
  assert.equal(rows[1].sourceHost, "mycnajobs.com");
});

test("the detail call returns the trigger with its runs and postings, newest posting first", async (t) => {
  const rawPosting = (id: string, posted_at: string | null, created_at: string) => ({
    id, source_url: `https://example.test/jobs/${id}`, employer_name: "Brightpath Home Care",
    title: "Caregiver", city: "Tucson", state: "AZ", location_text: "Tucson, AZ", pay_text: null,
    posted_at, status: "new", note: null, company_id: null, lead_id: null, demo_url: null, created_at,
  });
  stubFetch(t, (async (input) => {
    assert.equal(input, "/api/v1/dashboard/triggers/trg-1");
    return json({
      trigger: rawTrigger,
      runs: [{
        id: "run-1", state: "running", triggered_by: "setup", postings_seen: 0, postings_new: 0,
        error: null, created_at: "2026-09-01T13:00:00Z", started_at: "2026-09-01T13:00:05Z", finished_at: null,
      }],
      postings: [
        rawPosting("undated", null, "2026-09-01T00:00:00Z"),
        rawPosting("aug-30", "2026-08-30T00:00:00Z", "2026-08-31T00:00:00Z"),
        rawPosting("aug-31", "2026-08-31T00:00:00Z", "2026-08-31T00:00:00Z"),
      ],
    });
  }) as typeof fetch);

  const detail = await getTrigger("trg-1");
  assert.equal(detail.trigger.id, "trg-1");
  assert.equal(detail.runs[0].state, "running");
  assert.equal(detail.runs[0].triggeredBy, "setup");
  assert.equal(detail.runs[0].pagesFetched, null);
  assert.deepEqual(detail.postings.map((posting) => posting.id), ["aug-31", "aug-30", "undated"]);

  stubFetch(t, (async () => json({ trigger: rawTrigger, runs: [], postings: [] })) as typeof fetch);
  assert.deepEqual((await getTrigger("trg-1")).postings, []);
});

test("create sends the backend's exact body", async (t) => {
  assert.deepEqual(JSON.parse(createBody(input)), {
    source_url: "https://www.mycnajobs.com",
    watch: "A new caregiver or CNA job posting from a home care agency",
    filters: { keywords: ["caregiver", "CNA"], locations: ["All US"], exclude_employer_terms: ["hospital"] },
    schedule: { cadence: "daily", fire_hour: 2 },
    actions: { add_company: true, find_contact: true, build_demo: true, enroll: true },
    campaign_id: "cmp-1",
  });

  const hourly = JSON.parse(createBody({
    ...input, name: "  Agencies, Southeast ", cadence: "every_n_hours", fireHour: 0, intervalHours: 4,
    actions: { addCompany: true, findContact: false, buildDemo: false, enroll: false }, campaignId: null,
  }));
  assert.equal(hourly.name, "Agencies, Southeast");
  assert.deepEqual(hourly.schedule, { cadence: "every_n_hours", fire_hour: 0, interval_hours: 4 });
  assert.deepEqual(hourly.actions, { add_company: true, find_contact: false, build_demo: false, enroll: false });
  assert.equal(hourly.campaign_id, null);
  assert.deepEqual(Object.keys(hourly).sort(), ["actions", "campaign_id", "filters", "name", "schedule", "source_url", "watch"]);

  /* No site: the whole web. source_url travels as null, never as "". */
  const web = JSON.parse(createBody({ ...input, sourceUrl: null, name: "Home care agencies" }));
  assert.equal(web.source_url, null);
  assert.equal(web.name, "Home care agencies");
  assert.equal(JSON.parse(createBody({ ...input, sourceUrl: "   " })).source_url, null);

  stubFetch(t, (async (url, init) => {
    assert.equal(url, "/api/v1/dashboard/triggers");
    assert.equal(init?.method, "POST");
    assert.equal((init?.headers as Record<string, string>)["Content-Type"], "application/json");
    return json(rawTrigger, 201);
  }) as typeof fetch);
  const created = await createTrigger(input);
  assert.equal(created.status, "active");
});

test("edit puts the partial body without the site and reads the row back", async (t) => {
  const { sourceUrl: _site, ...edit } = input;
  void _site;
  assert.deepEqual(JSON.parse(updateBody({ ...edit, name: "Southeast agencies", locations: ["Atlanta", "Tampa"] })), {
    name: "Southeast agencies",
    watch: "A new caregiver or CNA job posting from a home care agency",
    filters: { keywords: ["caregiver", "CNA"], locations: ["Atlanta", "Tampa"], exclude_employer_terms: ["hospital"] },
    schedule: { cadence: "daily", fire_hour: 2 },
    actions: { add_company: true, find_contact: true, build_demo: true, enroll: true },
    campaign_id: "cmp-1",
  });
  assert.equal("source_url" in JSON.parse(updateBody(edit)), false);
  assert.equal("name" in JSON.parse(updateBody(edit)), false);

  stubFetch(t, (async (url, init) => {
    assert.equal(url, "/api/v1/dashboard/triggers/trg-1");
    assert.equal(init?.method, "PUT");
    assert.equal((init?.headers as Record<string, string>)["Content-Type"], "application/json");
    return json({ ...rawTrigger, name: "Southeast agencies" });
  }) as typeof fetch);
  const saved = await updateTrigger("trg-1", { ...edit, name: "Southeast agencies" });
  assert.equal(saved.name, "Southeast agencies");
});

test("check now posts and hands back the run id", async (t) => {
  stubFetch(t, (async (url, init) => {
    assert.equal(url, "/api/v1/dashboard/triggers/trg-1/run");
    assert.equal(init?.method, "POST");
    return json({ run_id: "run-9" }, 202);
  }) as typeof fetch);
  assert.deepEqual(await runTrigger("trg-1"), { runId: "run-9" });
});

test("errors surface the backend detail and code, with a status fallback", async (t) => {
  stubFetch(t, (async () =>
    json({ error: { code: "run_in_progress", detail: "A run is already in progress for this trigger." } }, 409)
  ) as typeof fetch);
  await assert.rejects(runTrigger("trg-1"), (error: unknown) => {
    assert.ok(error instanceof TriggerApiError);
    assert.equal(error.status, 409);
    assert.equal(error.code, "run_in_progress");
    assert.equal(error.message, "A run is already in progress for this trigger.");
    return true;
  });

  stubFetch(t, (async () => new Response("bad gateway", { status: 502 })) as typeof fetch);
  await assert.rejects(listTriggers(), (error: unknown) => {
    assert.ok(error instanceof TriggerApiError);
    assert.equal(error.status, 502);
    assert.equal(error.code, null);
    assert.equal(error.message, "Request failed (502)");
    return true;
  });
});
