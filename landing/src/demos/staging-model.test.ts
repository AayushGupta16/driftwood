import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_UNKNOWN,
  channelLabel,
  decisionsFor,
  demoHeading,
  groupSentByDay,
  groupStagedDemos,
  isHeld,
  parseDateOnly,
  plannedTime,
  queueHeadline,
  queueSends,
  runsThrough,
  sendingAccount,
  threadHref,
  type LeadContext,
  type ReviewItem,
  type SendRow,
} from "./staging-model.ts";

const lead = (id: string, name: string, company: string): LeadContext => ({
  lead_id: id,
  name,
  title: "Head of Growth",
  company,
  linkedin_url: null,
  stage: "new",
  prior_sends: 0,
  last_sent_at: null,
});

const item = (over: Partial<ReviewItem>): ReviewItem => ({
  id: "i1",
  kind: "send_email",
  title: "Meridian",
  body: "Hey Dana",
  subject: "A working demo",
  lead: lead("l1", "Dana Whitfield", "Meridian"),
  attachment_slug: null,
  evidence: null,
  status: "pending",
  created_at: "2026-09-10T10:00:00Z",
  can_decide: true,
  approval_policy_version: 3,
  ...over,
});

const send = (over: Partial<SendRow>): SendRow => ({
  id: "s1",
  kind: "email",
  note: "Hey Dana",
  subject: "A working demo",
  attachment_slug: null,
  lead: lead("l1", "Dana Whitfield", "Meridian"),
  status: "pending",
  error: null,
  due_at: "2026-09-16T16:00:00Z",
  projected_date: "2026-09-16",
  created_at: "2026-09-14T10:00:00Z",
  sent_at: null,
  ...over,
});

test("one card per lead: the bug item brings the video, the email brings the copy", () => {
  const demos = groupStagedDemos([
    item({
      id: "bug-1",
      kind: "bug_validation",
      body: "Same-day booking drops the reservation.",
      subject: null,
      attachment_slug: "meridian-booking",
      evidence: { device: "Pixel 9", video_timestamp: "0:12" },
      created_at: "2026-09-10T09:00:00Z",
    }),
    item({ id: "email-1", created_at: "2026-09-10T10:00:00Z" }),
  ]);
  assert.equal(demos.length, 1);
  assert.deepEqual(demos[0].itemIds, ["bug-1", "email-1"]);
  assert.equal(demos[0].videoSlug, "meridian-booking");
  assert.equal(demos[0].subject, "A working demo");
  assert.equal(demos[0].claim, "Same-day booking drops the reservation.");
  assert.equal(demos[0].heading, "Dana Whitfield, Meridian");
  assert.equal(demos[0].createdAt, "2026-09-10T09:00:00Z");
  assert.equal(demos[0].pinId, "bug-1");
  assert.equal(demos[0].canDecide, true);
  assert.equal(demos[0].policyVersion, 3);
});

test("connection requests and messages never reach the page", () => {
  const demos = groupStagedDemos([
    item({ id: "c1", kind: "send_connection" }),
    item({ id: "m1", kind: "send_message" }),
  ]);
  assert.deepEqual(demos, []);
});

test("decided items are gone; items with no lead stand alone", () => {
  const demos = groupStagedDemos([
    item({ id: "done", status: "approved" }),
    item({ id: "a", kind: "bug_validation", lead: null, created_at: "2026-09-11T09:00:00Z" }),
    item({ id: "b", kind: "bug_validation", lead: null, created_at: "2026-09-12T09:00:00Z" }),
  ]);
  assert.deepEqual(
    demos.map((demo) => demo.itemIds),
    [["a"], ["b"]],
  );
});

test("cards run oldest first, because the oldest is the one about to expire", () => {
  const demos = groupStagedDemos([
    item({ id: "new", lead: lead("l2", "Sam Okafor", "Ledgerline"), created_at: "2026-09-12T09:00:00Z" }),
    item({ id: "old", created_at: "2026-09-09T09:00:00Z" }),
  ]);
  assert.deepEqual(
    demos.map((demo) => demo.itemIds[0]),
    ["old", "new"],
  );
});

test("a card that holds one undecidable item offers no decisions", () => {
  const demos = groupStagedDemos([
    item({ id: "bug-1", kind: "bug_validation", can_decide: false }),
    item({ id: "email-1" }),
  ]);
  assert.equal(demos[0].canDecide, false);
});

test("the video slug is salvaged from evidence text when the column is empty", () => {
  const demos = groupStagedDemos([
    item({
      kind: "bug_validation",
      attachment_slug: null,
      body: "Clip: https://driftwood.sh/d/meridian-booking-4f2a",
    }),
  ]);
  assert.equal(demos[0].videoSlug, "meridian-booking-4f2a");
});

test("a heading falls back to the company, then to the item title", () => {
  assert.equal(demoHeading({ ...lead("l1", "", "Meridian"), name: null }, "x"), "Meridian");
  assert.equal(demoHeading(null, "Meridian bug"), "Meridian bug");
});

test("one decide call carries every item of the demo, with the reason when there is one", () => {
  const demo = groupStagedDemos([
    item({ id: "bug-1", kind: "bug_validation" }),
    item({ id: "email-1" }),
  ])[0];
  assert.deepEqual(decisionsFor(demo, "approve"), [
    { item_id: "bug-1", decision: "approve" },
    { item_id: "email-1", decision: "approve" },
  ]);
  assert.deepEqual(decisionsFor(demo, "deny", "Shorter"), [
    { item_id: "bug-1", decision: "deny", reason: "Shorter" },
    { item_id: "email-1", decision: "deny", reason: "Shorter" },
  ]);
});

test("the queue holds email and message rows that are still going out", () => {
  const rows = queueSends([
    send({ id: "a" }),
    send({ id: "b", kind: "message" }),
    send({ id: "c", kind: "connection_request" }),
    send({ id: "d", status: "failed" }),
    send({ id: "e", status: "sending" }),
    send({ id: "f", status: "held" }),
  ]);
  assert.deepEqual(
    rows.map((row) => row.id),
    ["a", "b", "e", "f"],
  );
});

test("channels read as the customer's own accounts", () => {
  assert.equal(channelLabel("email"), "Email");
  assert.equal(channelLabel("message"), "LinkedIn");
  assert.equal(channelLabel("x_dm"), "X");
});

test("a date-only string parses at local midnight, not UTC", () => {
  const date = parseDateOnly("2026-09-16");
  assert.equal(date?.getFullYear(), 2026);
  assert.equal(date?.getMonth(), 8);
  assert.equal(date?.getDate(), 16);
  assert.equal(parseDateOnly("nonsense"), null);
});

test("planned time takes the projected day, and the time only when the due stamp agrees", () => {
  const day = new Date(2026, 8, 16, 9, 0, 0);
  const onDay = plannedTime(
    send({ due_at: day.toISOString(), projected_date: "2026-09-16" }),
    false,
  );
  assert.match(onDay, /Sep 16/);
  assert.match(onDay, /9:00/);
  const deferred = plannedTime(
    send({ due_at: day.toISOString(), projected_date: "2026-09-18" }),
    false,
  );
  assert.match(deferred, /Sep 18/);
  assert.doesNotMatch(deferred, /9:00/);
  assert.equal(plannedTime(send({}), true), "Held");
});

test("the newer projected_send_date field wins over projected_date", () => {
  const planned = plannedTime(
    send({ projected_date: "2026-09-16", projected_send_date: "2026-09-21" }),
    false,
  );
  assert.match(planned, /Sep 21/);
});

test("held reads from the row, from a held status, or from a local hold", () => {
  assert.equal(isHeld(send({}), new Set()), false);
  assert.equal(isHeld(send({ held: true }), new Set()), true);
  assert.equal(isHeld(send({ status: "held" }), new Set()), true);
  assert.equal(isHeld(send({ id: "s9" }), new Set(["s9"])), true);
});

test("one connected account is named; a pool stays honest", () => {
  const one = { email: ["dana@meridian.com"], linkedin: [] as string[] };
  assert.equal(sendingAccount(send({}), one), "dana@meridian.com");
  assert.equal(
    sendingAccount(send({}), { email: ["a@x.com", "b@x.com"], linkedin: [] }),
    ACCOUNT_UNKNOWN,
  );
  assert.equal(
    sendingAccount(send({ sending_account: "sam@meridian.com" }), one),
    "sam@meridian.com",
  );
});

test("runs-through takes the last day across the kinds this page shows", () => {
  assert.equal(
    runsThrough([
      { kind: "email", queued: 2, sent_24h: 1, cap: 20, runs_through: "2026-09-16" },
      { kind: "message", queued: 4, sent_24h: 2, cap: 25, runs_through: "2026-09-17" },
      { kind: "connection_request", queued: 9, sent_24h: 3, cap: 20, runs_through: "2026-09-30" },
    ]),
    "2026-09-17",
  );
  assert.equal(runsThrough([]), null);
});

test("the queue headline drops the half it does not know", () => {
  assert.match(
    queueHeadline("2026-09-17", "Sends Monday to Friday, 9:00 AM to 6:00 PM PDT"),
    /^Queue runs through .+\. Sends Monday to Friday, 9:00 AM to 6:00 PM PDT\.$/,
  );
  assert.equal(
    queueHeadline(null, "Sends every day, 9:00 AM to 5:00 PM PDT"),
    "Sends every day, 9:00 AM to 5:00 PM PDT.",
  );
  assert.equal(queueHeadline(null, null), "");
});

test("sent rows group by the day they went out, newest first", () => {
  const days = groupSentByDay([
    send({ id: "a", status: "sent", sent_at: new Date(2026, 8, 9, 11, 0).toISOString() }),
    send({ id: "b", status: "sent", sent_at: new Date(2026, 8, 11, 9, 0).toISOString() }),
    send({ id: "c", status: "sent", sent_at: new Date(2026, 8, 11, 17, 0).toISOString() }),
    send({ id: "d", status: "sent", sent_at: null }),
    send({ id: "e", kind: "connection_request", status: "sent", sent_at: new Date(2026, 8, 12, 9, 0).toISOString() }),
  ]);
  assert.deepEqual(
    days.map((day) => [day.day, day.rows.map((row) => row.id)]),
    [
      ["2026-09-11", ["c", "b"]],
      ["2026-09-09", ["a"]],
    ],
  );
  assert.match(days[0].label, /Sep 11/);
});

test("the thread link carries the lead, and is absent without one", () => {
  assert.equal(threadHref(send({})), "/dashboard/inbox?lead=l1");
  assert.equal(threadHref(send({ lead: null })), null);
});
