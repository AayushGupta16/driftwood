import { Anno } from "./Anno";

/* Ramp → Notion: their software stack, categorized + priced from public signals,
   framed as a generic spend-management app (inspired-by, not a brand clone) */

const stats = [
  { label: "est. annual SaaS spend", value: "$4.2M" },
  { label: "vendors found", value: "63" },
  { label: "est. savings on Ramp", value: "$310k/yr" },
];

/* spend by category — sums to ~$4.2M; widths relative to the largest bar */
const categories = [
  { label: "infra & cloud", value: "$2.6M", pct: 100 },
  { label: "sales & crm", value: "$640k", pct: 25 },
  { label: "collab & comms", value: "$480k", pct: 19 },
  { label: "everything else", value: "$480k", pct: 19 },
];

const navItems = [
  { label: "Overview", active: true, icon: <NavIconGrid /> },
  { label: "Cards", active: false, icon: <NavIconCard /> },
  { label: "Expenses", active: false, icon: <NavIconReceipt /> },
  { label: "Bills", active: false, icon: <NavIconDoc /> },
  { label: "Insights", active: false, icon: <NavIconChart /> },
];

function NavIconGrid() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function NavIconCard() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 6.5h13" />
    </svg>
  );
}

function NavIconReceipt() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3.5 1.5h9v13l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5v-13Z" strokeLinejoin="round" />
      <path d="M6 5.5h4M6 8.5h4" strokeLinecap="round" />
    </svg>
  );
}

function NavIconDoc() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 1.5h5.5l3 3v10H4v-13Z" strokeLinejoin="round" />
      <path d="M9.5 1.5v3h3" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconChart() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2.5 13.5v-4M6.5 13.5v-7M10.5 13.5v-5M14.5 13.5v-10" strokeLinecap="round" />
    </svg>
  );
}

export function RampSpendMock() {
  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <Anno text="stack found via the BuiltWith API" pos="-top-3 right-8 rotate-1" />

      {/* app frame */}
      <div className="flex flex-1 overflow-hidden rounded-xl border border-line bg-white">
        {/* sidebar — icons only below md, hidden below sm */}
        <nav className="hidden w-11 shrink-0 flex-col gap-1 border-r border-line/80 bg-paper/50 px-1.5 py-3 sm:flex md:w-[118px] md:px-2">
          {navItems.map((item) => (
            <span
              key={item.label}
              className={`flex items-center justify-center gap-2 rounded-md px-2 py-1.5 font-mono text-[12px] md:justify-start ${
                item.active
                  ? "bg-tide-wash font-medium text-tide ring-1 ring-tide/20"
                  : "text-ink-faint"
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </span>
          ))}
        </nav>

        {/* main panel */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5 sm:p-4">
          {/* panel header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-2.5">
            <span className="font-mono text-[13.5px] font-semibold text-ink">
              Notion &middot; spend overview
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-ink-faint">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-tide" />
              0 accounts connected
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-paper/60 px-2.5 py-2 ring-1 ring-line/70">
                <p className="m-0 font-mono text-[12px] leading-snug text-ink-faint">{s.label}</p>
                <p className="m-0 mt-0.5 text-[19px] font-bold tracking-[-0.01em] text-ink sm:text-[22px]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* spend by category — small horizontal bars */}
          <div className="rounded-lg bg-paper/40 px-2.5 py-2 ring-1 ring-line/50">
            <p className="m-0 mb-1.5 font-mono text-[12px] text-ink-faint">spend by category</p>
            <div className="space-y-1.5">
              {categories.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="w-[108px] shrink-0 truncate font-mono text-[13px] text-ink-soft sm:w-[124px]">
                    {c.label}
                  </span>
                  <svg
                    viewBox="0 0 100 8"
                    preserveAspectRatio="none"
                    className="h-2 min-w-0 flex-1"
                    aria-hidden="true"
                  >
                    <rect x="0" y="0" width="100" height="8" rx="4" className="fill-sand/45" />
                    <rect x="0" y="0" width={c.pct} height="8" rx="4" className="fill-tide/80" />
                  </svg>
                  <span className="w-[52px] shrink-0 text-right font-mono text-[13px] text-ink-soft">
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* vendor rows */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/60 px-3 py-2 ring-1 ring-line/70">
              <span className="truncate font-mono text-[13.5px] text-ink">
                <span className="font-semibold">AWS</span> &middot; engineering
              </span>
              <span className="shrink-0 font-mono text-[13.5px] text-ink-soft">~$2.4M/yr</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/60 px-3 py-2 ring-1 ring-line/70">
              <span className="truncate font-mono text-[13.5px] text-ink">
                <span className="font-semibold">Salesforce</span> &middot; sales
              </span>
              <span className="shrink-0 font-mono text-[13.5px] text-ink-soft">
                ~$310k/yr &middot; <span className="font-medium text-tide">partner discount</span>
              </span>
            </div>
            {/* hero insight */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-tide-wash/80 px-3 py-2.5 shadow-[0_6px_16px_-10px_rgba(13,60,91,0.5)] ring-1 ring-tide/40">
              <span className="truncate font-mono text-[13.5px] text-ink">
                <span className="font-semibold">Zoom + Google Meet</span> &middot; overlap
              </span>
              <span className="shrink-0 rounded-full bg-tide px-2.5 py-1 font-mono text-[13px] font-medium text-white">
                pick one, save ~$40k
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/40 px-3 py-2 ring-1 ring-line/50 opacity-60">
              <span className="font-mono text-[13.5px] text-ink-soft">+ 60 more vendors, categorized</span>
              <span className="font-mono text-[13.5px] text-ink-faint">&hellip;</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
