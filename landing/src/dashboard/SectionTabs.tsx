import { withMockMode } from "../mock-mode";
export default function SectionTabs({ active }: { section?: "audiences"; active: string }) {
 const items = [["Lists", "/dashboard/audiences"], ["All contacts", "/dashboard/leads"], ["Companies", "/dashboard/companies"]];
 return <nav aria-label="Audience views" className="section-tabs">{items.map(([label, href]) => <a key={href} href={withMockMode(href)} aria-current={label === active ? "page" : undefined}>{label}</a>)}</nav>;
}
