import { useEffect, useRef } from "react";
import { agentDisplayName, type AgentChat, type AgentMessage } from "./useAgentChat";

// The message thread and composer. State lives in ./useAgentChat;
// these are the two pieces the conversation page and the agent-card dialog both
// render, so they take a chat and no layout opinions beyond an overridable
// className.

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

function Bubble({ message }: { message: AgentMessage }) {
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
          mine ? "bg-tide-wash text-ink" : "border border-line bg-surface text-ink"
        }`}
      >
        {formatText(message.text)}
      </div>
    </div>
  );
}

export function ImportFromSlackButton({ chat, className }: { chat: AgentChat; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => void chat.backfill()}
      disabled={chat.backfilling}
      className={
        className ??
        "cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[12.5px] font-medium text-ink-soft hover:border-tide/40 hover:text-tide disabled:cursor-wait disabled:opacity-60"
      }
    >
      {chat.backfilling ? "Importing" : "Import from Slack"}
    </button>
  );
}

export function AgentChatThread({ chat, className }: { chat: AgentChat; className?: string }) {
  const bottom = useRef<HTMLDivElement | null>(null);
  const lastId = useRef<string | null>(null);
  const { messages } = chat;

  // Follow the conversation only when it actually grew, so reading older
  // history is not yanked back to the bottom by the next poll.
  useEffect(() => {
    const newest = messages.at(-1)?.id ?? null;
    if (newest && newest !== lastId.current) {
      lastId.current = newest;
      bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <div className={className ?? "flex min-h-0 flex-1 flex-col gap-4 py-5"}>
      {chat.data && messages.length === 0 && (
        <p className="m-0 text-[13px] text-ink-soft">
          No conversation recorded yet. Earlier messages live in Slack — import them, or just
          send something below.
        </p>
      )}
      {chat.data?.has_more && (
        <button
          type="button"
          onClick={() => void chat.loadEarlier()}
          disabled={chat.loadingMore}
          className="mx-auto cursor-pointer rounded-full border border-line bg-surface px-3.5 py-1.5 text-[12px] font-medium text-ink-soft hover:text-ink disabled:cursor-wait"
        >
          {chat.loadingMore ? "Loading" : "Load earlier"}
        </button>
      )}
      {messages.map((message, index) => {
        const day = dayLabel(message.created_at);
        const previous = index > 0 ? dayLabel(messages[index - 1].created_at) : null;
        const divider = day !== previous ? day : null;
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
  );
}

export function AgentChatComposer({
  chat,
  hint = true,
  className,
}: {
  chat: AgentChat;
  hint?: boolean;
  className?: string;
}) {
  return (
    <div className={className ?? "sticky bottom-0 border-t border-line bg-paper pt-4"}>
      {chat.blockedReason && (
        <p className="m-0 mb-2 text-[12.5px] text-ink-soft">{chat.blockedReason}</p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={chat.draft}
          onChange={(event) => chat.setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void chat.send();
            }
          }}
          rows={2}
          placeholder={`Message ${agentDisplayName(chat.agentId)}`}
          disabled={chat.blocked || chat.sending}
          className="agent-composer min-h-[46px] w-full flex-1 resize-y rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-ink placeholder:text-ink-faint focus:border-tide focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void chat.send()}
          disabled={chat.blocked || chat.sending || !chat.draft.trim()}
          className="shrink-0 cursor-pointer rounded-full border border-tide bg-tide px-4 py-2.5 text-[13px] font-medium text-white hover:bg-tide-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {chat.sending ? "Sending" : "Send"}
        </button>
      </div>
      {hint && (
        <p className="m-0 mt-2 text-[11.5px] text-ink-soft">
          Goes straight to the agent and is copied into its Slack channel. Enter sends, Shift and
          Enter makes a new line.
        </p>
      )}
    </div>
  );
}
