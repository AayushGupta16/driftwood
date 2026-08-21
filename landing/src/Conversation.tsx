import { useEffect, useState } from "react";
import { LoggedOutView, ToastProvider } from "./dashboard/DashboardCommon";
import { AdminPanelControls, ImpersonationBanner } from "./GodMode";
import { AgentChatComposer, AgentChatThread, ImportFromSlackButton } from "./components/AgentChat";
import { agentDisplayName as displayName, useAgentChat } from "./components/useAgentChat";
import AppShell from "./dashboard/AppShell";
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

function agentIdFromPath() {
  const match = window.location.pathname.match(/^\/dashboard\/(?:admin\/agents|agents)\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function ConversationView({ user, agentId }: { user: User; agentId: string }) {
  const chat = useAgentChat(agentId);

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <AppShell
        active="admin-agents"
        mode="admin"
        identity={{ name: user.name || user.email, workspace: "Admin workspace", avatarUrl: user.avatar_url }}
        adminControl={<AdminPanelControls inAdminPanel />}
      >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.015em]">
              {displayName(agentId)}
            </h1>
            <p className="m-0 mt-1 text-[12.5px] text-ink-soft">
              {chat.data
                ? `${chat.data.online ? "Online" : "Offline"}${chat.data.paused ? " · archived" : ""} · also in Slack`
                : "Loading"}
            </p>
          </div>
          <ImportFromSlackButton chat={chat} />
        </div>

        {chat.error && (
          <div className="mt-4 rounded-xl border border-line bg-sand/50 px-4 py-3 text-[13px] text-ink">
            {chat.error}
          </div>
        )}
        {chat.notice && (
          <p className="m-0 mt-4 text-[12.5px] text-ink-soft" role="status">
            {chat.notice}
          </p>
        )}

        <AgentChatThread chat={chat} />
        <AgentChatComposer chat={chat} />
      </div>
      </AppShell>
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
