/* beat 1 — the 15-minute onboarding call, rendered as the artifact it actually
   produces: a shared Notion-style doc both sides are looking at, filling in
   live. The only hint of the call itself is the red-dot timer in the chrome. */

const DEMO_IDEAS = [
  "find bugs on the prospect's own site",
  "custom flows for their product, shown in the dashboard",
  "vibe-code a replica of their app + ship a feature",
];

const ICP_TAGS: { label: string; tone: string }[] = [
  { label: "CTOs", tone: "bg-tide-wash text-tide-deep" },
  { label: "QA engineers", tone: "bg-sand text-ink-soft" },
];

/* Notion block handle — the ⋮⋮ grip that sits in the left gutter of a block */
function BlockHandle() {
  return (
    <span
      aria-hidden="true"
      className="absolute -left-4.5 top-0.5 select-none font-mono text-[13px] leading-none tracking-[-0.12em] text-ink-faint/35"
    >
      &#8942;&#8942;
    </span>
  );
}

export function StoryCallCard({ building, icps, ideas }: { building: boolean; icps: boolean; ideas: number }) {
  return (
    <div className="flex w-full max-w-135 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)] lg:min-h-110">
      {/* doc chrome: breadcrumb on the left, presence + call timer on the right */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-2.5">
        <span className="min-w-0 truncate font-mono text-[13.5px] text-ink-faint">
          driftwood <span className="text-ink-faint/60">/</span>{" "}
          <span className="text-ink-soft">autosana &mdash; onboarding</span>
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="flex -space-x-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-tide font-mono text-[13px] font-semibold leading-none text-white ring-2 ring-surface">
              A
            </span>
            <span className="flex size-5 items-center justify-center rounded-full bg-tide-wash font-mono text-[13px] font-semibold leading-none text-tide ring-2 ring-surface">
              d
            </span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-0.5 font-mono text-[13.5px] text-ink-soft">
            <span className="size-1.5 rounded-full bg-[#e2574a]" />
            12:04
          </span>
        </span>
      </div>

      {/* the doc itself: white page, generous margins, Notion-flavored blocks */}
      <div className="flex flex-1 flex-col bg-white px-8 pb-7 pt-6 sm:px-10">
        {/* page title + meta */}
        <h3 className="m-0 text-[20px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          Autosana &mdash; onboarding
        </h3>
        <p className="m-0 mt-1.5 flex items-center gap-2 font-mono text-[13px] text-ink-faint">
          <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
          15-minute call &middot; notes fill in live
        </p>

        <div className="my-4 h-px bg-line/70" />

        <div className="flex flex-1 flex-col gap-5">
          {/* block: what they're building */}
          <div className={building ? "log-line" : "invisible"}>
            <div className="relative">
              <BlockHandle />
              <p className="m-0 text-[13.5px] font-semibold text-ink-soft">What they&apos;re building</p>
            </div>
            <p className="m-0 mt-1 text-[15px] leading-relaxed text-ink">
              AI agents that QA web apps automatically
            </p>
          </div>

          {/* block: ICPs as Notion colored tags */}
          <div className={icps ? "log-line" : "invisible"}>
            <p className="m-0 text-[13.5px] font-semibold text-ink-soft">ICPs</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ICP_TAGS.map(({ label, tone }) => (
                <span key={label} className={`rounded px-2 py-0.5 font-mono text-[13px] leading-snug ${tone}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* block: demo ideas as a Notion to-do list */}
          <div>
            <div className="relative">
              <BlockHandle />
              <p className="m-0 text-[13.5px] font-semibold text-ink-soft">Demo ideas</p>
            </div>
            <div className="mt-2 space-y-2">
              {DEMO_IDEAS.map((idea, i) => (
                <div
                  key={idea}
                  className={`flex items-center gap-2.5 ${i < ideas ? "toast-in" : "invisible"}`}
                >
                  <span className="size-3.5 shrink-0 rounded-[3px] ring-1 ring-line" />
                  <span className="min-w-0 flex-1 text-[15px] leading-snug text-ink sm:truncate">{idea}</span>
                  <span className="shrink-0 rounded bg-paper px-1.5 py-px font-mono text-[13px] text-ink-faint">
                    idea
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
