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

export type LeadImportAudience = {
  id: string;
  name: string;
  member_count: number;
  created: boolean;
};

export type LeadImportResult = {
  added: number;
  skipped_duplicate: number;
  skipped_suppressed: number;
  errors: Array<{ row: number; reason: string }>;
  // The csv_upload audience this import created or refreshed. Null when the
  // file produced no resolvable leads; absent from older backend responses.
  audience?: LeadImportAudience | null;
};

export type LeadImportNotice = {
  kind: "success" | "info" | "error";
  message: string;
  details?: string[];
  hint?: string;
};

export type AudienceFilters = {
  // The search is one sentence, translated server-side into Orange Slice
  // queries. Saved audiences persist it for reproducible re-runs.
  prompt: string;
};

export const EMPTY_FILTERS: AudienceFilters = {
  prompt: "",
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

const COMPANY_COLUMN_HINT =
  "Every row needs a company. Add a company column and upload the file again.";

function countNoun(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function invalidRows(count: number): string {
  return countNoun(count, "invalid row", "invalid rows");
}

// Four outcomes, in order: the file was unusable (error), the upload created
// an audience, it added people to an existing one, or everything in it was
// already imported (info, deliberately not styled like a failure).
export function summarizeLeadImport(result: LeadImportResult): LeadImportNotice {
  const audience = result.audience ?? null;
  const skipped: string[] = [];
  if (result.skipped_duplicate) {
    skipped.push(`${countNoun(result.skipped_duplicate, "duplicate", "duplicates")} skipped`);
  }
  if (result.skipped_suppressed) skipped.push(`${result.skipped_suppressed} suppressed`);
  if (result.errors.length) skipped.push(invalidRows(result.errors.length));
  const suffix = skipped.length ? ` · ${skipped.join(" · ")}` : "";

  if (!audience && result.added === 0 && !result.skipped_duplicate && !result.skipped_suppressed) {
    const notice: LeadImportNotice = {
      kind: "error",
      message: result.errors.length
        ? `Nothing imported · ${invalidRows(result.errors.length)}`
        : "Nothing imported",
      hint: COMPANY_COLUMN_HINT,
    };
    const details = result.errors.slice(0, 3).map((error) => `Row ${error.row}: ${error.reason}`);
    if (details.length) notice.details = details;
    return notice;
  }

  if (result.added > 0) {
    const people = countNoun(result.added, "person", "people");
    if (!audience) return { kind: "success", message: `Imported ${people}${suffix}` };
    if (audience.created) {
      return { kind: "success", message: `Imported ${people} into “${audience.name}”${suffix}` };
    }
    return {
      kind: "success",
      message: `Added ${people} to “${audience.name}” (${audience.member_count} total)${suffix}`,
    };
  }

  if (audience && result.skipped_duplicate) {
    const rest: string[] = [];
    if (result.skipped_suppressed) rest.push(`${result.skipped_suppressed} suppressed`);
    if (result.errors.length) rest.push(invalidRows(result.errors.length));
    const restSuffix = rest.length ? ` · ${rest.join(" · ")}` : "";
    return {
      kind: "info",
      message: `Everything in this file is already imported · “${audience.name}” has all ${countNoun(audience.member_count, "person", "people")}${restSuffix}`,
    };
  }

  return { kind: "info", message: `No new people imported${suffix}` };
}

/* Customer-facing source labels speak in capabilities, never vendor names
   (ux-principles rule 18): the discovery vendor is swappable plumbing, so
   its slug renders as "Lead search". Unknown slugs fall back to a generic
   word rather than title-casing a possible vendor name into the UI. */
const PROVIDER_LABELS: Record<string, string> = {
  csv_upload: "CSV upload",
  orange_slice: "Lead search",
  workspace: "Workspace",
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? "Imported";
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
