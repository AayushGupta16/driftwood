import assert from "node:assert/strict";
import test from "node:test";

import { uploadLeadList } from "./api.ts";

test("lead-list upload uses the authenticated CSV import contract", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (input, init) => {
    assert.equal(input, "/api/v1/imports/leads");
    assert.equal(init?.method, "POST");
    assert.equal(init?.credentials, "include");
    assert.ok(init?.body instanceof FormData);
    const uploaded = init.body.get("file");
    assert.ok(uploaded instanceof File);
    assert.equal(uploaded.name, "leads.csv");
    return new Response(JSON.stringify({
      added: 2,
      skipped_duplicate: 1,
      skipped_suppressed: 0,
      errors: [],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const result = await uploadLeadList(new File([
    "name,company,email\nCamille Rivera,Atlas Relay,camille@example.test\n",
  ], "leads.csv", { type: "text/csv" }));

  assert.deepEqual(result, {
    added: 2,
    skipped_duplicate: 1,
    skipped_suppressed: 0,
    errors: [],
  });
});
