import { createContext, useContext } from "react";

export type WorkspaceRole = "owner" | "admin" | "member";

export type WorkspacePermissions = {
  role: WorkspaceRole;
  canWrite: boolean;
  channels: {
    linkedin: boolean;
    email: boolean;
    x: boolean;
  };
};

export const DEFAULT_WORKSPACE_PERMISSIONS: WorkspacePermissions = {
  role: "owner",
  canWrite: true,
  channels: { linkedin: false, email: false, x: false },
};

export const WorkspacePermissionsContext = createContext(DEFAULT_WORKSPACE_PERMISSIONS);

export function useWorkspacePermissions(): WorkspacePermissions {
  return useContext(WorkspacePermissionsContext);
}
