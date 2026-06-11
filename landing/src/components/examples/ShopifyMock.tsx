import { Anno } from "./Anno";

/* Shopify → Patagonia: their own store, already rebuilt — one beautiful storefront */

const products = [
  { name: "Down Jacket", price: "$229", thumb: "bg-[linear-gradient(160deg,#f3ede1,#ddd2bc)]", body: "bg-[#b4552d]", hood: "bg-[#9a4523]" },
  { name: "Storm Shell", price: "$179", thumb: "bg-[linear-gradient(160deg,#eef0ea,#d3dad0)]", body: "bg-[#1d5e63]", hood: "bg-[#164b50]" },
  { name: "Trail Fleece", price: "$119", thumb: "bg-[linear-gradient(160deg,#f2efe6,#dcd5c2)]", body: "bg-[#5d6648]", hood: "bg-[#4b533a]" },
];

export function ShopifyRebuildMock() {
  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <Anno text="412 products imported overnight" pos="-top-3 left-8 -rotate-1" />
      <Anno text="checkout: 6 clicks → 2" pos="top-[44%] -right-4 rotate-1" />

      {/* browser frame */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_16px_40px_-24px_rgba(13,60,91,0.4)]">
        {/* chrome */}
        <div className="flex items-center gap-2.5 border-b border-line/70 bg-paper px-3.5 py-2">
          <span className="flex shrink-0 gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ec6a5e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f4bf4f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#61c554]" />
          </span>
          <span className="mx-auto truncate rounded-md bg-surface px-3 py-0.5 font-mono text-[13px] text-ink-soft ring-1 ring-line">
            patagonia.com &middot; rebuilt preview
          </span>
          <span className="hidden shrink-0 rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[12.5px] font-medium text-tide sm:inline">
            on Shopify
          </span>
        </div>

        {/* announcement bar */}
        <div className="bg-ink py-1 text-center font-mono text-[13px] text-paper/85">
          Free repairs for life &middot; carbon-neutral shipping
        </div>

        {/* nav */}
        <div className="flex items-center gap-4 border-b border-line/70 bg-surface px-4 py-2.5">
          <span className="text-[15px] font-bold tracking-[0.14em] text-ink">PATAGONIA</span>
          <span className="hidden gap-3.5 text-[13px] text-ink-soft sm:flex">
            <span>Shop</span>
            <span>Men</span>
            <span>Women</span>
            <span>Packs</span>
          </span>
          <span className="ml-auto font-mono text-[13px] text-ink-soft">Bag (2)</span>
        </div>

        {/* hero: dusk sky + ridgeline, inline SVG */}
        <div className="relative h-[136px] shrink-0 overflow-hidden">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 136" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="dw-dusk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1f2a4a" />
                <stop offset="0.55" stopColor="#5b4a6b" />
                <stop offset="1" stopColor="#d98e5f" />
              </linearGradient>
            </defs>
            <rect width="700" height="136" fill="url(#dw-dusk)" />
            <circle cx="520" cy="78" r="22" fill="#f4c684" opacity="0.9" />
            <polygon points="0,136 0,88 110,52 220,96 330,60 440,104 560,70 700,100 700,136" fill="#2b3354" opacity="0.85" />
            <polygon points="0,136 0,110 140,80 280,118 420,86 540,120 700,92 700,136" fill="#141a2e" />
          </svg>
          <div className="relative flex h-full flex-col items-start justify-center gap-1.5 px-5">
            <h3 className="m-0 text-[21px] font-bold leading-tight text-white drop-shadow-[0_1px_4px_rgba(10,14,30,0.6)]">
              Built for the long haul
            </h3>
            <p className="m-0 text-[13px] text-white/85 drop-shadow-[0_1px_3px_rgba(10,14,30,0.6)]">
              Gear that outlasts the season — and the next ten.
            </p>
            <span className="mt-1 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold text-ink">
              Shop the collection
            </span>
          </div>
        </div>

        {/* product grid */}
        <div className="flex flex-1 flex-col gap-2.5 bg-paper/60 p-3.5">
          <div className="grid grid-cols-3 gap-2.5 max-[400px]:grid-cols-2">
            {products.map((p, i) => (
              <div
                key={p.name}
                className={`overflow-hidden rounded-lg bg-surface ring-1 ring-line ${i === 2 ? "max-[400px]:col-span-2" : ""}`}
              >
                <div className={`flex h-16 items-end justify-center ${p.thumb}`}>
                  {/* abstract jacket silhouette */}
                  <div className="relative mb-1.5 w-11">
                    <div className={`mx-auto h-3 w-6 rounded-t-full ${p.hood}`} />
                    <div className={`relative h-8 w-11 rounded-md rounded-t-[12px] ${p.body}`}>
                      <span className="absolute left-1/2 top-1 h-6 w-px -translate-x-1/2 bg-white/45" />
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-1 px-2 py-1.5">
                  <span className="truncate text-[12.5px] font-medium text-ink">{p.name}</span>
                  <span className="shrink-0 font-mono text-[12.5px] text-ink-faint">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
          <span className="rounded-lg bg-ink py-2 text-center text-[14px] font-semibold text-paper">
            Buy now &mdash; 1-tap checkout
          </span>
        </div>
      </div>

    </div>
  );
}
