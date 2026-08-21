import assert from "node:assert/strict";
import test from "node:test";
import type { CampaignSummary } from "../campaigns/model";
import { buildOverviewSnapshot, campaignNeedsWork } from "./overview-model.ts";

const campaign = (
  patch: Partial<CampaignSummary> = {},
): CampaignSummary => ({
  id: "campaign-1",
  seriesId: "series-1",
  version: 1,
  name: "Founder-led QA teams",
  description: "A focused sequence.",
  audience: "Qualified QA leaders",
  status: "draft",
  stepCount: 2,
  contactCount: 3,
  createdAt: "2026-08-18T12:00:00Z",
  updatedAt: "2026-08-20T12:00:00Z",
  ...patch,
});

test("pending review is always the overview priority", () => {
  const result = buildOverviewSnapshot(3, {
    audienceCount: 2,
    assetCount: 4,
    campaigns: [campaign()],
  });

  assert.equal(result.primaryAction.href, "/dashboard/review");
  assert.equal(result.primaryAction.title, "3 decisions waiting");
});

test("empty workspaces move from audience to campaign setup", () => {
  const audienceFirst = buildOverviewSnapshot(0, {
    audienceCount: 0,
    assetCount: 0,
    campaigns: [],
  });
  assert.equal(audienceFirst.primaryAction.href, "/dashboard/audiences");

  const campaignNext = buildOverviewSnapshot(0, {
    audienceCount: 1,
    assetCount: 0,
    campaigns: [],
  });
  assert.equal(campaignNext.primaryAction.href, "/dashboard/campaigns/new");
});

test("incomplete drafts are counted from real readiness fields", () => {
  const incomplete = campaign({ id: "incomplete", contactCount: 0 });
  const complete = campaign({ id: "complete" });
  assert.equal(campaignNeedsWork(incomplete), true);
  assert.equal(campaignNeedsWork(complete), false);

  const result = buildOverviewSnapshot(0, {
    audienceCount: 2,
    assetCount: 1,
    campaigns: [complete, incomplete],
  });
  assert.equal(result.campaignsNeedingWork, 1);
  assert.equal(result.primaryAction.href, "/dashboard/campaigns");
});

test("recent campaigns are sorted without mutating the API result", () => {
  const older = campaign({ id: "older", updatedAt: "2026-08-19T12:00:00Z" });
  const newer = campaign({ id: "newer", updatedAt: "2026-08-21T12:00:00Z" });
  const campaigns = [older, newer];
  const result = buildOverviewSnapshot(0, {
    audienceCount: 1,
    assetCount: 2,
    campaigns,
  });

  assert.deepEqual(result.recentCampaigns.map((item) => item.id), ["newer", "older"]);
  assert.deepEqual(campaigns.map((item) => item.id), ["older", "newer"]);
});

test("partial inventory never claims the workspace is ready", () => {
  const result = buildOverviewSnapshot(0, {
    audienceCount: null,
    assetCount: 2,
    campaigns: null,
  });

  assert.equal(result.primaryAction.title, "Some readiness data is unavailable");
  assert.equal(result.primaryAction.href, "/dashboard/metrics");
});
