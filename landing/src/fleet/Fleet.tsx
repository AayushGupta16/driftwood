/* /dashboard/admin/fleet — the founder switchboard: every customer with
   their agent beside them (GET /api/v1/admin/agents/fleet). Rows needing
   attention arrive pre-sorted first from the backend; each row jumps to the
   agent's conversation and its drift graph. Polls every 15s like the
   Agents page. */

import { useCallback, useEffect, useState } from "react";
import AppShell from "../dashboard/AppShell";
import { LoggedOutView, ToastProvider } from "../dashboard/DashboardCommon";
import { AdminPanelControls, ImpersonationBanner } from "../GodMode";
import { CARD, relativeTime } from "../dashboard-shared";
import { withMockMode } from "../mock-mode";
import {
  agentStateLabel,
  agentStateTone,
  customerLabel,
  pipelineSummary,
  type FleetPage,
} from "./model";
import "./fleet.css";

type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_admin?: boolean;
  impersonating?: boolean;
};

type AuthState = { status: "loading" } | { status: "denied" } | { status: "ok"; user: User };

export default function Fleet() {
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
        {auth.status === "ok" && <FleetView user={auth.user} />}
      </div>
    </ToastProvider>
  );
}

function FleetView({ user }: { user: User }) {
  const [page, setPage] = useState<FleetPage | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/agents/fleet", { credentials: "include" });
      if (res.ok) {
        const parsed = (await res.json()) as FleetPage;
        if (parsed && typeof parsed === "object") setPage(parsed);
      }
    } catch {
      // keep the last good payload; the poll will retry
    }
    setLoaded(true);
  }, []);

  // setTimeout(0) keeps the initial kick off the synchronous effect path
  // (react-hooks/set-state-in-effect), same as Agents.tsx.
  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  async function handleLogout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <AppShell
        active="admin-fleet"
        mode="admin"
        identity={{ name: user.name || user.email, workspace: "Admin workspace", avatarUrl: user.avatar_url ?? undefined }}
        onLogout={handleLogout}
        adminControl={<AdminPanelControls inAdminPanel />}
      >
        <div className="flex flex-col gap-4">
          <header className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-semibold text-ink">Fleet</h1>
            <p className="text-sm text-ink-soft">
              Every customer and the agent working their pipeline. Attention first.
            </p>
            {page && (
              <span className="ml-auto text-xs text-ink-faint">
                refreshed {relativeTime(page.refreshed_at) ?? "just now"}
              </span>
            )}
          </header>

          {loaded && (page?.rows.length ?? 0) === 0 && (
            <div className={`${CARD} p-6 text-sm text-ink-soft`}>No customers yet.</div>
          )}

          <div className="flex flex-col gap-2">
            {page?.rows.map((row) => (
              <div key={row.customer.user_id} className={`${CARD} fleet-row`}>
                <div className="fleet-cell fleet-customer">
                  {row.customer.avatar_url ? (
                    <img src={row.customer.avatar_url} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="fleet-avatar-fallback">
                      {customerLabel(row).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {customerLabel(row)}
                      {row.attention_required && <span className="fleet-attention-dot" title={row.attention_reasons.join("; ")} />}
                    </div>
                    <div className="text-xs text-ink-faint">{row.customer.email}</div>
                  </div>
                </div>

                <div className="fleet-cell">
                  {row.agent ? (
                    <a
                      className="text-sm font-medium text-tide underline"
                      href={withMockMode(`/dashboard/admin/agents/${row.agent.agent_id}`)}
                    >
                      {row.agent.agent_id}
                    </a>
                  ) : (
                    <span className="text-sm text-ink-faint">—</span>
                  )}
                  <span className={`fleet-state is-${agentStateTone(row)}`}>{agentStateLabel(row)}</span>
                </div>

                <div className="fleet-cell text-xs text-ink-soft">{pipelineSummary(row.pipeline)}</div>

                <div className="fleet-cell fleet-links">
                  {row.agent && (
                    <a className="fleet-link" href={withMockMode(`/dashboard/admin/drift?agent=${row.agent.agent_id}`)}>
                      drift runs
                    </a>
                  )}
                  {row.attention_reasons.length > 0 && (
                    <span className="text-xs text-alert">{row.attention_reasons[0]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </>
  );
}
