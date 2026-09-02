/* The dashboard triggers API, mapped once here from the backend's snake_case
   shapes (backend app/schemas/triggers.py) to the camelCase the pages use.
   Base /api/v1/dashboard/triggers, same-origin session cookie. Errors come
   back as {"error": {"code", "detail"}}: 403 for read-only members on
   writes, 404 not_found, 409 run_in_progress. */

import type {
  NewTriggerInput,
  PostingStatus,
  RunState,
  Trigger,
  TriggerCadence,
  TriggerDetail,
  TriggerPosting,
  TriggerRun,
  TriggerSourceKind,
  TriggerStatus,
} from "./model";

const BASE = "/api/v1/dashboard/triggers";

type RawFilters = {
  keywords?: string[] | null;
  locations?: string[] | null;
  url?: string | null;
};

type RawCounts = {
  postings: number;
  new: number;
  agencies_added: number;
  leads: number;
  demos: number;
  enrolled: number;
  held: number;
};

export type RawTriggerRow = {
  id: string;
  name: string;
  source_kind: string;
  filters: RawFilters | null;
  cadence: string;
  fire_hour: number;
  campaign_id: string | null;
  campaign_name: string | null;
  status: string;
  last_run_at: string | null;
  last_run_state: string | null;
  counts: RawCounts;
  created_at: string;
};

export type RawRunRow = {
  id: string;
  state: string;
  triggered_by: string;
  postings_seen: number;
  postings_new: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type RawPostingRow = {
  id: string;
  source_url: string;
  employer_name: string;
  title: string;
  city: string | null;
  state: string | null;
  location_text: string | null;
  pay_text: string | null;
  posted_at: string | null;
  status: string;
  note: string | null;
  company_id: string | null;
  lead_id: string | null;
  demo_url: string | null;
  created_at: string;
};

export class TriggerApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | null = null;
    try {
      const body = (await response.json()) as {
        error?: { code?: string; detail?: string };
        detail?: string;
      };
      message = body.error?.detail ?? body.detail ?? message;
      code = body.error?.code ?? null;
    } catch {
      // Keep the status fallback for a non-JSON proxy error.
    }
    throw new TriggerApiError(message, response.status, code);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function mapTrigger(raw: RawTriggerRow): Trigger {
  return {
    id: raw.id,
    name: raw.name,
    sourceKind: raw.source_kind as TriggerSourceKind,
    filters: {
      keywords: raw.filters?.keywords ?? [],
      locations: raw.filters?.locations ?? [],
      url: raw.filters?.url ?? null,
    },
    cadence: raw.cadence as TriggerCadence,
    fireHour: raw.fire_hour,
    campaignId: raw.campaign_id,
    campaignName: raw.campaign_name,
    status: raw.status as TriggerStatus,
    lastRunAt: raw.last_run_at,
    lastRunState: raw.last_run_state,
    counts: {
      postings: raw.counts.postings,
      new: raw.counts.new,
      agenciesAdded: raw.counts.agencies_added,
      leads: raw.counts.leads,
      demos: raw.counts.demos,
      enrolled: raw.counts.enrolled,
      held: raw.counts.held,
    },
    createdAt: raw.created_at,
  };
}

export function mapRun(raw: RawRunRow): TriggerRun {
  return {
    id: raw.id,
    state: raw.state as RunState,
    triggeredBy: raw.triggered_by === "manual" ? "manual" : "schedule",
    postingsSeen: raw.postings_seen,
    postingsNew: raw.postings_new,
    error: raw.error,
    createdAt: raw.created_at,
    startedAt: raw.started_at,
    finishedAt: raw.finished_at,
  };
}

export function mapPosting(raw: RawPostingRow): TriggerPosting {
  return {
    id: raw.id,
    sourceUrl: raw.source_url,
    employerName: raw.employer_name,
    title: raw.title,
    city: raw.city,
    state: raw.state,
    locationText: raw.location_text,
    payText: raw.pay_text,
    postedAt: raw.posted_at,
    status: raw.status as PostingStatus,
    note: raw.note,
    companyId: raw.company_id,
    leadId: raw.lead_id,
    demoUrl: raw.demo_url,
    createdAt: raw.created_at,
  };
}

export async function listTriggers(): Promise<Trigger[]> {
  const body = await requestJson<{ triggers: RawTriggerRow[] }>(BASE);
  return body.triggers.map(mapTrigger);
}

export async function getTrigger(id: string): Promise<TriggerDetail> {
  const body = await requestJson<{
    trigger: RawTriggerRow;
    runs: RawRunRow[];
    postings: RawPostingRow[];
  }>(`${BASE}/${encodeURIComponent(id)}`);
  return {
    trigger: mapTrigger(body.trigger),
    runs: body.runs.map(mapRun),
    postings: body.postings.map(mapPosting),
  };
}

export function createBody(input: NewTriggerInput): string {
  return JSON.stringify({
    name: input.name,
    source_kind: input.sourceKind,
    filters: {
      keywords: input.keywords,
      locations: input.locations,
      ...(input.sourceKind === "custom_url" && input.url ? { url: input.url } : {}),
    },
    cadence: input.cadence,
    fire_hour: input.fireHour,
    campaign_id: input.campaignId,
  });
}

export async function createTrigger(input: NewTriggerInput): Promise<Trigger> {
  const body = await requestJson<RawTriggerRow>(BASE, {
    method: "POST",
    body: createBody(input),
  });
  return mapTrigger(body);
}

export async function runTrigger(id: string): Promise<{ runId: string }> {
  const body = await requestJson<{ run_id: string }>(`${BASE}/${encodeURIComponent(id)}/run`, {
    method: "POST",
  });
  return { runId: body.run_id };
}

export async function pauseTrigger(id: string): Promise<Trigger> {
  const body = await requestJson<RawTriggerRow>(`${BASE}/${encodeURIComponent(id)}/pause`, {
    method: "POST",
  });
  return mapTrigger(body);
}

export async function resumeTrigger(id: string): Promise<Trigger> {
  const body = await requestJson<RawTriggerRow>(`${BASE}/${encodeURIComponent(id)}/resume`, {
    method: "POST",
  });
  return mapTrigger(body);
}
