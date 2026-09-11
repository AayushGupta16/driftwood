import assert from "node:assert/strict";
import test from "node:test";
import { feedbackLimit, feedbackMessage, formatTimestamp } from "./feedback.ts";

test("video notes carry the paused moment, including zero and hour-long demos", () => {
  assert.equal(feedbackMessage("  Shorten the intro.  ", 12), "At 0:12 in the video:\nShorten the intro.");
  assert.equal(feedbackMessage("Change the opening.", 0), "At 0:00 in the video:\nChange the opening.");
  assert.equal(formatTimestamp(3661.9), "1:01:01");
  assert.equal(formatTimestamp(59.9), "0:59");
  assert.equal(formatTimestamp(60), "1:00");
  assert.equal(feedbackMessage("  A general suggestion.  ", null), "A general suggestion.");
});

test("timestamp context fits inside the API's message limit without truncating the note", () => {
  for (const timestamp of [null, 0, 12, 3661]) {
    const message = "a".repeat(feedbackLimit(timestamp));
    assert.equal(feedbackMessage(message, timestamp).length, 2000);
    assert.ok(feedbackMessage(message, timestamp).endsWith(message));
  }
});
