import assert from "node:assert/strict";
import test from "node:test";
import { listDemos, sendFeedback, type Demo } from "./api.ts";

const demo: Demo = {
  lead_id: "lead-1", lead_name: "Person", company_name: "Company",
  description: null, artifact_id: "artifact-1", name: "demo",
  content_type: "video/mp4", content_url: "/d/randomslug",
  created_at: "2026-09-11T08:00:00Z", updated_at: "2026-09-11T08:01:00.123456Z",
};

test("feedback carries the exact viewed artifact version and signed-in session", async (t) => {
  let captured: { url: string; init?: RequestInit } | undefined;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    captured = { url, init };
    return Response.json({ delivered: true });
  });
  await sendFeedback(demo, "Shorter opening, please.", "needs_changes");
  assert.equal(captured?.url, "/api/v1/dashboard/demos/lead-1/feedback");
  assert.equal(captured?.init?.credentials, "include");
  assert.equal(captured?.init?.method, "POST");
  assert.deepEqual(JSON.parse(captured?.init?.body as string), {
    message: "Shorter opening, please.", sentiment: "needs_changes",
    artifact_id: "artifact-1", artifact_updated_at: demo.updated_at,
  });
});

test("feedback delivery failures and replaced-demo conflicts remain actionable", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: { detail: "This demo has changed. Refresh and review it before sending feedback." } }, { status: 409 }));
  await assert.rejects(() => sendFeedback(demo, "Looks good", "looks_good"), /Refresh and review/);
});

test("an undelivered response cannot display a success confirmation", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ delivered: false }));
  await assert.rejects(() => sendFeedback(demo, "Looks good", "looks_good"), /could not be delivered/);
});

test("library searches encode special characters and pass cancellation through", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    const params = new URL(url, "http://localhost").searchParams;
    assert.equal(params.get("q"), "Sales & Marketing");
    assert.equal(params.get("offset"), "12");
    assert.equal(init?.signal, controller.signal);
    return Response.json({ demos: [demo], total: 13, limit: 12, offset: 12 });
  });
  assert.equal((await listDemos("Sales & Marketing", 12, controller.signal)).total, 13);
});
