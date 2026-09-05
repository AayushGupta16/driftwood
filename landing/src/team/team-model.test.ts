import assert from "node:assert/strict";
import test from "node:test";

import {
  domainDirty,
  inviteOutcomeLine,
  normalizeDomain,
  pendingSeatLine,
  resendRefusalMessage,
  resendWaitMinutes,
} from "./team-model.ts";

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

/* ---------- invitation emails ---------- */

test("the invite outcome says whether the email went out", () => {
  assert.equal(
    inviteOutcomeLine({ email: "sam@example.com", emailSent: true }),
    "Invite sent to sam@example.com.",
  );
  assert.equal(
    inviteOutcomeLine({ email: "sam@example.com", emailSent: false, reason: "email sending is not configured" }),
    "Seat added. No email was sent: email sending is not configured.",
  );
});

test("a reason keeps its own full stop and a missing reason still reads as a sentence", () => {
  assert.equal(
    inviteOutcomeLine({ email: "sam@example.com", emailSent: false, reason: "The address bounced." }),
    "Seat added. No email was sent: The address bounced.",
  );
  assert.equal(
    inviteOutcomeLine({ email: "sam@example.com", emailSent: false, reason: "  " }),
    "Seat added. No email was sent.",
  );
  assert.equal(inviteOutcomeLine({ email: "sam@example.com", emailSent: false }), "Seat added. No email was sent.");
});

const NOW = Date.parse("2026-09-05T12:00:00Z");

test("a pending seat says when it was invited and whether an email went out", () => {
  assert.equal(
    pendingSeatLine({ inviteSentAt: "2026-09-04T12:00:00Z", invitedAt: "2026-09-04T12:00:00Z" }, NOW),
    "Invited Sep 4, email sent",
  );
  assert.equal(
    pendingSeatLine({ inviteSentAt: null, invitedAt: "2026-09-02T12:00:00Z" }, NOW),
    "Invited Sep 2, no email sent",
  );
});

test("a resend moves the date to the send; another year spells the year; no date still reads", () => {
  assert.equal(
    pendingSeatLine({ inviteSentAt: "2026-09-05T12:00:00Z", invitedAt: "2026-09-02T12:00:00Z" }, NOW),
    "Invited Sep 5, email sent",
  );
  assert.equal(
    pendingSeatLine({ inviteSentAt: "2025-12-20T12:00:00Z", invitedAt: null }, NOW),
    "Invited Dec 20, 2025, email sent",
  );
  assert.equal(pendingSeatLine({ inviteSentAt: null, invitedAt: null }, NOW), "Invited, no email sent");
});

test("a resend is refused for ten minutes after the last send, then allowed", () => {
  const minute = 60_000;
  assert.equal(resendWaitMinutes(null, NOW), null);
  assert.equal(resendWaitMinutes(new Date(NOW - 10 * minute).toISOString(), NOW), null);
  assert.equal(resendWaitMinutes(new Date(NOW - 60 * minute).toISOString(), NOW), null);
  assert.equal(resendWaitMinutes(new Date(NOW - 4 * minute).toISOString(), NOW), 6);
  assert.equal(resendWaitMinutes(new Date(NOW - 9.5 * minute).toISOString(), NOW), 1);
  assert.equal(resendWaitMinutes(new Date(NOW).toISOString(), NOW), 10);
  assert.equal(resendWaitMinutes("not a date", NOW), null);
});

test("the refusal says when the last invite went and when the next can go", () => {
  const minute = 60_000;
  assert.equal(
    resendRefusalMessage(new Date(NOW - 4 * minute).toISOString(), NOW),
    "An invite went to this address 4 minutes ago. You can send another in 6 minutes.",
  );
  assert.equal(
    resendRefusalMessage(new Date(NOW - 9 * minute).toISOString(), NOW),
    "An invite went to this address 9 minutes ago. You can send another in 1 minute.",
  );
  assert.equal(
    resendRefusalMessage(new Date(NOW - 20_000).toISOString(), NOW),
    "An invite went to this address less than a minute ago. You can send another in 10 minutes.",
  );
});
