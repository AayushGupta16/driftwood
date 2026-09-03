/* The dashboard triggers API, mapped once here from the backend's snake_case
   shapes (backend app/schemas/triggers.py) to the camelCase the pages use.
   Base /api/v1/dashboard/triggers, same-origin session cookie. Errors come
   back as {"error": {"code", "detail"}}: 403 for read-only members on
   writes, 404 not_found, 409 run_in_progress.

   Rows written before source_url, watch, schedule, actions and pull
   existed lack those fields; the mapping fills them from the older
   source_kind, cadence and fire_hour so the pages work against either
   backend. */

import {
  hostFromUrl,
  legacyHost,
  normalizeCadence,
  normalizeStatus,
  sortPostings,
  type EditTriggerInput,
  type NewTriggerInput,
  type PostingStatus,
  type PullMethod,
  type RunState,
  type RunTrigger,
  type Trigger,
  type TriggerDetail,
  type TriggerPosting,
  type TriggerRun,
  type TriggerSourceKind,
} from "./model.ts";

const BASE = "/api/v1/dashboard/triggers";

type RawFilters = {
  keywords?: string[] | null;
  locations?: string[] | null;
  exclude_employer_terms?: string[] | null;
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

export type RawSchedule = {
  cadence: string;
  fire_hour: number;
  interval_hours?: number | null;
};

export type RawActions = {
  add_company: boolean;
  find_contact: boolean;
  build_demo: boolean;
  enroll: boolean;
};

export type RawPull = {
  method: string;
  label: string;
};

export type RawTriggerRow = {
  id: string;
  name: string;
  source_kind: string;
  source_url?: string | null;
  source_host?: string | null;
  watch?: string | null;
  filters: RawFilters | null;
  cadence: string;
  fire_hour: number;
  schedule?: RawSchedule | null;
  actions?: RawActions | null;
  pull?: RawPull | null;
  campaign_id: string | null;
  campaign_name: string | null;
  status: string;
  last_run_at: string | null;
  last_run_state: string | null;
  counts: RawCounts | null;
  created_at: string;
};

export type RawRunRow = {
  id: string;
  state: string;
  triggered_by: string;
  postings_seen: number;
  postings_new: number;
  pages_fetched?: number | null;
  credits_used?: number | null;
  cost_usd?: number | null;
  ids_seen?: number | null;
  ids_new?: number | null;
  ids_filtered?: number | null;
  error: string | null;
  note?: string | null;
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

function stringList(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function counter(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapTrigger(raw: RawTriggerRow): Trigger {
  const sourceUrl = raw.source_url ?? raw.filters?.url ?? null;
  const sourceHost = raw.source_host ?? hostFromUrl(sourceUrl) ?? legacyHost(raw.source_kind);
  const counts = raw.counts;
  return {
    id: raw.id,
    name: raw.name,
    sourceKind: raw.source_kind as TriggerSourceKind,
    sourceUrl,
    sourceHost,
    watch: raw.watch ?? null,
    filters: {
      keywords: stringList(raw.filters?.keywords),
      locations: stringList(raw.filters?.locations),
      excludeEmployerTerms: stringList(raw.filters?.exclude_employer_terms),
      url: raw.filters?.url ?? null,
    },
    schedule: {
      cadence: normalizeCadence(raw.schedule?.cadence ?? raw.cadence),
      fireHour: raw.schedule?.fire_hour ?? raw.fire_hour ?? 6,
      intervalHours: counter(raw.schedule?.interval_hours),
    },
    /* Before actions existed every trigger did the whole pipeline, and
       enrolled whenever it had a campaign. */
    actions: raw.actions
      ? {
          addCompany: Boolean(raw.actions.add_company),
          findContact: Boolean(raw.actions.find_contact),
          buildDemo: Boolean(raw.actions.build_demo),
          enroll: Boolean(raw.actions.enroll),
        }
      : { addCompany: true, findContact: true, buildDemo: true, enroll: Boolean(raw.campaign_id) },
    pull: raw.pull ? { method: raw.pull.method as PullMethod, label: raw.pull.label ?? "" } : null,
    campaignId: raw.campaign_id,
    campaignName: raw.campaign_name,
    status: normalizeStatus(raw.status),
    lastRunAt: raw.last_run_at,
    lastRunState: raw.last_run_state,
    counts: {
      postings: counts?.postings ?? 0,
      new: counts?.new ?? 0,
      agenciesAdded: counts?.agencies_added ?? 0,
      leads: counts?.leads ?? 0,
      demos: counts?.demos ?? 0,
      enrolled: counts?.enrolled ?? 0,
      held: counts?.held ?? 0,
    },
    createdAt: raw.created_at,
  };
}

/* "setup" is the check the backend starts on its own right after a
   trigger is created; anything else it might send reads as scheduled. */
function runTriggerKind(value: string | null | undefined): RunTrigger {
  return value === "manual" || value === "setup" ? value : "schedule";
}

export function mapRun(raw: RawRunRow): TriggerRun {
  return {
    id: raw.id,
    state: raw.state as RunState,
    triggeredBy: runTriggerKind(raw.triggered_by),
    postingsSeen: raw.postings_seen ?? 0,
    postingsNew: raw.postings_new ?? 0,
    pagesFetched: counter(raw.pages_fetched),
    creditsUsed: counter(raw.credits_used),
    costUsd: counter(raw.cost_usd),
    idsSeen: counter(raw.ids_seen),
    idsNew: counter(raw.ids_new),
    idsFiltered: counter(raw.ids_filtered),
    error: raw.error,
    note: raw.note ?? null,
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
  /* The backend hands postings back in insertion order; the page wants
     them newest first by posting date. */
  return {
    trigger: mapTrigger(body.trigger),
    runs: (body.runs ?? []).map(mapRun),
    postings: sortPostings((body.postings ?? []).map(mapPosting)),
  };
}

/* The wire shape of everything Edit can change, shared by POST and PUT.
   Name is sent only when the customer typed one; otherwise the backend
   names the trigger after the site. interval_hours rides along only for
   every_n_hours. */
function editableFields(input: EditTriggerInput) {
  const name = input.name?.trim();
  return {
    ...(name ? { name } : {}),
    watch: input.watch,
    filters: {
      keywords: input.keywords,
      locations: input.locations,
      exclude_employer_terms: input.excludeEmployerTerms,
    },
    schedule: {
      cadence: input.cadence,
      fire_hour: input.fireHour,
      ...(input.cadence === "every_n_hours" && input.intervalHours
        ? { interval_hours: input.intervalHours }
        : {}),
    },
    actions: {
      add_company: input.actions.addCompany,
      find_contact: input.actions.findContact,
      build_demo: input.actions.buildDemo,
      enroll: input.actions.enroll,
    },
    campaign_id: input.campaignId,
  };
}

/* The POST body, exactly as the backend reads it. source_url is null for
   a trigger that watches the whole web. */
export function createBody(input: NewTriggerInput): string {
  const { name, ...rest } = editableFields(input);
  return JSON.stringify({
    ...(name ? { name } : {}),
    source_url: input.sourceUrl?.trim() || null,
    ...rest,
  });
}

/* The PUT body: the partial the backend accepts, minus the site. */
export function updateBody(input: EditTriggerInput): string {
  return JSON.stringify(editableFields(input));
}

export async function createTrigger(input: NewTriggerInput): Promise<Trigger> {
  const body = await requestJson<RawTriggerRow>(BASE, {
    method: "POST",
    body: createBody(input),
  });
  return mapTrigger(body);
}

export async function updateTrigger(id: string, input: EditTriggerInput): Promise<Trigger> {
  const body = await requestJson<RawTriggerRow>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: updateBody(input),
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
