import { useEffect, useState } from "react";
import { CARD, useToast } from "./dashboard-shared";

/* God mode — admin-only user impersonation. A header button opens a search
   modal to pick a user and "become" them; a sticky banner shows while
   impersonating and lets the admin drop back to themselves. Both talk to the
   same-origin /api/v1/admin/* endpoints with the first-party session cookie.
   On any state change we hard-reload so the whole app re-reads /auth/me as the
   effective (impersonated) user. */

type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  is_admin: boolean;
  created_at: string;
};

/* ---------- header button + modal ---------- */

export function GodModeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-tide/40 bg-surface px-3.5 py-2 text-[13.5px] font-medium text-tide transition-colors hover:border-tide hover:bg-tide-wash"
      >
        <span aria-hidden="true">⚡</span>
        God mode
      </button>
      {open && <ImpersonateModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ImpersonateModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounced search — fetch on mount (empty q) and whenever q changes.
  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/admin/users?q=${encodeURIComponent(q)}&limit=50`,
          { credentials: "include" },
        );
        if (cancelled) return;
        if (!res.ok) throw new Error("request failed");
        const data = (await res.json()) as { users: AdminUser[]; total: number };
        if (!cancelled) setUsers(data.users);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 py-[10vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Impersonate a user"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`flex max-h-[80vh] w-full max-w-lg flex-col ${CARD} p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em]">
            Impersonate a user
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 cursor-pointer rounded-lg p-1 text-[18px] leading-none text-ink-faint transition-colors hover:text-ink"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="mt-4 w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-tide/60"
        />

        <div className="mt-4 min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span
                className="size-6 animate-spin rounded-full border-2 border-line border-t-tide"
                role="status"
                aria-label="Searching"
              />
            </div>
          ) : users.length === 0 ? (
            <p className="m-0 py-10 text-center text-[13.5px] text-ink-soft">
              No users found.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  pending={impersonatingId === u.id}
                  disabled={impersonatingId !== null}
                  onImpersonatingChange={setImpersonatingId}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  pending,
  disabled,
  onImpersonatingChange,
}: {
  user: AdminUser;
  pending: boolean;
  disabled: boolean;
  onImpersonatingChange: (id: string | null) => void;
}) {
  const displayName = user.name || user.email || "Unnamed user";
  const toast = useToast();

  async function handleImpersonate() {
    onImpersonatingChange(user.id);
    try {
      const res = await fetch(`/api/v1/admin/impersonate/${user.id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      window.location.href = "/dashboard";
    } catch {
      toast("Couldn't impersonate that user. Please try again.", "error");
      onImpersonatingChange(null);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-paper/40 px-3 py-2.5">
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-medium text-ink">
            {user.name || user.email || "Unnamed user"}
          </span>
          {user.is_admin && <Badge>admin</Badge>}
          {user.is_approved && <Badge>approved</Badge>}
        </div>
        {user.name && user.email && (
          <div className="truncate text-[12.5px] text-ink-soft">{user.email}</div>
        )}
      </div>
      <button
        type="button"
        onClick={handleImpersonate}
        disabled={disabled}
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-tide px-3.5 py-2 text-[13px] font-semibold text-white no-underline shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:bg-tide-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white"
          />
        )}
        {pending ? "Entering…" : "Impersonate"}
      </button>
    </li>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-line bg-surface px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-faint">
      {children}
    </span>
  );
}

/* ---------- sticky "you are impersonating" banner ---------- */

export function ImpersonationBanner({ email }: { email: string }) {
  const [exiting, setExiting] = useState(false);
  const toast = useToast();

  async function handleExit() {
    setExiting(true);
    try {
      const res = await fetch("/api/v1/admin/stop-impersonating", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("request failed");
      window.location.href = "/dashboard";
    } catch {
      toast("Couldn't exit god mode. Please try again.", "error");
      setExiting(false);
    }
  }

  return (
    <div className="sticky top-0 z-50 border-b border-amber-600/25 bg-amber-500/10 text-amber-800 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <span className="min-w-0 truncate text-[13.5px] font-medium">
          <span aria-hidden="true">⚡</span> God mode — viewing as {email}.
        </span>
        <button
          type="button"
          onClick={handleExit}
          disabled={exiting}
          className="shrink-0 cursor-pointer rounded-xl border border-amber-600/40 bg-amber-500/10 px-3.5 py-1.5 text-[13px] font-medium text-amber-800 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exiting ? "Exiting…" : "Exit god mode"}
        </button>
      </div>
    </div>
  );
}
