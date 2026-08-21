import assert from "node:assert/strict";
import test from "node:test";

import { initializeMockMode, mockBlockedResponse, withMockMode } from "./mock-mode.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
}

test("explicit mock mode remains active across queryless dashboard navigation", () => {
  const storage = memoryStorage();
  assert.equal(initializeMockMode("?mock=member", "/dashboard", storage), "member");
  assert.equal(initializeMockMode("", "/dashboard/campaigns/new", storage), "member");
});

test("mock mode does not leak to marketing pages and can be explicitly disabled", () => {
  const storage = memoryStorage({ "driftwood.dashboard.mock-mode": "1" });
  assert.equal(initializeMockMode("", "/", storage), null);
  assert.equal(initializeMockMode("?mock=off", "/dashboard", storage), null);
  assert.equal(initializeMockMode("", "/dashboard", storage), null);
});

test("unregistered mock APIs fail closed", async () => {
  const response = mockBlockedResponse("/api/v1/unknown");
  assert.equal(response.status, 501);
  const data = (await response.json()) as { detail: string };
  assert.match(data.detail, /Live API access is blocked/);
});

test("dashboard links carry the active mock mode across history and navigation", () => {
  const origin = "http://127.0.0.1:4174";
  assert.equal(
    withMockMode("/dashboard/campaigns/new", "member", origin),
    "/dashboard/campaigns/new?mock=member",
  );
  assert.equal(
    withMockMode("/dashboard/audiences?view=all#saved", "1", origin),
    "/dashboard/audiences?view=all&mock=1#saved",
  );
  assert.equal(withMockMode("/", "1", origin), "/");
  assert.equal(withMockMode("https://example.com/dashboard", "1", origin), "https://example.com/dashboard");
});
