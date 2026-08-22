import type { AssetAgent, AssetAssignmentMode, AssetKind, CompanyAsset } from "./model";

type RawAsset = {
  id: string;
  kind: AssetKind;
  name: string;
  description: string;
  tags: string[];
  original_filename: string | null;
  content_type: string | null;
  byte_size: number | null;
  external_url: string | null;
  content_url: string | null;
  created_at: string;
  updated_at: string;
  assignment_mode?: AssetAssignmentMode;
  assigned_agent_ids?: string[];
};

export class AssetApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function responseError(response: Response): Promise<AssetApiError> {
  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as {
      error?: { detail?: string };
      detail?: string;
    };
    message = body.error?.detail ?? body.detail ?? message;
  } catch {
    // A proxy can return HTML. Keep the useful status fallback.
  }
  return new AssetApiError(message, response.status);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as T;
}

function mapAsset(raw: RawAsset): CompanyAsset {
  return {
    id: raw.id,
    kind: raw.kind,
    name: raw.name,
    description: raw.description,
    tags: raw.tags,
    originalFilename: raw.original_filename,
    contentType: raw.content_type,
    byteSize: raw.byte_size,
    externalUrl: raw.external_url,
    contentUrl: raw.content_url,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    assignmentMode: raw.assignment_mode ?? "all",
    assignedAgentIds: raw.assigned_agent_ids ?? [],
  };
}

export async function listAssets(): Promise<CompanyAsset[]> {
  const body = await requestJson<{ assets: RawAsset[] }>("/api/v1/dashboard/assets");
  return body.assets.map(mapAsset);
}

export async function createLinkAsset(input: {
  name: string;
  url: string;
  description: string;
  tags: string[];
}): Promise<CompanyAsset> {
  const raw = await requestJson<RawAsset>("/api/v1/dashboard/assets/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return mapAsset(raw);
}

export async function uploadAsset(input: {
  file: File;
  name: string;
  description: string;
  tags: string;
}): Promise<CompanyAsset> {
  const body = new FormData();
  body.set("file", input.file);
  if (input.name.trim()) body.set("name", input.name.trim());
  body.set("description", input.description);
  body.set("tags", input.tags);
  const raw = await requestJson<RawAsset>("/api/v1/dashboard/assets/upload", {
    method: "POST",
    body,
  });
  return mapAsset(raw);
}

export async function deleteAsset(id: string): Promise<void> {
  const response = await fetch(
    `/api/v1/dashboard/assets/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!response.ok) throw await responseError(response);
}

export async function listAssetAgents(): Promise<AssetAgent[]> {
  const body = await requestJson<{ agents: AssetAgent[] }>("/api/v1/dashboard/assets/agents");
  return body.agents;
}

export async function updateAssetAssignments(
  id: string,
  input: { assignmentMode: AssetAssignmentMode; agentIds: string[] },
): Promise<CompanyAsset> {
  const raw = await requestJson<RawAsset>(
    `/api/v1/dashboard/assets/${encodeURIComponent(id)}/assignments`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignment_mode: input.assignmentMode,
        agent_ids: input.assignmentMode === "all" ? [] : input.agentIds,
      }),
    },
  );
  return mapAsset(raw);
}
