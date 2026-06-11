/* The artifact: a recorded bug repro on the prospect's own checkout.
   Embedded by the scroll story in App.tsx and by OgCard.tsx. */
export function BugDemoCard({ compact }: { compact?: boolean }) {
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
              acme.com/checkout
            </span>
          </div>
          {/* checkout result */}
          <div className={`space-y-1.5 px-3 ${compact ? "py-2" : "py-2.5"}`}>
            <div className="flex items-center justify-between">
              <div className="h-1.5 w-16 rounded-full bg-[#dfe3e9]" />
              <span className="relative rounded-md bg-[#16181d] px-2.5 py-1 text-[10px] font-semibold text-white">
                Pay $84
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#d4574a] px-1 py-px font-mono text-[9px] font-bold leading-none text-white">
                  &times;2
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#f1f3f6] px-2 py-1.5 ring-1 ring-[#e6e9ee]">
              <span className="font-mono text-[10px] font-medium text-[#3c424e]">Visa &middot;&middot;&middot;&middot;4242</span>
              <span className="font-mono text-[10px] text-[#7a8190]">$84.00 &middot; 4:02 PM</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#fff5f4] px-2 py-1.5 ring-[1.5px] ring-[#d4574a]">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-medium text-[#3c424e]">
                Visa &middot;&middot;&middot;&middot;4242
                <span className="rounded-full bg-[#d4574a] px-1.5 py-px text-[9px] font-bold text-white">duplicate</span>
              </span>
              <span className="font-mono text-[10px] font-semibold text-[#d4574a]">$84.00 &middot; 4:02 PM</span>
            </div>
          </div>
        </div>
        {/* rec badge */}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 py-0.5 pl-1.5 pr-2 font-mono text-[10.5px] font-medium text-white">
          <span className="size-1.5 rounded-full bg-[#e2574a]" />
          REC 0:47
        </span>
      </div>
      {/* meta */}
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tide">
            <svg viewBox="0 0 24 24" className="ml-px size-2.5 fill-white">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="m-0 truncate text-[13.5px] font-semibold leading-tight text-ink">acme.com checkout, bug recording</p>
            <p className="m-0 truncate text-[11.5px] leading-tight text-ink-faint">recorded by Autosana's QA agent</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[10.5px] font-medium text-tide">0:47</span>
      </div>
    </div>
  );
}
