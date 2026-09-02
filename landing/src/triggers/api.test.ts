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
  type RawTriggerRow,
} from "./api.ts";

const rawTrigger: RawTriggerRow = {
  id: "trg-1",
  name: "myCNAjobs",
  source_kind: "mycnajobs",
  filters: { keywords: ["caregiver", "CNA"], locations: ["All US"], url: null },
  cadence: "daily",
  fire_hour: 6,
  campaign_id: "cmp-1",
  campaign_name: "Home care agency intro",
  status: "active",
  last_run_at: "2026-09-01T13:02:00Z",
  last_run_state: "done",
  counts: { postings: 34, new: 14, agencies_added: 11, leads: 9, demos: 9, enrolled: 9, held: 2 },
  created_at: "2026-08-19T16:00:00Z",
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

test("trigger rows map snake_case to the page shape, filters defaulting to empty lists", () => {
  const trigger = mapTrigger(rawTrigger);
  assert.equal(trigger.sourceKind, "mycnajobs");
  assert.equal(trigger.fireHour, 6);
  assert.equal(trigger.campaignName, "Home care agency intro");
  assert.equal(trigger.lastRunAt, "2026-09-01T13:02:00Z");
  assert.deepEqual(trigger.counts, {
    postings: 34, new: 14, agenciesAdded: 11, leads: 9, demos: 9, enrolled: 9, held: 2,
  });
  assert.deepEqual(mapTrigger({ ...rawTrigger, filters: null }).filters, {
    keywords: [], locations: [], url: null,
  });
});

test("runs and postings map every wire field", () => {
  const run = mapRun({
    id: "run-1", state: "done", triggered_by: "manual", postings_seen: 219, postings_new: 9,
    error: null, created_at: "2026-09-01T13:00:00Z", started_at: "2026-09-01T13:00:05Z",
    finished_at: "2026-09-01T13:02:00Z",
  });
  assert.equal(run.triggeredBy, "manual");
  assert.equal(run.postingsSeen, 219);
  assert.equal(run.finishedAt, "2026-09-01T13:02:00Z");

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
    return json({ triggers: [rawTrigger] });
  }) as typeof fetch);

  const rows = await listTriggers();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "myCNAjobs");
});

test("the detail call returns the trigger with its runs and postings", async (t) => {
  stubFetch(t, (async (input) => {
    assert.equal(input, "/api/v1/dashboard/triggers/trg-1");
    return json({
      trigger: rawTrigger,
      runs: [{
        id: "run-1", state: "running", triggered_by: "schedule", postings_seen: 0, postings_new: 0,
        error: null, created_at: "2026-09-01T13:00:00Z", started_at: "2026-09-01T13:00:05Z", finished_at: null,
      }],
      postings: [],
    });
  }) as typeof fetch);

  const detail = await getTrigger("trg-1");
  assert.equal(detail.trigger.id, "trg-1");
  assert.equal(detail.runs[0].state, "running");
  assert.deepEqual(detail.postings, []);
});

test("create sends the backend's exact body and the url only for a custom site", async (t) => {
  const base = {
    name: "myCNAjobs", keywords: ["caregiver", "CNA"], locations: ["Atlanta, GA"],
    cadence: "daily" as const, fireHour: 6, campaignId: null,
  };
  assert.deepEqual(JSON.parse(createBody({ ...base, sourceKind: "mycnajobs", url: "https://ignored.test" })), {
    name: "myCNAjobs",
    source_kind: "mycnajobs",
    filters: { keywords: ["caregiver", "CNA"], locations: ["Atlanta, GA"] },
    cadence: "daily",
    fire_hour: 6,
    campaign_id: null,
  });
  assert.deepEqual(
    JSON.parse(createBody({ ...base, sourceKind: "custom_url", url: "https://jobs.example.test/list", campaignId: "cmp-1" })).filters,
    { keywords: ["caregiver", "CNA"], locations: ["Atlanta, GA"], url: "https://jobs.example.test/list" },
  );

  stubFetch(t, (async (input, init) => {
    assert.equal(input, "/api/v1/dashboard/triggers");
    assert.equal(init?.method, "POST");
    assert.equal((init?.headers as Record<string, string>)["Content-Type"], "application/json");
    return json(rawTrigger, 201);
  }) as typeof fetch);
  const created = await createTrigger({ ...base, sourceKind: "mycnajobs", url: null });
  assert.equal(created.status, "active");
});

test("run now posts and hands back the run id", async (t) => {
  stubFetch(t, (async (input, init) => {
    assert.equal(input, "/api/v1/dashboard/triggers/trg-1/run");
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
