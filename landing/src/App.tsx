import { useEffect, useRef, useState, type ReactNode } from "react";
import { BugDemoCard } from "./components/AgentDemo";
import WaitlistForm from "./components/WaitlistForm";
import { Nav, Footer, useReveal } from "./components/Chrome";

/* ---------- shared chrome ---------- */

/* card shell every story graphic shares, so the stage reads as one consistent object */
function CardShell({
  left,
  right,
  children,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full max-w-135 flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)] ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex min-w-0 items-center gap-2 font-mono text-[13.5px] font-medium text-ink-soft">
          <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
          <span className="truncate">{left}</span>
        </span>
        <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 font-mono text-[13px] text-ink-soft">{right}</span>
      </div>
      {children}
    </div>
  );
}

/* the bug recording as email clients actually render video: a square thumbnail */
function SquareVideoThumb({ className }: { className?: string }) {
  return (
    <div className={`relative aspect-square w-40 shrink-0 overflow-hidden rounded-xl bg-[#16181d] ${className ?? ""}`}>
      <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-black/60 py-0.5 pl-1.5 pr-2 font-mono text-[10.5px] font-medium text-white">
        <span className="size-1.5 rounded-full bg-[#e2574a]" />
        REC
      </span>
      {/* frozen frame: the duplicate charge, mid-recording */}
      <div className="mx-5 mt-9 rounded-md bg-white/95 px-2.5 py-2">
        <div className="flex items-center justify-between">
          <span className="h-1.5 w-10 rounded-full bg-[#dfe3e9]" />
          <span className="relative rounded bg-[#16181d] px-1.5 py-0.5 text-[9px] font-semibold text-white">
            Pay
            <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#d4574a] px-1 py-px font-mono text-[8px] font-bold leading-none text-white">
              &times;2
            </span>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#f1f3f6]" />
        <div className="mt-1 h-1.5 w-full rounded-full bg-[#d4574a]/30" />
      </div>
      <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)]">
        <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5 fill-[#16181d]" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-5 font-mono text-[10.5px] text-white/85">
        <span className="truncate">acme.com checkout bug</span>
        <span className="shrink-0">0:47</span>
      </span>
    </div>
  );
}

/* ---------- the story: one campaign, end to end ---------- */

const STORY_KICKER = (
  <>
    Example campaign: <span className="font-medium text-ink">Autosana</span>, a company selling AI QA agents.
  </>
);

const BEATS = [
  { title: "Develop ICPs and brainstorm possible demos", sub: null },
  {
    title: "An agent goes through each prospect and makes them a custom demo",
    sub: "Every email is verified by a human before it goes out.",
  },
  { title: "We send out the email", sub: "We manage your inboxes, warming, and deliverability." },
  {
    title: "Sarah replies.",
    sub: "We track open rates, click-throughs, every conversion, and sequence the follow-up.",
  },
  { title: "Each email serves as a datapoint", sub: "We learn which demos win replies and which ICPs convert." },
];

/* beat 1 — what we learn on the onboarding call, and the demo ideas it produces */
const DEMO_IDEAS = [
  "find bugs on the prospect's own site",
  "custom flows for their product, shown in the dashboard",
  "vibe-code a replica of their app + ship a feature",
];

function StoryOnboardCard({ building, icps, ideas }: { building: boolean; icps: boolean; ideas: number }) {
  return (
    <CardShell
      left={
        <>
          client: Autosana &middot; AI QA agents
        </>
      }
      right="15-minute onboarding call"
      className="lg:min-h-110"
    >
      <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-5">
        <div className={building ? "log-line" : "invisible"}>
          <p className="m-0 font-mono text-[13.5px] tracking-[0.02em] text-ink-faint">what they're building</p>
          <p className="m-0 mt-1.5 text-[16px] leading-relaxed text-ink">AI agents that QA web apps automatically</p>
        </div>
        <div className={icps ? "log-line" : "invisible"}>
          <p className="m-0 font-mono text-[13.5px] tracking-[0.02em] text-ink-faint">their ICPs</p>
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
          <p className="m-0 flex items-center gap-2.5 font-mono text-[13.5px] tracking-[0.02em] text-ink-faint">
            <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
            ideas for custom demos
          </p>
          <div className="mt-2.5 space-y-2">
            {DEMO_IDEAS.map((idea, i) => (
              <div
                key={idea}
                className={`flex items-center justify-between gap-3 rounded-xl bg-paper/70 px-3.5 py-2.5 ring-1 ring-line/70 ${
                  i < ideas ? "toast-in" : "invisible"
                }`}
              >
                <span className="truncate text-[14.5px] font-medium text-ink-soft">{idea}</span>
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-mono text-[13px] text-ink-faint ring-1 ring-line">
                  idea
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/* beat 2 — the agent's per-prospect plan, with fallbacks, ending in the recording */
const PROSPECT_PLAN = [
  "try to find bugs in the product",
  "if that doesn't work, create custom flows",
  "if easy to vibe-code, replicate it + add a feature",
];

function StoryAgentCard({ plans, logs, thumb }: { plans: number; logs: number; thumb: boolean }) {
  return (
    <CardShell
      left={<>autosana's QA agent &times; driftwood</>}
      right={<>prospect: Sarah &middot; self-serve product</>}
      className="lg:min-h-110"
    >
      <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
        <div>
          <p className="m-0 font-mono text-[13.5px] tracking-[0.02em] text-ink-faint">the plan for sarah</p>
          <div className="mt-2.5 space-y-2">
            {PROSPECT_PLAN.map((step, i) => (
              <div
                key={step}
                className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 ${
                  i === 0 ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-paper/70 opacity-60 ring-1 ring-line/70"
                } ${i < plans ? "toast-in" : "invisible"}`}
              >
                <span
                  className={`truncate text-[14.5px] ${i === 0 ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}
                >
                  <span className="mr-2 font-mono text-[13px] text-ink-faint">{i + 1}</span>
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
        <div className="space-y-2 font-mono text-[14px] text-ink-soft">
          <p className={`m-0 flex items-start gap-2.5 ${logs > 0 ? "log-line" : "invisible"}`}>
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
    </CardShell>
  );
}

/* beat 3 — the compose window; video sits at the bottom as a square, like email clients render it */
const COMPOSE_ANNOS = [
  { text: "a real bug, found this morning", pos: "right-0 top-24 translate-x-[55%] -rotate-2" },
  { text: "the proof is attached", pos: "bottom-20 right-0 translate-x-[50%] rotate-1" },
];

function StoryComposeCard({
  on,
  sent,
  annos,
  inlineAnnos,
}: {
  on: boolean;
  sent: boolean;
  annos: number;
  inlineAnnos?: boolean;
}) {
  const block = (i: number) => (on ? { animationDelay: `${0.08 + i * 0.12}s` } : undefined);
  const blockClass = on ? "block-in" : "invisible";
  return (
    <div className="relative w-full max-w-135">
      <div className="flex flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)] lg:min-h-110">
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="size-2.5 rounded-full bg-[#e8b4a8]" />
          <span className="size-2.5 rounded-full bg-[#e6d3a3]" />
          <span className="size-2.5 rounded-full bg-[#b5cfae]" />
          <span className="ml-2 font-mono text-[13.5px] text-ink-soft">New message</span>
          <span
            className={`ml-auto rounded-full px-2.5 py-0.5 font-mono text-[13px] font-medium transition-colors duration-500 ${
              sent ? "bg-tide-wash text-tide" : "bg-paper text-ink-soft"
            }`}
          >
            {sent ? "Sent" : "Draft"}
          </span>
        </div>

        {/* headers */}
        <div className="space-y-1.5 border-b border-line px-5 py-2.5 text-[14.5px]">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-ink-faint">To</span>
            <span className="rounded-full bg-paper px-2 py-0.5 font-medium text-ink-soft">sarah@acme.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-ink-faint">Subject</span>
            <span className="font-medium text-ink">found a bug in Acme's checkout</span>
          </div>
        </div>

        {/* body — blocks fade in with the beat; `invisible` keeps the height reserved */}
        <div className="flex-1 px-5 py-4 text-[15px] leading-relaxed text-ink-soft">
          <p className={`m-0 ${blockClass}`} style={block(0)}>
            Hi Sarah,
          </p>
          <p className={`m-0 mt-3 ${blockClass}`} style={block(0)}>
            Our QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay charges the
            card twice. The 47-second recording is below.
          </p>
          <p className={`m-0 mt-3 ${blockClass}`} style={block(1)}>
            Open to a quick call this week?
          </p>
          <div className={`mt-4 ${on ? "pop-in" : "invisible"}`} style={block(2)}>
            <SquareVideoThumb />
          </div>
        </div>
      </div>

      {/* annotations — why this email works */}
      {inlineAnnos ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {COMPOSE_ANNOS.map((a) => (
            <span
              key={a.text}
              className="inline-block rounded-full bg-tide-wash px-3 py-1 font-mono text-[13.5px] font-medium text-tide ring-1 ring-tide/20"
            >
              {a.text}
            </span>
          ))}
        </div>
      ) : (
        COMPOSE_ANNOS.map((a, i) => (
          <span
            key={a.text}
            className={`absolute z-10 inline-flex items-center gap-1.5 rounded-full bg-tide-wash px-3 py-1 font-mono text-[13.5px] font-medium text-tide shadow-[0_8px_20px_-10px_rgba(13,60,91,0.45)] ring-1 ring-tide/25 ${a.pos} ${
              annos > i ? "toast-in" : "invisible"
            }`}
          >
            <span aria-hidden="true">&larr;</span>
            {a.text}
          </span>
        ))
      )}
    </div>
  );
}

/* beat 4 — the reply, styled as a real inbox thread */
function StoryReplyThread({ on }: { on: boolean }) {
  return (
    <div className="flex w-full max-w-135 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)] lg:min-h-110">
      {/* thread header */}
      <div className="border-b border-line px-5 py-4">
        <p className="m-0 text-[16.5px] font-semibold text-ink">Re: found a bug in Acme's checkout</p>
        <p className="m-0 mt-1 font-mono text-[13px] text-ink-faint">Inbox &middot; 2 messages</p>
      </div>
      {/* our send, collapsed */}
      <div className="flex items-center gap-3 border-b border-line bg-paper/50 px-5 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide font-mono text-[12px] font-semibold text-white">
          A
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-medium text-ink-soft">
            Autosana <span className="font-normal text-ink-faint">to sarah@acme.com</span>
          </span>
          <span className="block truncate text-[14px] text-ink-faint">
            Our QA agent ran Acme's checkout this morning and caught a real bug&hellip;
          </span>
        </span>
        <span className="shrink-0 font-mono text-[13px] text-ink-faint">9:02 AM</span>
      </div>
      {/* her reply, expanded */}
      <div
        className={`flex-1 px-5 py-4 ${on ? "block-in" : "invisible"}`}
        style={on ? { animationDelay: "0.2s" } : undefined}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tide-wash text-[14px] font-bold text-tide">
            SC
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="m-0 text-[16px] font-semibold text-ink">Sarah Chen</p>
              <span className="font-mono text-[13px] text-ink-faint">sarah@acme.com &middot; 11:08 AM</span>
              <span className="ml-auto rounded-full bg-tide-wash px-2.5 py-0.5 font-mono text-[13px] font-medium text-tide">
                2h later
              </span>
            </div>
            <p className="m-0 mt-0.5 font-mono text-[13px] text-ink-faint">to autosana</p>
            <p className="m-0 mt-3 text-[16.5px] leading-relaxed text-ink">ok this is wild. got time Thursday?</p>
            <div className="mt-4 border-l-2 border-line pl-3 text-[14px] leading-relaxed text-ink-faint">
              On Tue, Autosana wrote:
              <br />
              Our QA agent ran Acme's checkout this morning and caught a real bug&hellip;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* beat 5 — every send feeds the ranking of what to build next */
const PROOF_RANKING = [
  { name: "bug recording", replies: "4.9% reply", width: "82%", tone: "win", tag: "gets the budget" },
  { name: "custom flows demo", replies: "3.2% reply", width: "54%", tone: "mid", tag: "testing now" },
  { name: "coverage report", replies: "1.1% reply", width: "18%", tone: "cut", tag: "cut this week" },
] as const;

function StoryDataCard({ rows }: { rows: number }) {
  return (
    <CardShell left="proof testing" right="re-ranked weekly" className="lg:min-h-110">
      <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-5">
        {PROOF_RANKING.map((a, i) => (
          <div
            key={a.name}
            className={`rounded-xl px-3.5 py-3 ${a.tone === "win" ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-paper/70 ring-1 ring-line/70"} ${
              a.tone === "cut" ? "opacity-55" : ""
            } ${i < rows ? "toast-in" : "invisible"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`truncate text-[14.5px] ${a.tone === "win" ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}
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
        <p className="mb-0 mt-2 text-center font-mono text-[13px] text-ink-faint">
          we keep you updated on results and what we're improving
        </p>
      </div>
    </CardShell>
  );
}

function StorySection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / total));
      setProg(Math.round(p * 500) / 500);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* everything below derives from scroll progress, so scrubbing back up just works */
  const active = Math.min(BEATS.length - 1, Math.floor(prog * BEATS.length));
  const local = prog * BEATS.length - active;
  /* beat 1 — facts, then ideas, one by one */
  const building = active > 0 || local > 0.06;
  const icps = active > 0 || local > 0.24;
  const ideas = active > 0 ? 3 : local > 0.72 ? 3 : local > 0.55 ? 2 : local > 0.38 ? 1 : 0;
  /* beat 2 — plan steps, the find, then the recording materializes */
  const plans = active > 1 ? 3 : active === 1 ? Math.min(3, Math.floor(local / 0.14) + 1) : 0;
  const logs = active > 1 ? 2 : active === 1 ? (local > 0.58 ? 2 : local > 0.44 ? 1 : 0) : 0;
  const thumb = active > 1 || (active === 1 && local > 0.74);
  /* beat 3 — annotations, then the Draft→Sent flip */
  const sent = active > 2 || (active === 2 && local > 0.75);
  const annos = active > 2 ? 2 : active === 2 ? (local > 0.45 ? 2 : local > 0.2 ? 1 : 0) : 0;
  /* beat 5 — ranked rows land one by one */
  const rows = active === 4 ? Math.min(3, Math.floor(local / 0.18) + 1) : 0;

  const panes = [
    <StoryOnboardCard key="onboard" building={building} icps={icps} ideas={ideas} />,
    <StoryAgentCard key="agent" plans={plans} logs={logs} thumb={thumb} />,
    <StoryComposeCard key="compose" on={active === 2} sent={sent} annos={annos} />,
    <StoryReplyThread key="reply" on={active === 3} />,
    <StoryDataCard key="data" rows={rows} />,
  ];

  return (
    <section id="story" className="scroll-mt-20">
      <h2 className="sr-only">See an example campaign</h2>

      {/* pinned walkthrough (desktop, motion ok) */}
      <div ref={wrapRef} className="relative hidden h-[520vh] lg:motion-safe:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          {/* beat title */}
          <div className="grid text-center">
            {BEATS.map((beat, i) => (
              <p
                key={beat.title}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 mx-auto my-0 max-w-3xl text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-snug tracking-[-0.015em] transition-all duration-500 ease-out ${
                  i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-3 opacity-0" : "translate-y-3 opacity-0"
                }`}
              >
                {beat.title}
              </p>
            ))}
          </div>

          {/* beat subheading — beat 1 gets the example-campaign kicker instead */}
          <div className="mt-4 grid text-center">
            {BEATS.map((beat, i) => (
              <p
                key={beat.title}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 mx-auto my-0 max-w-2xl transition-all duration-500 ease-out ${
                  i === 0 ? "font-mono text-[14px] text-ink-soft" : "text-[17px] leading-relaxed text-ink-soft"
                } ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                {i === 0 ? STORY_KICKER : beat.sub}
              </p>
            ))}
          </div>

          {/* beat progress */}
          <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
            {BEATS.map((beat, i) => (
              <span
                key={beat.title}
                className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-tide" : "w-3 bg-line"}`}
              />
            ))}
          </div>

          {/* stage — all beats share one grid cell so the stage never changes height */}
          <div className="mt-8 grid w-full">
            {panes.map((pane, i) => (
              <div
                key={BEATS[i].title}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 flex items-center justify-center transition-all duration-500 ease-out ${
                  i === active
                    ? "translate-y-0 opacity-100"
                    : i < active
                      ? "pointer-events-none -translate-y-8 opacity-0"
                      : "pointer-events-none translate-y-8 opacity-0"
                }`}
              >
                {pane}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* stacked walkthrough (mobile + reduced motion) — every beat in order */}
      <div className="py-20 sm:py-26 lg:motion-safe:hidden">
        <p className="reveal m-0 font-mono text-[14px] leading-relaxed text-ink-soft">{STORY_KICKER}</p>
        <div className="mt-12 space-y-18">
          {[
            <StoryOnboardCard key="onboard" building icps ideas={3} />,
            <StoryAgentCard key="agent" plans={3} logs={2} thumb />,
            <StoryComposeCard key="compose" on sent annos={2} inlineAnnos />,
            <StoryReplyThread key="reply" on />,
            <StoryDataCard key="data" rows={3} />,
          ].map((stage, i) => (
            <div key={BEATS[i].title} className="reveal">
              <p className="m-0 font-mono text-[13.5px] font-medium text-tide">0{i + 1}</p>
              <p className="mb-0 mt-2 max-w-150 text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-snug tracking-[-0.015em]">
                {BEATS[i].title}
              </p>
              {BEATS[i].sub && (
                <p className="mb-0 mt-3 max-w-130 text-[17px] leading-relaxed text-ink-soft">{BEATS[i].sub}</p>
              )}
              <div className="mt-7">{stage}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- the contrast: slop vs a custom demo ---------- */

function UsualEmail() {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-line bg-surface/70 p-5">
      <div className="border-b border-line pb-3 text-[14px]">
        <p className="m-0 text-ink-faint">
          Subject: <span className="text-ink-soft">Sarah — quick question (Acme x Autosana)</span>
        </p>
      </div>
      <div className="mb-0 mt-4 space-y-4 text-[15px] leading-relaxed text-ink-soft">
        <p className="m-0">Hey Sarah,</p>
        <p className="m-0">
          Huge fan of what you're building at Acme — saw you just crossed 200 employees. Incredible
          momentum.
        </p>
        <p className="m-0">
          I'm the founder of Autosana, an AI-powered platform that automates QA end-to-end. We just
          closed our seed round and are growing 40% month over month — teams like yours are seeing
          huge results.
        </p>
        <p className="m-0">
          Would love to connect and show you what we're building. Any chance you have 15 minutes this
          week?
        </p>
        <p className="m-0">Best,</p>
      </div>
      <span className="mt-auto self-start pt-4">
        <span className="inline-block rounded-full bg-paper px-2.5 py-1 font-mono text-[13.5px] text-ink-soft ring-1 ring-line">
          read in 4 seconds, archived
        </span>
      </span>
    </div>
  );
}

function DriftwoodEmail() {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-tide/35 bg-surface p-5 shadow-[0_20px_50px_-28px_rgba(13,60,91,0.4)]">
      <div className="border-b border-line pb-3 text-[14px]">
        <p className="m-0 text-ink-faint">
          Subject: <span className="font-medium text-ink">found a bug in Acme's checkout</span>
        </p>
      </div>
      <div className="mb-4 mt-4 space-y-4 text-[15px] leading-relaxed text-ink-soft">
        <p className="m-0">Hi Sarah,</p>
        <p className="m-0">
          Our QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay
          charges the card twice. The 47-second recording is below.
        </p>
        <p className="m-0">Open to a quick call this week?</p>
      </div>
      <SquareVideoThumb className="w-36" />
      <span className="mt-auto self-start pt-4">
        <span className="inline-block rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[13.5px] font-medium text-tide">
          "ok this is wild. got time Thursday?" &middot; 2h later
        </span>
      </span>
    </div>
  );
}

function CompareSection() {
  return (
    <section id="compare" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
      <div className="reveal mx-auto max-w-150 text-center">
        <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
          Don't send out AI slop
        </h2>
      </div>

      <div className="reveal relative mx-auto mt-12 grid w-full max-w-5xl items-stretch gap-8 sm:grid-cols-2 lg:gap-10">
        <div className="flex h-full flex-col">
          <p className="mb-3 ml-1 font-mono text-[13.5px] tracking-[0.02em] text-ink-soft">what everyone else sends</p>
          <UsualEmail />
        </div>

        {/* "vs" chip, dead-center in the gap between the two columns */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-[13.5px] font-semibold text-ink-soft shadow-[0_8px_20px_-10px_rgba(13,60,91,0.45)] sm:inline-flex"
        >
          vs
        </span>

        <div className="flex h-full flex-col">
          <p className="mb-3 ml-1 font-mono text-[13.5px] tracking-[0.02em] text-tide">what driftwood sent</p>
          <div className="tide-ring-pulse flex flex-1 flex-col rounded-2xl">
            <DriftwoodEmail />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- examples carousel: a product you know pitching a company you know ---------- */

/* Runway → Liquid Death: a finished custom ad, built from their own assets */
function RunwayAdMock() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-xl bg-[#16181d] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 font-mono text-[12.5px] text-white/70">
          <span className="truncate">liquid_death_15s_v1.mp4 &middot; made with runway</span>
          <span className="shrink-0">1080 &times; 1080</span>
        </div>
        {/* the paused frame */}
        <div className="relative mx-auto flex aspect-square w-full max-w-85 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-[linear-gradient(160deg,#23262d,#101216)]">
          <span className="absolute left-3 top-3 rounded-full border border-white/25 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-white/85">
            LIQUID DEATH
          </span>
          {/* their tallboy can, cut out + in motion */}
          <div className="relative h-36 w-16 -rotate-6 rounded-[10px] bg-[linear-gradient(90deg,#878e99,#e8ebef_45%,#6f7682)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]">
            <div className="absolute inset-x-1 top-1.5 h-1 rounded-full bg-black/25" />
            <div className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 rounded-sm bg-[#16181d] px-1 py-2 text-center font-mono text-[8px] font-bold leading-tight tracking-widest text-white">
              LIQUID
              <br />
              DEATH
            </div>
          </div>
          <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-[#16181d]" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
          <p className="absolute inset-x-0 bottom-4 m-0 text-center text-[17px] font-bold text-white">
            “Murder your thirst.”
          </p>
        </div>
        {/* scrubber */}
        <div className="flex items-center gap-3">
          <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-white/15" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 w-[60%] rounded-full bg-white/80" />
            <span className="absolute left-[60%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>
          <span className="shrink-0 font-mono text-[12.5px] text-white/70">0:09 / 0:15</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {["tagline: their own, from their homepage", "can shots: from their product pages", "logo + colors: matched"].map(
          (chip) => (
            <span key={chip} className="rounded-full bg-paper px-2.5 py-1 font-mono text-[12.5px] text-ink-soft ring-1 ring-line">
              {chip}
            </span>
          ),
        )}
      </div>
      <p className="m-0 mt-auto text-center font-mono text-[13px] text-ink-faint">
        a finished ad for Liquid Death, assembled from assets already on their site
      </p>
    </div>
  );
}

/* Ramp → Notion: their software stack, categorized + priced from public signals */
function RampSpendMock() {
  const stats = [
    { label: "est. annual SaaS spend", value: "$4.2M" },
    { label: "vendors found", value: "63" },
    { label: "est. savings on Ramp", value: "$310k/yr" },
  ];
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-1 flex-col gap-3 rounded-xl border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[13px] text-ink-soft">notion's software stack — categorized + priced</span>
          <span className="rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[12.5px] font-medium text-tide">
            estimated from public signals
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-paper/60 px-3 py-2.5 ring-1 ring-line/70">
              <p className="m-0 font-mono text-[11.5px] leading-snug text-ink-faint">{s.label}</p>
              <p className="m-0 mt-1 text-[20px] font-bold tracking-[-0.01em] text-ink sm:text-[23px]">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/60 px-3 py-2.5 ring-1 ring-line/70">
            <span className="font-mono text-[13px] text-ink">
              <span className="font-semibold">AWS</span> &middot; engineering
            </span>
            <span className="shrink-0 font-mono text-[13px] text-ink-soft">~$2.4M/yr</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/60 px-3 py-2.5 ring-1 ring-line/70">
            <span className="font-mono text-[13px] text-ink">
              <span className="font-semibold">Salesforce</span> &middot; sales
            </span>
            <span className="shrink-0 font-mono text-[13px] text-ink-soft">
              ~$310k/yr &middot; <span className="font-semibold text-tide">partner discount</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-tide-wash/70 px-3 py-2.5 ring-1 ring-tide/35">
            <span className="font-mono text-[13px] text-ink">
              <span className="font-semibold">Zoom + Google Meet</span> &middot; overlap
            </span>
            <span className="shrink-0 font-mono text-[13px] font-medium text-tide">pick one, save ~$40k</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/40 px-3 py-2.5 ring-1 ring-line/50 opacity-60">
            <span className="font-mono text-[13px] text-ink-soft">+ 60 more vendors, categorized</span>
            <span className="font-mono text-[13px] text-ink-faint">&hellip;</span>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap justify-center gap-2">
          {["stack inferred from their job posts + site tech", "prices: public list pricing"].map((chip) => (
            <span key={chip} className="rounded-full bg-paper px-2.5 py-1 font-mono text-[12.5px] text-ink-soft ring-1 ring-line">
              {chip}
            </span>
          ))}
        </div>
      </div>
      <p className="m-0 text-center font-mono text-[13px] text-ink-faint">
        their software spend mapped and priced before they've shared a single statement
      </p>
    </div>
  );
}

/* Shopify → Patagonia: their store rebuilt, side by side */
function ShopifyRebuildMock() {
  const thumbs = (label: string) => (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex h-18 items-end justify-center rounded-lg bg-[linear-gradient(150deg,#e7e2d4,#cfc8b4)] pb-1.5 font-mono text-[10.5px] text-ink-faint"
        >
          {label}
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        {/* before */}
        <div className="flex flex-col rounded-xl border border-dashed border-line bg-paper/50">
          <div className="flex items-center justify-between gap-2 border-b border-line/70 px-3.5 py-2.5">
            <span className="truncate font-mono text-[12.5px] text-ink-soft">their store today — patagonia.com</span>
            <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-mono text-[11.5px] text-ink-faint ring-1 ring-line">
              8.2s load
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 p-3.5">
            {thumbs("their jacket")}
            <div className="h-2.5 w-3/5 rounded-full bg-line/70" />
            <div className="h-2.5 w-2/5 rounded-full bg-line/70" />
            <span className="mt-auto self-start rounded-full bg-surface px-2.5 py-1 font-mono text-[12px] text-ink-soft ring-1 ring-line">
              checkout &middot; 5 steps &middot; abandons at step 3
            </span>
          </div>
        </div>
        {/* after */}
        <div className="flex flex-col rounded-xl border-2 border-tide/35 bg-white shadow-[0_16px_40px_-24px_rgba(13,60,91,0.4)]">
          <div className="flex items-center justify-between gap-2 border-b border-line/70 px-3.5 py-2.5">
            <span className="truncate font-mono text-[12.5px] font-medium text-ink">rebuilt on Shopify — same brand</span>
            <span className="shrink-0 rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[11.5px] font-medium text-tide">
              1.1s load
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 p-3.5">
            {thumbs("same jacket")}
            <div className="h-2.5 w-3/5 rounded-full bg-line/70" />
            <span className="rounded-lg bg-ink py-2 text-center text-[13.5px] font-semibold text-paper">
              Buy now &middot; Shop Pay — 1-page checkout
            </span>
            <span className="mt-auto self-center rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[12px] font-medium text-tide">
              their catalog imported overnight &middot; 412 products
            </span>
          </div>
        </div>
      </div>
      <p className="m-0 text-center font-mono text-[13px] text-ink-faint">
        Patagonia's own store rebuilt — same products, same brand, checkout visibly faster
      </p>
    </div>
  );
}

/* Square → Joe's Pizza: their real menu, live as an ordering page they never set up */
function SquareOrderMock() {
  const menu = [
    { item: "cheese slice", price: "$3.50" },
    { item: "pepperoni slice", price: "$4.75" },
    { item: "garlic knots (4)", price: "$4.00" },
  ];
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-1 flex-wrap items-center justify-center gap-7 rounded-xl border border-line bg-paper/40 p-4 sm:p-5">
        {/* phone frame */}
        <div className="flex w-67 flex-col gap-2 rounded-[22px] border border-line bg-white p-3 shadow-[0_20px_50px_-28px_rgba(13,60,91,0.45)]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15.5px] font-bold text-ink">Joe's Pizza</span>
            <span className="rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[11.5px] font-medium text-tide">
              order online
            </span>
          </div>
          <div className="flex h-16 items-end rounded-lg bg-[linear-gradient(160deg,#3a3e46,#1c1f25)] px-2.5 pb-1.5 font-mono text-[10.5px] text-white/75">
            their Carmine St storefront
          </div>
          {menu.map((m) => (
            <div
              key={m.item}
              className="flex items-center justify-between gap-2 rounded-lg bg-paper/60 px-2.5 py-2 ring-1 ring-line/70"
            >
              <span className="font-mono text-[12.5px] text-ink">{m.item}</span>
              <span className="font-mono text-[12.5px] text-ink-soft">
                {m.price} <span className="text-tide">&oplus;</span>
              </span>
            </div>
          ))}
          <span className="rounded-lg bg-ink py-2 text-center text-[13px] font-semibold text-paper">
            2 slices &middot; $8.25 &middot; Checkout
          </span>
        </div>
        {/* provenance */}
        <div className="flex max-w-62 flex-col gap-2">
          {[
            "menu scraped from the PDF on their site",
            "items + prices verbatim",
            "✓ test order #001 placed — simulated",
          ].map((chip) => (
            <span key={chip} className="rounded-full bg-surface px-3 py-1.5 font-mono text-[12.5px] text-ink-soft ring-1 ring-line">
              {chip}
            </span>
          ))}
        </div>
      </div>
      <p className="m-0 text-center font-mono text-[13px] text-ink-faint">
        Joe's real menu, already live as an ordering page they never set up
      </p>
    </div>
  );
}

const SLIDES = [
  { key: "runway", company: "Runway", domain: "AI video", prospect: "Liquid Death", art: RunwayAdMock },
  { key: "ramp", company: "Ramp", domain: "spend management", prospect: "Notion", art: RampSpendMock },
  { key: "shopify", company: "Shopify", domain: "commerce", prospect: "Patagonia", art: ShopifyRebuildMock },
  { key: "square", company: "Square", domain: "local commerce", prospect: "Joe's Pizza (NYC)", art: SquareOrderMock },
];

function ExamplesSection() {
  const [index, setIndex] = useState(0);
  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  return (
    <section id="examples" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
      <div className="reveal mx-auto max-w-160 text-center">
        <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
          See how this looks for different companies
        </h2>
        <p className="mb-0 mt-4 text-[17.5px] leading-relaxed text-ink-soft">
          A product you know, pitching a company you know — and the custom demo we'd build for that exact email.
        </p>
      </div>

      <div className="reveal relative mx-auto mt-12 max-w-4xl">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((slide, i) => (
              <div key={slide.key} className="w-full shrink-0 px-1 pb-2" aria-hidden={i !== index}>
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)] sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-mono text-[13.5px] text-ink-soft">
                      <span className="font-semibold text-ink">{slide.company}</span> &middot; {slide.domain} — pitching{" "}
                      <span className="font-semibold text-ink">{slide.prospect}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 font-mono text-[12.5px] text-ink-soft">
                      {i + 1} / {SLIDES.length}
                    </span>
                  </div>
                  <slide.art />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* controls */}
        <button
          type="button"
          aria-label="previous example"
          onClick={() => go(-1)}
          className="absolute -left-3 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-[0_8px_20px_-10px_rgba(13,60,91,0.45)] transition-colors hover:text-tide sm:-left-5 lg:-left-14"
        >
          <svg viewBox="0 0 24 24" className="size-4 stroke-current" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="next example"
          onClick={() => go(1)}
          className="absolute -right-3 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-[0_8px_20px_-10px_rgba(13,60,91,0.45)] transition-colors hover:text-tide sm:-right-5 lg:-right-14"
        >
          <svg viewBox="0 0 24 24" className="size-4 stroke-current" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="mt-6 flex items-center justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              aria-label={`show ${slide.company} example`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 cursor-pointer rounded-full border-0 p-0 transition-all duration-300 ${
                i === index ? "w-7 bg-tide" : "w-2 bg-line hover:bg-ink-faint/50"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="reveal mb-0 mt-8 text-center font-mono text-[12.5px] text-ink-faint">
        illustrative examples — these companies aren't driftwood customers
      </p>
    </section>
  );
}

/* faint sea-chart contour lines behind the hero */
function HeroContours() {
  return (
    <svg
      viewBox="0 0 600 600"
      aria-hidden="true"
      className="pointer-events-none absolute -right-44 -top-48 -z-10 hidden size-155 text-tide opacity-[0.06] lg:block"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M300 40 C 420 50 540 140 555 280 C 568 400 480 530 330 555 C 190 575 60 480 45 340 C 32 210 150 55 300 40 Z" />
        <path d="M300 90 C 400 95 495 170 508 285 C 518 380 445 480 320 502 C 205 520 100 440 90 330 C 80 225 180 92 300 90 Z" />
        <path d="M300 140 C 380 145 445 200 458 290 C 468 360 410 432 315 450 C 222 465 150 405 140 320 C 132 240 215 142 300 140 Z" />
        <path d="M300 190 C 360 195 398 235 408 295 C 416 348 372 392 308 402 C 245 412 198 372 192 312 C 186 255 240 192 300 190 Z" />
        <path d="M300 240 C 340 243 352 268 358 298 C 363 332 338 352 305 356 C 270 360 246 340 243 308 C 240 275 262 240 300 240 Z" />
      </g>
    </svg>
  );
}

export default function App() {
  useReveal();

  return (
    <div className="grain relative min-h-screen overflow-x-clip">
      <Nav />

      <main id="top" className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* hero */}
        <section className="relative isolate flex flex-col items-center pb-10 pt-20 text-center sm:pt-24 lg:pt-28">
          <HeroContours />
          <h1 className="m-0 max-w-5xl text-[clamp(2.9rem,6.5vw,4.9rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Ship a custom demo in every cold email.
          </h1>
          <p className="mx-auto mt-6 max-w-145 text-[19px] leading-relaxed text-ink-soft sm:text-[20px]">
            We manage your entire cold email channel. Each prospect gets a custom demo built for their company.
          </p>
          <div className="relative mt-9 flex justify-center">
            <WaitlistForm id="email-hero" />
          </div>
          <a
            href="#story"
            className="mt-14 inline-flex flex-col items-center gap-2 font-mono text-[14px] text-ink-soft no-underline transition-colors hover:text-tide"
          >
            See an example
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-4 stroke-current"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4v14M6 13l6 6 6-6" />
            </svg>
          </a>
        </section>

        {/* one campaign, end to end */}
        <StorySection />

        {/* the contrast */}
        <CompareSection />

        {/* familiar-company examples */}
        <ExamplesSection />

        {/* final cta */}
        <section id="join" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
          <div className="reveal mx-auto max-w-150 text-center">
            <h2 className="m-0 text-[clamp(2rem,4.6vw,3rem)] font-semibold leading-tight tracking-[-0.015em]">
              See what we'd send your prospects.
            </h2>
            <p className="mt-4 text-[18px] leading-relaxed text-ink-soft">
              We're onboarding a few design partners. Leave a work email and we'll show you what a campaign for
              your product looks like.
            </p>
            <div className="relative mt-8 flex justify-center">
              <WaitlistForm id="email-footer" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
