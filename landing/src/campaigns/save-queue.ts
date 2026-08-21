import type { Campaign } from "./model";

type SaveCampaign = (campaign: Campaign) => Promise<Campaign>;

/** Coalesce campaign snapshots while guaranteeing one in-flight PUT at a time. */
export class CampaignSaveQueue {
  private active: Promise<Campaign> | null = null;
  private queued: Campaign | null = null;
  private readonly save: SaveCampaign;

  constructor(save: SaveCampaign) {
    this.save = save;
  }

  enqueue(snapshot: Campaign): Promise<Campaign> {
    this.queued = snapshot;
    if (this.active) return this.active;
    this.active = this.drain().then(
      (saved) => {
        this.active = null;
        return saved;
      },
      (error: unknown) => {
        this.active = null;
        throw error;
      },
    );
    return this.active;
  }

  private async drain(): Promise<Campaign> {
    let latest: Campaign | null = null;
    while (this.queued) {
      const snapshot = this.queued;
      this.queued = null;
      latest = await this.save(snapshot);
      // The queue can be repopulated while the awaited request is in flight.
      // TypeScript's control-flow analysis does not model that mutation.
      const queued = this.queued as Campaign | null;
      if (queued) {
        this.queued = { ...queued, lockVersion: latest.lockVersion };
      }
    }
    if (!latest) throw new Error("No campaign save was queued.");
    return latest;
  }
}
