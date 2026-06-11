import { Anno } from "./Anno";

/* Square → Joe's Pizza: their real menu, live as an ordering page they never set up */
export function SquareOrderMock() {
  const menu = [
    {
      item: "cheese slice",
      price: "$3.50",
      qty: 1,
      thumb:
        "bg-[radial-gradient(circle_at_30%_25%,#f9e2a4,transparent_60%),linear-gradient(135deg,#f2cd7d,#dfa03c)]",
    },
    {
      item: "pepperoni slice",
      price: "$4.75",
      qty: 1,
      thumb:
        "bg-[radial-gradient(circle_at_32%_34%,#b8372b_0_4px,transparent_4.5px),radial-gradient(circle_at_68%_62%,#b8372b_0_4px,transparent_4.5px),radial-gradient(circle_at_52%_80%,#a52f24_0_3px,transparent_3.5px),linear-gradient(135deg,#f0c873,#dd9c38)]",
    },
    {
      item: "garlic knots (4)",
      price: "$4.00",
      qty: 0,
      thumb:
        "bg-[radial-gradient(circle_at_30%_32%,#f0d9a8_0_5px,transparent_5.5px),radial-gradient(circle_at_70%_40%,#ecd09a_0_5px,transparent_5.5px),radial-gradient(circle_at_48%_72%,#e9cd92_0_5px,transparent_5.5px),linear-gradient(135deg,#d9a85e,#a8712f)]",
    },
  ];
  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <Anno text="menu: from their PDF" pos="-top-3 right-8 rotate-1" />
      <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(165deg,#2b2f37,#191c22)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 font-mono text-[13px] text-white/65">
          <span className="truncate">joespizza.nyc &middot; ordering page, live on Square</span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="pulse-dot size-1.5 rounded-full bg-[#3fb98a]" />
            accepting orders
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {/* the ordering page */}
          <div className="flex w-66 flex-col gap-2 rounded-[20px] bg-white p-3 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <span className="text-[16px] font-bold text-ink">Joe's Pizza</span>
              <span className="rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[12px] font-medium text-tide">
                order online
              </span>
            </div>
            {/* storefront photo strip: awning stripes over a late-night facade */}
            <div className="relative h-16 overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_50%_115%,rgba(244,196,108,0.5),transparent_62%),linear-gradient(170deg,#363a43,#181b21)]">
              <div className="h-2.5 w-full bg-[repeating-linear-gradient(90deg,#b3403a_0_14px,#f3ece0_14px_28px)]" />
              <span className="absolute bottom-1.5 left-2.5 font-mono text-[11.5px] text-white/75">
                their Carmine St storefront
              </span>
            </div>
            {menu.map((m) => (
              <div
                key={m.item}
                className="flex items-center gap-2.5 rounded-lg bg-paper/60 px-2 py-1.5 ring-1 ring-line/70"
              >
                <span className={`size-9 shrink-0 rounded-md ring-1 ring-black/10 ${m.thumb}`} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-semibold text-ink">{m.item}</span>
                  <span className="font-mono text-[13px] leading-tight text-ink-faint">{m.price}</span>
                </span>
                {m.qty > 0 ? (
                  <span className="flex shrink-0 items-center gap-2 rounded-full bg-white px-2 py-0.5 font-mono text-[13px] text-ink ring-1 ring-line">
                    <span className="text-ink-faint">&minus;</span>
                    {m.qty}
                    <span className="text-tide">+</span>
                  </span>
                ) : (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[14px] text-tide ring-1 ring-line">
                    +
                  </span>
                )}
              </div>
            ))}
            {/* sticky checkout bar */}
            <span className="flex items-center justify-between rounded-lg bg-ink px-3 py-2">
              <span className="font-mono text-[13px] text-paper/75">2 slices &middot; $8.25</span>
              <span className="text-[13.5px] font-semibold text-paper">Checkout &rarr;</span>
            </span>
          </div>
          {/* the first order, landing on their kitchen printer */}
          <div className="w-56 rotate-2 [filter:drop-shadow(0_24px_28px_rgba(0,0,0,0.55))]">
            <div className="rounded-t-md bg-[#fbf7ea] px-4 pt-3.5 pb-3 font-mono">
              <p className="m-0 text-center text-[12.5px] font-bold tracking-[0.14em] text-[#2a2d33]">
                NEW ONLINE ORDER
              </p>
              <p className="m-0 mt-0.5 text-center text-[11.5px] text-[#8a8576]">#001 &middot; 6:42 PM</p>
              <div className="my-2.5 border-t border-dashed border-[#cfc8b0]" />
              <div className="space-y-1.5 text-[12.5px] text-[#3c3a30]">
                <p className="m-0 flex justify-between">
                  <span>2&times; cheese slice</span>
                  <span>$7.00</span>
                </p>
                <p className="m-0 flex justify-between">
                  <span>1&times; garlic knots</span>
                  <span>$4.00</span>
                </p>
              </div>
              <div className="my-2.5 border-t border-dashed border-[#cfc8b0]" />
              <p className="m-0 flex justify-between text-[13px] font-bold text-[#2a2d33]">
                <span>total</span>
                <span>$11.00</span>
              </p>
              <p className="m-0 mt-2.5 text-center text-[11.5px] text-[#8a8576]">
                test order — simulated, no charge
              </p>
            </div>
            {/* torn perforated edge, fresh off the printer */}
            <svg
              viewBox="0 0 224 8"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="-mt-px block h-2 w-full"
            >
              <path
                fill="#fbf7ea"
                d="M0 0 H224 L216 8 L208 0 L200 8 L192 0 L184 8 L176 0 L168 8 L160 0 L152 8 L144 0 L136 8 L128 0 L120 8 L112 0 L104 8 L96 0 L88 8 L80 0 L72 8 L64 0 L56 8 L48 0 L40 8 L32 0 L24 8 L16 0 L8 8 Z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
