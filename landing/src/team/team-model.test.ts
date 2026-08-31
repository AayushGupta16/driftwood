import assert from "node:assert/strict";
import test from "node:test";

import { domainDirty, normalizeDomain } from "./team-model.ts";

test("domains normalize to trimmed lowercase, dropping a pasted leading @", () => {
  assert.equal(normalizeDomain("  Kalmia.DEV "), "kalmia.dev");
  assert.equal(normalizeDomain("@kalmia.dev"), "kalmia.dev");
  assert.equal(normalizeDomain("   "), null);
  assert.equal(normalizeDomain("@"), null);
});

test("an untouched domain field is never dirty", () => {
  assert.equal(domainDirty(null, null), false);
  assert.equal(domainDirty("kalmia.dev", null), false);
});

test("a draft matching the saved value stays clean, however it is typed", () => {
  assert.equal(domainDirty("kalmia.dev", "kalmia.dev"), false);
  assert.equal(domainDirty("kalmia.dev", " Kalmia.Dev "), false);
  assert.equal(domainDirty(null, ""), false);
  assert.equal(domainDirty(null, "   "), false);
});

test("a real change is dirty, including clearing a saved domain", () => {
  assert.equal(domainDirty(null, "kalmia.dev"), true);
  assert.equal(domainDirty("kalmia.dev", "example.com"), true);
  assert.equal(domainDirty("kalmia.dev", ""), true);
});
