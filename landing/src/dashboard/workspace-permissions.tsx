import type { ReactNode } from "react";
import {
  DEFAULT_WORKSPACE_PERMISSIONS,
  WorkspacePermissionsContext,
  type WorkspacePermissions,
  type WorkspaceRole,
} from "./workspace-permissions-context";

export function WorkspacePermissionsProvider({
  role,
  channels,
  children,
}: {
  role: WorkspaceRole;
  channels?: WorkspacePermissions["channels"];
  children: ReactNode;
}) {
  return (
    <WorkspacePermissionsContext.Provider value={{
      role,
      canWrite: role !== "member",
      channels: channels ?? DEFAULT_WORKSPACE_PERMISSIONS.channels,
    }}>
      {children}
    </WorkspacePermissionsContext.Provider>
  );
}
