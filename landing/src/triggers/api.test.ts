import assert from "node:assert/strict";
import test from "node:test";

import {
  createBody,
  createTrigger,
  errorDetail,
  getTrigger,
  listTriggers,
  mapFields,
  mapItem,
  mapRun,
  mapTrigger,
  runTrigger,
  TriggerApiError,
  updateBody,
  updateTrigger,
  type RawTriggerRow,
} from "./api.ts";

const rawTrigger: RawTriggerRow = {
  id: "trg-1",
  name: "myCNAjobs",
  watch: "New caregiver and CNA jobs from home care agencies, not hospitals",
  summary: "Checks mycnajobs.com every night for caregiver and CNA jobs in five metros, skipping hospitals.",
  cadence: "daily",
  fire_hour: 2,
  schedule: { cadence: "daily", fire_hour: 2, interval_hours: null },
  pull: { method: "site", reason: null },
  campaign_id: "cmp-1",
  campaign_name: "MochaCare intro",
  status: "active",
  last_run_at: "2026-09-01T13:02:00Z",
  last_run_state: "done",
  counts: { items: 34, new: 14, companies_added: 11, leads: 9, demos: 9, enrolled: 9 },
  created_at: "2026-08-19T16:00:00Z",
  updated_at: "2026-08-30T16:00:00Z",
};

/* A row from before the rename: the old count names, the old counter
   names on its checks, and no summary. */
const legacyTrigger: RawTriggerRow = {
  id: "trg-old",
  name: "Live-in caregivers",
  cadence: "weekly",
  fire_hour: 6,
  campaign_id: null,
  campaign_name: null,
  status: "paused",
  last_run_at: null,
  last_run_state: null,
  counts: { postings: 7, new: 2, agencies_added: 6 },
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

test("trigger rows map snake_case to the page shape", () => {
  const trigger = mapTrigger(rawTrigger);
  assert.equal(trigger.name, "myCNAjobs");
  assert.equal(trigger.watch, "New caregiver and CNA jobs from home care agencies, not hospitals");
  assert.equal(trigger.summary, "Checks mycnajobs.com every night for caregiver and CNA jobs in five metros, skipping hospitals.");
  assert.deepEqual(trigger.schedule, { cadence: "daily", fireHour: 2, intervalHours: null });
  assert.deepEqual(trigger.pull, { method: "site", reason: null });
  assert.equal(trigger.status, "active");
  assert.equal(trigger.campaignName, "MochaCare intro");
  assert.equal(trigger.updatedAt, "2026-08-30T16:00:00Z");
  assert.deepEqual(trigger.counts, { items: 34, new: 14, companiesAdded: 11, leads: 9, demos: 9, enrolled: 9 });
});

test("rows from before the rename read through the old names", () => {
  const trigger = mapTrigger(legacyTrigger);
  assert.equal(trigger.summary, null);
  assert.equal(trigger.updatedAt, null);
  assert.equal(trigger.pull, null);
  assert.equal(trigger.status, "paused");
  assert.deepEqual(trigger.schedule, { cadence: "weekly", fireHour: 6, intervalHours: null });
  // postings -> items, agencies_added -> companiesAdded.
  assert.equal(trigger.counts.items, 7);
  assert.equal(trigger.counts.companiesAdded, 6);

  const bare = mapTrigger({ ...legacyTrigger, counts: null });
  assert.equal(bare.counts.items, 0);
  assert.equal(bare.counts.companiesAdded, 0);

  assert.equal(mapTrigger({ ...legacyTrigger, status: "something_new" }).status, "active");
  assert.equal(mapTrigger({ ...legacyTrigger, cadence: "hourly" }).schedule.cadence, "daily");
  assert.deepEqual(
    mapTrigger({ ...legacyTrigger, schedule: { cadence: "every_n_hours", fire_hour: 0, interval_hours: 4 } }).schedule,
    { cadence: "every_n_hours", fireHour: 0, intervalHours: 4 },
  );
});

test("the reason a source cannot be read arrives on either field, never as an identifier", () => {
  assert.equal(mapTrigger({ ...rawTrigger, pull: { method: "unsupported", reason: "It needs a sign-in." } }).pull?.reason, "It needs a sign-in.");
  assert.equal(mapTrigger({ ...rawTrigger, pull: { method: "unsupported", note: "It needs a sign-in." } }).pull?.reason, "It needs a sign-in.");
  assert.equal(mapTrigger({ ...rawTrigger, pull: { method: "unsupported", reason: "  ", note: "It needs a sign-in." } }).pull?.reason, "It needs a sign-in.");
  // The provider id the backend used to put on note is not a sentence.
  assert.equal(mapTrigger({ ...rawTrigger, pull: { method: "api", note: "dataforseo_google_jobs" } }).pull?.reason, null);
});

test("checks map both spellings of their counters", () => {
  const run = mapRun({
    id: "run-1", state: "done", triggered_by: "manual", items_seen: 219, items_new: 9,
    ids_seen: 219, ids_new: 9, error: null, created_at: "2026-09-01T13:00:00Z",
    started_at: "2026-09-01T13:00:05Z", finished_at: "2026-09-01T13:02:00Z",
  });
  assert.equal(run.triggeredBy, "manual");
  assert.equal(run.itemsSeen, 219);
  assert.equal(run.idsSeen, 219);
  assert.equal(run.finishedAt, "2026-09-01T13:02:00Z");

  const rawOld = {
    id: "run-0", state: "done", triggered_by: "schedule", postings_seen: 88, postings_new: 6,
    error: null, created_at: "2026-08-20T13:00:00Z", started_at: null, finished_at: null,
  };
  const old = mapRun(rawOld);
  assert.equal(old.itemsSeen, 88);
  assert.equal(old.itemsNew, 6);
  assert.equal(old.idsSeen, null);
  assert.equal(old.idsNew, null);

  // The check the backend starts by itself after create is "setup"; any
  // other value it might send reads as scheduled.
  assert.equal(mapRun({ ...rawOld, triggered_by: "setup" }).triggeredBy, "setup");
  assert.equal(mapRun({ ...rawOld, triggered_by: "cron" }).triggeredBy, "schedule");
});

test("items map the entity under either name, and carry whatever fields they brought", () => {
  const item = mapItem({
    id: "p-1", source_url: "https://example.test/items/1", entity_name: "Verdant Grid",
    title: "Raises $18M", fields: [{ label: "Round", value: "Series A" }],
    found_at: "2026-08-31T00:00:00Z", status: "enrolled", note: null,
    company_id: "c-1", lead_id: "l-1", demo_url: "https://driftwood.sh/d/abc", created_at: "2026-08-31T13:02:00Z",
  });
  assert.equal(item.entityName, "Verdant Grid");
  assert.equal(item.foundAt, "2026-08-31T00:00:00Z");
  assert.deepEqual(item.fields, [{ label: "Round", value: "Series A" }]);
  assert.equal(item.status, "enrolled");

  const legacy = mapItem({
    id: "p-2", source_url: "https://example.test/items/2", employer_name: "Brightpath Home Care",
    title: null, posted_at: "2026-08-30T00:00:00Z", status: "new", note: null,
    company_id: null, lead_id: null, demo_url: null, created_at: "2026-08-31T13:02:00Z",
  });
  assert.equal(legacy.entityName, "Brightpath Home Care");
  assert.equal(legacy.title, "");
  assert.equal(legacy.foundAt, "2026-08-30T00:00:00Z");
  assert.deepEqual(legacy.fields, []);
});

test("extracted fields read as key and value however the backend shaped them", () => {
  assert.deepEqual(mapFields([{ label: "Round", value: "Series A" }]), [{ label: "Round", value: "Series A" }]);
  assert.deepEqual(mapFields([{ name: "Round", value: "Series A" }]), [{ label: "Round", value: "Series A" }]);
  assert.deepEqual(mapFields([{ key: "Round", text: "Series A" }]), [{ label: "Round", value: "Series A" }]);
  assert.deepEqual(mapFields([{ label: "Round" }, { value: "Series A" }, null, "nope"]), []);
  assert.deepEqual(mapFields({ due_on: "Oct 4", bid_number: 4021 }), [
    { label: "Due on", value: "Oct 4" },
    { label: "Bid number", value: "4021" },
  ]);
  assert.deepEqual(mapFields(null), []);
  assert.deepEqual(mapFields("Series A"), []);
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
  assert.equal(rows[0].name, "myCNAjobs");
  assert.equal(rows[1].counts.items, 7);
});

test("the detail call returns the trigger with its checks and items, newest item first", async (t) => {
  const rawItem = (id: string, found_at: string | null, created_at: string) => ({
    id, source_url: `https://example.test/items/${id}`, entity_name: "Brightpath Home Care",
    title: "Caregiver", found_at, status: "new", note: null,
    company_id: null, lead_id: null, demo_url: null, created_at,
  });
  stubFetch(t, (async (input) => {
    assert.equal(input, "/api/v1/dashboard/triggers/trg-1");
    return json({
      trigger: rawTrigger,
      runs: [{
        id: "run-1", state: "running", triggered_by: "setup", items_seen: 0, items_new: 0,
        error: null, created_at: "2026-09-01T13:00:00Z", started_at: "2026-09-01T13:00:05Z", finished_at: null,
      }],
      items: [
        rawItem("undated", null, "2026-09-01T00:00:00Z"),
        rawItem("aug-30", "2026-08-30T00:00:00Z", "2026-08-31T00:00:00Z"),
        rawItem("aug-31", "2026-08-31T00:00:00Z", "2026-08-31T00:00:00Z"),
      ],
    });
  }) as typeof fetch);

  const detail = await getTrigger("trg-1");
  assert.equal(detail.trigger.id, "trg-1");
  assert.equal(detail.runs[0].state, "running");
  assert.deepEqual(detail.items.map((item) => item.id), ["aug-31", "aug-30", "undated"]);

  /* A backend still calling them postings answers the same page. */
  stubFetch(t, (async () => json({
    trigger: rawTrigger,
    runs: [],
    postings: [rawItem("only", "2026-08-31T00:00:00Z", "2026-08-31T00:00:00Z")],
  })) as typeof fetch);
  assert.deepEqual((await getTrigger("trg-1")).items.map((item) => item.id), ["only"]);
});

test("create sends one sentence and nothing else", async (t) => {
  assert.deepEqual(JSON.parse(createBody({ watch: "Companies that just raised a Series A", campaignId: null })), {
    watch: "Companies that just raised a Series A",
  });
  assert.deepEqual(JSON.parse(createBody({ watch: "New warehouse jobs in Texas", campaignId: "cmp-1" })), {
    watch: "New warehouse jobs in Texas",
    campaign_id: "cmp-1",
  });

  stubFetch(t, (async (url, init) => {
    assert.equal(url, "/api/v1/dashboard/triggers");
    assert.equal(init?.method, "POST");
    assert.equal((init?.headers as Record<string, string>)["Content-Type"], "application/json");
    return json(rawTrigger, 201);
  }) as typeof fetch);
  const created = await createTrigger({ watch: "New warehouse jobs in Texas", campaignId: null });
  assert.equal(created.status, "active");
});

test("edit puts only what changed, so an unchanged sentence never rebuilds the trigger", async (t) => {
  assert.deepEqual(JSON.parse(updateBody({ watch: "Companies that raised a Series B" })), {
    watch: "Companies that raised a Series B",
  });
  assert.deepEqual(JSON.parse(updateBody({ campaignId: "cmp-2" })), { campaign_id: "cmp-2" });
  // Clearing the campaign is a change, and travels as null.
  assert.deepEqual(JSON.parse(updateBody({ campaignId: null })), { campaign_id: null });
  assert.deepEqual(JSON.parse(updateBody({})), {});

  stubFetch(t, (async (url, init) => {
    assert.equal(url, "/api/v1/dashboard/triggers/trg-1");
    assert.equal(init?.method, "PUT");
    assert.equal(init?.body, JSON.stringify({ watch: "Companies that raised a Series B" }));
    return json({ ...rawTrigger, watch: "Companies that raised a Series B", summary: null, status: "needs_setup" });
  }) as typeof fetch);
  const saved = await updateTrigger("trg-1", { watch: "Companies that raised a Series B" });
  // A new sentence sends the trigger back to Building with no readback.
  assert.equal(saved.status, "needs_setup");
  assert.equal(saved.summary, null);
});

test("check now posts and hands back the check id", async (t) => {
  stubFetch(t, (async (url, init) => {
    assert.equal(url, "/api/v1/dashboard/triggers/trg-1/run");
    assert.equal(init?.method, "POST");
    return json({ run_id: "run-9" }, 202);
  }) as typeof fetch);
  assert.deepEqual(await runTrigger("trg-1"), { runId: "run-9" });
});

test("an error body only reaches the page when it is a sentence", () => {
  assert.equal(errorDetail({ error: { code: "not_found", detail: "Trigger not found" } }), "Trigger not found");
  assert.equal(errorDetail({ detail: "Say what to watch." }), "Say what to watch.");
  // A 422 answers with a list of objects; printing one is the
  // "[object Object]" a customer used to see where an explanation belonged.
  assert.equal(errorDetail({ detail: [{ loc: ["body", "watch"], msg: "field required" }] }), null);
  assert.equal(errorDetail({ error: { code: "invalid", detail: { msg: "nope" } } }), null);
  assert.equal(errorDetail({ detail: "   " }), null);
  assert.equal(errorDetail(null), null);
  assert.equal(errorDetail("plain text"), "plain text");
});

test("errors surface the backend detail and code, with a status fallback", async (t) => {
  stubFetch(t, (async () =>
    json({ error: { code: "run_in_progress", detail: "A check is already running for this trigger." } }, 409)
  ) as typeof fetch);
  await assert.rejects(runTrigger("trg-1"), (error: unknown) => {
    assert.ok(error instanceof TriggerApiError);
    assert.equal(error.status, 409);
    assert.equal(error.code, "run_in_progress");
    assert.equal(error.message, "A check is already running for this trigger.");
    return true;
  });

  // The 422 that used to render as [object Object] now reads as a status.
  stubFetch(t, (async () => json({ detail: [{ msg: "field required" }] }, 422)) as typeof fetch);
  await assert.rejects(listTriggers(), (error: unknown) => {
    assert.ok(error instanceof TriggerApiError);
    assert.equal(error.message, "Request failed (422)");
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
