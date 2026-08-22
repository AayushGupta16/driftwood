import type { CampaignSummary } from "../campaigns/model";

export type OverviewInventory = {
  audienceCount: number | null;
  assetCount: number | null;
  campaigns: CampaignSummary[] | null;
};

export type OverviewPrimaryAction = {
  href: string;
  label: string;
  title: string;
  detail: string;
};

export type OverviewSnapshot = {
  audienceCount: number | null;
  assetCount: number | null;
  campaignCount: number | null;
  activeCampaignCount: number | null;
  draftCampaignCount: number | null;
  campaignsNeedingWork: number | null;
  recentCampaigns: CampaignSummary[];
  primaryAction: OverviewPrimaryAction;
};

const choiceMissing = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "choose an audience";
};

export function campaignNeedsWork(campaign: CampaignSummary): boolean {
  return (
    campaign.status === "draft" &&
    (choiceMissing(campaign.audience) ||
      campaign.stepCount === 0 ||
      campaign.contactCount === 0)
  );
}

export function buildOverviewSnapshot(
  pendingReviews: number | null,
  inventory: OverviewInventory,
): OverviewSnapshot {
  const campaigns = inventory.campaigns;
  const recentCampaigns = [...(campaigns ?? [])]
    .sort((left, right) => {
      const leftAt = Date.parse(left.updatedAt);
      const rightAt = Date.parse(right.updatedAt);
      return (Number.isNaN(rightAt) ? 0 : rightAt) -
        (Number.isNaN(leftAt) ? 0 : leftAt);
    })
    .slice(0, 3);
  const activeCampaignCount = campaigns
    ? campaigns.filter((campaign) => campaign.status === "active").length
    : null;
  const draftCampaignCount = campaigns
    ? campaigns.filter((campaign) => campaign.status === "draft").length
    : null;
  const campaignsNeedingWork = campaigns
    ? campaigns.filter(campaignNeedsWork).length
    : null;

  let primaryAction: OverviewPrimaryAction;
  if (pendingReviews !== null && pendingReviews > 0) {
    primaryAction = {
      href: "/dashboard/review",
      label: "Open review queue",
      title: `${pendingReviews} ${pendingReviews === 1 ? "decision" : "decisions"} waiting`,
      detail: "Review the queued outreach before anything can move forward.",
    };
  } else if (inventory.audienceCount === null || campaigns === null) {
    primaryAction = {
      href: "/dashboard/metrics",
      label: "View available metrics",
      title: "Some readiness data is unavailable",
      detail: "Pipeline activity is still available while the workspace inventory reconnects.",
    };
  } else if (inventory.audienceCount === 0) {
    primaryAction = {
      href: "/dashboard/audiences",
      label: "Build an audience",
      title: "Start with the right people",
      detail: "Discover leads and save a reusable audience for your first sequence.",
    };
  } else if (campaigns && campaigns.length === 0) {
    primaryAction = {
      href: "/dashboard/campaigns/new",
      label: "Create a campaign",
      title: "Turn an audience into a sequence",
      detail: "Add reviewed email, LinkedIn, demo, and wait steps.",
    };
  } else if (campaignsNeedingWork !== null && campaignsNeedingWork > 0) {
    primaryAction = {
      href: "/dashboard/campaigns",
      label: "Finish campaign setup",
      title: `${campaignsNeedingWork} ${campaignsNeedingWork === 1 ? "draft needs" : "drafts need"} work`,
      detail: "Complete the audience or sequence before review.",
    };
  } else {
    primaryAction = {
      href: "/dashboard/metrics",
      label: "View channel metrics",
      title: "Workspace is ready",
      detail: "Check who replied, who booked, and where the pipeline is moving.",
    };
  }

  return {
    audienceCount: inventory.audienceCount,
    assetCount: inventory.assetCount,
    campaignCount: campaigns?.length ?? null,
    activeCampaignCount,
    draftCampaignCount,
    campaignsNeedingWork,
    recentCampaigns,
    primaryAction,
  };
}
