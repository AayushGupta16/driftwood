import { useCallback, useEffect, useMemo, useState } from "react";

// State for the founder↔agent conversation, shared by the full page at
// /dashboard/admin/agents/<id> and the panel inside an agent card's dialog. One
// implementation on purpose: the send guards and the refusal reasons are the
// fiddly part, and two copies would drift.

export type AgentMessage = {
  id: string;
  role: "founder" | "agent" | "customer" | "system";
  text: string;
  source: string;
  created_at: string;
};

export type AgentConversation = {
  agent_id: string;
  paused: boolean;
  online: boolean;
  can_send: boolean;
  messages: AgentMessage[];
  oldest_at: string | null;
  has_more: boolean;
};

// The backend answers failures as {"error": {"code", "detail"}}. The reason a
// send was refused — paused, offline, no channel — is the whole value of the
// response, so it has to survive to the screen rather than becoming a status
// code. Same reader as the review queue uses.
export async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { detail?: unknown } };
    const detail = data.error?.detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    // non-JSON body — use the fallback
  }
  return fallback;
}

export function agentDisplayName(agentId: string) {
  return agentId
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export type AgentChat = ReturnType<typeof useAgentChat>;

export function useAgentChat(agentId: string) {
  const [data, setData] = useState<AgentConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [older, setOlder] = useState<AgentMessage[]>([]);

  const base = `/api/v1/admin/agents/${encodeURIComponent(agentId)}/conversation`;

  const load = useCallback(
    async (quiet = false) => {
      try {
        const response = await fetch(base, { credentials: "include" });
        if (!response.ok) throw new Error(`Conversation returned ${response.status}`);
        setData((await response.json()) as AgentConversation);
        setError(null);
      } catch (reason) {
        if (!quiet) setError(reason instanceof Error ? reason.message : "Could not load");
      }
    },
    [base],
  );

  useEffect(() => {
    // Off the effect body, as on the agents dashboard, so the first fetch is not
    // a synchronous setState during mount.
    const initial = window.setTimeout(() => void load(), 0);
    // Fast enough that a reply feels like it arrives, slow enough to be free.
    const poll = window.setInterval(() => void load(true), 4000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(poll);
    };
  }, [load]);

  const messages = useMemo(() => [...older, ...(data?.messages ?? [])], [older, data]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch(base, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error(await readErrorDetail(response, `Send returned ${response.status}`));
      }
      setData((await response.json()) as AgentConversation);
      setDraft("");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not send");
    } finally {
      setSending(false);
    }
  }, [base, draft, sending]);

  const loadEarlier = useCallback(async () => {
    const cursor = messages[0]?.created_at ?? data?.oldest_at;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`${base}?before=${encodeURIComponent(cursor)}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await readErrorDetail(response, `Load returned ${response.status}`));
      }
      const page = (await response.json()) as AgentConversation;
      setOlder((current) => [...page.messages, ...current]);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not load earlier");
    } finally {
      setLoadingMore(false);
    }
  }, [base, data, loadingMore, messages]);

  const backfill = useCallback(async () => {
    setBackfilling(true);
    setNotice(null);
    try {
      const response = await fetch(`${base}/backfill`, { method: "POST", credentials: "include" });
      if (!response.ok) {
        throw new Error(await readErrorDetail(response, `Import returned ${response.status}`));
      }
      const result = (await response.json()) as { scanned: number; imported: number };
      setNotice(`Imported ${result.imported} messages from ${result.scanned} scanned in Slack.`);
      setOlder([]);
      await load(true);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not import");
    } finally {
      setBackfilling(false);
    }
  }, [base, load]);

  const blocked = data ? data.paused || !data.can_send || !data.online : false;
  const blockedReason = !data
    ? null
    : !data.can_send
      ? "This agent has no channel bound, so it cannot be messaged."
      : data.paused
        ? "This agent is archived. Restore it on the agents page to send."
        : !data.online
          ? "This agent's gateway is offline right now."
          : null;

  return {
    agentId,
    data,
    messages,
    error,
    notice,
    draft,
    setDraft,
    send,
    sending,
    loadEarlier,
    loadingMore,
    backfill,
    backfilling,
    blocked,
    blockedReason,
  };
}
