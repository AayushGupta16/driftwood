import { BugDemoCard } from "../AgentDemo";

/* beat 2, reframed as an agent console: the per-prospect plan with fallbacks,
   a terminal-style run feed, ending in the recording */
const PROSPECT_PLAN = [
  "try to find bugs in the product",
  "if that doesn't work, create custom flows",
  "if easy to vibe-code, replicate it + add a feature",
];

export function StoryConsoleCard({ plans, logs, thumb }: { plans: number; logs: number; thumb: boolean }) {
  return (
    <div className="flex w-full max-w-135 flex-col rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)] lg:min-h-110">
      {/* app-window chrome: traffic lights, tab title, scale chip */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#e8b4a8]" />
          <span className="size-2.5 rounded-full bg-[#e6d3a3]" />
          <span className="size-2.5 rounded-full bg-[#b5cfae]" />
        </span>
        <span className="flex min-w-0 items-center gap-2 rounded-t-md border border-b-0 border-line bg-paper/70 px-3 pb-1 pt-1.5 font-mono text-[13.5px] font-medium text-ink-soft">
          <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
          <span className="min-w-0 sm:truncate">driftwood agent</span>
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-sand px-2.5 py-0.5 font-mono text-[13px] text-ink-soft">
          prospect 14 of 200
        </span>
      </div>
      {/* context row: who the agent is working through */}
      <div className="border-b border-line px-5 py-2">
        <p className="m-0 font-mono text-[13.5px] tracking-[0.02em] text-ink-faint">
          Sarah &middot; acme.com &middot; self-serve product
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
        <div>
          <p className="m-0 font-mono text-[14px] tracking-[0.02em] text-ink-faint">the plan for sarah</p>
          <div className="mt-2.5 space-y-2">
            {PROSPECT_PLAN.map((step, i) => (
              <div
                key={step}
                className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 ${
                  i === 0 ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-paper/70 opacity-60 ring-1 ring-line/70"
                } ${i < plans ? "toast-in" : "invisible"}`}
              >
                <span
                  className={`min-w-0 text-[15.5px] sm:truncate ${i === 0 ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}
                >
                  <span className="mr-2 font-mono text-[13.5px] text-ink-faint">{i + 1}</span>
                  {step}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[12.5px] font-medium ${
                    i === 0 ? "bg-tide text-white" : "bg-surface text-ink-faint ring-1 ring-line"
                  }`}
                >
                  {i === 0 ? "running" : "fallback"}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* run feed: terminal-style output with timestamps and a hairline gutter */}
        <div className="space-y-2 border-l-2 border-line/80 pl-3.5 font-mono text-[14.5px] text-ink-soft">
          <p className={`m-0 flex items-start gap-2.5 ${logs > 0 ? "log-line" : "invisible"}`}>
            <span className="mt-px shrink-0 text-[13px] text-ink-faint">08:47</span>
            <svg
              viewBox="0 0 24 24"
              className="mt-[3px] size-3.5 shrink-0 stroke-[#d4574a]"
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 4.5v10M12 19v.5" />
            </svg>
            <span className="font-medium text-ink">bug found: double-clicking Pay charges twice</span>
          </p>
          <p className={`m-0 flex items-start gap-2.5 ${logs > 1 ? "log-line" : "invisible"}`}>
            <span className="mt-px shrink-0 text-[13px] text-ink-faint">08:49</span>
            <svg
              viewBox="0 0 24 24"
              className="mt-[3px] size-3.5 shrink-0 stroke-tide"
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            recording the bug &middot; 0:47
          </p>
        </div>
        <div className={thumb ? "materialize" : "invisible"}>
          <BugDemoCard compact />
        </div>
      </div>
    </div>
  );
}
