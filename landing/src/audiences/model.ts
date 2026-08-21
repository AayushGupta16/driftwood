export type AudienceMember = {
  leadId: string;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedinUrl: string | null;
  stage: string;
  contactable: boolean;
};

export type AudienceSummary = {
  id: string;
  name: string;
  description: string;
  sourceProvider: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Audience = AudienceSummary & {
  discoveryFilters: Record<string, string>;
  members: AudienceMember[];
};

export type DiscoveryCandidate = Omit<AudienceMember, "contactable" | "leadId"> & {
  providerRecordId: string;
  leadId: string | null;
};

export type DiscoveryResult = {
  provider: string;
  providerLabel: string;
  candidates: DiscoveryCandidate[];
};

export type AudienceFilters = {
  query: string;
  company: string;
  title: string;
};

export const EMPTY_FILTERS: AudienceFilters = {
  query: "",
  company: "",
  title: "",
};

export function filterAudiences(
  audiences: AudienceSummary[],
  query: string,
): AudienceSummary[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return audiences;
  return audiences.filter((audience) =>
    [audience.name, audience.description, audience.sourceProvider]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export function toggleLead(
  selected: ReadonlySet<string>,
  leadId: string,
): Set<string> {
  const next = new Set(selected);
  if (next.has(leadId)) next.delete(leadId);
  else next.add(leadId);
  return next;
}

export function formatAudienceDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function stageLabel(stage: string): string {
  return stage.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
