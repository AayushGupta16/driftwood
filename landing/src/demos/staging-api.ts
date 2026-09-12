/* The fetch layer behind /dashboard/demos. Same-origin relative paths and
   cookie auth, like the other dashboard fetchers.

   Two endpoints carry the page today: GET /dashboard/reviews (Staging) and
   GET /dashboard/sends (Queue and Sent), plus POST /reviews/decide for every
   decision. The per-row queue controls (send-next, hold, resume, pull,
   hold-all, resume-all) and the staging pin are being added on the backend;
   until they exist they answer 404, so every one of them reports `missing`
   instead of throwing and the page says so beside the control. */

import { getAccounts } from "../accounts/api";
import { accountLabel } from "../accounts/model";
import { getPolicy } from "../approvals/api";
import type { ApprovalPolicy } from "../approvals/model";
import { getSettings, type SendSchedule } from "../settings/api";
import type { QueueStat, ReviewItem, SendRow } from "./staging-model";

export type { ApprovalPolicy, SendSchedule };

export type ReviewsPage = {
  pending: ReviewItem[];
  total_pending: number;
  queue_stats?: QueueStat[];
};

export type SendsPage = { sends: SendRow[]; total: number };

export type Decision = {
  item_id: string;
  decision: "approve" | "deny";
  reason?: string;
};

export type DecideResult = {
  approved: number;
  denied: number;
  skipped: string[];
  queued: string[];
};

/* What a write reports back. `missing` is the 404 that means "the backend
   does not serve this yet" — the page re-enables the control and says so,
   rather than showing a failure the customer cannot act on. */
export type Outcome = { ok: true } | { ok: false; missing: boolean; message: string };

const FALLBACK = "That did not go through. Try it again.";

/* The backend's error envelope is {"error": {"code", "detail"}}; some
   layers answer {"detail": ...}. Both read the same here. */
async function errorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { detail?: unknown };
      detail?: unknown;
    };
    const detail = body.error?.detail ?? body.detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    /* A proxy can answer HTML; keep the fallback. */
  }
  return fallback;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  if (!response.ok) throw new Error(await errorDetail(response, FALLBACK));
  return (await response.json()) as T;
}

async function post(path: string, init?: RequestInit): Promise<Outcome> {
  try {
    const response = await fetch(path, {
      method: "POST",
      credentials: "include",
      ...init,
    });
    if (response.ok) return { ok: true };
    return {
      ok: false,
      missing: response.status === 404 || response.status === 405,
      message: await errorDetail(response, FALLBACK),
    };
  } catch {
    return { ok: false, missing: false, message: FALLBACK };
  }
}

export const REVIEW_CHUNK = 100;
export const SEND_CHUNK = 100;
/* Same ceiling the review queue uses: pages fetched per list, at most. */
export const PAGE_GUARD = 100;

export const fetchReviewsPage = (offset: number) =>
  getJson<ReviewsPage>(
    `/api/v1/dashboard/reviews?limit=${REVIEW_CHUNK}&offset=${offset}`,
  );

export const fetchQueuePage = (offset: number) =>
  getJson<SendsPage>(
    `/api/v1/dashboard/sends?limit=${SEND_CHUNK}&offset=${offset}`,
  );

export const fetchSentPage = () =>
  getJson<SendsPage>(`/api/v1/dashboard/sends?view=sent&limit=${SEND_CHUNK}`);

/* Every decision on a card is one POST, so approving a demo is one agent
   wake whether it carries one item or three. If-Match is the approval
   policy version the card was rendered against: a policy change between
   render and press has to fail loudly, not decide under the new rules. */
export async function decide(
  decisions: Decision[],
  policyVersion: number,
): Promise<DecideResult> {
  const response = await fetch("/api/v1/dashboard/reviews/decide", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "If-Match": String(policyVersion),
    },
    body: JSON.stringify(decisions),
  });
  if (!response.ok)
    throw new Error(
      await errorDetail(response, "That decision did not go through. Try it again."),
    );
  return (await response.json()) as DecideResult;
}

/* Keeps one demo in Staging past the 3-day expiry. */
export const pinDemo = (itemId: string) =>
  post(`/api/v1/dashboard/reviews/${encodeURIComponent(itemId)}/pin`);

export type QueueAction = "send-next" | "hold" | "resume" | "pull";

export const queueAction = (sendId: string, action: QueueAction) =>
  post(`/api/v1/dashboard/sends/${encodeURIComponent(sendId)}/${action}`);

export const holdAllSends = () => post("/api/v1/dashboard/sends/hold-all");
export const resumeAllSends = () => post("/api/v1/dashboard/sends/resume-all");

/* ---------- the accounts a demo can go out from ---------- */

export type SenderPools = { email: string[]; linkedin: string[] };

export const EMPTY_SENDERS: SenderPools = { email: [], linkedin: [] };

/* Only active accounts can send, so only they can be named on a queue row. */
export async function fetchSenders(): Promise<SenderPools> {
  const page = await getAccounts();
  return {
    email: page.email.filter((row) => row.status === "active").map(accountLabel),
    linkedin: page.linkedin
      .filter((row) => row.status === "active")
      .map(accountLabel),
  };
}

/* ---------- replies, for the Replied badge on Sent ---------- */

/* Which leads answered. The reply feed is the channel-metrics drilldown
   (status=replied), the same source the Inbox reads. */
export async function fetchRepliedLeads(
  window: { start: string; end: string },
): Promise<ReadonlySet<string>> {
  const query = new URLSearchParams({
    start: window.start,
    end: window.end,
    status: "replied",
    limit: "100",
    offset: "0",
  });
  const page = await getJson<{ people: { lead_id: string | null }[] }>(
    `/api/v1/dashboard/channel-metrics?${query}`,
  );
  const ids = new Set<string>();
  for (const person of page.people) if (person.lead_id) ids.add(person.lead_id);
  return ids;
}

/* ---------- first loads, started at chunk eval ---------- */

/* A memoized promise: the sidebar's Demos count and the page itself read the
   same first page instead of asking twice. Unlike dashboard-shared's
   prefetch() this is re-readable, because two callers need it; retries and
   refreshes go straight to the fetchers above. */
function once<T>(start: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = start();
      pending.then(undefined, () => {});
    }
    return pending;
  };
}

export const firstReviewsPage = once(() => fetchReviewsPage(0));
export const firstQueuePage = once(() => fetchQueuePage(0));
export const firstSentPage = once(() => fetchSentPage());
export const approvalPolicy = once(() => getPolicy());
export const workspaceSettings = once(() => getSettings());
export const senderPools = once(() => fetchSenders());
