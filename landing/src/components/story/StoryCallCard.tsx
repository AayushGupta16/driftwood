/* beat 1 — the 15-minute onboarding call, rendered the way Zoom/Meet actually
   render a screenshare: a shared notes doc dominates the window, the call
   itself is pushed to the edges (presenter bar up top, PiP thumbnails) */

const DEMO_IDEAS = [
  "find bugs on the prospect's own site",
  "custom flows for their product, shown in the dashboard",
  "vibe-code a replica of their app + ship a feature",
];

/* tiny picture-in-picture participant thumbnail — clearly subordinate to the
   shared doc; sub-13px text is fine here, it's chrome inside an app mock */
function PipThumb({ initials, name, accent }: { initials: string; name: string; accent: string }) {
  return (
    <div className="relative h-11 w-16 overflow-hidden rounded-md bg-[#23262d] ring-1 ring-white/15">
      <span
        className={`absolute left-1/2 top-[42%] flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-[9px] font-semibold text-white ${accent}`}
      >
        {initials}
      </span>
      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 py-px font-mono text-[10.5px] leading-tight text-white/85">
        {name}
      </span>
    </div>
  );
}

export function StoryCallCard({ building, icps, ideas }: { building: boolean; icps: boolean; ideas: number }) {
  return (
    <div className="flex w-full max-w-135 flex-col rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)] lg:min-h-110">
      {/* meeting chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex min-w-0 items-center gap-2 font-mono text-[14px] font-medium text-ink-soft">
          <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
          <span className="min-w-0 sm:truncate">15-minute onboarding call</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-sand px-2.5 py-0.5 font-mono text-[13.5px] text-ink-soft">
          <span className="size-1.5 rounded-full bg-[#e2574a]" />
          12:04
        </span>
      </div>
      {/* the screenshare viewport: dark call surround, shared doc filling it */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl bg-[#16181d]">
          {/* presenter bar, Zoom-style */}
          <p className="m-0 bg-[#2f7d5b]/90 py-1 text-center font-mono text-[11.5px] text-white">
            You are viewing driftwood&apos;s screen
          </p>
          {/* picture-in-picture participants, pinned to the edge of the share */}
          <div className="absolute right-2 top-8 z-10 flex gap-1.5">
            <PipThumb initials="AU" name="Autosana" accent="bg-tide" />
            <PipThumb initials="dw" name="driftwood" accent="bg-white/15 ring-1 ring-white/25" />
          </div>
          {/* the shared notes document — the dominant visual */}
          <div className="m-2 flex flex-1 flex-col rounded-lg bg-surface">
            <div className="flex min-w-0 items-center gap-2.5 border-b border-line/70 py-2.5 pl-4 pr-37">
              <span className="min-w-0 truncate font-mono text-[13px] text-ink-soft">
                autosana &mdash; onboarding notes
              </span>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[13px] text-ink-faint">
                <span className="pulse-dot size-1.5 rounded-full bg-tide" />
                live
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-4 px-4 py-4">
              <div className={building ? "log-line" : "invisible"}>
                <p className="m-0 font-mono text-[13px] tracking-[0.02em] text-ink-faint">what they're building</p>
                <p className="m-0 mt-1 text-[15px] leading-relaxed text-ink">
                  AI agents that QA web apps automatically
                </p>
              </div>
              <div className={icps ? "log-line" : "invisible"}>
                <p className="m-0 font-mono text-[13px] tracking-[0.02em] text-ink-faint">their ICPs</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {["CTOs", "QA engineers"].map((icp) => (
                    <span
                      key={icp}
                      className="rounded-full border border-line bg-paper/70 px-2.5 py-0.5 font-mono text-[13px] text-ink-soft"
                    >
                      {icp}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="m-0 font-mono text-[13px] tracking-[0.02em] text-ink-faint">ideas for custom demos</p>
                <div className="mt-2 space-y-1.5">
                  {DEMO_IDEAS.map((idea, i) => (
                    <div
                      key={idea}
                      className={`flex items-center justify-between gap-3 rounded-lg bg-paper/70 px-3 py-2 ring-1 ring-line/70 ${
                        i < ideas ? "toast-in" : "invisible"
                      }`}
                    >
                      <span className="min-w-0 text-[14.5px] font-medium text-ink-soft sm:truncate">{idea}</span>
                      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-mono text-[13px] text-ink-faint ring-1 ring-line">
                        idea
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
