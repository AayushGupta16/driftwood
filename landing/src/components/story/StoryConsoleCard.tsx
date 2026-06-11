import { BugDemoCard } from "../AgentDemo";

/* beat 2: the agent as a real terminal session — a run command, the
   per-prospect plan as output, then the live run feed */
const PLAN_LINES = [
  { step: "find bugs in the product", tag: "running" },
  { step: "create custom flows", tag: "fallback" },
  { step: "replicate + add a feature", tag: "fallback" },
];

export function StoryConsoleCard({ plans, logs, thumb }: { plans: number; logs: number; thumb: boolean }) {
  return (
    <div className="flex w-full max-w-135 flex-col overflow-hidden rounded-2xl border border-line bg-[#16181d] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)] lg:min-h-110">
      {/* terminal title bar: traffic lights, session title, scale chip */}
      <div className="flex items-center gap-3 border-b border-white/8 bg-white/4 px-4 py-2.5">
        <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#e8b4a8]" />
          <span className="size-2.5 rounded-full bg-[#e6d3a3]" />
          <span className="size-2.5 rounded-full bg-[#b5cfae]" />
        </span>
        <span className="min-w-0 font-mono text-[13.5px] text-white/60 sm:truncate">
          driftwood agent &mdash; sarah@acme.com
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[13px] text-white/70">
          prospect 14 of 200
        </span>
      </div>
      {/* terminal body */}
      <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-4 font-mono text-[14px] leading-normal">
        {/* the command, always visible */}
        <p className="m-0 text-white/90">
          <span className="mr-2.5 text-white/35">&#10095;</span>
          driftwood run --prospect sarah@acme.com
        </p>
        {/* the plan, printed as output */}
        <div className="space-y-1.5">
          <p className="m-0 text-[13.5px] text-white/40">plan for sarah</p>
          {PLAN_LINES.map((line, i) => (
            <p key={line.step} className={`m-0 flex items-baseline gap-3 ${i < plans ? "toast-in" : "invisible"}`}>
              <span className={`min-w-0 sm:truncate ${i === 0 ? "text-white" : "text-white/40"}`}>
                <span className={`mr-2 ${i === 0 ? "text-white/50" : "text-white/30"}`}>{i + 1}.</span>
                {line.step}
              </span>
              <span
                className={`shrink-0 text-[13px] ${i === 0 ? "font-medium text-[#3fb98a]" : "text-white/35"}`}
              >
                [{line.tag}]
              </span>
            </p>
          ))}
        </div>
        {/* the run feed */}
        <div className="space-y-1.5 text-[14.5px]">
          <p className={`m-0 flex items-baseline gap-2.5 ${logs > 0 ? "log-line" : "invisible"}`}>
            <span className="shrink-0 font-semibold text-[#d4574a]">!</span>
            <span className="font-medium text-white/90">bug found: double-clicking Pay charges twice</span>
          </p>
          <p className={`m-0 flex items-baseline gap-2.5 text-white/70 ${logs > 1 ? "log-line" : "invisible"}`}>
            <span className="shrink-0 text-[#3fb98a]">&#10003;</span>
            recording the bug &middot; 0:47
          </p>
        </div>
        {/* recorded clip, hovering inline like a file preview; the blinking
            cursor sits under it so the session reads as still running */}
        <div className={thumb ? "materialize" : "invisible"}>
          <BugDemoCard compact />
        </div>
        <p className="m-0 leading-none text-white/35" aria-hidden="true">
          <span className="pulse-dot inline-block h-3.5 w-2 bg-white/70" />
        </p>
      </div>
    </div>
  );
}
