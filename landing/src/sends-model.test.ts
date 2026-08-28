import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SENT_QUERY,
  sendKindChips,
  sendKindLabel,
  sendKindRank,
  sentLedgerQuery,
} from "./sends-model.ts";

test("send kinds carry their human labels; unknown kinds pass through", () => {
  assert.equal(sendKindLabel("message"), "message");
  assert.equal(sendKindLabel("connection_request"), "connection");
  assert.equal(sendKindLabel("email"), "email");
  assert.equal(sendKindLabel("x_dm"), "X DM");
  assert.equal(sendKindLabel("x_follow"), "X follow");
  assert.equal(sendKindLabel("carrier_pigeon"), "carrier_pigeon");
});

test("chips order known kinds by rank, trail unknown kinds, drop empties", () => {
  assert.deepEqual(
    sendKindChips({
      email: 12,
      x_dm: 2,
      message: 40,
      connection_request: 7,
      x_follow: 0,
    }),
    [
      { kind: "connection_request", count: 7 },
      { kind: "message", count: 40 },
      { kind: "email", count: 12 },
      { kind: "x_dm", count: 2 },
    ],
  );
  // Unknown kinds share the trailing rank and fall back to name order.
  assert.ok(sendKindRank("carrier_pigeon") > sendKindRank("email"));
  assert.deepEqual(
    sendKindChips({ zz_later: 1, aa_sooner: 1, email: 1 }).map((c) => c.kind),
    ["email", "aa_sooner", "zz_later"],
  );
});

test("the default sent query stays byte-identical to the historical URL", () => {
  assert.equal(sentLedgerQuery(DEFAULT_SENT_QUERY, 100), "view=sent&limit=100");
});

test("kind and order join the query only when they narrow something", () => {
  assert.equal(
    sentLedgerQuery({ kind: "connection_request", order: "newest" }, 100),
    "view=sent&limit=100&kind=connection_request",
  );
  assert.equal(
    sentLedgerQuery({ kind: null, order: "oldest" }, 100),
    "view=sent&limit=100&order=oldest",
  );
  assert.equal(
    sentLedgerQuery({ kind: "email", order: "oldest" }, 50),
    "view=sent&limit=50&kind=email&order=oldest",
  );
});
