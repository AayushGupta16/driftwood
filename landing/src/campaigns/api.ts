import type {
  Campaign,
  CampaignContact,
  CampaignStatus,
  CampaignStep,
  CampaignSummary,
  ContactJourneyStatus,
  StepKind,
} from "./model";

type RawCampaignSummary = {
  id: string;
  series_id: string;
  version: number;
  name: string;
  description: string;
  audience_name: string;
  audience_id?: string | null;
  lock_version?: number;
  status: CampaignStatus;
  step_count: number;
  contact_count: number;
  created_at: string;
  updated_at: string;
};

type RawCampaignStep = {
  id: string;
  position: number;
  kind: StepKind;
  label: string;
  subject: string | null;
  body: string;
  delay_days: number;
  send_window: CampaignStep["sendWindow"];
  stop_on_reply: boolean;
  attachment_slug: string | null;
};

type RawCampaignContact = {
  id: string;
  name: string | null;
  company: string;
  role: string | null;
  stage: string;
  selected: boolean;
  selectable: boolean;
  enrollment_status: ContactJourneyStatus | null;
  current_step: number | null;
  next_action_at: string | null;
};

type RawCampaignDetail = RawCampaignSummary & {
  steps: RawCampaignStep[];
  contacts: RawCampaignContact[];
};

export class CampaignApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(
    message: string,
    status: number,
    code: string | null = null,
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | null = null;
    try {
      const body = (await response.json()) as {
        error?: { detail?: string; code?: string };
        detail?: string;
      };
      message = body.error?.detail ?? body.detail ?? message;
      code = body.error?.code ?? null;
    } catch {
      // Keep the status-based fallback for non-JSON proxy or network errors.
    }
    throw new CampaignApiError(message, response.status, code);
  }
  return (await response.json()) as T;
}

function mapSummary(raw: RawCampaignSummary): CampaignSummary {
  return {
    id: raw.id,
    seriesId: raw.series_id,
    version: raw.version,
    name: raw.name,
    description: raw.description,
    audience: raw.audience_name,
    audienceId: raw.audience_id ?? null,
    lockVersion: raw.lock_version ?? 0,
    status: raw.status,
    stepCount: raw.step_count,
    contactCount: raw.contact_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapContact(contact: RawCampaignContact): CampaignContact {
  return {
    id: contact.id,
    name: contact.name ?? "Unnamed lead",
    company: contact.company,
    role: contact.role ?? "Role not set",
    stage: contact.stage,
    selected: contact.selected,
    selectable: contact.selectable,
    status: contact.enrollment_status,
    currentStep: contact.current_step,
    nextActionAt: contact.next_action_at,
  };
}

export function mapCampaign(raw: RawCampaignDetail): Campaign {
  const summary = mapSummary(raw);
  return {
    id: summary.id,
    seriesId: summary.seriesId,
    version: summary.version,
    name: summary.name,
    description: summary.description,
    audience: summary.audience,
    audienceId: summary.audienceId,
    lockVersion: summary.lockVersion,
    status: summary.status,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    steps: raw.steps.map((step) => ({
      id: step.id,
      kind: step.kind,
      label: step.label,
      subject: step.subject ?? "",
      body: step.body,
      delayDays: step.delay_days,
      sendWindow: step.send_window,
      stopOnReply: step.stop_on_reply,
      attachmentSlug: step.attachment_slug ?? undefined,
    })),
    contacts: raw.contacts.map(mapContact),
  };
}

export type CampaignContactPage = {
  contacts: CampaignContact[];
  total: number;
  limit: number;
  offset: number;
};

export async function listCampaignContacts(
  id: string,
  options: { query?: string; limit?: number; offset?: number } = {},
): Promise<CampaignContactPage> {
  const query = new URLSearchParams({
    q: options.query ?? "",
    limit: String(options.limit ?? 50),
    offset: String(options.offset ?? 0),
  });
  const raw = await requestJson<{
    contacts: RawCampaignContact[];
    total: number;
    limit: number;
    offset: number;
  }>(`/api/v1/dashboard/campaigns/${encodeURIComponent(id)}/contacts?${query}`);
  return { ...raw, contacts: raw.contacts.map(mapContact) };
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const body = await requestJson<{ campaigns: RawCampaignSummary[] }>(
    "/api/v1/dashboard/campaigns",
  );
  return body.campaigns.map(mapSummary);
}

export async function createCampaign(): Promise<Campaign> {
  const raw = await requestJson<RawCampaignDetail>("/api/v1/dashboard/campaigns", {
    method: "POST",
    body: JSON.stringify({ name: "Untitled campaign" }),
  });
  return mapCampaign(raw);
}

export async function getCampaign(id: string): Promise<Campaign> {
  const raw = await requestJson<RawCampaignDetail>(
    `/api/v1/dashboard/campaigns/${encodeURIComponent(id)}`,
  );
  return mapCampaign(raw);
}

export async function saveCampaign(campaign: Campaign): Promise<Campaign> {
  const raw = await requestJson<RawCampaignDetail>(
    `/api/v1/dashboard/campaigns/${encodeURIComponent(campaign.id)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        expected_lock_version: campaign.lockVersion,
        name: campaign.name,
        description: campaign.description,
        audience_name: campaign.audience,
        audience_id: campaign.audienceId,
        lead_ids: campaign.contacts
          .filter((contact) => contact.selected)
          .map((contact) => contact.id),
        steps: campaign.steps.map((step) => ({
          id: step.id,
          kind: step.kind,
          label: step.label,
          subject: step.subject || null,
          body: step.body,
          delay_days: step.delayDays,
          send_window: step.sendWindow,
          stop_on_reply: step.stopOnReply,
          attachment_slug: step.attachmentSlug ?? null,
        })),
      }),
    },
  );
  return mapCampaign(raw);
}

async function campaignAction(
  id: string,
  action: "pause" | "resume" | "revisions",
): Promise<Campaign> {
  const raw = await requestJson<RawCampaignDetail>(
    `/api/v1/dashboard/campaigns/${encodeURIComponent(id)}/${action}`,
    { method: "POST" },
  );
  return mapCampaign(raw);
}

export async function activateCampaign(id: string): Promise<Campaign> {
  const raw = await requestJson<{
    campaign: RawCampaignDetail;
    outreach_queued: false;
  }>(`/api/v1/dashboard/campaigns/${encodeURIComponent(id)}/activate`, {
    method: "POST",
  });
  return mapCampaign(raw.campaign);
}

export const pauseCampaign = (id: string) => campaignAction(id, "pause");
export const resumeCampaign = (id: string) => campaignAction(id, "resume");
export const createCampaignRevision = (id: string) =>
  campaignAction(id, "revisions");
