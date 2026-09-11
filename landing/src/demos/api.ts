export type Demo = {
  lead_id: string;
  lead_name: string | null;
  company_name: string;
  description: string | null;
  artifact_id: string;
  name: string;
  content_type: string;
  content_url: string;
  created_at: string;
  updated_at: string;
};

export type DemosPage = { demos: Demo[]; total: number; limit: number; offset: number };
export type Sentiment = "general" | "looks_good" | "needs_changes";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    try {
      const body = await response.json();
      if (typeof body.error?.detail === "string") message = body.error.detail;
    } catch { /* Keep the status when the proxy returns a non-JSON error. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function listDemos(query: string, offset: number, signal: AbortSignal): Promise<DemosPage> {
  return request(`/api/v1/dashboard/demos?${new URLSearchParams({ q: query, offset: String(offset), limit: "12" })}`, { signal });
}

export async function sendFeedback(demo: Demo, message: string, sentiment: Sentiment): Promise<void> {
  const result = await request<{ delivered: boolean }>(`/api/v1/dashboard/demos/${encodeURIComponent(demo.lead_id)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sentiment, artifact_id: demo.artifact_id, artifact_updated_at: demo.updated_at }),
  });
  if (!result.delivered) throw new Error("Your feedback could not be delivered. Please try again.");
}
