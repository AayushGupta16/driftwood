import { useEffect, useRef, useState, type ReactNode } from "react";
import { Wordmark } from "../components/Chrome";
import {
  AgentsIcon,
  AssetsIcon,
  AudienceIcon,
  CampaignIcon,
  CloseIcon,
  CompaniesIcon,
  LogoutIcon,
  MenuIcon,
  MetricsIcon,
  OverviewIcon,
  PeopleIcon,
  PlusIcon,
  ReviewIcon,
  SearchVisibilityIcon,
  type DashboardIconProps,
} from "./icons";
import {
  navigationGroups,
  type DashboardIconName,
  type DashboardSection,
  type NavigationMode,
} from "./navigation";
import "./app-shell.css";

export type { DashboardSection } from "./navigation";

type Identity = {
  name: string;
  workspace?: string | null;
  avatarUrl?: string | null;
};

type AppShellProps = {
  active: DashboardSection;
  children: ReactNode;
  identity?: Identity;
  onLogout?: () => void;
  adminControl?: ReactNode;
  notice?: ReactNode;
  workspace?: boolean;
  mode?: NavigationMode;
  mainClassName?: string;
};

const ICONS: Record<DashboardIconName, (props: DashboardIconProps) => ReactNode> = {
  overview: OverviewIcon,
  audience: AudienceIcon,
  campaign: CampaignIcon,
  metrics: MetricsIcon,
  people: PeopleIcon,
  companies: CompaniesIcon,
  assets: AssetsIcon,
  review: ReviewIcon,
  agents: AgentsIcon,
  search: SearchVisibilityIcon,
};

function Navigation({ active, mode }: { active: DashboardSection; mode: NavigationMode }) {
  return (
    <nav className="app-sidebar-nav" aria-label={mode === "admin" ? "Admin panel" : "Dashboard"}>
      {navigationGroups(mode).map((group, index) => (
        <NavGroup key={group.label ?? index} label={group.label} items={group.items} active={active} />
      ))}
    </nav>
  );
}

function NavGroup({ label, items, active }: { label?: string; items: ReturnType<typeof navigationGroups>[number]["items"]; active: DashboardSection }) {
  return (
    <div className="app-sidebar-group">
      {label && <p className="app-sidebar-label">{label}</p>}
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const current = item.id === active;
        return (
          <a key={item.id} href={item.href} className={`app-sidebar-link ${current ? "is-active" : ""}`} aria-current={current ? "page" : undefined}>
            <Icon size={17} />
            <span>{item.label}</span>
          </a>
        );
      })}
    </div>
  );
}

export default function AppShell({
  active,
  children,
  identity,
  onLogout,
  adminControl,
  notice,
  workspace = false,
  mode = "customer",
  mainClassName = "",
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const name = identity?.name || "Driftwood workspace";
  const workspaceName = identity?.workspace || (mode === "admin" ? "Admin workspace" : "Customer workspace");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 959px)");
    const sync = () => {
      setMobileLayout(media.matches);
      if (!media.matches) setMenuOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!menuOpen || !mobileLayout) return;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, mobileLayout]);

  function closeMenu() {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="dashboard-app-shell">
      <a className="dashboard-skip" href="#dashboard-main">Skip to content</a>
      <header className="app-mobile-masthead">
        <button ref={menuButtonRef} type="button" className="app-mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen}>
          <MenuIcon size={19} />
        </button>
        <a href="/" className="app-mobile-brand" aria-label="Driftwood home"><Wordmark markSize="size-7" className="text-[17px]" /></a>
        <span className="app-mobile-avatar" aria-hidden="true">{name[0]?.toUpperCase()}</span>
      </header>

      <button type="button" className={`app-sidebar-scrim ${menuOpen ? "is-open" : ""}`} onClick={closeMenu} aria-label="Close navigation" tabIndex={menuOpen ? 0 : -1} />
      <aside
        ref={sidebarRef}
        className={`app-sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label={mode === "admin" ? "Admin navigation" : "Workspace navigation"}
        aria-hidden={mobileLayout && !menuOpen ? true : undefined}
        inert={mobileLayout && !menuOpen ? true : undefined}
      >
        <div className="app-sidebar-brand-row">
          <a href="/" className="app-sidebar-brand" aria-label="Driftwood home"><Wordmark markSize="size-7" className="text-[17px]" /></a>
          <button ref={closeButtonRef} type="button" className="app-sidebar-close" onClick={closeMenu} aria-label="Close navigation"><CloseIcon size={18} /></button>
        </div>
        {mode === "admin" ? (
          <div className="app-sidebar-context"><span>Driftwood</span><strong>Admin panel</strong></div>
        ) : (
          <a className="app-sidebar-create" href="/dashboard/campaigns/new"><PlusIcon size={16} />New campaign</a>
        )}
        <Navigation active={active} mode={mode} />
        <div className="app-sidebar-footer">
          {adminControl && <div className="app-sidebar-admin">{adminControl}</div>}
          <div className="app-sidebar-identity">
            {identity?.avatarUrl ? (
              <img src={identity.avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span aria-hidden="true">{name[0]?.toUpperCase()}</span>
            )}
            <div><strong>{name}</strong><small>{workspaceName}</small></div>
            {onLogout && <button type="button" onClick={onLogout} aria-label="Log out" title="Log out"><LogoutIcon size={16} /></button>}
          </div>
        </div>
      </aside>

      <div className="app-shell-stage">
        {notice && <div className="app-shell-notice" role="note">{notice}</div>}
        <main id="dashboard-main" className={`${workspace ? "app-shell-main is-workspace" : "app-shell-main"} ${mainClassName}`.trim()}>
          {children}
        </main>
      </div>
    </div>
  );
}
