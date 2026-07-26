import { useCallback, useEffect, useMemo, useState } from "react";
import { LoggedOutView, ToastProvider } from "./Dashboard";
import { GodModeButton, ImpersonationBanner } from "./GodMode";
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
  next_action?: string | null;
  blocked_on?: string | null;
  progress?: string | string[] | null;
  steps: Step[];
};

type HumanNeed =
  | string
  | {
      id?: string | null;
      question: string;
      context?: string | null;
      options?: { id: string; label: string; consequence?: string | null }[];
    };

type AgentStatus = {
  schema_version: 1;
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

function displayName(agentId: string) {
  return agentId
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
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

function deadlineLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T23:59:59` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: value.length === 10 ? undefined : "numeric",
  }).format(date);
}

function needQuestion(need: HumanNeed) {
  return typeof need === "string" ? need : need.question;
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

function StatusSignal({ agent }: { agent: AgentCardData }) {
  if (agent.attention_required) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
        <span className="size-1.5 rounded-full bg-ink" aria-hidden="true" />
        Needs attention
      </span>
    );
  }
  if (agent.is_running) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-tide">
        <span className="size-1.5 rounded-full bg-tide" aria-hidden="true" />
        Running
      </span>
    );
  }
  return null;
}

function AgentCard({
  agent,
  now,
  busy,
  onOpen,
  onHealth,
  onPause,
}: {
  agent: AgentCardData;
  now: number;
  busy: boolean;
  onOpen: () => void;
  onHealth: (score: number) => void;
  onPause: () => void;
}) {
  const goal = activeGoal(agent.status);
  const progress = goalProgress(goal);
  const due = deadlineLabel(goal?.deadline);
  const visibleSteps = goal?.steps.filter((step) => step.status !== "cancelled").slice(0, 3) ?? [];
  const visibleProgress = goal?.progress
    ? (Array.isArray(goal.progress) ? goal.progress : [goal.progress]).slice(0, 2)
    : [];
  const workers = agent.status?.subagents.filter((worker) => worker.status === "working").length ?? 0;
  const latestOutput = agent.status?.latest_output;
  const href = outputUrl(latestOutput?.url);

  return (
    <article className="agent-card flex min-h-[390px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="cursor-pointer border-0 bg-transparent p-0 text-left text-[18px] font-semibold tracking-[-0.01em] text-ink hover:text-tide"
        >
          {displayName(agent.agent_id)}
        </button>
        <StatusSignal agent={agent} />
      </div>

      <p className="agent-copy-clamp m-0 mt-4 min-h-[63px] text-[14px] leading-[1.5] text-ink">
        {agent.status?.whats_happening ?? "This agent has not reported its status yet."}
      </p>

      {agent.is_running && agent.current_assignment && (
        <div className="mt-4 border-l-2 border-tide pl-3">
          <span className="block text-[12px] font-medium text-ink-soft">Working now</span>
          <span className="agent-copy-clamp mt-1 block text-[13px] leading-[1.45] text-ink">
            {agent.current_assignment}
          </span>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[12px] font-medium text-ink-soft">Current goal</span>
            <span className="agent-copy-clamp mt-1 block text-[13.5px] font-medium leading-[1.4] text-ink">
              {goal?.outcome ?? "No active goal reported"}
            </span>
          </div>
          {(progress || due) && <span className="shrink-0 text-[12px] text-ink-soft">{[progress, due].filter(Boolean).join(" · ")}</span>}
        </div>
        {visibleSteps.length > 0 && (
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {visibleSteps.map((step, index) => (
              <li key={step.id ?? `${step.text}-${index}`} className="flex items-start gap-2 text-[12.5px] leading-[1.35] text-ink-soft">
                <span className="agent-step-mark mt-[1px]" data-status={step.status} aria-hidden="true" />
                <span>{step.text}</span>
              </li>
            ))}
          </ul>
        )}
        {visibleSteps.length === 0 && visibleProgress.length > 0 && (
          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
            {visibleProgress.map((item) => (
              <li key={item} className="agent-copy-clamp flex items-start gap-2 text-[12.5px] leading-[1.35] text-ink-soft">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-faint" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {goal?.next_action && (
          <p className="m-0 mt-3 text-[12.5px] leading-[1.4] text-ink-soft">
            <span className="font-medium text-ink">Next:</span> {goal.next_action}
          </p>
        )}
      </div>

      {agent.status?.needs_human[0] && (
        <div className="mt-4 rounded-lg border border-line bg-sand/50 px-3 py-2.5 text-[12.5px] leading-[1.4] text-ink">
          <span className="font-medium">You:</span> {needQuestion(agent.status.needs_human[0])}
        </div>
      )}

      {latestOutput && (
        <div className="mt-4 flex items-start justify-between gap-3 border-t border-line pt-3">
          <div className="min-w-0">
            <span className="block text-[12px] text-ink-soft">Latest output</span>
            <span className="mt-0.5 block truncate text-[12.5px] font-medium text-ink">{latestOutput.title}</span>
          </div>
          {href && (
            <a href={href} target="_blank" rel="noreferrer" className="shrink-0 text-[12px] font-medium text-tide no-underline hover:text-tide-deep">
              Open
            </a>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between border-t border-line pt-3 text-[11.5px] text-ink-soft">
          <span>{workers} sub-agent{workers === 1 ? "" : "s"} reported working</span>
          <span>{relativeTime(agent.status_updated_at ?? agent.last_activity_at, now)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
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
    </article>
  );
}

function AgentDetail({ agent, onClose }: { agent: AgentCardData; onClose: () => void }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
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
        <p className="m-0 mt-6 text-[15px] leading-[1.55] text-ink">{agent.status?.whats_happening ?? "No status reported."}</p>

        {agent.attention_reasons.length > 0 && (
          <section className="mt-6 rounded-xl border border-line bg-sand/50 p-4">
            <h3 className="m-0 text-[13px] font-semibold text-ink">Needs attention</h3>
            <ul className="mb-0 mt-2 pl-5 text-[13px] leading-[1.6] text-ink-soft">
              {agent.attention_reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </section>
        )}

        <section className="mt-7">
          <h3 className="m-0 text-[14px] font-semibold">Goals</h3>
          <div className="mt-3 flex flex-col gap-3">
            {(agent.status?.goals ?? []).map((goal) => (
              <div key={goal.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <strong className="text-[14px] font-semibold">{goal.outcome}</strong>
                  <span className="text-[12px] text-ink-soft">
                    {[goal.priority, goal.status, deadlineLabel(goal.deadline)].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {goal.next_action && <p className="m-0 mt-2 text-[13px] text-ink-soft"><span className="font-medium text-ink">Next:</span> {goal.next_action}</p>}
                {goal.progress && (
                  <div className="mt-3 border-t border-line pt-3 text-[12.5px] leading-[1.5] text-ink-soft">
                    {Array.isArray(goal.progress)
                      ? <ul className="m-0 pl-5">{goal.progress.map((item) => <li key={item}>{item}</li>)}</ul>
                      : <p className="m-0">{goal.progress}</p>}
                  </div>
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
              {agent.status.needs_human.map((need, index) => (
                <div key={typeof need === "string" ? need : need.id ?? `${need.question}-${index}`} className="rounded-xl border border-line p-4">
                  <p className="m-0 text-[13.5px] font-medium">{needQuestion(need)}</p>
                  {typeof need !== "string" && need.context && <p className="m-0 mt-1.5 text-[12.5px] leading-[1.5] text-ink-soft">{need.context}</p>}
                  {typeof need !== "string" && need.options?.length ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {need.options.map((option) => (
                        <div key={option.id} className="rounded-lg border border-line px-3 py-2 text-[12.5px]">
                          <strong className="font-medium">{option.label}</strong>
                          {option.consequence && <span className="mt-1 block text-ink-soft">{option.consequence}</span>}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
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
      </div>
    </div>
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
      <div className="agents-page relative flex min-h-screen flex-col overflow-x-clip">
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
    } catch (reason) {
      if (!quiet) setError(reason instanceof Error ? reason.message : "Could not load agents");
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

  async function refreshStatuses() {
    setRefreshing(true);
    setNotice(null);
    try {
      const response = await fetch("/api/v1/admin/agents/status/bootstrap", { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error(`Refresh returned ${response.status}`);
      const result = (await response.json()) as { delivered: string[]; offline: string[] };
      setNotice(`Woke ${result.delivered.length} agents${result.offline.length ? `; ${result.offline.length} offline` : ""}.`);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not wake agents");
    } finally {
      setRefreshing(false);
    }
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
            <h1 className="m-0 mt-5 text-[clamp(1.7rem,3.6vw,2.2rem)] font-semibold leading-[1.08] tracking-[-0.015em]">Agents</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setArchivedOpen((open) => !open)} className="cursor-pointer rounded-full border border-line bg-surface px-3.5 py-2 text-[12.5px] font-medium text-ink-soft hover:text-ink" aria-expanded={archivedOpen}>
              Archived {archived.length}
            </button>
            <button type="button" onClick={refreshStatuses} disabled={refreshing} className="cursor-pointer rounded-full border border-tide bg-tide px-3.5 py-2 text-[12.5px] font-medium text-white hover:bg-tide-deep disabled:cursor-wait disabled:opacity-60">
              {refreshing ? "Waking agents" : "Refresh status"}
            </button>
          </div>
        </div>

        {notice && <p className="m-0 mt-4 text-[12.5px] text-ink-soft" role="status">{notice}</p>}
        {error && <div className="mt-6 rounded-xl border border-line bg-sand/50 px-4 py-3 text-[13px] text-ink">{error}</div>}

        {archivedOpen && (
          <section className="mt-6 rounded-[14px] border border-line bg-[#f8fafb] p-4" aria-label="Archived agents">
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
          <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Active agents">
            {active.map((agent) => (
              <AgentCard
                key={agent.agent_id}
                agent={agent}
                now={now}
                busy={busyId === agent.agent_id}
                onOpen={() => setSelectedId(agent.agent_id)}
                onHealth={(score) => void mutate(`/api/v1/admin/agents/${encodeURIComponent(agent.agent_id)}/health`, { method: "PATCH", body: JSON.stringify({ score }) }, agent.agent_id)}
                onPause={() => void mutate(`/api/v1/admin/agents/${encodeURIComponent(agent.agent_id)}/pause`, { method: "PATCH", body: JSON.stringify({ paused: true }) }, agent.agent_id)}
              />
            ))}
            {payload && active.length === 0 && <p className="m-0 text-[13px] text-ink-soft">All customer agents are archived.</p>}
          </section>
        )}
      </main>
      {selected && <AgentDetail agent={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
