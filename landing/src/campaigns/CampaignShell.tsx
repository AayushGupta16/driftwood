import type { ReactNode } from "react";
import { type DashboardSection } from "../dashboard/AppShell";
import WorkspacePage from "../dashboard/WorkspacePage";
import "./campaigns.css";

type CampaignShellProps = {
  active: "home" | "campaigns" | "people" | "review";
  children: ReactNode;
  workspace?: boolean;
};

export default function CampaignShell({
  active,
  children,
  workspace = false,
}: CampaignShellProps) {
  const shellSection: DashboardSection = active === "people" ? "leads" : active;
  return (
    <WorkspacePage
      active={shellSection}
      workspace={workspace}
      notice="Campaign activation freezes a version. Outreach still requires the existing review and approval path."
    >
      {children}
    </WorkspacePage>
  );
}
