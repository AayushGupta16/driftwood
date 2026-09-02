export type DashboardSection =
  | "home"
  | "audiences"
  | "campaigns"
  | "triggers"
  | "metrics"
  | "leads"
  | "companies"
  | "assets"
  | "review"
  | "team"
  | "admin-agents"
  | "admin-search"
  | "admin-fleet"
  | "admin-drift";

export type NavigationMode = "customer" | "admin";

export type DashboardIconName =
  | "overview"
  | "audience"
  | "campaign"
  | "trigger"
  | "metrics"
  | "people"
  | "companies"
  | "assets"
  | "review"
  | "agents"
  | "search"
  | "fleet"
  | "drift";

export type NavItem = {
  id: DashboardSection;
  label: string;
  href: string;
  icon: DashboardIconName;
};

export type NavGroup = { label?: string; items: NavItem[] };

const CUSTOMER_PRIMARY: NavItem[] = [
  { id: "home", label: "Overview", href: "/dashboard", icon: "overview" },
  { id: "audiences", label: "Audiences", href: "/dashboard/audiences", icon: "audience" },
  { id: "campaigns", label: "Campaigns", href: "/dashboard/campaigns", icon: "campaign" },
  { id: "triggers", label: "Triggers", href: "/dashboard/triggers", icon: "trigger" },
  { id: "metrics", label: "Metrics", href: "/dashboard/metrics", icon: "metrics" },
];

const CUSTOMER_WORKSPACE: NavItem[] = [
  { id: "leads", label: "All leads", href: "/dashboard/leads", icon: "people" },
  { id: "companies", label: "Companies", href: "/dashboard/companies", icon: "companies" },
  { id: "assets", label: "Assets", href: "/dashboard/assets", icon: "assets" },
  { id: "review", label: "Review queue", href: "/dashboard/review", icon: "review" },
  { id: "team", label: "Team", href: "/dashboard/team", icon: "people" },
];

const ADMIN_INTERNAL: NavItem[] = [
  { id: "admin-fleet", label: "Fleet", href: "/dashboard/admin/fleet", icon: "fleet" },
  { id: "admin-agents", label: "Agents", href: "/dashboard/admin/agents", icon: "agents" },
  { id: "admin-drift", label: "Drift runs", href: "/dashboard/admin/drift", icon: "drift" },
  // Dropped 2026-08-23 (Aayush/Dheer call), re-added 2026-08-31 on Aayush's ask.
  { id: "admin-search", label: "Search visibility", href: "/dashboard/admin/search-visibility", icon: "search" },
];

export function navigationGroups(mode: NavigationMode): NavGroup[] {
  return mode === "admin"
    ? [{ label: "Internal tools", items: ADMIN_INTERNAL }]
    : [
        { items: CUSTOMER_PRIMARY },
        { label: "Workspace", items: CUSTOMER_WORKSPACE },
      ];
}
