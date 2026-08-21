/* node --test (npm test) — Node 24 strips TypeScript types natively. */
/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";
import { CampaignSaveQueue } from "./save-queue.ts";
import type { Campaign } from "./model.ts";

const fixture = (name: string, lockVersion = 0): Campaign => ({
  id: "campaign-1",
  seriesId: "series-1",
  version: 1,
  name,
  description: "",
  audience: "Audience",
  audienceId: "audience-1",
  lockVersion,
  status: "draft",
  createdAt: "2026-08-21T00:00:00Z",
  updatedAt: "2026-08-21T00:00:00Z",
  steps: [],
  contacts: [],
});

test("save queue serializes requests and forwards the new lock version", async () => {
  const calls: Campaign[] = [];
  let releaseFirst: ((campaign: Campaign) => void) | undefined;
  const queue = new CampaignSaveQueue(async (campaign) => {
    calls.push(campaign);
    if (calls.length === 1) {
      return await new Promise<Campaign>((resolve) => {
        releaseFirst = resolve;
      });
    }
    return { ...campaign, lockVersion: campaign.lockVersion + 1 };
  });

  const first = queue.enqueue(fixture("first"));
  const second = queue.enqueue(fixture("newest"));
  assert.equal(calls.length, 1);
  releaseFirst?.(fixture("first", 1));
  const saved = await second;

  assert.equal(await first, saved);
  assert.deepEqual(calls.map((campaign) => campaign.name), ["first", "newest"]);
  assert.equal(calls[1].lockVersion, 1);
  assert.equal(saved.lockVersion, 2);
});
