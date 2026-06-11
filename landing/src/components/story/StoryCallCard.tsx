/* beat 1 — the 15-minute Zoom-style onboarding call, with an AI notetaker
   (Granola-style) filling in what we learn, live */

const DEMO_IDEAS = [
  "find bugs on the prospect's own site",
  "custom flows for their product, shown in the dashboard",
  "vibe-code a replica of their app + ship a feature",
];

/* tiny muted-mic glyph for the video tiles */
function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3 stroke-white/65"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </svg>
  );
}

/* one abstract participant tile: initials avatar, name tag, mic — no faces */
function VideoTile({ initials, name, accent }: { initials: string; name: string; accent: string }) {
  return (
    <div className="relative h-20 flex-1 overflow-hidden rounded-xl bg-[#16181d]">
      <span
        className={`absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-[12px] font-semibold text-white ${accent}`}
      >
        {initials}
      </span>
      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[11px] text-white/85">
        {name}
      </span>
      <span className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-md bg-black/60">
        <MicIcon />
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
      {/* the call itself: two short tiles, no faces */}
      <div className="flex gap-2.5 px-5 pt-4">
        <VideoTile initials="AU" name="Autosana" accent="bg-tide" />
        <VideoTile initials="dw" name="driftwood" accent="bg-white/15 ring-1 ring-white/25" />
      </div>
      {/* the AI notetaker, filling in live */}
      <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-5">
        <p className="m-0 flex items-center gap-2.5 font-mono text-[14px] tracking-[0.02em] text-ink-faint">
          <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
          notes &middot; taken live
        </p>
        <div className={building ? "log-line" : "invisible"}>
          <p className="m-0 font-mono text-[14px] tracking-[0.02em] text-ink-faint">what they're building</p>
          <p className="m-0 mt-1.5 text-[16px] leading-relaxed text-ink">AI agents that QA web apps automatically</p>
        </div>
        <div className={icps ? "log-line" : "invisible"}>
          <p className="m-0 font-mono text-[14px] tracking-[0.02em] text-ink-faint">their ICPs</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["CTOs", "QA engineers"].map((icp) => (
              <span
                key={icp}
                className="rounded-full border border-line bg-paper/70 px-3 py-1 font-mono text-[13px] text-ink-soft"
              >
                {icp}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="m-0 font-mono text-[14px] tracking-[0.02em] text-ink-faint">ideas for custom demos</p>
          <div className="mt-2.5 space-y-2">
            {DEMO_IDEAS.map((idea, i) => (
              <div
                key={idea}
                className={`flex items-center justify-between gap-3 rounded-xl bg-paper/70 px-3.5 py-2.5 ring-1 ring-line/70 ${
                  i < ideas ? "toast-in" : "invisible"
                }`}
              >
                <span className="min-w-0 text-[15.5px] font-medium text-ink-soft sm:truncate">{idea}</span>
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-mono text-[13.5px] text-ink-faint ring-1 ring-line">
                  idea
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
