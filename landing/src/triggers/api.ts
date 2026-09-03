/* The dashboard triggers API, mapped once here from the backend's snake_case
   shapes (backend app/schemas/triggers.py) to the camelCase the pages use.
   Base /api/v1/dashboard/triggers, same-origin session cookie. Errors come
   back as {"error": {"code", "detail"}}: 403 for read-only members on
   writes, 404 not_found, 409 run_in_progress.

   A create sends one sentence and nothing else; the backend derives the
   source, the schedule and what happens to each item. Fields the backend is
   renaming (entity_name, companies_added) are read new-name-first with the
   old name as a fallback, so the page works against either. Everything the
   pages stopped showing (pull labels, credits, dollars, pages fetched,
   filtered counts, the customer's old filters and action toggles) is simply
   not mapped. */

import {
  normalizeCadence,
  normalizeStatus,
  plainReason,
  sortItems,
  type EditTriggerInput,
  type ItemField,
  type ItemStatus,
  type NewTriggerInput,
  type RunState,
  type RunTrigger,
  type Trigger,
  type TriggerDetail,
  type TriggerItem,
  type TriggerRun,
} from "./model.ts";

const BASE = "/api/v1/dashboard/triggers";

type RawCounts = {
  items?: number | null;
  postings?: number | null;
  new?: number | null;
  companies_added?: number | null;
  agencies_added?: number | null;
  leads?: number | null;
  demos?: number | null;
  enrolled?: number | null;
};

export type RawSchedule = {
  cadence: string;
  fire_hour: number;
  interval_hours?: number | null;
};

export type RawPull = {
  method: string;
  /* The agent's words for a source it could not read. The backend sends it
     on one of these; whichever is filled wins. */
  reason?: string | null;
  note?: string | null;
};

export type RawTriggerRow = {
  id: string;
  name: string;
  watch?: string | null;
  summary?: string | null;
  cadence: string;
  fire_hour: number;
  schedule?: RawSchedule | null;
  pull?: RawPull | null;
  campaign_id: string | null;
  campaign_name: string | null;
  status: string;
  last_run_at: string | null;
  last_run_state: string | null;
  counts: RawCounts | null;
  created_at: string;
  updated_at?: string | null;
};

export type RawRunRow = {
  id: string;
  state: string;
  triggered_by: string;
  postings_seen?: number | null;
  postings_new?: number | null;
  items_seen?: number | null;
  items_new?: number | null;
  ids_seen?: number | null;
  ids_new?: number | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type RawItemRow = {
  id: string;
  source_url: string;
  entity_name?: string | null;
  employer_name?: string | null;
  title?: string | null;
  fields?: unknown;
  posted_at?: string | null;
  found_at?: string | null;
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

/* An error body is not always a sentence: a 422 answers with a list of
   objects, and printing one on the page is the "[object Object]" a
   customer saw where an explanation belonged. Only a real string counts. */
export function errorDetail(body: unknown): string | null {
  if (typeof body === "string") return body.trim() || null;
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const nested = record.error;
  if (nested && typeof nested === "object") {
    const detail = (nested as Record<string, unknown>).detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
  }
  return typeof record.detail === "string" && record.detail.trim() ? record.detail.trim() : null;
}

function errorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const nested = (body as Record<string, unknown>).error;
  if (!nested || typeof nested !== "object") return null;
  const code = (nested as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
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
      const body: unknown = await response.json();
      message = errorDetail(body) ?? message;
      code = errorCode(body);
    } catch {
      // Keep the status fallback for a non-JSON proxy error.
    }
    throw new TriggerApiError(message, response.status, code);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function counter(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function count(...values: (number | null | undefined)[]): number {
  for (const value of values) {
    const numeric = counter(value);
    if (numeric !== null) return numeric;
  }
  return 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/* Extracted fields arrive either as rows the backend already labelled or
   as the raw object the extraction produced; both read as key and value. */
export function mapFields(raw: unknown): ItemField[] {
  if (Array.isArray(raw)) {
    return raw
      .map((entry): ItemField => {
        if (!entry || typeof entry !== "object") return { label: "", value: "" };
        const row = entry as Record<string, unknown>;
        return {
          label: text(row.label ?? row.name ?? row.key),
          value: text(row.value ?? row.text),
        };
      })
      .filter((field) => field.label !== "" && field.value !== "");
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([label, value]) => {
        const words = label.replace(/[_-]+/g, " ").trim();
        return {
          label: words ? words.charAt(0).toUpperCase() + words.slice(1) : "",
          value: typeof value === "number" ? String(value) : text(value),
        };
      })
      .filter((field) => field.label !== "" && field.value !== "");
  }
  return [];
}

export function mapTrigger(raw: RawTriggerRow): Trigger {
  const counts = raw.counts;
  return {
    id: raw.id,
    name: raw.name,
    watch: raw.watch ?? null,
    summary: raw.summary ?? null,
    schedule: {
      cadence: normalizeCadence(raw.schedule?.cadence ?? raw.cadence),
      fireHour: raw.schedule?.fire_hour ?? raw.fire_hour ?? 6,
      intervalHours: counter(raw.schedule?.interval_hours),
    },
    pull: raw.pull
      ? { method: raw.pull.method, reason: plainReason(raw.pull.reason) ?? plainReason(raw.pull.note) }
      : null,
    campaignId: raw.campaign_id,
    campaignName: raw.campaign_name,
    status: normalizeStatus(raw.status),
    lastRunAt: raw.last_run_at,
    lastRunState: raw.last_run_state,
    counts: {
      items: count(counts?.items, counts?.postings),
      new: count(counts?.new),
      companiesAdded: count(counts?.companies_added, counts?.agencies_added),
      leads: count(counts?.leads),
      demos: count(counts?.demos),
      enrolled: count(counts?.enrolled),
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? null,
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
    itemsSeen: count(raw.items_seen, raw.postings_seen),
    itemsNew: count(raw.items_new, raw.postings_new),
    idsSeen: counter(raw.ids_seen),
    idsNew: counter(raw.ids_new),
    error: raw.error,
    createdAt: raw.created_at,
    startedAt: raw.started_at,
    finishedAt: raw.finished_at,
  };
}

export function mapItem(raw: RawItemRow): TriggerItem {
  return {
    id: raw.id,
    sourceUrl: raw.source_url,
    entityName: raw.entity_name ?? raw.employer_name ?? "",
    title: raw.title ?? "",
    fields: mapFields(raw.fields),
    foundAt: raw.found_at ?? raw.posted_at ?? null,
    status: raw.status as ItemStatus,
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
    postings?: RawItemRow[];
    items?: RawItemRow[];
  }>(`${BASE}/${encodeURIComponent(id)}`);
  /* The backend hands items back in insertion order; the page wants them
     newest first. */
  return {
    trigger: mapTrigger(body.trigger),
    runs: (body.runs ?? []).map(mapRun),
    items: sortItems((body.items ?? body.postings ?? []).map(mapItem)),
  };
}

/* The POST body, exactly as the backend reads it: the sentence, and a
   campaign when the customer chose one. */
export function createBody(input: NewTriggerInput): string {
  return JSON.stringify({
    watch: input.watch,
    ...(input.campaignId ? { campaign_id: input.campaignId } : {}),
  });
}

/* The PUT body: only what changed. A new sentence puts the trigger back
   into Building while the agent rebuilds how it checks, so an unchanged
   sentence is left out rather than sent back unaltered. */
export function updateBody(input: EditTriggerInput): string {
  const body: Record<string, unknown> = {};
  if (typeof input.watch === "string") body.watch = input.watch;
  if (input.campaignId !== undefined) body.campaign_id = input.campaignId;
  return JSON.stringify(body);
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
