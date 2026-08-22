export type DashboardSection =
  | "home"
  | "audiences"
  | "campaigns"
  | "metrics"
  | "leads"
  | "companies"
  | "assets"
  | "review"
  | "admin-agents"
  | "admin-search";

export type NavigationMode = "customer" | "admin";

export type DashboardIconName =
  | "overview"
  | "audience"
  | "campaign"
  | "metrics"
  | "people"
  | "companies"
  | "assets"
  | "review"
  | "agents"
  | "search";

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
  { id: "metrics", label: "Metrics", href: "/dashboard/metrics", icon: "metrics" },
];

const CUSTOMER_WORKSPACE: NavItem[] = [
  { id: "leads", label: "All leads", href: "/dashboard/leads", icon: "people" },
  { id: "companies", label: "Companies", href: "/dashboard/companies", icon: "companies" },
  { id: "assets", label: "Assets", href: "/dashboard/assets", icon: "assets" },
  { id: "review", label: "Review queue", href: "/dashboard/review", icon: "review" },
];

const ADMIN_INTERNAL: NavItem[] = [
  { id: "admin-agents", label: "Agents", href: "/dashboard/admin/agents", icon: "agents" },
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
