import { useCallback, useEffect, useState } from "react";
import { LoggedOutView, ToastProvider } from "./dashboard/DashboardCommon";
import { AdminPanelControls, ImpersonationBanner } from "./GodMode";
import { AgentChatComposer, AgentChatThread, ImportFromSlackButton } from "./components/AgentChat";
import { agentDisplayName as displayName, useAgentChat } from "./components/useAgentChat";
import AppShell from "./dashboard/AppShell";
import { CARD } from "./dashboard-shared";
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
  | { status: "offline" }
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

        {/* Failure looks like a failure (ux-principles rule 7), not a sand
            notice; the 4s poll keeps retrying and clears this on recovery. */}
        {chat.error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-600/25 bg-red-500/10 px-4 py-3 text-[13px] font-medium text-red-800">
            {chat.error}. Retrying automatically.
          </div>
        )}
        {chat.notice && (
          <p className="m-0 mt-4 text-[12.5px] text-ink-soft" role="status">
            {chat.notice}
          </p>
        )}

        {chat.data || chat.error ? (
          <>
            <AgentChatThread chat={chat} />
            <AgentChatComposer chat={chat} />
          </>
        ) : (
          <ThreadSkeleton />
        )}
      </div>
      </AppShell>
    </>
  );
}

/* First-load placeholder for the thread region (ux-principles rules 1 + 2):
   message-bubble-shaped blocks plus the composer's footprint, so nothing
   jumps when the conversation lands. */
function ThreadSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading conversation"
      className="flex min-h-0 flex-1 animate-pulse flex-col gap-5 py-5 motion-reduce:animate-none"
    >
      <div className="h-16 w-[min(30rem,80%)] self-start rounded-[14px] border border-line bg-sand/40" />
      <div className="h-12 w-[min(22rem,65%)] self-end rounded-[14px] bg-sand" />
      <div className="h-20 w-[min(32rem,85%)] self-start rounded-[14px] border border-line bg-sand/40" />
      <div className="mt-auto border-t border-line pt-4">
        <div className="h-[46px] rounded-[12px] bg-sand" />
      </div>
    </div>
  );
}

/* Pre-auth first paint: mirror the page we're about to show (title row,
   message bubbles, composer) instead of a lone spinner on a blank page —
   ux-principles rules 1 + 2. The AppShell chrome itself still waits on
   identity. Local Tailwind-only copy per the Leads/Companies precedent. */
function LoadingView() {
  return (
    <div
      role="status"
      aria-label="Loading conversation"
      className="mx-auto flex w-full max-w-4xl flex-1 animate-pulse flex-col px-4 pb-6 motion-reduce:animate-none sm:px-8"
    >
      <div className="flex items-end justify-between gap-3 border-b border-line pb-4 pt-8">
        <div>
          <div className="h-7 w-44 rounded-md bg-sand" />
          <div className="mt-2 h-3 w-32 rounded bg-sand" />
        </div>
        <div className="h-[34px] w-36 rounded-full bg-sand" />
      </div>
      <div className="flex flex-1 flex-col gap-5 py-5">
        <div className="h-16 w-[min(30rem,80%)] self-start rounded-[14px] border border-line bg-sand/40" />
        <div className="h-12 w-[min(22rem,65%)] self-end rounded-[14px] bg-sand" />
        <div className="h-20 w-[min(32rem,85%)] self-start rounded-[14px] border border-line bg-sand/40" />
      </div>
      <div className="border-t border-line pt-4">
        <div className="h-[46px] rounded-[12px] bg-sand" />
      </div>
    </div>
  );
}

/* Painted when /auth/me itself was unreachable: the admin stays here with a
   retry instead of being shown the sign-in card — error is not logged-out
   (ux-principles rule 7). */
function OfflineView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div role="alert" className={`w-full max-w-sm ${CARD} p-6 text-center`}>
        <p className="m-0 text-[14.5px] font-semibold text-ink">
          Can&rsquo;t reach driftwood right now
        </p>
        <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          The connection failed before we could check your session. Check
          your network and retry.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 cursor-pointer rounded-full bg-tide px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-tide-deep"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const agentId = agentIdFromPath();

  /* A network blip is not a logout (ux-principles rule 7): only a readable
     /auth/me response may deny access. A thrown fetch paints the retry card
     instead of the sign-in card. State starts at "loading", so the check
     itself only ever sets the outcome; the retry handler resets to
     "loading" before re-running it. */
  const check = useCallback(async () => {
    try {
      const response = await fetch("/auth/me", { credentials: "include" });
      const user: User | null = response.ok ? await response.json() : null;
      setAuth(user?.is_admin ? { status: "ok", user } : { status: "denied" });
    } catch {
      setAuth({ status: "offline" });
    }
  }, []);

  useEffect(() => {
    // Off the effect body, as in useAgentChat, so the first check is not a
    // synchronous setState during mount.
    const initial = window.setTimeout(() => void check(), 0);
    return () => window.clearTimeout(initial);
  }, [check]);

  function retry() {
    setAuth({ status: "loading" });
    void check();
  }

  return (
    <ToastProvider>
      <div className="agents-page flex min-h-[100dvh] flex-col overflow-x-clip bg-paper">
        {auth.status === "loading" ? (
          <LoadingView />
        ) : auth.status === "offline" ? (
          <OfflineView onRetry={retry} />
        ) : auth.status === "denied" || !agentId ? (
          <LoggedOutView />
        ) : (
          <ConversationView user={auth.user} agentId={agentId} />
        )}
      </div>
    </ToastProvider>
  );
}
