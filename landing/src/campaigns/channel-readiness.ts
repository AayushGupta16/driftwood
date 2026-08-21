import type { Campaign, StepKind } from "./model";

export type CampaignChannel = "email" | "linkedin" | "x";
export type ChannelConnections = Record<CampaignChannel, boolean>;

function channelForStep(kind: StepKind): CampaignChannel | null {
  if (kind === "email") return "email";
  if (kind === "linkedin-connect" || kind === "linkedin-message") return "linkedin";
  return null;
}
export function requiredCampaignChannels(campaign: Campaign): CampaignChannel[] {
  return [...new Set(campaign.steps.flatMap((step) => {
    const channel = channelForStep(step.kind);
    return channel ? [channel] : [];
  }))];
}

export function disconnectedChannelIssues(
  campaign: Campaign,
  connections: ChannelConnections,
): string[] {
  return requiredCampaignChannels(campaign)
    .filter((channel) => !connections[channel])
    .map((channel) => {
      if (channel === "linkedin") return "Connect LinkedIn before activating this sequence.";
      if (channel === "email") return "Connect an email mailbox before activating this sequence.";
      return "Connect X before activating this sequence.";
    });
}
