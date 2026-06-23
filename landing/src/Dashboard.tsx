import { useEffect, useState, type ReactNode } from "react";
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

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

const CARD =
  "rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_40px_-26px_rgba(22,24,29,0.4)]";

function Pill({
  tone,
  children,
}: {
  tone: "active" | "pending";
  children: ReactNode;
}) {
  const cls =
    tone === "active"
      ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-700"
      : "border-amber-600/25 bg-amber-500/10 text-amber-700";
  const dot = tone === "active" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.04em] ${cls}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
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
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)]">
        <a href="/" className="inline-flex justify-center text-ink no-underline">
          <Wordmark markSize="size-8" className="text-[18px]" />
        </a>
        <h1 className="m-0 mt-6 text-[24px] font-semibold tracking-[-0.015em]">
          Sign in to your dashboard
        </h1>
        <p className="mx-auto mt-2.5 max-w-[30ch] text-[15px] leading-relaxed text-ink-soft">
          See the campaigns and prospect demos we&rsquo;re building for you.
        </p>
        <a
          href="/auth/login"
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-paper px-4.5 py-3 text-[14.5px] font-semibold text-ink no-underline shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:border-ink-faint/50"
        >
          <GoogleMark className="size-4.5 shrink-0" />
          Continue with Google
        </a>
        <p className="m-0 mt-4.5 font-mono text-[11.5px] tracking-[0.04em] text-ink-faint">
          Invite-only · approved accounts
        </p>
      </div>
    </main>
  );
}

/* ---------- logged-in shell ---------- */

function LoggedInView({ user, onLogout }: { user: User; onLogout: () => void }) {
  const displayName = user.name || user.email;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 shadow-[0_10px_28px_-24px_rgba(22,24,29,0.5)] backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="text-[18px] text-ink no-underline">
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
            <span className="hidden text-[14px] font-medium text-ink sm:inline">
              {displayName}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        {user.is_approved ? (
          <ApprovedView user={user} />
        ) : (
          <PendingView />
        )}
      </main>
    </>
  );
}

function PageHead({ heading }: { heading: string }) {
  return (
    <h1 className="m-0 text-[clamp(2rem,4.6vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
      {heading}
    </h1>
  );
}

/* ---------- pending (awaiting approval) ---------- */

function PendingView() {
  return (
    <>
      <PageHead heading="You're on the list." />

      <ChecklistCard
        title="What happens next"
        aside={<Pill tone="pending">Pending review</Pill>}
      >
        <Step state="done" num={1} title="Account created">
          You&rsquo;re signed in with Google. Nothing else to do here.
        </Step>
        <Step state="now" num={2} title="We review &amp; approve">
          Our team confirms fit and switches on your workspace. You&rsquo;ll get
          an email.
        </Step>
        <Step state="soon" num={3} title="Connect &amp; launch" tag="soon">
          Link LinkedIn and watch your first prospect demos roll in.
        </Step>
      </ChecklistCard>

      <p className="mt-6 text-center font-mono text-[12.5px] text-ink-faint">
        Questions? Reply to your welcome email and we&rsquo;ll get right back.
      </p>
    </>
  );
}

/* ---------- approved (workspace live) ---------- */

function ApprovedView({ user }: { user: User }) {
  const connected = user.linkedin_connected;
  const firstName = user.name.split(" ")[0] || user.email;

  return (
    <>
      <LinkedInBanner />
      <PageHead heading={`Welcome back, ${firstName}.`} />

      <AccountStrip connected={connected} />

      <ChecklistCard
        title={connected ? "You're all set" : "Finish setup"}
        aside={
          connected ? (
            <Pill tone="active">Setup complete</Pill>
          ) : (
            <span className="font-mono text-[12px] text-ink-faint">1 of 2 done</span>
          )
        }
      >
        <Step state="done" num={1} title="Account approved">
          Your workspace is provisioned and ready.
        </Step>
        <LinkedInStep connected={connected} />
        <Step
          state="soon"
          num={3}
          title="Campaigns &amp; prospect demos"
          tag="coming soon"
        >
          Once you&rsquo;re connected, your campaigns and the demos we build for
          each prospect show up right here.
        </Step>
      </ChecklistCard>
    </>
  );
}

function AccountStrip({ connected }: { connected: boolean }) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
      <div className="bg-surface px-5 py-3.5">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
          Status
        </p>
        <div className="mt-2">
          <Pill tone="active">Active</Pill>
        </div>
      </div>
      <div className="bg-surface px-5 py-3.5">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
          LinkedIn
        </p>
        <p
          className={`m-0 mt-2.5 text-[14.5px] font-medium ${
            connected ? "text-emerald-700" : "text-ink-soft"
          }`}
        >
          {connected ? "Connected" : "Not connected"}
        </p>
      </div>
    </div>
  );
}

/* ---------- checklist primitives ---------- */

function ChecklistCard({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`mt-7 overflow-hidden ${CARD}`}>
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-2">
        <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {aside}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Step({
  state,
  num,
  title,
  tag,
  children,
  action,
}: {
  state: "done" | "now" | "soon";
  num: number;
  title: string;
  tag?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const iconCls =
    state === "done"
      ? "border-emerald-600/20 bg-emerald-500/10 text-emerald-700"
      : state === "now"
        ? "border-tide/25 bg-tide-wash text-tide"
        : "border-dashed border-sand bg-paper text-ink-faint";

  return (
    <div className="flex gap-4 border-t border-line px-6 py-5">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] border font-mono text-[13px] font-semibold ${iconCls}`}
        aria-hidden="true"
      >
        {state === "done" ? "✓" : num}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 flex flex-wrap items-center gap-2.5 text-[15px] font-semibold tracking-[-0.005em]">
          <span>{title}</span>
          {tag && (
            <span className="rounded-md border border-sand px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-ink-faint">
              {tag}
            </span>
          )}
        </h3>
        <p className="m-0 mt-1.5 max-w-md text-[14px] leading-relaxed text-ink-soft">
          {children}
        </p>
        {action && <div className="mt-3.5">{action}</div>}
      </div>
    </div>
  );
}

/* ---------- LinkedIn step (owns connect/disconnect state) ---------- */

function LinkedInStep({ connected }: { connected: boolean }) {
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

  const errorNode = error && (
    <p className="m-0 mt-3 text-[13.5px] font-medium text-red-700" role="alert">
      {error}
    </p>
  );

  if (connected) {
    return (
      <Step
        state="done"
        num={2}
        title="LinkedIn connected"
        action={
          <>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={pending}
              className="cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Disconnecting…" : "Disconnect"}
            </button>
            {errorNode}
          </>
        }
      >
        Linked and ready for outreach.
      </Step>
    );
  }

  return (
    <Step
      state="now"
      num={2}
      title="Connect your LinkedIn"
      action={
        <>
          <button
            type="button"
            onClick={handleConnect}
            disabled={pending}
            className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#0A66C2] px-4.5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:bg-[#095196] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LinkedInMark className="size-4.5 shrink-0" />
            {pending ? "Connecting…" : "Connect LinkedIn"}
          </button>
          {errorNode}
        </>
      }
    >
      We use this to run your outreach. You&rsquo;ll sign in on a secure Unipile
      page — we never see your password.
    </Step>
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
      className={`mb-7 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] font-medium ${
        connected
          ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-800"
          : "border-red-600/25 bg-red-500/10 text-red-800"
      }`}
    >
      <span aria-hidden="true">{connected ? "✓" : "✕"}</span>
      {connected
        ? "LinkedIn connected — you're all set."
        : "Connection failed, please try again."}
    </div>
  );
}
