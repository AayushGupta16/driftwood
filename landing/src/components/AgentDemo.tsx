/* The artifact: a live online-ordering page the agent built from the prospect's
   own menu. Embedded by the marquee terminal in App.tsx and by OgCard.tsx. */
export function OrderDemoCard({ compact }: { compact?: boolean }) {
  const items = [
    { name: "cheese slice", price: "$3.50" },
    { name: "pepperoni slice", price: "$4.75" },
    { name: "garlic knots (4)", price: "$4.00" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* mini browser */}
      <div className={`relative bg-[#eef0f3] ${compact ? "p-2.5 pb-0" : "p-3 pb-0"}`}>
        <div className="overflow-hidden rounded-t-lg border border-b-0 border-[#d8dce2] bg-white shadow-sm">
          {/* chrome */}
          <div className="flex items-center gap-1.5 border-b border-[#e8eaee] bg-[#f6f7f9] px-2.5 py-1.5">
            <span className="size-1.5 rounded-full bg-[#d9dde3]" />
            <span className="size-1.5 rounded-full bg-[#d9dde3]" />
            <span className="size-1.5 rounded-full bg-[#d9dde3]" />
            <span className="ml-1.5 rounded bg-white px-2 py-0.5 font-mono text-[10.5px] text-[#7a8190] ring-1 ring-[#e8eaee]">
              joespizza.nyc/order
            </span>
          </div>
          {/* the ordering page the agent built */}
          <div className={`px-3 ${compact ? "py-2" : "py-2.5"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-ink">Joe's Pizza</span>
              <span className="rounded-full bg-tide-wash px-1.5 py-0.5 font-mono text-[9px] font-medium text-tide">
                order online
              </span>
            </div>
            <div className="mt-1.5 space-y-1">
              {items.map((it) => (
                <div
                  key={it.name}
                  className="flex items-center justify-between rounded-md bg-[#f1f3f6] px-2 py-1 ring-1 ring-[#e6e9ee]"
                >
                  <span className="font-mono text-[10px] font-medium text-[#3c424e]">{it.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[#7a8190]">{it.price}</span>
                    <span className="flex size-3.5 items-center justify-center rounded-full bg-white font-mono text-[11px] leading-none text-tide ring-1 ring-[#e6e9ee]">
                      +
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-md bg-[#16181d] px-2 py-1">
              <span className="font-mono text-[9.5px] text-paper/70">2 slices &middot; $8.25</span>
              <span className="text-[9.5px] font-semibold text-paper">Checkout &rarr;</span>
            </div>
          </div>
        </div>
        {/* live badge */}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 py-0.5 pl-1.5 pr-2 font-mono text-[10.5px] font-medium text-white">
          <span className="pulse-dot size-1.5 rounded-full bg-[#3fb98a]" />
          LIVE
        </span>
      </div>
      {/* meta */}
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tide">
            <svg viewBox="0 0 24 24" className="size-3 stroke-white" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="m-0 truncate text-[13.5px] font-semibold leading-tight text-ink">joespizza.nyc, live ordering page</p>
            <p className="m-0 truncate text-[11.5px] leading-tight text-ink-faint">built from their menu, on Square</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[10.5px] font-medium text-tide">live</span>
      </div>
    </div>
  );
}
