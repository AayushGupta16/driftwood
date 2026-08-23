/* /dashboard/admin/drift — the drift-run node graph, per agent.

   Agent pills come from /overview (every agent that has ever queued a run);
   the graph draws the selected agent's runs as chains hanging off the task
   hub, stages colored by what the judges actually said (drift_judgments),
   topology from the task's flow.json manifest served in the overview.
   Clicking a run or stage opens the detail rail, which fetches the full
   judgment payloads (scores, transcripts) for that run. Polls every 15s
   while any shown run is still active, like the Agents page. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../dashboard/AppShell";
import { LoggedOutView, ToastProvider } from "../dashboard/DashboardCommon";
import { AdminPanelControls, ImpersonationBanner } from "../GodMode";
import { CARD, relativeTime } from "../dashboard-shared";
import {
  fetchAgentRuns,
  fetchOverview,
  fetchRunDetail,
  type DriftOverview,
  type DriftRunDetail,
} from "./api";
import {
  buildGraph,
  fitView,
  layoutRadial,
  relaxGraph,
  runDuration,
  terminalFor,
  type DriftRun,
  type FlowManifest,
  type Graph,
  type GraphNode,
} from "./model";
import "./drift.css";

type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_admin?: boolean;
  impersonating?: boolean;
};

type AuthState = { status: "loading" } | { status: "denied" } | { status: "ok"; user: User };

const ACTIVE_STATES = new Set(["queued", "launching", "running"]);

/* Node stroke/fill from the design tokens only: ok green for pass/done,
   alert red for failures (the sanctioned internal-dashboard exception),
   tide for the agent/task/emissions, line-gray for anything neutral. */
function nodeTone(n: GraphNode): "good" | "bad" | "tide" | "muted" {
  if (n.type === "agent" || n.type === "task") return "tide";
  if (n.type === "run" || n.type === "end")
    return n.tone === "good" ? "good" : n.tone === "bad" ? "bad" : "muted";
  const s = n.stageResult?.status;
  if (s === "passed" || s === "retried") return "good";
  if (s === "failed") return "bad";
  return "tide";
}

export default function Drift() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const user = (await res.json()) as User;
          if (cancelled) return;
          setAuth(user.is_admin ? { status: "ok", user } : { status: "denied" });
        } else {
          setAuth({ status: "denied" });
        }
      } catch {
        if (!cancelled) setAuth({ status: "denied" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ToastProvider>
      <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip">
        {auth.status === "loading" && (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-soft">
            Checking access…
          </div>
        )}
        {auth.status === "denied" && <LoggedOutView />}
        {auth.status === "ok" && <DriftView user={auth.user} />}
      </div>
    </ToastProvider>
  );
}

function DriftView({ user }: { user: User }) {
  const [overview, setOverview] = useState<DriftOverview | null>(null);
  const [overviewLoaded, setOverviewLoaded] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(
    new URLSearchParams(window.location.search).get("agent"),
  );
  const [runs, setRuns] = useState<DriftRun[] | null>(null);
  const [shown, setShown] = useState(12);
  const [detail, setDetail] = useState<DriftRunDetail | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetchOverview();
    setOverview(data);
    setOverviewLoaded(true);
    // Default to the busiest agent once the overview lands.
    if (data?.agents.length) {
      const busiest = [...data.agents].sort((a, b) => b.total - a.total)[0];
      setAgentId((prev) => prev ?? busiest.agent_id);
    }
  }, []);

  // setTimeout(0) keeps the initial kick off the synchronous effect path
  // (react-hooks/set-state-in-effect), same as Agents.tsx.
  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  const loadRuns = useCallback(async () => {
    if (!agentId) return;
    const page = await fetchAgentRuns(agentId, shown);
    if (page) setRuns(page.runs);
  }, [agentId, shown]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadRuns(), 0);
    return () => window.clearTimeout(initial);
  }, [loadRuns]);

  // Poll while anything shown is still in flight.
  useEffect(() => {
    if (!runs?.some((r) => ACTIVE_STATES.has(r.state))) return;
    const timer = setInterval(() => void loadRuns(), 15000);
    return () => clearInterval(timer);
  }, [runs, loadRuns]);

  async function handleLogout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/";
    }
  }

  const manifest: FlowManifest | null =
    (runs?.length && overview?.flows[runs[0].task]) || null;
  const tally = overview?.agents.find((a) => a.agent_id === agentId);

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <AppShell
        active="admin-drift"
        mode="admin"
        identity={{ name: user.name || user.email, workspace: "Admin workspace", avatarUrl: user.avatar_url ?? undefined }}
        onLogout={handleLogout}
        adminControl={<AdminPanelControls inAdminPanel />}
      >
        <div className="flex flex-col gap-4">
          <header className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-semibold text-ink">Drift runs</h1>
            <p className="text-sm text-ink-soft">
              Every run an agent queued, its judge gates, and how it ended.
            </p>
          </header>

          {overviewLoaded && (overview?.agents.length ?? 0) === 0 && (
            <div className={`${CARD} p-6 text-sm text-ink-soft`}>
              No drift runs yet. Runs appear here the moment an agent calls{" "}
              <code>queue_drift_run</code>.
            </div>
          )}

          {(overview?.agents.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {[...overview!.agents]
                .sort((a, b) => b.total - a.total || a.agent_id.localeCompare(b.agent_id))
                .map((a) => (
                <button
                  key={a.agent_id}
                  onClick={() => {
                    setAgentId(a.agent_id);
                    setRuns(null);
                    setDetail(null);
                    setSelected(null);
                  }}
                  className={`drift-pill ${a.agent_id === agentId ? "is-active" : ""} ${a.total === 0 ? "is-empty" : ""}`}
                >
                  {a.agent_id}
                  <span className="drift-pill-count">{a.total === 0 ? "no runs" : a.total}</span>
                  {a.in_flight > 0 && <span className="drift-pill-live">{a.in_flight} live</span>}
                </button>
                ))}
            </div>
          )}

          {tally && (
            <div className="flex flex-wrap gap-2 text-xs text-ink-soft">
              {Object.entries(tally.states)
                .sort(([, a], [, b]) => b - a)
                .map(([state, count]) => (
                  <span key={state} className="drift-state-chip">
                    <span className={`drift-dot ${chipTone(state)}`} />
                    {count} {state.replace(/_/g, " ")}
                  </span>
                ))}
            </div>
          )}

          {agentId && runs && runs.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              showing latest
              {[12, 25, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setShown(n)}
                  className={`drift-pill ${shown === n ? "is-active" : ""}`}
                >
                  {n}
                </button>
              ))}
              runs
            </div>
          )}
          {agentId && runs && runs.length > 0 && (
            <GraphCanvas
              key={`${agentId}:${runs.length}`}
              agentId={agentId}
              runs={runs}
              manifest={manifest}
              selected={selected}
              onSelect={(node) => {
                if (!node?.run) {
                  setSelected(null);
                  setDetail(null);
                  return;
                }
                setSelected(node.id);
                void fetchRunDetail(node.run.id).then(setDetail);
              }}
            />
          )}
          {agentId && runs && runs.length === 0 && (
            <div className={`${CARD} p-6 text-sm text-ink-soft`}>
              {agentId} hasn't queued any drift runs.
            </div>
          )}

          {selected && <DetailRail selectedId={selected} runs={runs ?? []} detail={detail} manifest={manifest} />}
        </div>
      </AppShell>
    </>
  );
}

function chipTone(state: string): string {
  if (state === "done" || state === "already_done") return "is-good";
  if (ACTIVE_STATES.has(state)) return "is-tide";
  return "is-bad";
}

function GraphCanvas({
  agentId,
  runs,
  manifest,
  selected,
  onSelect,
}: {
  agentId: string;
  runs: DriftRun[];
  manifest: FlowManifest | null;
  selected: string | null;
  onSelect: (node: GraphNode | null) => void;
}) {
  const graph: Graph = useMemo(() => {
    const g = buildGraph(agentId, runs[0]?.task ?? "drift", runs, manifest);
    layoutRadial(g);
    return g;
  }, [agentId, runs, manifest]);

  // Initial view fits the whole layout; the canvas remounts (see its key in
  // DriftView) when the graph changes shape, so no refit effect is needed.
  const [view, setView] = useState(() => fitView(graph, 1200, 720));
  const [, force] = useState(0);
  const drag = useRef<{ node: GraphNode | null; panning: boolean; px: number; py: number; moved: boolean }>({
    node: null,
    panning: false,
    px: 0,
    py: 0,
    moved: false,
  });

  /* The elastic loop: run relaxGraph frames while a node is held or until
     the graph settles back onto its radial homes. Started by pointer
     handlers, self-stopping — no interval lives past the settle. */
  const raf = useRef<number | null>(null);
  const animate = useCallback(
    function tick() {
      raf.current = null;
      const moving = relaxGraph(graph, drag.current.node?.id ?? null);
      force((v) => v + 1);
      if (moving > 0.08 || drag.current.node) raf.current = requestAnimationFrame(tick);
    },
    [graph],
  );
  const wake = useCallback(() => {
    if (raf.current === null) raf.current = requestAnimationFrame(animate);
  }, [animate]);
  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );
  const svgRef = useRef<SVGSVGElement | null>(null);

  /* Client coords -> viewBox coords (the svg has a viewBox, so CSS pixels
     are scaled/centered) -> world coords under the pan/zoom transform. */
  const toCanvas = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  };
  const toWorld = (cx: number, cy: number) => ({ x: (cx - view.x) / view.k, y: (cy - view.y) / view.k });
  const findNode = (mx: number, my: number): GraphNode | null => {
    const p = toWorld(mx, my);
    for (let i = graph.nodes.length - 1; i >= 0; i--) {
      const n = graph.nodes[i];
      if (Math.hypot(n.x - p.x, n.y - p.y) <= n.r + 4) return n;
    }
    return null;
  };

  return (
    <div className={`${CARD} drift-canvas-card`}>
      <svg
        ref={svgRef}
        className="drift-canvas"
        viewBox="0 0 1200 720"
        onPointerDown={(e) => {
          const { x: mx, y: my } = toCanvas(e.clientX, e.clientY);
          const n = findNode(mx, my);
          drag.current = { node: n && n.type !== "agent" ? n : null, panning: !n, px: mx, py: my, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const { x: mx, y: my } = toCanvas(e.clientX, e.clientY);
          const d = drag.current;
          if (d.node) {
            const p = toWorld(mx, my);
            d.node.x = p.x;
            d.node.y = p.y;
            d.node.vx = 0;
            d.node.vy = 0;
            d.moved = true;
            wake();
          } else if (d.panning && (e.buttons & 1) === 1) {
            setView((v) => ({ ...v, x: v.x + (mx - d.px), y: v.y + (my - d.py) }));
            d.px = mx;
            d.py = my;
            d.moved = true;
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          if (!d.moved) {
            const { x: mx, y: my } = toCanvas(e.clientX, e.clientY);
            onSelect(findNode(mx, my));
          }
          if (d.node) wake();
          drag.current = { node: null, panning: false, px: 0, py: 0, moved: false };
        }}
        onWheel={(e) => {
          const { x: mx, y: my } = toCanvas(e.clientX, e.clientY);
          const f = Math.exp(-e.deltaY * 0.0015);
          setView((v) => ({ x: mx - (mx - v.x) * f, y: my - (my - v.y) * f, k: v.k * f }));
        }}
      >
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {graph.edges.map((e, i) => {
            const a = graph.byId.get(e.a)!;
            const b = graph.byId.get(e.b)!;
            return (
              <line
                key={i}
                className={`drift-edge ${e.spine ? "is-spine" : ""}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
              />
            );
          })}
          {graph.nodes.map((n) => {
            // Stage labels only once zoomed in — at overview scale they
            // collide; run names and outcomes always show.
            const showLabel = n.type !== "stage" || view.k >= 0.9 || selected === n.id;
            return (
              <g key={n.id} className={`drift-node tone-${nodeTone(n)} ${selected === n.id ? "is-selected" : ""}`}>
                <circle cx={n.x} cy={n.y} r={n.r}>
                  <title>{n.label}</title>
                </circle>
                {showLabel && (
                  <text
                    className={n.type === "agent" || n.type === "task" ? "drift-label-big" : n.type === "run" ? "drift-label-run" : "drift-label"}
                    x={n.x}
                    y={n.type === "agent" ? n.y + n.r + 15 : n.y - n.r - 5}
                    textAnchor="middle"
                    // Counter-scale so text stays readable at the fitted zoom.
                    style={{ fontSize: `${Math.min(((n.type === "agent" || n.type === "task" ? 13 : n.type === "run" ? 12 : 11) / view.k) * 0.9, 26)}px` }}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <p className="drift-canvas-hint">drag nodes · drag background to pan · scroll to zoom · click a run or stage for detail</p>
    </div>
  );
}

function DetailRail({
  selectedId,
  runs,
  detail,
  manifest,
}: {
  selectedId: string;
  runs: DriftRun[];
  detail: DriftRunDetail | null;
  manifest: FlowManifest | null;
}) {
  const runId = selectedId.replace(/^run:/, "").split(":")[0];
  const run = runs.find((r) => r.id === runId);
  if (!run) return null;
  const slug = String(run.parameters?.slug ?? "") || run.task;
  const t = terminalFor(run, manifest);
  const demoUrl = typeof run.result?.demo_url === "string" ? run.result.demo_url : null;
  const stageId = selectedId.includes(":") ? selectedId.split(":").slice(2).join(":") : null;
  const shown = detail?.id === run.id ? detail.judgments : run.judgments.map((j) => ({ ...j, detail: null }));

  return (
    <div className={`${CARD} p-4`}>
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-base font-semibold text-ink">{slug}</h2>
        <span className={`drift-state-chip ${t.tone === "good" ? "is-good" : t.tone === "bad" ? "is-bad" : "is-tide"}`}>
          <span className={`drift-dot ${t.tone === "good" ? "is-good" : t.tone === "bad" ? "is-bad" : "is-tide"}`} />
          {t.label}
        </span>
        <span className="text-xs text-ink-soft">
          queued {relativeTime(run.created_at) ?? "—"}
          {runDuration(run) ? ` · ran ${runDuration(run)}` : ""}
        </span>
        {demoUrl && (
          <a className="text-xs font-medium text-tide underline" href={demoUrl} target="_blank" rel="noreferrer">
            demo page ↗
          </a>
        )}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {shown.map((j, i) => (
          <li key={i} className="text-xs">
            <div className="flex items-center gap-2">
              <span className={`drift-dot ${j.passed === true ? "is-good" : j.passed === false ? "is-bad" : "is-tide"}`} />
              <code className="rounded bg-sand px-1.5 py-0.5">{j.label}</code>
              <span className={j.passed === true ? "font-semibold text-ok" : j.passed === false ? "font-semibold text-alert" : "text-ink-soft"}>
                {j.passed === true ? "pass" : j.passed === false ? "fail" : "info"}
              </span>
              <span className="text-ink-faint">{relativeTime(j.created_at)}</span>
            </div>
            {"detail" in j && j.detail != null && (
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-sand p-2 text-[11px] leading-snug text-ink-soft">
                {JSON.stringify(j.detail, null, 1).slice(0, 4000)}
              </pre>
            )}
          </li>
        ))}
        {shown.length === 0 && (
          <li className="text-xs text-ink-soft">
            No judgments recorded — this run ended before its flow emitted anything
            {stageId ? "" : "."}
          </li>
        )}
      </ul>
    </div>
  );
}
