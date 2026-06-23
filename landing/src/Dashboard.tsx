import { useEffect, useState } from "react";
import { Wordmark } from "./components/Chrome";

/* /dashboard — Google-login-gated shell. Talks to the same-origin /auth/*
   endpoints (vite proxy in dev, vercel rewrite in prod), so every request
   must send the first-party session cookie. */

type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  is_approved: boolean;
  linkedin_connected: boolean;
};

type AuthState =
  | { status: "loading" }
  | { status: "logged-out" }
  | { status: "logged-in"; user: User };

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function Dashboard() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const user = (await res.json()) as User;
          if (!cancelled) setAuth({ status: "logged-in", user });
        } else {
          setAuth({ status: "logged-out" });
        }
      } catch {
        if (!cancelled) setAuth({ status: "logged-out" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="grain relative flex min-h-screen flex-col overflow-x-clip">
      {auth.status === "loading" && <LoadingView />}
      {auth.status === "logged-out" && <LoggedOutView />}
      {auth.status === "logged-in" && (
        <LoggedInView user={auth.user} onLogout={handleLogout} />
      )}
    </div>
  );
}

function LoadingView() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span
        className="size-7 animate-spin rounded-full border-2 border-line border-t-tide"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function LoggedOutView() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)]">
        <a href="/" className="inline-flex text-ink no-underline">
          <Wordmark markSize="size-8" className="text-[19px]" />
        </a>
        <h1 className="m-0 mt-7 text-[clamp(1.7rem,4vw,2.1rem)] font-semibold tracking-[-0.015em]">
          Dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-[15.5px] leading-relaxed text-ink-soft">
          Sign in to see your campaigns and the demos we've built for your
          prospects.
        </p>
        <a
          href="/auth/login"
          className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-paper px-4.5 py-3 text-[15px] font-semibold text-ink no-underline shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:border-ink-faint/50"
        >
          <GoogleMark className="size-4.5 shrink-0" />
          Sign in with Google
        </a>
      </div>
    </main>
  );
}

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function LinkedInBanner() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("linkedin");
  if (status !== "connected" && status !== "failed") return null;

  const connected = status === "connected";
  return (
    <div
      role="status"
      className={`mb-8 rounded-xl border px-4 py-3 text-[14.5px] font-medium ${
        connected
          ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800"
          : "border-red-600/30 bg-red-500/10 text-red-800"
      }`}
    >
      {connected ? "LinkedIn connected!" : "Connection failed, try again."}
    </div>
  );
}

function LinkedInCard({ connected }: { connected: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/linkedin/connect", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      setError("Couldn't start the connection. Please try again.");
      setPending(false);
    }
  }

  async function handleDisconnect() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/linkedin/disconnect", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      window.location.reload();
    } catch {
      setError("Couldn't disconnect. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_40px_-26px_rgba(22,24,29,0.4)]">
      {connected ? (
        <>
          <h2 className="m-0 flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.01em]">
            <LinkedInMark className="size-5 shrink-0 text-[#0A66C2]" />
            LinkedIn connected
            <span className="text-emerald-600" aria-hidden="true">
              &#10003;
            </span>
          </h2>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-soft">
            Your LinkedIn account is linked and ready for outreach.
          </p>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={pending}
            className="mt-5 cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Disconnecting…" : "Disconnect"}
          </button>
        </>
      ) : (
        <>
          <h2 className="m-0 flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.01em]">
            <LinkedInMark className="size-5 shrink-0 text-[#0A66C2]" />
            Connect your LinkedIn
          </h2>
          <p className="m-0 mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">
            We use this to run your outreach. You&rsquo;ll be taken to a secure
            Unipile page to sign in.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={pending}
            className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#0A66C2] px-4.5 py-2.5 text-[15px] font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:bg-[#095196] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LinkedInMark className="size-4.5 shrink-0" />
            {pending ? "Connecting…" : "Connect LinkedIn"}
          </button>
        </>
      )}
      {error && (
        <p className="m-0 mt-3 text-[13.5px] font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function LoggedInView({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const displayName = user.name || user.email;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 shadow-[0_10px_28px_-24px_rgba(22,24,29,0.5)] backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="text-[19px] text-ink no-underline">
            <Wordmark markSize="size-8" />
          </a>
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={`${displayName}'s avatar`}
                className="size-8 shrink-0 rounded-full border border-line object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide font-mono text-[13px] font-semibold text-white">
                {displayName[0]?.toUpperCase()}
              </span>
            )}
            <span className="hidden text-[14.5px] font-medium text-ink sm:inline">
              {displayName}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-14 sm:px-8 sm:py-18">
        {user.is_approved && <LinkedInBanner />}
        <p className="m-0 font-mono text-[14px] text-ink-faint">
          Logged in as {user.email}
        </p>
        <h1 className="m-0 mt-3 text-[clamp(2rem,4.6vw,2.8rem)] font-semibold leading-tight tracking-[-0.015em]">
          {user.is_approved ? `Welcome back, ${displayName}.` : "You're on the list."}
        </h1>
        <div className="mt-9 rounded-2xl border border-line bg-surface p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_40px_-26px_rgba(22,24,29,0.4)]">
          <p className="m-0 text-[17px] leading-relaxed text-ink-soft">
            {user.is_approved
              ? "Your dashboard is coming soon."
              : "Your account is created and pending access. We'll enable your dashboard shortly — keep an eye on your inbox."}
          </p>
        </div>
        {user.is_approved && (
          <LinkedInCard connected={user.linkedin_connected} />
        )}
      </main>
    </>
  );
}
