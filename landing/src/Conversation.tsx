import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoggedOutView, ToastProvider } from "./Dashboard";
import { ImpersonationBanner } from "./GodMode";
import { Wordmark } from "./components/Chrome";
import "./agents.css";

type User = {
  email: string;
  name: string;
  avatar_url: string | null;
  is_admin?: boolean;
  impersonating?: boolean;
};

type AuthState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "ok"; user: User };

type Message = {
  id: string;
  role: "founder" | "agent" | "customer" | "system";
  text: string;
  source: string;
  created_at: string;
};

type Conversation = {
  agent_id: string;
  paused: boolean;
  online: boolean;
  can_send: boolean;
  messages: Message[];
  oldest_at: string | null;
  has_more: boolean;
};

// The backend answers failures as {"error": {"code", "detail"}}. The reason a
// send was refused — paused, offline, no channel — is the whole value of the
// response, so it has to survive to the screen rather than becoming a status
// code. Same reader as the review queue uses.
async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { detail?: unknown } };
    const detail = data.error?.detail;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    // non-JSON body — use the fallback
  }
  return fallback;
}

function displayName(agentId: string) {
  return agentId
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function agentIdFromPath() {
  const match = window.location.pathname.match(/^\/dashboard\/agents\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? "Today"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function clockLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    new Date(iso),
  );
}

// Messages carry Slack's own link and mention syntax, since that is the room
// they were written for. There is no markdown renderer in this app and the CSP
// forbids pulling one in, so this unwraps the two forms that would otherwise
// read as garbage and leaves everything else as plain text. Building React
// nodes rather than HTML means there is no injection surface here at all.
const SLACK_TOKEN = /<(https?:\/\/[^>|]+)(?:\|([^>]+))?>|<@([A-Z0-9]+)>|(https?:\/\/\S+)/g;

function formatText(text: string) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  SLACK_TOKEN.lastIndex = 0;
  while ((match = SLACK_TOKEN.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [raw, linked, label, mention, bare] = match;
    const href = linked || bare;
    if (href) {
      nodes.push(
        <a
          key={`${match.index}-${raw}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-tide underline-offset-2 hover:text-tide-deep"
        >
          {label || href.replace(/^https?:\/\//, "")}
        </a>,
      );
    } else if (mention) {
      nodes.push(
        <span key={`${match.index}-${raw}`} className="font-medium text-ink">
          @{mention === "U0ALN8B9GH0" ? "Aayush" : mention}
        </span>,
      );
    }
    last = match.index + raw.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function Bubble({ message }: { message: Message }) {
  const mine = message.role === "founder";
  const label =
    message.role === "founder"
      ? "You"
      : message.role === "customer"
        ? "Customer"
        : message.role === "system"
          ? "System"
          : "Agent";
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className="mb-1 flex items-baseline gap-2 text-[11.5px] text-ink-soft">
        <span className="font-medium">{label}</span>
        <span>{clockLabel(message.created_at)}</span>
      </div>
      <div
        className={`max-w-[min(46rem,88%)] whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-[1.55] ${
          mine
            ? "bg-tide-wash text-ink"
            : "border border-line bg-surface text-ink"
        }`}
      >
        {formatText(message.text)}
      </div>
    </div>
  );
}

function ConversationView({ user, agentId }: { user: User; agentId: string }) {
  const [data, setData] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [older, setOlder] = useState<Message[]>([]);
  const bottom = useRef<HTMLDivElement | null>(null);
  const lastId = useRef<string | null>(null);

  const base = `/api/v1/admin/agents/${encodeURIComponent(agentId)}/conversation`;

  const load = useCallback(
    async (quiet = false) => {
      try {
        const response = await fetch(base, { credentials: "include" });
        if (!response.ok) throw new Error(`Conversation returned ${response.status}`);
        setData((await response.json()) as Conversation);
        setError(null);
      } catch (reason) {
        if (!quiet) setError(reason instanceof Error ? reason.message : "Could not load");
      }
    },
    [base],
  );

  useEffect(() => {
    void load();
    // Fast enough that a reply feels like it arrives, slow enough to be free.
    const poll = window.setInterval(() => void load(true), 4000);
    return () => window.clearInterval(poll);
  }, [load]);

  const messages = useMemo(
    () => [...older, ...(data?.messages ?? [])],
    [older, data],
  );

  // Follow the conversation only when it actually grew, so reading older
  // history is not yanked back to the bottom by the next poll.
  useEffect(() => {
    const newest = messages.at(-1)?.id ?? null;
    if (newest && newest !== lastId.current) {
      lastId.current = newest;
      bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  async function send() {
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
      setData((await response.json()) as Conversation);
      setDraft("");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  async function loadEarlier() {
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
      const page = (await response.json()) as Conversation;
      setOlder((current) => [...page.messages, ...current]);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not load earlier");
    } finally {
      setLoadingMore(false);
    }
  }

  async function backfill() {
    setBackfilling(true);
    setNotice(null);
    try {
      const response = await fetch(`${base}/backfill`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await readErrorDetail(response, `Import returned ${response.status}`));
      }
      const result = (await response.json()) as { scanned: number; imported: number };
      setNotice(
        `Imported ${result.imported} messages from ${result.scanned} scanned in Slack.`,
      );
      setOlder([]);
      await load(true);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not import");
    } finally {
      setBackfilling(false);
    }
  }

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

  let lastDay = "";

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="text-[18px] text-ink no-underline">
            <Wordmark markSize="size-8" />
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-ink-soft sm:inline">{user.name || user.email}</span>
            <a
              href="/dashboard/agents"
              className="inline-flex rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-soft no-underline hover:border-tide/40 hover:text-tide"
            >
              All agents
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-6 pt-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.015em]">
              {displayName(agentId)}
            </h1>
            <p className="m-0 mt-1 text-[12.5px] text-ink-soft">
              {data
                ? `${data.online ? "Online" : "Offline"}${data.paused ? " · archived" : ""} · also in Slack`
                : "Loading"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void backfill()}
            disabled={backfilling}
            className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[12.5px] font-medium text-ink-soft hover:border-tide/40 hover:text-tide disabled:cursor-wait disabled:opacity-60"
          >
            {backfilling ? "Importing" : "Import from Slack"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-line bg-sand/50 px-4 py-3 text-[13px] text-ink">
            {error}
          </div>
        )}
        {notice && (
          <p className="m-0 mt-4 text-[12.5px] text-ink-soft" role="status">
            {notice}
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 py-5">
          {data && messages.length === 0 && (
            <p className="m-0 text-[13px] text-ink-soft">
              No conversation recorded yet. Earlier messages live in Slack — import them,
              or just send something below.
            </p>
          )}
          {data?.has_more && (
            <button
              type="button"
              onClick={() => void loadEarlier()}
              disabled={loadingMore}
              className="mx-auto cursor-pointer rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12px] font-medium text-ink-soft hover:text-ink disabled:cursor-wait"
            >
              {loadingMore ? "Loading" : "Load earlier"}
            </button>
          )}
          {messages.map((message) => {
            const day = dayLabel(message.created_at);
            const divider = day !== lastDay ? day : null;
            lastDay = day;
            return (
              <div key={message.id} className="flex flex-col gap-4">
                {divider && (
                  <div className="flex items-center gap-3 text-[11.5px] text-ink-soft">
                    <span className="h-px flex-1 bg-line" />
                    {divider}
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <Bubble message={message} />
              </div>
            );
          })}
          <div ref={bottom} />
        </div>

        <div className="sticky bottom-0 border-t border-line bg-paper pt-4">
          {blockedReason && (
            <p className="m-0 mb-2 text-[12.5px] text-ink-soft">{blockedReason}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder={`Message ${displayName(agentId)}`}
              disabled={blocked || sending}
              className="agent-composer min-h-[46px] w-full flex-1 resize-y rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-ink placeholder:text-ink-faint focus:border-tide focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={blocked || sending || !draft.trim()}
              className="shrink-0 cursor-pointer rounded-full border border-tide bg-tide px-4 py-2.5 text-[13px] font-medium text-white hover:bg-tide-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "Sending" : "Send"}
            </button>
          </div>
          <p className="m-0 mt-2 text-[11.5px] text-ink-soft">
            Goes straight to the agent and is copied into its Slack channel. Enter sends,
            Shift and Enter makes a new line.
          </p>
        </div>
      </main>
    </>
  );
}

export default function ConversationPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const agentId = agentIdFromPath();

  useEffect(() => {
    let cancelled = false;
    fetch("/auth/me", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((user: User | null) => {
        if (cancelled) return;
        setAuth(user?.is_admin ? { status: "ok", user } : { status: "denied" });
      })
      .catch(() => !cancelled && setAuth({ status: "denied" }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ToastProvider>
      <div className="agents-page flex min-h-[100dvh] flex-col overflow-x-clip bg-paper">
        {auth.status === "loading" ? (
          <div className="flex flex-1 items-center justify-center">
            <span
              className="size-7 animate-spin rounded-full border-2 border-line border-t-tide"
              role="status"
              aria-label="Loading conversation"
            />
          </div>
        ) : auth.status === "denied" || !agentId ? (
          <LoggedOutView />
        ) : (
          <ConversationView user={auth.user} agentId={agentId} />
        )}
      </div>
    </ToastProvider>
  );
}
