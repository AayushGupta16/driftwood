import { useCallback, useEffect, useMemo, useState } from "react";
import { LoggedOutView, ToastProvider } from "./Dashboard";
import { GodModeButton, ImpersonationBanner } from "./GodMode";
import { Wordmark } from "./components/Chrome";
import { AgentChatComposer, AgentChatThread, ImportFromSlackButton } from "./components/AgentChat";
import { type AgentChat, agentDisplayName as displayName, readErrorDetail, useAgentChat } from "./components/useAgentChat";
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

type Step = {
  id?: string | null;
  text: string;
  status: "todo" | "doing" | "blocked" | "done" | "cancelled";
  evidence?: string | null;
};

type Goal = {
  id: string;
  outcome: string;
  status: "active" | "blocked" | "done" | "cancelled" | "superseded";
  priority?: "P0" | "P1" | "P2" | "P3" | null;
  deadline?: string | null;
  deadline_note?: string | null;
  next_action?: string | null;
  blocked_on?: string | null;
  steps: Step[];
};

type HumanNeed =
  | string
  | {
      id?: string | null;
      kind?: "review" | "decision" | "question" | null;
      question: string;
      context?: string | null;
      url?: string | null;
      link_label?: string | null;
      options?: { id: string; label: string; consequence?: string | null }[];
    };

type AgentState =
  | "running"
  | "partially_blocked"
  | "blocked"
  | "waiting_for_review"
  | "waiting"
  | "idle"
  | "complete"
  | "error";

type AgentStatus = {
  state: AgentState;
  whats_happening: string;
  goals: Goal[];
  needs_human: HumanNeed[];
  subagents: { name: string; task: string; status: string }[];
  latest_output: {
    title: string;
    summary?: string | null;
    url?: string | null;
    kind?: string | null;
  } | null;
};

type AgentCardData = {
  agent_id: string;
  paused: boolean;
  customer_health: number | null;
  is_running: boolean;
  attention_required: boolean;
  attention_reasons: string[];
  current_assignment: string | null;
  status: AgentStatus | null;
  status_updated_at: string | null;
  last_activity_at: string | null;
};

type DashboardPayload = {
  refreshed_at: string;
  agents: AgentCardData[];
};

function LoadingView() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span
        className="size-7 animate-spin rounded-full border-2 border-line border-t-tide"
        role="status"
        aria-label="Loading agents"
      />
    </div>
  );
}

function relativeTime(value: string | null, now: number) {
  if (!value) return "No update yet";
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// A deadline is a calendar date the agent had to submit as one; anything it
// wanted to SAY about the deadline is deadline_note. Parsed at midday so a
// date-only value cannot roll to the neighbouring day in another timezone.
function deadlineLabel(goal?: Goal | null) {
  if (!goal?.deadline) return null;
  const date = new Date(`${goal.deadline}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

// The card reads deadlines as a countdown (relative for urgency; the dialog
// keeps the absolute date for planning). Measured to 23:59 of the deadline
// day — the schema deliberately keeps deadline a bare date. Past a week the
// hours are noise; inside a day the days are. A settled goal gets the plain
// date back — a countdown on a finished goal is meaningless.
function dueShort(goal: Goal | null, now: number) {
  if (!goal?.deadline) return null;
  const at = new Date(`${goal.deadline}T23:59:59`).getTime();
  if (Number.isNaN(at)) return null;
  if (goal.status === "done" || goal.status === "cancelled") {
    const date = deadlineLabel(goal);
    return date ? `due ${date}` : null;
  }
  const hours = Math.floor(Math.abs(at - now) / 3600e3);
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  const span = days >= 7 ? `${days}d` : days === 0 ? `${rest}h` : `${days}d ${rest}h`;
  return at < now ? `${span} overdue` : `due in ${span}`;
}

function needQuestion(need: HumanNeed) {
  const question = typeof need === "string" ? need : need.question;
  return question.replace(/^Aayush:\s*/i, "").trim();
}

function needUrl(need: HumanNeed) {
  return typeof need === "string" ? null : outputUrl(need.url);
}

function outputUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function activeGoal(status: AgentStatus | null) {
  return status?.goals.find((goal) => goal.status === "active" || goal.status === "blocked") ?? status?.goals[0] ?? null;
}

function goalProgress(goal: Goal | null) {
  if (!goal?.steps.length) return null;
  const done = goal.steps.filter((step) => step.status === "done").length;
  return `${done}/${goal.steps.length}`;
}

function managerState(agent: AgentCardData): AgentState {
  if (agent.is_running) return "running";
  return agent.status?.state ?? "idle";
}

const stateLabels: Record<AgentState, string> = {
  running: "Running",
  partially_blocked: "Partly blocked",
  blocked: "Blocked",
  waiting_for_review: "Waiting for review",
  waiting: "Waiting",
  idle: "Idle",
  complete: "Complete",
  error: "Error",
};

function StatusSignal({ agent }: { agent: AgentCardData }) {
  const state = managerState(agent);
  // The needs-attention dot IS the state signal's dot ("merged" in
  // draft-inline-answers.html) — a separate corner badge next to this dot was
  // the rejected first attempt: two dots of different sizes ~10px apart.
  const open = agent.paused ? 0 : agent.status?.needs_human.length ?? 0;
  return (
    <span
      className="agent-state inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-ink-soft"
      data-state={state}
      data-needs-you={open > 0 || undefined}
    >
      <span className="agent-state-dot" aria-hidden="true" />
      {stateLabels[state]}
      {open > 0 && <span className="sr-only">, {open} question{open === 1 ? "" : "s"} waiting on you</span>}
    </span>
  );
}

function AgentCard({
  agent,
  now,
  busy,
  onOpen,
  onMessage,
  onHealth,
  onPause,
}: {
  agent: AgentCardData;
  now: number;
  busy: boolean;
  onOpen: () => void;
  onMessage: () => void;
  onHealth: (score: number) => void;
  onPause: () => void;
}) {
  const goal = activeGoal(agent.status);
  const goalMeta = [goalProgress(goal), dueShort(goal, now)].filter(Boolean).join(" · ");
  const goals = (agent.status?.goals ?? []).filter(
    (item) => item.status !== "cancelled" && item.status !== "superseded",
  );
  const cardGoals = goals.slice(0, 3);
  const latestOutput = agent.status?.latest_output;
  const href = outputUrl(latestOutput?.url);
  const needs = agent.status?.needs_human ?? [];
  const shownNeeds = needs.slice(0, 3);
  const updatedAt = agent.status_updated_at ?? agent.last_activity_at;
  const summary = agent.status?.whats_happening
    ?? agent.current_assignment
    ?? "This agent has not reported its status yet.";

  return (
    <article className="agent-card group relative flex min-w-0 flex-col p-5">
      <button type="button" onClick={onOpen} className="agent-card-hit absolute inset-0 z-0 cursor-pointer rounded-[inherit] border-0 bg-transparent" aria-label={`Open ${displayName(agent.agent_id)} details`} />
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">{displayName(agent.agent_id)}</h2>
          <StatusSignal agent={agent} />
        </div>

        {/* Need-to-know up top (flags, then the narrative); the middle of the
            card is every decision waiting on you; the goal stays a quiet line
            further down. */}
        {agent.attention_reasons.length > 0 && (
          <ul className="m-0 mt-4 list-none space-y-1.5 p-0 text-[12.5px] leading-[1.4] text-ink">
            {agent.attention_reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2">
                <span className="agent-attention-mark" aria-hidden="true" />
                <span className="agent-two-line-clamp">{reason}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="agent-summary-clamp m-0 mt-4 text-[14px] leading-[1.5] text-ink">{summary}</p>

        {shownNeeds.length > 0 && (
          <div className="agent-action mt-4 px-3 py-2.5 text-[12.5px] leading-[1.45] text-ink">
            <span className="block text-[11.5px] font-medium text-tide-deep">
              {shownNeeds.length === 1
                ? needKind(shownNeeds[0]) === "review" ? "Needs your eyes" : "Your action"
                : "Decisions for you"}
            </span>
            <ul className="m-0 list-none p-0">
              {shownNeeds.map((item, index) => (
                <li key={needKey(item, index)} className={index === 0 ? "mt-1" : "mt-1.5 border-t border-tide/15 pt-1.5"}>
                  <span className="agent-two-line-clamp block">{needQuestion(item)}</span>
                </li>
              ))}
            </ul>
            {needs.length > shownNeeds.length && (
              <span className="mt-1.5 block text-[11.5px] font-medium text-tide-deep/85">
                + {needs.length - shownNeeds.length} more
              </span>
            )}
          </div>
        )}

        {/* With decisions on the card the goal stays one quiet line; with
            nothing waiting, spend that space on the goals and their due
            dates. Progress/Next and the step list live in the dialog. */}
        {needs.length > 0
          ? goal && (
            <p className="agent-two-line-clamp m-0 mt-4 border-t border-line pt-3 text-[12.5px] leading-[1.45] text-ink-soft">
              <span className="text-ink">{goal.outcome}</span>
              {goalMeta && <> · {goalMeta}</>}
            </p>
          )
          : cardGoals.length > 0 && (
            <ul className="m-0 mt-4 list-none space-y-2 border-t border-line p-0 pt-3">
              {cardGoals.map((item) => {
                const meta = [item.status === "blocked" ? "blocked" : null, goalProgress(item), dueShort(item, now)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={item.id} className="agent-two-line-clamp text-[12.5px] leading-[1.45] text-ink-soft">
                    <span className="text-ink">{item.outcome}</span>
                    {meta && <> · {meta}</>}
                  </li>
                );
              })}
              {goals.length > cardGoals.length && (
                <li className="text-[11.5px] text-ink-faint">+ {goals.length - cardGoals.length} more goals</li>
              )}
            </ul>
          )}

        {latestOutput && href && (
          <a href={href} target="_blank" rel="noreferrer" className="pointer-events-auto relative z-20 mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-[12.5px] no-underline" onClick={(event) => event.stopPropagation()}>
            <span className="min-w-0">
              <span className="block text-[11.5px] text-ink-soft">Latest output</span>
              <span className="mt-0.5 block truncate font-medium text-ink">{latestOutput.title}</span>
            </span>
            <span className="shrink-0 font-medium text-tide">Open</span>
          </a>
        )}
      </div>

      <div className="pointer-events-auto relative z-20 mt-5">
        <div className="flex items-center justify-between border-t border-line pt-3 text-[11.5px] text-ink-soft">
          <span>{updatedAt ? "Status updated" : "Status"}</span>
          <span>{relativeTime(updatedAt, now)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1" role="group" aria-label={`${displayName(agent.agent_id)} customer health`}>
            <span className="mr-1 text-[11.5px] text-ink-soft">Health</span>
            {[1, 2, 3, 4].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onHealth(score)}
                disabled={busy}
                aria-pressed={agent.customer_health === score}
                className={`flex size-11 cursor-pointer items-center justify-center rounded-full border text-[11.5px] font-medium disabled:cursor-wait disabled:opacity-50 sm:size-7 ${
                  agent.customer_health === score
                    ? "border-tide bg-tide text-white"
                    : "border-line bg-surface text-ink-soft hover:border-tide/60 hover:text-tide"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Still an anchor so cmd-click and middle-click open the standalone
                page; a plain click keeps you here and opens the dialog's
                Messages tab instead of navigating away. */}
            <a
              href={`/dashboard/agents/${encodeURIComponent(agent.agent_id)}`}
              onClick={(event) => {
                event.stopPropagation();
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onMessage();
              }}
              className="min-h-11 cursor-pointer content-center rounded-full border border-tide/40 bg-surface px-3 py-1.5 text-[11.5px] font-medium text-tide no-underline hover:bg-tide-wash sm:min-h-0"
            >
              Message
            </a>
            <button
              type="button"
              onClick={onPause}
              disabled={busy}
              className="min-h-11 cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] font-medium text-ink-soft hover:border-ink-faint hover:text-ink disabled:cursor-wait disabled:opacity-50 sm:min-h-0"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

type DetailTab = "status" | "messages";

function AgentDetail({
  agent,
  initialTab,
  onClose,
  onAnswered,
}: {
  agent: AgentCardData;
  initialTab: DetailTab;
  onClose: () => void;
  onAnswered: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>(initialTab);
  // Mounted for the whole dialog, not just the Messages tab, so a half-typed
  // message survives a look back at the status.
  const chat = useAgentChat(agent.agent_id);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Escape out of the composer first — closing the dialog would throw the
      // draft away.
      const target = event.target;
      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
        target.blur();
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/35 px-4 py-[6vh]"
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName(agent.agent_id)} details`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl rounded-[16px] border border-line bg-surface p-5 shadow-win sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-[23px] font-semibold tracking-[-0.015em]">{displayName(agent.agent_id)}</h2>
            <div className="mt-2"><StatusSignal agent={agent} /></div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:text-ink">
            Close
          </button>
        </div>

        <div className="mt-5 flex items-center gap-4 border-b border-line" role="tablist" aria-label="Agent detail sections">
          {([["status", "Status"], ["messages", "Messages"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-0.5 pb-2.5 text-[13px] font-medium ${
                tab === id ? "border-tide text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "messages" ? (
          <ConversationPanel agent={agent} chat={chat} />
        ) : (
          <AgentStatusPanel agent={agent} onAnswered={onAnswered} />
        )}
      </div>
    </div>
  );
}

// The same conversation as /dashboard/agents/<id>, in the dialog you get from
// clicking a card — so answering an agent never costs a page load.
function ConversationPanel({ agent, chat }: { agent: AgentCardData; chat: AgentChat }) {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[12.5px] text-ink-soft">
          {chat.data
            ? `${chat.data.online ? "Online" : "Offline"}${chat.data.paused ? " · archived" : ""} · also in Slack`
            : "Loading conversation"}
        </p>
        <div className="flex items-center gap-3">
          <ImportFromSlackButton
            chat={chat}
            className="cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-ink-soft hover:text-tide disabled:cursor-wait disabled:opacity-60"
          />
          <a
            href={`/dashboard/agents/${encodeURIComponent(agent.agent_id)}`}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-medium text-tide no-underline hover:text-tide-deep"
          >
            Open full page
          </a>
        </div>
      </div>

      {chat.error && (
        <div className="mt-3 rounded-xl border border-line bg-sand/50 px-4 py-3 text-[13px] text-ink">{chat.error}</div>
      )}
      {chat.notice && (
        <p className="m-0 mt-3 text-[12.5px] text-ink-soft" role="status">{chat.notice}</p>
      )}

      <div className="mt-3 flex h-[min(56vh,28rem)] flex-col">
        <AgentChatThread chat={chat} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4 pr-1" />
        <AgentChatComposer chat={chat} hint={false} className="border-t border-line pt-3" />
      </div>
    </div>
  );
}

function needKind(need: HumanNeed): "review" | "decision" | "question" {
  if (typeof need === "string") return "question";
  if (need.kind === "review" || (need.url && need.kind !== "decision")) return "review";
  if (need.kind === "decision" || (need.options?.length ?? 0) > 0) return "decision";
  return "question";
}

function needKey(need: HumanNeed, index: number) {
  return typeof need === "string" ? `${need}-${index}` : need.id ?? `${need.question}-${index}`;
}

function AgentStatusPanel({
  agent,
  onAnswered,
}: {
  agent: AgentCardData;
  onAnswered: () => void;
}) {
  // Draft answers per ask, keyed by the ask's stable id. Deliberately NOT the
  // chat composer's state: the integration notes call out that routing these
  // through the composer would clobber a half-typed message.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const needs = agent.status?.needs_human ?? [];
  const answerable = needs.filter(
    (need): need is Exclude<HumanNeed, string> => typeof need !== "string" && !!need.id,
  );
  const filled = answerable.filter((need) => (answers[need.id as string] ?? "").trim());

  async function sendAnswers() {
    if (!filled.length || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/v1/admin/agents/${encodeURIComponent(agent.agent_id)}/asks/answers`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: filled.map((need) => ({
              slug: need.id,
              text: (answers[need.id as string] ?? "").trim(),
            })),
          }),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorDetail(response, `Send returned ${response.status}`));
      }
      setAnswers({});
      setNotice(
        `Sent ${filled.length} answer${filled.length === 1 ? "" : "s"} to the agent.`,
      );
      onAnswered();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not send answers");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
        <p className="m-0 mt-6 text-[15px] leading-[1.55] text-ink">{agent.status?.whats_happening ?? "No status reported."}</p>

        <section className="mt-7">
          <h3 className="m-0 text-[14px] font-semibold">Goals</h3>
          <div className="mt-3 flex flex-col gap-3">
            {(agent.status?.goals ?? []).map((goal) => (
              <div key={goal.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <strong className="text-[14px] font-semibold">{goal.outcome}</strong>
                  <span className="text-[12px] text-ink-soft">
                    {[goal.priority, goal.status, deadlineLabel(goal)].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {goal.next_action && <p className="m-0 mt-2 text-[13px] text-ink-soft"><span className="font-medium text-ink">Next:</span> {goal.next_action}</p>}
                {goal.deadline_note && (
                  <p className="m-0 mt-2 text-[13px] text-ink-soft">
                    <span className="font-medium text-ink">Deadline:</span> {goal.deadline_note}
                  </p>
                )}
                {goal.steps.length > 0 && (
                  <ul className="m-0 mt-3 flex list-none flex-col gap-2 border-t border-line pt-3 p-0">
                    {goal.steps.map((step, index) => (
                      <li key={step.id ?? `${step.text}-${index}`} className="flex items-start gap-2 text-[13px] text-ink-soft">
                        <span className="agent-step-mark mt-[2px]" data-status={step.status} aria-hidden="true" />
                        <span>{step.text}{step.evidence ? <span className="block text-[11.5px] text-ink-faint">{step.evidence}</span> : null}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {!agent.status?.goals.length && <p className="m-0 text-[13px] text-ink-soft">No goals reported.</p>}
          </div>
        </section>

        {agent.status?.needs_human.length ? (
          <section className="mt-7">
            <h3 className="m-0 text-[14px] font-semibold">Questions for you</h3>
            <div className="mt-3 flex flex-col gap-3">
              {needs.map((need, index) => {
                const kind = needKind(need);
                const slug = typeof need === "string" ? null : (need.id ?? null);
                const value = slug ? (answers[slug] ?? "") : "";
                return (
                  <div key={needKey(need, index)} className="rounded-xl border border-line p-4">
                    <p className="m-0 text-[13.5px] font-medium">{needQuestion(need)}</p>
                    {typeof need !== "string" && need.context && <p className="m-0 mt-1.5 text-[12.5px] leading-[1.5] text-ink-soft">{need.context}</p>}
                    {kind === "review" && needUrl(need) && (
                      <a href={needUrl(need) ?? undefined} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full border border-tide bg-tide px-3.5 py-1.5 text-[12.5px] font-medium text-white no-underline hover:bg-tide-deep">
                        {typeof need === "string" ? "Open review" : need.link_label || "Open review"}
                      </a>
                    )}
                    {kind !== "review" && needUrl(need) && (
                      <a href={needUrl(need) ?? undefined} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[12.5px] font-medium text-tide no-underline hover:text-tide-deep">
                        {typeof need === "string" ? "Open link" : need.link_label || "Open link"}
                      </a>
                    )}
                    {typeof need !== "string" && need.options?.length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {need.options.map((option) => {
                          const selected = slug !== null && value === option.label;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={!slug}
                              aria-pressed={selected}
                              onClick={() =>
                                slug &&
                                setAnswers((current) => ({
                                  ...current,
                                  // Clicking the selected option un-picks it, so a
                                  // mis-click is undoable without the text field.
                                  [slug]: selected ? "" : option.label,
                                }))
                              }
                              className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-[12.5px] ${
                                selected
                                  ? "border-tide bg-tide-wash text-ink"
                                  : "border-line bg-surface text-ink hover:border-tide/40"
                              }`}
                            >
                              <strong className="font-medium">{option.label}</strong>
                              {option.consequence && <span className="mt-1 block text-ink-soft">{option.consequence}</span>}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    {slug && (
                      <input
                        type="text"
                        value={value}
                        onChange={(event) =>
                          setAnswers((current) => ({ ...current, [slug]: event.target.value }))
                        }
                        placeholder={kind === "decision" ? "Pick an option above or write your own" : "Answer"}
                        className="mt-3 w-full rounded-[10px] border border-line bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:border-tide focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {answerable.length > 0 && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[12px] text-ink-soft">
                  {agent.is_running
                    ? "Agent is mid-turn; answers would be lost. Try again in a few minutes."
                    : notice ?? `${filled.length} of ${answerable.length} answered`}
                </span>
                <button
                  type="button"
                  onClick={() => void sendAnswers()}
                  disabled={!filled.length || sending || agent.is_running}
                  className="shrink-0 cursor-pointer rounded-full border border-tide bg-tide px-4 py-2 text-[12.5px] font-medium text-white hover:bg-tide-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending
                    ? "Sending"
                    : `Send answer${filled.length === 1 ? "" : "s"}`}
                </button>
              </div>
            )}
          </section>
        ) : null}

        {agent.status?.latest_output && (
          <section className="mt-7 border-t border-line pt-5">
            <h3 className="m-0 text-[14px] font-semibold">Latest output</h3>
            <p className="m-0 mt-2 text-[13px] font-medium">{agent.status.latest_output.title}</p>
            {agent.status.latest_output.summary && <p className="m-0 mt-1 text-[12.5px] leading-[1.5] text-ink-soft">{agent.status.latest_output.summary}</p>}
            {outputUrl(agent.status.latest_output.url) && (
              <a href={outputUrl(agent.status.latest_output.url) ?? undefined} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[12.5px] font-medium text-tide no-underline hover:text-tide-deep">Open output</a>
            )}
          </section>
        )}
    </>
  );
}

export default function Agents() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("not authenticated");
        return (await response.json()) as User;
      })
      .then((user) => {
        if (!cancelled) setAuth(user.is_admin ? { status: "ok", user } : { status: "denied" });
      })
      .catch(() => !cancelled && setAuth({ status: "denied" }));
    return () => { cancelled = true; };
  }, []);

  return (
    <ToastProvider>
      <div className="agents-page relative flex min-h-[100dvh] flex-col overflow-x-clip">
        <a href="#agents-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-[13px] focus:text-ink">Skip to agents</a>
        {auth.status === "loading" && <LoadingView />}
        {auth.status === "denied" && <LoggedOutView />}
        {auth.status === "ok" && <AgentsView user={auth.user} />}
      </div>
    </ToastProvider>
  );
}

function AgentsView({ user }: { user: User }) {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<DetailTab>("status");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    try {
      const response = await fetch("/api/v1/admin/agents/dashboard", { credentials: "include" });
      if (!response.ok) throw new Error(`Agent dashboard returned ${response.status}`);
      const next = (await response.json()) as DashboardPayload;
      setPayload(next);
      setError(null);
      return true;
    } catch (reason) {
      if (!quiet) setError(reason instanceof Error ? reason.message : "Could not load agents");
      return false;
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setNow(Date.now());
      void load();
    }, 0);
    const poll = window.setInterval(() => void load(true), 15000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [load]);

  const active = useMemo(() => payload?.agents.filter((agent) => !agent.paused) ?? [], [payload]);
  const archived = useMemo(() => payload?.agents.filter((agent) => agent.paused) ?? [], [payload]);
  const waitingCount = useMemo(
    () => active.filter((agent) => (agent.status?.needs_human.length ?? 0) > 0).length,
    [active],
  );
  const selected = payload?.agents.find((agent) => agent.agent_id === selectedId) ?? null;
  const displayUserName = user.name || user.email;

  async function mutate(path: string, init: RequestInit, agentId: string) {
    setBusyId(agentId);
    setNotice(null);
    try {
      const response = await fetch(path, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
      if (!response.ok) throw new Error(`Update returned ${response.status}`);
      await load(true);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  // Re-reads what the backend already stores from turn events. It messages no
  // agent: asking the fleet to restate its status spent a model turn per agent
  // and interrupted the ones that were mid-turn. A failure paints the error
  // box, so the notice only claims a refresh that happened.
  async function refreshStatuses() {
    setRefreshing(true);
    setNotice(null);
    const loaded = await load();
    setRefreshing(false);
    if (loaded) setNotice("Statuses updated");
  }

  async function handleLogout() {
    try { await fetch("/auth/logout", { method: "POST", credentials: "include" }); }
    finally { window.location.href = "/dashboard"; }
  }

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="text-[18px] text-ink no-underline"><Wordmark markSize="size-8" /></a>
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={`${displayUserName}'s avatar`} className="hidden size-8 rounded-full border border-line object-cover sm:block" referrerPolicy="no-referrer" />
            ) : (
              <span className="hidden size-8 items-center justify-center rounded-full bg-tide text-[13px] font-semibold text-white sm:flex">{displayUserName[0]?.toUpperCase()}</span>
            )}
            <span className="hidden text-[14px] font-medium text-ink sm:inline">{displayUserName}</span>
            <span className="hidden sm:inline-flex"><GodModeButton /></span>
            <a href="/dashboard/seo-geo" className="hidden rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-soft no-underline hover:border-tide/40 hover:text-tide md:inline-flex">SEO / GEO</a>
            <a href="/dashboard/agents" aria-current="page" className="inline-flex rounded-full border border-tide bg-tide-wash px-3.5 py-2 text-[13px] font-medium text-tide no-underline">Agents</a>
            <button type="button" onClick={handleLogout} className="hidden cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:text-ink sm:inline-flex">Log out</button>
          </div>
        </nav>
      </header>

      <main id="agents-main" className="mx-auto w-full max-w-7xl flex-1 px-5 pb-14 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <a href="/dashboard" className="text-[13.5px] font-medium text-ink-soft no-underline hover:text-ink">Back to dashboard</a>
            <h1 className="m-0 mt-5 text-[clamp(1.7rem,3.6vw,2.2rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
              Agents
              {/* The signal survives scrolling past a card. */}
              {waitingCount > 0 && (
                <span className="agent-h1-count" role="status">
                  <span className="agent-h1-count-dot" aria-hidden="true" />
                  {waitingCount} waiting on you
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setArchivedOpen((open) => !open)} className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[12.5px] font-medium text-ink-soft hover:text-ink" aria-expanded={archivedOpen}>
              Archived {archived.length}
            </button>
            <button type="button" onClick={refreshStatuses} disabled={refreshing} className="cursor-pointer rounded-full border border-tide bg-tide px-3.5 py-2 text-[12.5px] font-medium text-white hover:bg-tide-deep disabled:cursor-wait disabled:opacity-60">
              {refreshing ? "Refreshing" : "Refresh status"}
            </button>
          </div>
        </div>

        {notice && <p className="m-0 mt-4 text-[12.5px] text-ink-soft" role="status">{notice}</p>}
        {error && <div className="mt-6 rounded-xl border border-line bg-sand/50 px-4 py-3 text-[13px] text-ink">{error}</div>}

        {archivedOpen && (
          <section className="mt-6 rounded-[14px] border border-line bg-paper p-4" aria-label="Archived agents">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-[14px] font-semibold">Archived agents</h2>
                <p className="m-0 mt-1 text-[12px] text-ink-soft">Archived is the same state as paused. Existing scheduled sends are unchanged.</p>
              </div>
              <button type="button" onClick={() => setArchivedOpen(false)} className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] text-ink-soft hover:text-ink">Close</button>
            </div>
            <div className="mt-4 grid gap-2">
              {archived.map((agent) => (
                <div key={agent.agent_id} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <strong className="block text-[13.5px] font-semibold">{displayName(agent.agent_id)}</strong>
                    <span className="mt-0.5 block truncate text-[12px] text-ink-soft">{agent.status?.whats_happening ?? "No status reported"}</span>
                  </div>
                  <button type="button" disabled={busyId === agent.agent_id} onClick={() => void mutate(`/api/v1/admin/agents/${encodeURIComponent(agent.agent_id)}/pause`, { method: "PATCH", body: JSON.stringify({ paused: false }) }, agent.agent_id)} className="cursor-pointer rounded-full border border-tide/40 bg-surface px-3 py-1.5 text-[12px] font-medium text-tide hover:bg-tide-wash disabled:cursor-wait disabled:opacity-50">Restore</button>
                </div>
              ))}
              {!archived.length && <p className="m-0 py-2 text-[12.5px] text-ink-soft">No archived agents.</p>}
            </div>
          </section>
        )}

        {!payload && !error ? (
          <div className="flex items-center justify-center py-24"><LoadingView /></div>
        ) : (
          // Rows stretch so the footer controls line up across a row.
          <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Active agents">
            {active.map((agent) => (
              <AgentCard
                key={agent.agent_id}
                agent={agent}
                now={now}
                busy={busyId === agent.agent_id}
                onOpen={() => { setSelectedTab("status"); setSelectedId(agent.agent_id); }}
                onMessage={() => { setSelectedTab("messages"); setSelectedId(agent.agent_id); }}
                onHealth={(score) => void mutate(`/api/v1/admin/agents/${encodeURIComponent(agent.agent_id)}/health`, { method: "PATCH", body: JSON.stringify({ score }) }, agent.agent_id)}
                onPause={() => void mutate(`/api/v1/admin/agents/${encodeURIComponent(agent.agent_id)}/pause`, { method: "PATCH", body: JSON.stringify({ paused: true }) }, agent.agent_id)}
              />
            ))}
            {payload && active.length === 0 && <p className="m-0 text-[13px] text-ink-soft">All customer agents are archived.</p>}
          </section>
        )}
      </main>
      {selected && (
        <AgentDetail
          key={selected.agent_id}
          agent={selected}
          initialTab={selectedTab}
          onClose={() => setSelectedId(null)}
          onAnswered={() => void load(true)}
        />
      )}
    </>
  );
}
