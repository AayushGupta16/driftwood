import assert from "node:assert/strict";
import test from "node:test";

import { disconnectedChannelIssues, requiredCampaignChannels } from "./channel-readiness.ts";
import type { Campaign } from "./model.ts";

const campaign = {
  id: "campaign-1",
  seriesId: "series-1",
  version: 1,
  name: "QA leaders",
  description: "",
  audience: "QA leaders",
  audienceId: "audience-1",
  lockVersion: 1,
  status: "draft",
  createdAt: "2026-08-21T00:00:00Z",
  updatedAt: "2026-08-21T00:00:00Z",
  contacts: [],
  steps: [
    { id: "email", kind: "email", label: "Email", subject: "Hello", body: "Hi", delayDays: 0, sendWindow: "business-hours", stopOnReply: true },
    { id: "wait", kind: "wait", label: "Wait", subject: "", body: "", delayDays: 2, sendWindow: "business-hours", stopOnReply: false },
    { id: "linkedin", kind: "linkedin-message", label: "LinkedIn", subject: "", body: "Hi", delayDays: 0, sendWindow: "business-hours", stopOnReply: true },
  ],
} satisfies Campaign;

test("channel readiness derives required connected providers from sequence steps", () => {
  assert.deepEqual(requiredCampaignChannels(campaign), ["email", "linkedin"]);
  assert.deepEqual(
    disconnectedChannelIssues(campaign, { email: false, linkedin: true, x: false }),
    ["Connect an email mailbox before activating this sequence."],
  );
  assert.deepEqual(
    disconnectedChannelIssues(campaign, { email: true, linkedin: true, x: false }),
    [],
  );
});
