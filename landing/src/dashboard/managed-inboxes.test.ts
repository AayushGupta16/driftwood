import assert from "node:assert/strict";
import test from "node:test";

import { domainVariations, hasMoreDomains } from "./managed-inboxes.ts";

test("domainVariations: the proven five lead, all .com, seed cleaned", () => {
  const names = domainVariations("Acme Corp");
  assert.deepEqual(names.slice(0, 5), [
    "acmecorp-ai.com",
    "acmecorphq.com",
    "useacmecorp.com",
    "joinacmecorp.com",
    "withacmecorp.com",
  ]);
  assert.equal(names.length, 17);
  assert.ok(names.every((name) => name.endsWith(".com")));
  assert.equal(new Set(names).size, names.length);
});

test("domainVariations: an empty or symbol-only seed yields nothing", () => {
  assert.deepEqual(domainVariations(""), []);
  assert.deepEqual(domainVariations("  !!"), []);
});

test("hasMoreDomains: picking every visible name never hides the path to more", () => {
  // the founder-hit state: all visible picked, unchecked candidates remain
  assert.equal(
    hasMoreDomains({
      unselectedVerified: 0,
      visibleTarget: 8,
      exhausted: false,
      checkingEmpty: false,
    }),
    true,
  );
});

test("hasMoreDomains: verified extras beyond the slice still offer more", () => {
  assert.equal(
    hasMoreDomains({
      unselectedVerified: 10,
      visibleTarget: 8,
      exhausted: true,
      checkingEmpty: false,
    }),
    true,
  );
});

test("hasMoreDomains: everything verified and showing means no control", () => {
  assert.equal(
    hasMoreDomains({
      unselectedVerified: 5,
      visibleTarget: 8,
      exhausted: true,
      checkingEmpty: false,
    }),
    false,
  );
});

test("hasMoreDomains: the checking hint owns the empty-and-sweeping state", () => {
  assert.equal(
    hasMoreDomains({
      unselectedVerified: 0,
      visibleTarget: 8,
      exhausted: false,
      checkingEmpty: true,
    }),
    false,
  );
});
