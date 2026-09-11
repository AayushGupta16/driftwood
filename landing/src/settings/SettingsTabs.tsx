import { withMockMode } from "../mock-mode";
const items = [["Send schedule", "/dashboard/settings"], ["Sending accounts", "/dashboard/settings?tab=accounts"], ["Approvals", "/dashboard/settings?tab=approvals"], ["Product & brand assets", "/dashboard/assets"], ["Team", "/dashboard/team"], ["Face Cloning", "/dashboard/face-cloning"]];
export default function SettingsTabs({ active }: { active: string }) {
 return <nav aria-label="Settings views" className="section-tabs">{items.map(([label, href]) => <a key={href} href={withMockMode(href)} aria-current={label === active ? "page" : undefined}>{label}</a>)}</nav>;
}
