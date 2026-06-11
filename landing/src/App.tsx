import { useEffect, useRef, useState, type ReactNode } from "react";
import { BugDemoCard } from "./components/AgentDemo";
import WaitlistForm from "./components/WaitlistForm";
import { Nav, Footer, useReveal } from "./components/Chrome";

const STEPS = [
  {
    title: "A research agent on every prospect",
    body: "Before we write a word, an agent crawls the prospect's site and actually runs their product. It comes back with something real and current to say — not a first-name merge tag.",
    art: ResearchArt,
  },
  {
    title: "A demo artifact in every email",
    body: "We turn the best finding into something they can click — like a recording of a real bug in their own checkout. A human checks every one before it ships.",
    art: PersonalizeArt,
  },
  {
    title: "Replies decide what we build next",
    body: "We test different artifact formats against each other and watch the replies. Whatever wins gets the volume; whatever doesn't gets cut.",
    art: IterateArt,
  },
];

function HowHeading() {
  return (
    <>
      <h2 className="m-0 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
        You take the meetings. We run everything else.
      </h2>
    </>
  );
}

/* shared card shell so every vignette keeps the same footprint */
function VignetteFrame({ label, meta, children }: { label: string; meta: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.02em] text-ink-soft">
          <span className="pulse-dot size-1.5 rounded-full bg-tide" />
          {label}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-0.5 font-mono text-[11px] text-ink-soft">{meta}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </div>
  );
}

/* Research — one agent run over one prospect's product */
function ResearchArt() {
  const runs = [
    { label: "acme.com", detail: "14 pages crawled" },
    { label: "checkout flow", detail: "tested" },
    { label: "changelog + docs", detail: "read this morning" },
  ];
  const findings = [
    { text: "double-charge bug", tag: "recorded", hot: true },
    { text: "stale pricing on /teams", tag: "noted" },
    { text: "search ignores filters", tag: "noted" },
  ];
  return (
    <VignetteFrame label="prospect research" meta="Sarah · Acme">
      <div className="flex flex-1 flex-col justify-center">
        <div className="space-y-2.5 font-mono text-[11.5px] text-ink-soft">
          {runs.map((run) => (
            <p key={run.label} className="m-0 flex items-center gap-2.5">
              <svg
                viewBox="0 0 24 24"
                className="size-3.5 shrink-0 stroke-tide"
                fill="none"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <span>
                <span className="text-ink">{run.label}</span> &middot; {run.detail}
              </span>
            </p>
          ))}
        </div>
        <p className="mb-0 mt-5 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.02em] text-ink-faint">
          <span className="pulse-dot mx-1 size-1.5 shrink-0 rounded-full bg-tide" />3 findings
        </p>
        <div className="mt-2.5 space-y-2">
          {findings.map((f) => (
            <div
              key={f.text}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 ${
                f.hot ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-paper/70 opacity-70"
              }`}
            >
              <span className={`truncate text-[12.5px] ${f.hot ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>
                {f.text}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10.5px] font-medium ${
                  f.hot ? "bg-tide text-white" : "bg-surface text-ink-faint ring-1 ring-line"
                }`}
              >
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mb-0 mt-4 text-center font-mono text-[11px] text-ink-faint">one deep run per prospect, before we write a word</p>
    </VignetteFrame>
  );
}

/* Personalize — the artifact is the bug recording itself, built for one prospect */
function PersonalizeArt() {
  return (
    <VignetteFrame label="demo build" meta="built for Sarah · Acme">
      <div className="flex flex-1 flex-col justify-center">
        <BugDemoCard />
        <div className="mt-5 space-y-2.5 font-mono text-[11.5px] text-ink-soft">
          <p className="m-0 flex items-center gap-2.5">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 shrink-0 stroke-tide"
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            <span>pulled from acme.com &middot; 14 pages</span>
          </p>
          <p className="m-0 flex items-center gap-2.5">
            <span className="pulse-dot mx-1 size-1.5 shrink-0 rounded-full bg-tide" />
            <span className="text-ink">human review before it ships</span>
          </p>
        </div>
      </div>
      <p className="mb-0 mt-4 text-center font-mono text-[11px] text-ink-faint">one artifact per prospect, never reused</p>
    </VignetteFrame>
  );
}

/* tiny artifact previews for the Iterate readout */
function ArtifactThumb({ kind }: { kind: "rec" | "dash" | "doc" }) {
  if (kind === "rec") {
    return (
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#16181d]">
        <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5 fill-white" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#e2574a]" />
      </span>
    );
  }
  if (kind === "dash") {
    return (
      <span className="flex size-10 shrink-0 gap-1 rounded-lg border border-line bg-white p-1.5">
        <span className="h-full w-1.5 rounded-sm bg-tide/70" />
        <span className="flex flex-1 flex-col justify-between py-0.5">
          <span className="h-1 w-full rounded-full bg-[#dfe3e9]" />
          <span className="h-1 w-3/4 rounded-full bg-tide/50" />
          <span className="h-1 w-full rounded-full bg-[#dfe3e9]" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex size-10 shrink-0 flex-col justify-center gap-1 rounded-lg border border-line bg-white px-2">
      <span className="h-1 w-full rounded-full bg-[#dfe3e9]" />
      <span className="h-1 w-2/3 rounded-full bg-[#dfe3e9]" />
      <span className="h-1 w-full rounded-full bg-[#d4574a]/60" />
    </span>
  );
}

/* Iterate — competing demo artifacts; replies pick what we build next */
function IterateArt() {
  const artifacts = [
    {
      thumb: "rec",
      name: "bug recording",
      desc: "double-charge on checkout · 0:47",
      replies: "4.9% reply",
      width: "82%",
      tone: "win",
      tag: "gets the budget",
    },
    {
      thumb: "dash",
      name: "QA dashboard",
      desc: "Acme's app · custom test suites written",
      replies: "3.2% reply",
      width: "54%",
      tone: "mid",
      tag: "testing now",
    },
    {
      thumb: "doc",
      name: "coverage report",
      desc: "signup flow · 12 cases annotated",
      replies: "1.1% reply",
      width: "18%",
      tone: "cut",
      tag: "cut this week",
    },
  ] as const;
  return (
    <VignetteFrame label="artifact testing" meta="re-ranked weekly">
      <div className="flex flex-1 flex-col justify-center gap-3">
        {artifacts.map((a) => (
          <div
            key={a.name}
            className={`rounded-xl px-3.5 py-3 ${
              a.tone === "win" ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-paper/70"
            } ${a.tone === "cut" ? "opacity-55" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                <ArtifactThumb kind={a.thumb} />
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[12.5px] ${
                      a.tone === "win" ? "font-semibold text-ink" : "font-medium text-ink-soft"
                    }`}
                  >
                    {a.name}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-ink-faint">{a.desc}</span>
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10.5px] font-medium ${
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
                className={`shrink-0 font-mono text-[11px] ${
                  a.tone === "win" ? "font-medium text-tide" : "text-ink-faint"
                }`}
              >
                {a.replies}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mb-0 mt-4 text-center font-mono text-[11px] text-ink-faint">
        replies decide which artifact prospects get next
      </p>
    </VignetteFrame>
  );
}

function HowSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / total));
      setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
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

  const jumpTo = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const total = wrap.offsetHeight - window.innerHeight;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (total / STEPS.length) * (i + 0.5), behavior: "smooth" });
  };

  return (
    <section id="how" className="scroll-mt-20 border-t border-line">
      {/* pinned scroll story (desktop, motion ok) */}
      <div ref={wrapRef} className="relative hidden h-[300vh] lg:motion-safe:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="max-w-150">
            <HowHeading />
          </div>

          <div className="mt-12 grid w-full grid-cols-[1fr_1.05fr] items-center gap-16 xl:gap-20">
            {/* topics */}
            <div className="flex flex-col gap-8">
              {STEPS.map((step, i) => (
                <button
                  key={step.title}
                  type="button"
                  aria-current={i === active ? "step" : undefined}
                  onClick={() => jumpTo(i)}
                  className="group relative block w-full cursor-pointer border-0 bg-transparent p-0 pl-6 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1 left-0 top-1 w-[3px] rounded-full transition-colors duration-500 ${
                      i === active ? "bg-tide" : "bg-line group-hover:bg-ink-faint/60"
                    }`}
                  />
                  <div
                    className={`transition-opacity duration-500 ${
                      i === active ? "opacity-100" : "opacity-60 group-hover:opacity-80"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                      <h3 className="m-0 text-[19px] font-semibold tracking-[-0.01em]">{step.title}</h3>
                      <span className="font-mono text-[12px] text-ink-faint">0{i + 1}</span>
                    </div>
                    <p className="mb-0 mt-2 max-w-105 text-[15.5px] leading-relaxed text-ink-soft">{step.body}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* vignettes */}
            <div className="relative h-105">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 transition-all duration-500 ease-out ${
                    i === active
                      ? "translate-y-0 opacity-100"
                      : i < active
                        ? "pointer-events-none -translate-y-8 opacity-0"
                        : "pointer-events-none translate-y-8 opacity-0"
                  }`}
                >
                  <step.art />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* plain list (mobile + reduced motion) */}
      <div className="pt-20 sm:pt-26 lg:motion-safe:hidden">
        <div className="reveal max-w-150">
          <HowHeading />
        </div>
        <ol className="relative m-0 mt-12 list-none space-y-12 p-0">
          <span className="absolute bottom-6 left-5 top-6 w-px bg-line" aria-hidden="true" />
          {STEPS.map((step, i) => (
            <li key={step.title} className="reveal relative pl-16" style={{ transitionDelay: `${i * 0.06}s` }}>
              <span className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-tide/40 bg-tide-wash font-mono text-[12px] font-semibold text-tide">
                0{i + 1}
              </span>
              <h3 className="m-0 text-[19px] font-semibold">{step.title}</h3>
              <p className="mb-0 mt-2 max-w-110 text-[15.5px] leading-relaxed text-ink-soft">{step.body}</p>
              <div className="-ml-16 mt-5 sm:ml-0 sm:max-w-130">
                <step.art />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* the plumbing, in one quiet line */}
      <div className="reveal mt-14 pb-20 sm:pb-26 lg:motion-safe:mt-0 lg:motion-safe:pb-24">
        <p className="m-0 rounded-2xl border border-line bg-surface/60 px-6 py-5 text-[15px] leading-relaxed text-ink-soft">
          And the plumbing — domains, inboxes, warming, deliverability, send windows. Handled daily, so reply
          rates don't quietly die.
        </p>
      </div>
    </section>
  );
}

/* ---------- the story: one send, start to reply ---------- */

const STORY_KICKER = (
  <>
    Example campaign — <span className="font-medium text-ink">Autosana</span>, an AI QA agent, selling to{" "}
    <span className="font-medium text-ink">Sarah Chen</span> at Acme.
  </>
);

const STORY_CAPTIONS = [
  "First, our agent tests their product and finds something real.",
  "The email writes itself around the finding.",
  "Sarah replies.",
  "What everyone else sends gets archived in 4 seconds.",
];

const STORY_LOGS = [
  "crawling acme.com · 14 pages",
  "testing checkout flows",
  "bug found: double-clicking Pay charges twice",
  "recording the repro · 0:47",
];

const COMPOSE_ANNOS = [
  { text: "a real bug, found this morning", pos: "right-0 top-24 translate-x-[55%] -rotate-2" },
  { text: "proof attached, not claims", pos: "right-0 top-[52%] translate-x-[60%] rotate-1" },
  { text: "specific ask, easy yes", pos: "bottom-16 right-0 translate-x-[50%] -rotate-1" },
];

/* beat 1 — the build/log card; lines are revealed by scroll state, never timers */
function StoryBuildCard({ logs, thumb }: { logs: number; thumb: boolean }) {
  return (
    <div className="flex w-full max-w-135 flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[12.5px] font-medium text-ink-soft">
          <span className="pulse-dot size-1.5 rounded-full bg-tide" />
          autosana's QA agent &times; driftwood
        </span>
        <span className="rounded-full bg-sand px-2.5 py-0.5 font-mono text-[12px] text-ink-soft">
          prospect: Sarah Chen &middot; Acme
        </span>
      </div>
      <div className="space-y-3 px-5 pb-2 pt-5 font-mono text-[13px] text-ink-soft">
        {STORY_LOGS.map((line, i) => (
          <p key={line} className={`m-0 flex items-start gap-2.5 ${i < logs ? "log-line" : "invisible"}`}>
            <svg
              viewBox="0 0 24 24"
              className={`mt-[3px] size-3.5 shrink-0 ${i === 2 ? "stroke-[#d4574a]" : "stroke-tide"}`}
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {i === 2 ? <path d="M12 4.5v10M12 19v.5" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
            </svg>
            <span className={i === 2 ? "font-medium text-ink" : undefined}>{line}</span>
          </p>
        ))}
      </div>
      <div className="px-5 pb-5 pt-3">
        <div className={thumb ? "materialize" : "invisible"}>
          <BugDemoCard />
        </div>
      </div>
    </div>
  );
}

/* beat 2 — the compose window; body blocks slide in with the beat, annotations point at why it works */
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
      <div className="rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="size-2.5 rounded-full bg-[#e8b4a8]" />
          <span className="size-2.5 rounded-full bg-[#e6d3a3]" />
          <span className="size-2.5 rounded-full bg-[#b5cfae]" />
          <span className="ml-2 font-mono text-[12.5px] text-ink-soft">New message</span>
          <span
            className={`ml-auto rounded-full px-2.5 py-0.5 font-mono text-[12px] font-medium transition-colors duration-500 ${
              sent ? "bg-tide-wash text-tide" : "bg-paper text-ink-soft"
            }`}
          >
            {sent ? "Sent" : "Draft"}
          </span>
        </div>

        {/* headers */}
        <div className="space-y-1.5 border-b border-line px-5 py-2.5 text-[13.5px]">
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
        <div className="px-5 py-4 text-[14px] leading-relaxed text-ink-soft">
          <p className={`m-0 ${blockClass}`} style={block(0)}>
            Hi Sarah,
          </p>
          <p className={`m-0 mt-3 ${blockClass}`} style={block(0)}>
            Our QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay charges the
            card twice. Here's the 47-second recording:
          </p>
          <div className={`mt-3 ${on ? "pop-in" : "invisible"}`} style={block(1)}>
            <BugDemoCard compact />
          </div>
          <p className={`m-0 mt-3 ${blockClass}`} style={block(2)}>
            We already work with Y Combinator's engineering team to catch bugs before they ship, and our customers
            save an average of 10 hours a week on QA.
          </p>
          <p className={`m-0 mt-3 ${blockClass}`} style={block(3)}>
            Open to a quick call this week?
          </p>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <span className="font-mono text-[12.5px] text-ink-soft">recording attached by driftwood</span>
          <span
            className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold text-white transition-colors duration-300 ${
              sent ? "send-fill bg-tide-deep" : "bg-tide"
            }`}
          >
            {sent ? "Sent" : "Send"}
          </span>
        </div>
      </div>

      {/* annotations — why this email works */}
      {inlineAnnos ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {COMPOSE_ANNOS.map((a) => (
            <span
              key={a.text}
              className="inline-block rounded-full bg-tide-wash px-3 py-1 font-mono text-[12.5px] font-medium text-tide ring-1 ring-tide/20"
            >
              {a.text}
            </span>
          ))}
        </div>
      ) : (
        COMPOSE_ANNOS.map((a, i) => (
          <span
            key={a.text}
            className={`absolute z-10 inline-flex items-center gap-1.5 rounded-full bg-tide-wash px-3 py-1 font-mono text-[12.5px] font-medium text-tide shadow-[0_8px_20px_-10px_rgba(13,60,91,0.45)] ring-1 ring-tide/25 ${a.pos} ${
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

/* beat 3 — the reply, styled as a real inbox thread */
function StoryReplyThread({ on }: { on: boolean }) {
  return (
    <div className="w-full max-w-135 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      {/* thread header */}
      <div className="border-b border-line px-5 py-4">
        <p className="m-0 text-[15.5px] font-semibold text-ink">Re: found a bug in Acme's checkout</p>
        <p className="m-0 mt-1 font-mono text-[12px] text-ink-faint">Inbox &middot; 2 messages</p>
      </div>
      {/* our send, collapsed */}
      <div className="flex items-center gap-3 border-b border-line bg-paper/50 px-5 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide font-mono text-[11px] font-semibold text-white">
          A
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-ink-soft">
            Autosana <span className="font-normal text-ink-faint">to sarah@acme.com</span>
          </span>
          <span className="block truncate text-[13px] text-ink-faint">
            Our QA agent ran Acme's checkout this morning and caught a real bug&hellip;
          </span>
        </span>
        <span className="shrink-0 font-mono text-[12px] text-ink-faint">9:02 AM</span>
      </div>
      {/* her reply, expanded */}
      <div className={`px-5 py-4 ${on ? "block-in" : "invisible"}`} style={on ? { animationDelay: "0.2s" } : undefined}>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tide-wash text-[13px] font-bold text-tide">
            SC
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="m-0 text-[15px] font-semibold text-ink">Sarah Chen</p>
              <span className="font-mono text-[12px] text-ink-faint">sarah@acme.com &middot; 11:08 AM</span>
              <span className="ml-auto rounded-full bg-tide-wash px-2.5 py-0.5 font-mono text-[12px] font-medium text-tide">
                2h later
              </span>
            </div>
            <p className="m-0 mt-0.5 font-mono text-[12px] text-ink-faint">to autosana</p>
            <p className="m-0 mt-3 text-[15.5px] leading-relaxed text-ink">ok this is wild. got time Thursday?</p>
            <div className="mt-4 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-ink-faint">
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

/* the generic cold email everyone else sends */
function UsualEmail() {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-line bg-surface/70 p-5">
      <div className="border-b border-line pb-3 text-[13px]">
        <p className="m-0 text-ink-faint">
          Subject: <span className="text-ink-soft">Sarah — quick question (Acme x Autosana)</span>
        </p>
      </div>
      <div className="mb-0 mt-4 space-y-4 text-[14px] leading-relaxed text-ink-soft">
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
        <span className="inline-block rounded-full bg-paper px-2.5 py-1 font-mono text-[12.5px] text-ink-soft ring-1 ring-line">
          read in 4 seconds, archived
        </span>
      </span>
    </div>
  );
}

/* the driftwood email, condensed for the side-by-side */
function DriftwoodEmail() {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-tide/35 bg-surface p-5 shadow-[0_20px_50px_-28px_rgba(13,60,91,0.4)]">
      <div className="border-b border-line pb-3 text-[13px]">
        <p className="m-0 text-ink-faint">
          Subject: <span className="font-medium text-ink">found a bug in Acme's checkout</span>
        </p>
      </div>
      <div className="mb-3 mt-4 space-y-4 text-[14px] leading-relaxed text-ink-soft">
        <p className="m-0">Hi Sarah,</p>
        <p className="m-0">
          Our QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay
          charges the card twice. Here's the 47-second recording:
        </p>
      </div>
      <BugDemoCard compact />
      <div className="mb-0 mt-3 text-[14px] leading-relaxed text-ink-soft">
        <p className="m-0">Open to a quick call this week?</p>
      </div>
      <span className="mt-auto self-start pt-4">
        <span className="inline-block rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[12.5px] font-medium text-tide">
          "ok this is wild. got time Thursday?" &middot; 2h later
        </span>
      </span>
    </div>
  );
}

/* beat 4 — the contrast; the slop email lands beside the driftwood send */
function StoryCompare({ on, draw }: { on: boolean; draw: number }) {
  return (
    <div className="relative grid w-full max-w-5xl items-start gap-8 sm:grid-cols-2 lg:gap-10">
      {/* hand-drawn arrow from the slop email back to the driftwood send, drawn by scroll */}
      <svg
        viewBox="0 0 200 70"
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden w-44 -translate-x-1/2 text-tide lg:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M188 54 C 150 16, 68 6, 14 40" pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: 1 - draw }} />
        <path d="M14 40 l14 -3 M14 40 l3 -14" className="transition-opacity duration-300" opacity={draw >= 1 ? 1 : 0} />
      </svg>
      <div className="flex h-full flex-col">
        <p className="mb-3 ml-1 font-mono text-[12.5px] tracking-[0.02em] text-tide">what driftwood sent</p>
        <DriftwoodEmail />
      </div>
      <div className={`flex h-full flex-col transition-all delay-150 duration-700 ease-out ${on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
        <p className="mb-3 ml-1 font-mono text-[12.5px] tracking-[0.02em] text-ink-soft">what everyone else sends</p>
        <UsualEmail />
      </div>
    </div>
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
      setProg(Math.round(p * 400) / 400);
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
  const active = Math.min(STORY_CAPTIONS.length - 1, Math.floor(prog * STORY_CAPTIONS.length));
  const local = prog * STORY_CAPTIONS.length - active;
  const logs = active > 0 ? STORY_LOGS.length : Math.min(STORY_LOGS.length, Math.floor(local / 0.16) + 1);
  const thumb = active > 0 || local > 0.66;
  const sent = active > 1 || (active === 1 && local > 0.75);
  const annos = active > 1 ? 3 : active === 1 ? (local > 0.62 ? 3 : local > 0.4 ? 2 : local > 0.18 ? 1 : 0) : 0;
  const draw = active === 3 ? Math.min(1, Math.max(0, (local - 0.1) / 0.45)) : 0;

  const panes = [
    <StoryBuildCard key="build" logs={logs} thumb={thumb} />,
    <StoryComposeCard key="compose" on={active === 1} sent={sent} annos={annos} />,
    <StoryReplyThread key="reply" on={active === 2} />,
    <StoryCompare key="compare" on={active === 3} draw={draw} />,
  ];

  return (
    <section id="story" className="scroll-mt-20 border-t border-line">
      <h2 className="sr-only">Watch one send, start to reply</h2>

      {/* pinned walkthrough (desktop, motion ok) */}
      <div ref={wrapRef} className="relative hidden h-[420vh] lg:motion-safe:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          {/* persistent kicker — who this example is about, always on screen */}
          <p className="m-0 text-center font-mono text-[13px] text-ink-soft">{STORY_KICKER}</p>

          {/* narrator caption — one grid cell so the tallest caption reserves the height */}
          <div className="mt-6 grid text-center">
            {STORY_CAPTIONS.map((caption, i) => (
              <p
                key={caption}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 mx-auto my-0 max-w-3xl text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-snug tracking-[-0.015em] transition-all duration-500 ease-out ${
                  i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-3 opacity-0" : "translate-y-3 opacity-0"
                }`}
              >
                {caption}
              </p>
            ))}
          </div>

          {/* beat progress */}
          <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
            {STORY_CAPTIONS.map((caption, i) => (
              <span
                key={caption}
                className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-tide" : "w-3 bg-line"}`}
              />
            ))}
          </div>

          {/* stage — all beats share one grid cell so the stage never changes height */}
          <div className="mt-9 grid w-full">
            {panes.map((pane, i) => (
              <div
                key={STORY_CAPTIONS[i]}
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
        <p className="reveal m-0 font-mono text-[13px] leading-relaxed text-ink-soft">{STORY_KICKER}</p>
        <div className="mt-12 space-y-18">
          {[
            <StoryBuildCard key="build" logs={STORY_LOGS.length} thumb />,
            <StoryComposeCard key="compose" on sent annos={3} inlineAnnos />,
            <StoryReplyThread key="reply" on />,
            <StoryCompare key="compare" on draw={1} />,
          ].map((stage, i) => (
            <div key={STORY_CAPTIONS[i]} className="reveal">
              <p className="m-0 font-mono text-[12.5px] font-medium text-tide">0{i + 1}</p>
              <p className="mb-0 mt-2 max-w-150 text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-snug tracking-[-0.015em]">
                {STORY_CAPTIONS[i]}
              </p>
              <div className="mt-7">{stage}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── artifacts: every product has a demo artifact; three fictional senders ── */

/* Autosana — a bug recording, the site's existing motif in miniature */
function RecArtifactMock() {
  return (
    <div className="relative flex h-44 flex-col overflow-hidden rounded-xl bg-[#16181d]">
      <span className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[12px] font-medium text-white/90">
        <span className="pulse-dot size-1.5 rounded-full bg-[#e2574a]" />
        rec
      </span>
      {/* faint page skeleton behind the play button */}
      <div className="absolute inset-x-5 top-8 space-y-2 opacity-15" aria-hidden="true">
        <div className="h-1.5 w-2/3 rounded-full bg-white" />
        <div className="h-1.5 w-1/2 rounded-full bg-white" />
        <div className="h-1.5 w-3/5 rounded-full bg-white" />
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-white" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </div>
      <div className="relative flex items-center justify-between gap-3 border-t border-white/10 px-3.5 py-2.5">
        <span className="truncate font-mono text-[12px] text-white/75">acme.com checkout &middot; 0:47</span>
        <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
          <span className="block h-full w-1/3 rounded-full bg-white/70" />
        </span>
      </div>
    </div>
  );
}

/* Lumen — a live dashboard pre-filled with the prospect's own public data */
function DashArtifactMock() {
  return (
    <div className="flex h-44 flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2">
        <span className="truncate font-mono text-[12px] font-medium text-ink">Northwind &middot; ops overview</span>
        <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-8 shrink-0 flex-col items-center gap-1.5 border-r border-line bg-paper/70 py-2.5" aria-hidden="true">
          <span className="size-2.5 rounded-sm bg-tide/70" />
          <span className="size-2.5 rounded-sm bg-line" />
          <span className="size-2.5 rounded-sm bg-line" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-paper/70 px-2.5 py-1.5">
              <p className="m-0 truncate font-mono text-[12px] text-ink-faint">fulfillment lag</p>
              <p className="m-0 text-[14px] font-semibold tracking-[-0.01em] text-ink">2.4 days</p>
            </div>
            <div className="rounded-lg bg-paper/70 px-2.5 py-1.5">
              <p className="m-0 truncate font-mono text-[12px] text-ink-faint">orders at risk</p>
              <p className="m-0 text-[14px] font-semibold tracking-[-0.01em] text-ink">31</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 rounded-lg bg-paper/70 p-2">
            <svg
              viewBox="0 0 160 40"
              className="size-full overflow-visible"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 32 C 24 30 34 22 56 24 C 78 26 92 12 114 14 C 132 15 146 8 158 6"
                stroke="var(--color-tide)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="158" cy="6" r="2.5" fill="var(--color-tide)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Relay — a cost teardown built from the prospect's public pricing */
function DocArtifactMock() {
  const rows = [
    { item: "card processing", cost: "$21,300/mo" },
    { item: "cross-border fees", cost: "$4,100/mo" },
  ];
  return (
    <div className="flex h-44 flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="border-b border-line px-3.5 py-2.5">
        <p className="m-0 text-[13px] font-semibold tracking-[-0.01em] text-ink">What Brightline pays today</p>
        <p className="m-0 mt-0.5 font-mono text-[12px] text-ink-faint">prepared by Relay</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 px-3.5">
        {rows.map((r) => (
          <div key={r.item} className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] text-ink-soft">{r.item}</span>
            <span className="shrink-0 font-mono text-[12px] text-ink-soft">{r.cost}</span>
          </div>
        ))}
        <div className="-mx-2.5 mt-0.5 flex items-baseline justify-between gap-3 rounded-lg bg-tide-wash/70 px-2.5 py-1.5 ring-1 ring-tide/35">
          <span className="truncate text-[13px] font-medium text-ink">same volume on Relay</span>
          <span className="shrink-0 font-mono text-[12px] font-semibold text-tide">&minus;$8,400/mo</span>
        </div>
      </div>
    </div>
  );
}

const ARTIFACT_EXAMPLES = [
  {
    company: "autosana · ai qa agent",
    artifact: "bug recording",
    art: RecArtifactMock,
    source: "recorded on acme.com · nothing installed",
    caption:
      "Autosana's agent ran the prospect's checkout and caught a real bug. The 47-second recording is the whole pitch.",
  },
  {
    company: "lumen · analytics for ops teams",
    artifact: "live dashboard",
    art: DashArtifactMock,
    source: "built from Northwind's public data",
    caption:
      "A working dashboard with the prospect's own numbers already in it. They open the email and see their operation.",
  },
  {
    company: "relay · payments api",
    artifact: "cost teardown",
    art: DocArtifactMock,
    source: "from their public pricing + checkout",
    caption:
      "A line-by-line read of what the prospect pays now, with the saving Relay would unlock already worked out.",
  },
];

function ArtifactsSection() {
  return (
    <section id="artifacts" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
      <div className="reveal max-w-150">
        <h2 className="m-0 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
          Your product has an artifact too.
        </h2>
        <p className="mb-0 mt-4 max-w-130 text-[16.5px] leading-relaxed text-ink-soft">
          A bug recording is just what proof looks like for a QA agent. Whatever you sell, there's a format that
          shows your product working on each prospect's own data — and finding it is our job, not yours.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {ARTIFACT_EXAMPLES.map((ex, i) => (
          <div
            key={ex.company}
            className="reveal flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]"
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-center justify-between gap-3 pb-4">
              <span className="truncate font-mono text-[12px] font-medium text-ink-soft">{ex.company}</span>
              <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 font-mono text-[12px] text-ink-soft">
                {ex.artifact}
              </span>
            </div>
            <ex.art />
            <p className="m-0 mt-2.5 font-mono text-[12px] text-ink-faint">{ex.source}</p>
            <p className="mb-0 mt-3 text-[13.5px] leading-relaxed text-ink-soft">{ex.caption}</p>
          </div>
        ))}
      </div>

      <p className="reveal mb-0 mt-10 max-w-130 text-[16.5px] leading-relaxed text-ink-soft" style={{ transitionDelay: "0.1s" }}>
        If you sell software, there's a version of this for you. Finding it is the first thing we do.
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
        <section className="relative isolate flex flex-col items-center py-20 text-center sm:py-24 lg:py-28">
          <HeroContours />
          <h1 className="m-0 max-w-5xl text-[clamp(2.6rem,6vw,4.4rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Ship every cold email with a custom demo.
          </h1>
          <p className="mx-auto mt-6 max-w-145 text-[18px] leading-relaxed text-ink-soft sm:text-[19px]">
            We run your whole cold email channel and build each prospect a demo of your product, so more sends
            convert into meetings.
          </p>
          <div className="relative mt-9 flex justify-center">
            <WaitlistForm id="email-hero" />
          </div>
          <p className="mt-4 font-mono text-[13px] text-ink-soft">Now onboarding a small group of design partners.</p>
          <a
            href="#story"
            className="mt-14 inline-flex flex-col items-center gap-2 font-mono text-[13px] text-ink-soft no-underline transition-colors hover:text-tide"
          >
            watch one send, start to reply
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

        {/* one send, start to reply */}
        <StorySection />

        {/* works for any product */}
        <ArtifactsSection />

        {/* what we handle */}
        <HowSection />

        {/* working with us */}
        <section id="working" className="border-t border-line py-20 sm:py-26">
          <div className="reveal max-w-150">
            <p className="m-0 font-mono text-[13px] text-tide">Working with us</p>
            <h2 className="m-0 mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
              You talk to founders, not agents.
            </h2>
          </div>

          <p
            className="reveal mb-0 mt-8 max-w-xl text-[17px] leading-relaxed text-ink-soft"
            style={{ transitionDelay: "0.08s" }}
          >
            Driftwood is run by its founders — when you work with us, that's who you're talking to. You tell us
            what you sell and who buys it; our agents do the research and build the demos, and a human reviews
            every email before it ships. When a prospect replies, the meeting goes straight to your calendar.
          </p>
        </section>

        {/* final cta */}
        <section id="join" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
          <div className="reveal mx-auto max-w-150 text-center">
            <h2 className="m-0 text-[clamp(1.8rem,4.2vw,2.8rem)] font-semibold leading-tight tracking-[-0.015em]">
              See what we'd send your prospects.
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
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
