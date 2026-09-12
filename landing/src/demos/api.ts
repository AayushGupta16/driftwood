export type Demo = {
  demo_id: string;
  lead_id: string | null;
  lead_name: string | null;
  company_name: string;
  description: string | null;
  artifact_id: string;
  name: string;
  content_type: string;
  content_url: string;
  preview_url?: string | null;
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

export async function listDemos(query: string, offset: number, signal: AbortSignal): Promise<DemosPage> {
  // Deploy this client before the additive backend change. Older responses
  // contain only lead_id; normalize once so UI state always has a demo identity.
  const page = await request<DemosPage>(`/api/v1/dashboard/demos?${new URLSearchParams({ q: query, offset: String(offset), limit: "12" })}`, { signal });
  return { ...page, demos: page.demos.map((demo) => {
    const demoId = demo.demo_id ?? demo.lead_id;
    if (!demoId) throw new Error("This demo could not be loaded. Please refresh and try again.");
    return { ...demo, demo_id: demoId };
  }) };
}

export async function sendFeedback(demo: Demo, message: string, sentiment: Sentiment): Promise<void> {
  const result = await request<{ delivered: boolean }>(`/api/v1/dashboard/demos/${encodeURIComponent(demo.demo_id)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sentiment, artifact_id: demo.artifact_id, artifact_updated_at: demo.updated_at }),
  });
  if (!result.delivered) throw new Error("Your feedback could not be delivered. Please try again.");
}
