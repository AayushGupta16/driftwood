export type AudienceMember = {
  leadId: string;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedinUrl: string | null;
  stage: string;
  contactable: boolean;
  outreachEligible: boolean;
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

export type DiscoveryCandidate = Omit<AudienceMember, "contactable" | "outreachEligible" | "leadId"> & {
  providerRecordId: string;
  leadId: string | null;
};

export type DiscoveryResult = {
  provider: string;
  providerLabel: string;
  candidates: DiscoveryCandidate[];
};

export type DiscoveryProvider = {
  provider: "orange_slice" | "workspace";
  label: string;
  configured: boolean;
};

export type DiscoveryStatus = {
  defaultProvider: "orange_slice" | "workspace";
  providers: DiscoveryProvider[];
};

export type LeadImportResult = {
  added: number;
  skipped_duplicate: number;
  skipped_suppressed: number;
  errors: Array<{ row: number; reason: string }>;
};

export type AudienceFilters = {
  // A non-empty prompt drives the search server-side (LLM-translated into
  // Orange Slice queries); the three structured fields are the legacy lane
  // and are ignored while a prompt is present.
  prompt: string;
  query: string;
  company: string;
  title: string;
};

export const EMPTY_FILTERS: AudienceFilters = {
  prompt: "",
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

export function outreachEligibleMembers(
  members: AudienceMember[],
): AudienceMember[] {
  return members.filter((member) => member.contactable && member.outreachEligible);
}

export function summarizeLeadImport(result: LeadImportResult): string {
  const parts = [result.added ? `${result.added} imported` : "No new leads"];
  if (result.skipped_duplicate) parts.push(`${result.skipped_duplicate} already added`);
  if (result.skipped_suppressed) parts.push(`${result.skipped_suppressed} suppressed`);
  if (result.errors.length) {
    parts.push(`${result.errors.length} invalid ${result.errors.length === 1 ? "row" : "rows"}`);
  }
  return parts.join(" · ");
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
