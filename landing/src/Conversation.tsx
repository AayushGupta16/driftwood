import { useEffect, useState } from "react";
import { LoggedOutView, ToastProvider } from "./Dashboard";
import { ImpersonationBanner } from "./GodMode";
import { Wordmark } from "./components/Chrome";
import { AgentChatComposer, AgentChatThread, ImportFromSlackButton } from "./components/AgentChat";
import { agentDisplayName as displayName, useAgentChat } from "./components/useAgentChat";
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
  const match = window.location.pathname.match(/^\/dashboard\/agents\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function ConversationView({ user, agentId }: { user: User; agentId: string }) {
  const chat = useAgentChat(agentId);

  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5 sm:px-8">
          <a href="/" target="_blank" rel="noreferrer" className="text-[18px] text-ink no-underline">
            <Wordmark markSize="size-8" />
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-ink-soft sm:inline">{user.name || user.email}</span>
            <a
              href="/dashboard/agents"
              target="_blank"
              rel="noreferrer"
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
