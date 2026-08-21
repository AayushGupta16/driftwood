export type AssetKind = "image" | "video" | "link";
export type AssetAssignmentMode = "all" | "selected";

export type AssetAgent = {
  id: string;
  label: string;
  paused: boolean;
};

export type CompanyAsset = {
  id: string;
  kind: AssetKind;
  name: string;
  description: string;
  tags: string[];
  originalFilename: string | null;
  contentType: string | null;
  byteSize: number | null;
  externalUrl: string | null;
  contentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  assignmentMode: AssetAssignmentMode;
  assignedAgentIds: string[];
};

export function assetAssignmentsReady(loading: boolean, failed: boolean): boolean {
  return !loading && !failed;
}

export function assetAssignmentLabel(asset: CompanyAsset, agents: AssetAgent[]): string {
  if (asset.assignmentMode === "all") return "All workspace agents";
  if (asset.assignedAgentIds.length === 0) return "No agent access";
  const labels = new Map(agents.map((agent) => [agent.id, agent.label]));
  const assigned = asset.assignedAgentIds.map((id) => labels.get(id) ?? id);
  if (assigned.length <= 2) return assigned.join(", ");
  return `${assigned.slice(0, 2).join(", ")} +${assigned.length - 2}`;
}

export type AssetFilter = "all" | AssetKind;

export function filterAssets(
  assets: CompanyAsset[],
  filter: AssetFilter,
  query: string,
): CompanyAsset[] {
  const normalized = query.trim().toLocaleLowerCase();
  return assets.filter((asset) => {
    if (filter !== "all" && asset.kind !== filter) return false;
    if (!normalized) return true;
    return [
      asset.name,
      asset.description,
      asset.originalFilename ?? "",
      ...asset.tags,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalized);
  });
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "External link";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

export function assetKindLabel(kind: AssetKind): string {
  if (kind === "image") return "Image";
  if (kind === "video") return "Video";
  return "Link";
}

export function assetDestination(asset: CompanyAsset): string | null {
  return asset.externalUrl ?? asset.contentUrl;
}
