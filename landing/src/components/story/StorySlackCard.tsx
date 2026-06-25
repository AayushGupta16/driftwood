/* beat 4 — the weekly results update, posted by the driftwood bot in the
   customer's Slack channel: which demo types are winning, what we're cutting */

const PROOF_RANKING = [
  { name: "live ordering page", replies: "4.9% reply", width: "82%", tone: "win", tag: "gets the budget" },
  { name: "rebuilt menu preview", replies: "3.2% reply", width: "54%", tone: "mid", tag: "testing now" },
  { name: "savings one-pager", replies: "1.1% reply", width: "18%", tone: "cut", tag: "cut this week" },
] as const;

export function StorySlackCard({ rows }: { rows: number }) {
  return (
    <div className="flex w-full max-w-135 flex-col rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)] lg:min-h-110">
      {/* channel chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[14px] font-medium text-ink-soft">
          <span className="text-ink-faint">#</span>
          <span className="min-w-0 sm:truncate">square-outbound</span>
        </span>
        <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 font-mono text-[13px] text-ink-soft">
          2 members
        </span>
      </div>
      {/* the bot's weekly message */}
      <div className="flex flex-1 items-start gap-3 px-5 py-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tide font-mono text-[15px] font-semibold text-white">
          d
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="m-0 text-[15.5px] font-bold text-ink">driftwood</p>
            <span className="rounded bg-paper px-1.5 py-px font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint ring-1 ring-line">
              app
            </span>
            <span className="font-mono text-[12.5px] text-ink-faint">Fri 9:00 AM</span>
          </div>
          <p className="m-0 mt-1.5 text-[15.5px] leading-relaxed text-ink">week 3: what's winning</p>
          {/* attachment block: the ranking */}
          <div className="mt-2.5 space-y-2 rounded-lg rounded-l-none border-l-[3px] border-tide/45 bg-paper/60 py-2.5 pl-3 pr-2.5">
            {PROOF_RANKING.map((a, i) => (
              <div
                key={a.name}
                className={`rounded-xl px-3.5 py-3 ${a.tone === "win" ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-surface/80 ring-1 ring-line/70"} ${
                  a.tone === "cut" ? "opacity-55" : ""
                } ${i < rows ? "toast-in" : "invisible"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`min-w-0 text-[14.5px] sm:truncate ${a.tone === "win" ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}
                  >
                    {a.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[12.5px] font-medium ${
                      a.tone === "win"
                        ? "bg-tide text-white"
                        : a.tone === "mid"
                          ? "bg-tide-wash text-tide"
                          : "bg-surface text-ink-faint ring-1 ring-line"
                    }`}
                  >
                    {a.tag}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50">
                    <div
                      className={`h-full rounded-full ${a.tone === "win" ? "bg-tide" : "bg-ink-faint/50"}`}
                      style={{ width: a.width }}
                    />
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[13px] ${a.tone === "win" ? "font-medium text-tide" : "text-ink-faint"}`}
                  >
                    {a.replies}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="m-0 mt-2.5 text-[15px] leading-relaxed text-ink-soft">
            we're scaling live ordering pages and cutting one-pagers.
          </p>
          {/* reactions */}
          <div className="mt-2.5 flex gap-1.5">
            <span className="flex items-center gap-1.5 rounded-full bg-tide-wash px-2.5 py-0.5 font-mono text-[13px] font-medium text-tide ring-1 ring-tide/30">
              <span aria-hidden="true">&#128077;</span>2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
