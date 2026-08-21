import { useEffect, useState, type ReactNode } from "react";
import { LoggedOutView } from "./DashboardCommon";
import { AdminPanelControls, ImpersonationBanner } from "../GodMode";
import AppShell, { type DashboardSection } from "./AppShell";

type WorkspaceUser = {
  email: string;
  name: string;
  avatar_url: string | null;
  is_approved: boolean;
  is_admin?: boolean;
  impersonating?: boolean;
  org?: { name: string; role: "owner" | "admin" | "member" } | null;
};

type AuthState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "ready"; user: WorkspaceUser };

export default function WorkspacePage({
  active,
  children,
  notice,
  workspace = false,
}: {
  active: DashboardSection;
  children: ReactNode;
  notice?: ReactNode;
  workspace?: boolean;
}) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let current = true;
    fetch("/auth/me", { credentials: "include" })
      .then(async (response) => response.ok ? await response.json() as WorkspaceUser : null)
      .then((user) => {
        if (!current) return;
        setAuth(user?.is_approved ? { status: "ready", user } : { status: "denied" });
      })
      .catch(() => current && setAuth({ status: "denied" }));
    return () => { current = false; };
  }, []);

  async function logout() {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/dashboard";
    }
  }

  if (auth.status === "loading") {
    return <div className="flex min-h-[100dvh] items-center justify-center"><span className="size-7 animate-spin rounded-full border-2 border-line border-t-tide" role="status" aria-label="Loading workspace" /></div>;
  }
  if (auth.status === "denied") return <LoggedOutView />;

  const user = auth.user;
  return (
    <>
      {user.impersonating && <ImpersonationBanner email={user.email} />}
      <AppShell
        active={active}
        workspace={workspace}
        identity={{ name: user.name || user.email, workspace: user.org?.name, avatarUrl: user.avatar_url }}
        onLogout={logout}
        adminControl={user.is_admin ? <AdminPanelControls /> : undefined}
        notice={notice}
      >
        {children}
      </AppShell>
    </>
  );
}
