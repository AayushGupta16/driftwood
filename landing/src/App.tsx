import { useEffect, useRef, useState, type ReactNode } from "react";
import { BugDemoCard } from "./components/AgentDemo";
import WaitlistForm from "./components/WaitlistForm";
import { Nav, Footer, useReveal } from "./components/Chrome";

const STEPS = [
  {
    title: "A research agent on every prospect",
    body: "Before we write a word, an agent crawls the prospect's site and runs their product. It comes back with something real to say.",
    art: ResearchArt,
  },
  {
    title: "Proof of value in every email",
    body: "We turn the best finding into something they can click, like a recording of a real bug in their own checkout. A human checks every one before it ships.",
    art: PersonalizeArt,
  },
  {
    title: "Replies decide what we build next",
    body: "We test different proof formats against each other and watch the replies. We keep sending what wins and cut what doesn't.",
    art: IterateArt,
  },
];

function HowHeading() {
  return (
    <>
      <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
        You take the meetings. We run everything else.
      </h2>
    </>
  );
}

const PLUMBING = ["domains", "inboxes", "warming", "deliverability", "send windows"];

/* the deliberate non-step footer of the topic list: campaign plumbing we run daily */
function PlumbingNote() {
  return (
    <div>
      <p className="m-0 max-w-105 text-[16px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink">The plumbing is included.</span> We check it every
        day.
      </p>
      <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-2 p-0">
        {PLUMBING.map((item) => (
          <li
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-2.5 py-1 font-mono text-[13px] lowercase text-ink-soft"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-3 shrink-0 stroke-tide"
              fill="none"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* shared card shell so every vignette keeps the same footprint */
function VignetteFrame({ label, meta, children }: { label: string; meta: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[13px] font-medium tracking-[0.02em] text-ink-soft">
          <span className="pulse-dot size-1.5 rounded-full bg-tide" />
          {label}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-0.5 font-mono text-[12px] text-ink-soft">{meta}</span>
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
        <div className="space-y-2.5 font-mono text-[12.5px] text-ink-soft">
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
        <p className="mb-0 mt-5 flex items-center gap-2.5 font-mono text-[12px] tracking-[0.02em] text-ink-faint">
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
              <span className={`truncate text-[13.5px] ${f.hot ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>
                {f.text}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[11.5px] font-medium ${
                  f.hot ? "bg-tide text-white" : "bg-surface text-ink-faint ring-1 ring-line"
                }`}
              >
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mb-0 mt-4 text-center font-mono text-[12px] text-ink-faint">one deep run per prospect, before we write a word</p>
    </VignetteFrame>
  );
}

/* Personalize — the artifact is the bug recording itself, built for one prospect */
function PersonalizeArt() {
  return (
    <VignetteFrame label="demo build" meta="built for Sarah · Acme">
      <div className="flex flex-1 flex-col justify-center">
        <BugDemoCard />
        <div className="mt-5 space-y-2.5 font-mono text-[12.5px] text-ink-soft">
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
      <p className="mb-0 mt-4 text-center font-mono text-[12px] text-ink-faint">built fresh for each prospect, never reused</p>
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
    <VignetteFrame label="proof testing" meta="re-ranked weekly">
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
                    className={`block truncate text-[13.5px] ${
                      a.tone === "win" ? "font-semibold text-ink" : "font-medium text-ink-soft"
                    }`}
                  >
                    {a.name}
                  </span>
                  <span className="block truncate font-mono text-[12px] text-ink-faint">{a.desc}</span>
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[11.5px] font-medium ${
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
                className={`shrink-0 font-mono text-[12px] ${
                  a.tone === "win" ? "font-medium text-tide" : "text-ink-faint"
                }`}
              >
                {a.replies}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mb-0 mt-4 text-center font-mono text-[12px] text-ink-faint">
        replies decide what prospects get next
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
                      <h3 className="m-0 text-[20px] font-semibold tracking-[-0.01em]">{step.title}</h3>
                      <span className="font-mono text-[13px] text-ink-faint">0{i + 1}</span>
                    </div>
                    <p className="mb-0 mt-2 max-w-105 text-[16.5px] leading-relaxed text-ink-soft">{step.body}</p>
                  </div>
                </button>
              ))}
              <div className="border-t border-line pl-6 pt-6">
                <PlumbingNote />
              </div>
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
      <div className="py-20 sm:py-26 lg:motion-safe:hidden">
        <div className="reveal max-w-150">
          <HowHeading />
        </div>
        <ol className="relative m-0 mt-12 list-none space-y-12 p-0">
          <span className="absolute bottom-6 left-5 top-6 w-px bg-line" aria-hidden="true" />
          {STEPS.map((step, i) => (
            <li key={step.title} className="reveal relative pl-16" style={{ transitionDelay: `${i * 0.06}s` }}>
              <span className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-tide/40 bg-tide-wash font-mono text-[13px] font-semibold text-tide">
                0{i + 1}
              </span>
              <h3 className="m-0 text-[20px] font-semibold">{step.title}</h3>
              <p className="mb-0 mt-2 max-w-110 text-[16.5px] leading-relaxed text-ink-soft">{step.body}</p>
              <div className="-ml-16 mt-5 sm:ml-0 sm:max-w-130">
                <step.art />
              </div>
            </li>
          ))}
        </ol>
        <div className="reveal mt-14 border-t border-line pt-8">
          <PlumbingNote />
        </div>
      </div>
    </section>
  );
}

/* ---------- the story: one campaign, end to end ---------- */

const STORY_KICKER = (
  <>
    Example campaign: <span className="font-medium text-ink">Autosana</span>, an AI QA agent, selling to{" "}
    <span className="font-medium text-ink">Sarah Chen</span> at Acme.
  </>
);

const STORY_CAPTIONS = [
  "First, we learn your company inside and out.",
  "An agent researches each prospect and builds their proof.",
  "The email goes out.",
  "Sarah replies.",
  "Everyone else's email gets archived in 4 seconds. Ours got a meeting.",
];

/* beat 1 — what we learn about the client, and the proof ideas it produces */
const CLIENT_FACTS = ["runs automated QA on web apps", "sells to engineering leaders"];

const PROOF_IDEAS = [
  "bug recording on the prospect's own site",
  "QA dashboard run against their app",
  "test-coverage teardown",
];

/* beat 2 — the agent's run over one prospect; "pick" ties back to the beat-1 ideas */
const STORY_LOGS = [
  { text: "crawling acme.com · 14 pages", tone: "run" },
  { text: "best idea for acme: bug recording", tone: "pick" },
  { text: "testing checkout flows", tone: "run" },
  { text: "bug found: double-clicking Pay charges twice", tone: "alert" },
  { text: "recording the bug · 0:47", tone: "run" },
] as const;

const COMPOSE_ANNOS = [
  { text: "a real bug, found this morning", pos: "right-0 top-24 translate-x-[55%] -rotate-2" },
  { text: "the proof is attached", pos: "right-0 top-[52%] translate-x-[60%] rotate-1" },
  { text: "one clear ask", pos: "bottom-16 right-0 translate-x-[50%] -rotate-1" },
];

/* beat 1 — the understanding/ideation workspace for the client (not the prospect);
   facts and ideas are revealed by scroll state, never timers */
function StoryClientCard({ facts, ideas }: { facts: number; ideas: number }) {
  return (
    <div className="flex w-full max-w-135 flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[13.5px] font-medium text-ink-soft">
          <span className="pulse-dot size-1.5 rounded-full bg-tide" />
          client: Autosana &middot; AI QA agent
        </span>
        <span className="rounded-full bg-sand px-2.5 py-0.5 font-mono text-[13.5px] text-ink-soft">
          onboarding &middot; week one
        </span>
      </div>
      <div className="px-5 pt-5">
        <p className="m-0 font-mono text-[13.5px] tracking-[0.02em] text-ink-faint">what they do</p>
        <div className="mt-3 space-y-2.5 text-[16px] leading-relaxed text-ink-soft">
          {CLIENT_FACTS.map((fact, i) => (
            <p key={fact} className={`m-0 flex items-center gap-2.5 ${i < facts ? "log-line" : "invisible"}`}>
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
              {fact}
            </p>
          ))}
        </div>
      </div>
      <div className="px-5 pb-5 pt-5">
        <p className="m-0 flex items-center gap-2.5 font-mono text-[13.5px] tracking-[0.02em] text-ink-faint">
          <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-tide" />
          proof ideas &middot; what we could build for a prospect
        </p>
        <div className="mt-3 space-y-2">
          {PROOF_IDEAS.map((idea, i) => (
            <div
              key={idea}
              className={`flex items-center justify-between gap-3 rounded-xl bg-paper/70 px-3.5 py-2.5 ring-1 ring-line/70 ${
                i < ideas ? "toast-in" : "invisible"
              }`}
            >
              <span className="truncate text-[14.5px] font-medium text-ink-soft">{idea}</span>
              <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-mono text-[13.5px] text-ink-faint ring-1 ring-line">
                idea
              </span>
            </div>
          ))}
        </div>
        <p className="mb-0 mt-4 text-center font-mono text-[13.5px] text-ink-faint">
          none chosen yet. the best fit gets picked per prospect
        </p>
      </div>
    </div>
  );
}

/* beat 2 — the agent's build/log card; lines are revealed by scroll state, never timers */
function StoryBuildCard({ logs, thumb }: { logs: number; thumb: boolean }) {
  return (
    <div className="flex w-full max-w-135 flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[13.5px] font-medium text-ink-soft">
          <span className="pulse-dot size-1.5 rounded-full bg-tide" />
          autosana's QA agent &times; driftwood
        </span>
        <span className="rounded-full bg-sand px-2.5 py-0.5 font-mono text-[13.5px] text-ink-soft">
          prospect: Sarah Chen &middot; Acme
        </span>
      </div>
      <div className="space-y-3 px-5 pb-2 pt-5 font-mono text-[14px] text-ink-soft">
        {STORY_LOGS.map((line, i) => (
          <p key={line.text} className={`m-0 flex items-start gap-2.5 ${i < logs ? "log-line" : "invisible"}`}>
            <svg
              viewBox="0 0 24 24"
              className={`mt-[3px] size-3.5 shrink-0 ${line.tone === "alert" ? "stroke-[#d4574a]" : "stroke-tide"}`}
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {line.tone === "alert" ? <path d="M12 4.5v10M12 19v.5" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
            </svg>
            <span
              className={
                line.tone === "alert" ? "font-medium text-ink" : line.tone === "pick" ? "font-medium text-tide" : undefined
              }
            >
              {line.text}
            </span>
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

/* beat 3 — the compose window; body blocks slide in with the beat, annotations point at why it works */
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
        <div className="px-5 py-4 text-[15px] leading-relaxed text-ink-soft">
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
          <span className="font-mono text-[13.5px] text-ink-soft">recording attached by driftwood</span>
          <span
            className={`rounded-lg px-4 py-1.5 text-[14px] font-semibold text-white transition-colors duration-300 ${
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
    <div className="w-full max-w-135 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
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
      <div className={`px-5 py-4 ${on ? "block-in" : "invisible"}`} style={on ? { animationDelay: "0.2s" } : undefined}>
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

/* the generic cold email everyone else sends */
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

/* the driftwood email, condensed for the side-by-side */
function DriftwoodEmail() {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-tide/35 bg-surface p-5 shadow-[0_20px_50px_-28px_rgba(13,60,91,0.4)]">
      <div className="border-b border-line pb-3 text-[14px]">
        <p className="m-0 text-ink-faint">
          Subject: <span className="font-medium text-ink">found a bug in Acme's checkout</span>
        </p>
      </div>
      <div className="mb-3 mt-4 space-y-4 text-[15px] leading-relaxed text-ink-soft">
        <p className="m-0">Hi Sarah,</p>
        <p className="m-0">
          Our QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay
          charges the card twice. Here's the 47-second recording:
        </p>
      </div>
      <BugDemoCard compact />
      <div className="mb-0 mt-3 text-[15px] leading-relaxed text-ink-soft">
        <p className="m-0">Open to a quick call this week?</p>
      </div>
      <span className="mt-auto self-start pt-4">
        <span className="inline-block rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[13.5px] font-medium text-tide">
          "ok this is wild. got time Thursday?" &middot; 2h later
        </span>
      </span>
    </div>
  );
}

/* beat 5 — the contrast; slop on the left, the driftwood send on the right (before → after).
   The old hand-drawn arrow clipped and floated off the cards, so it's replaced by things that
   can't break: a centered "vs" chip in the gap, and a pulsing tide ring on the driftwood card. */
function StoryCompare({ on, vs }: { on: boolean; vs: boolean }) {
  return (
    <div className="relative grid w-full max-w-5xl items-stretch gap-8 sm:grid-cols-2 lg:gap-10">
      <div className="flex h-full flex-col">
        <p className="mb-3 ml-1 font-mono text-[13.5px] tracking-[0.02em] text-ink-soft">what everyone else sends</p>
        <UsualEmail />
      </div>

      {/* "vs" chip, dead-center in the gap between the two columns */}
      <span
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-[13.5px] font-semibold text-ink-soft shadow-[0_8px_20px_-10px_rgba(13,60,91,0.45)] sm:inline-flex ${
          vs ? "toast-in" : "invisible"
        }`}
      >
        vs
      </span>

      <div
        className={`flex h-full flex-col transition-all delay-150 duration-700 ease-out ${
          on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <p className="mb-3 ml-1 font-mono text-[13.5px] tracking-[0.02em] text-tide">what driftwood sent</p>
        <div className={`flex flex-1 flex-col rounded-2xl ${vs ? "tide-ring-pulse" : ""}`}>
          <DriftwoodEmail />
        </div>
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
  const active = Math.min(STORY_CAPTIONS.length - 1, Math.floor(prog * STORY_CAPTIONS.length));
  const local = prog * STORY_CAPTIONS.length - active;
  /* beat 1 — client facts, then proof ideas, one by one */
  const facts = active > 0 ? CLIENT_FACTS.length : Math.min(CLIENT_FACTS.length, Math.floor(local / 0.16) + 1);
  const ideas = active > 0 ? PROOF_IDEAS.length : local > 0.74 ? 3 : local > 0.56 ? 2 : local > 0.38 ? 1 : 0;
  /* beat 2 — agent log lines, then the artifact materializes */
  const logs =
    active > 1 ? STORY_LOGS.length : active === 1 ? Math.min(STORY_LOGS.length, Math.floor(local / 0.13) + 1) : 0;
  const thumb = active > 1 || (active === 1 && local > 0.72);
  /* beat 3 — annotations, then the Draft→Sent flip */
  const sent = active > 2 || (active === 2 && local > 0.75);
  const annos = active > 2 ? 3 : active === 2 ? (local > 0.62 ? 3 : local > 0.4 ? 2 : local > 0.18 ? 1 : 0) : 0;
  /* beat 5 — the "vs" chip lands once both emails are on screen */
  const vs = active === 4 && local > 0.35;

  const panes = [
    <StoryClientCard key="client" facts={facts} ideas={ideas} />,
    <StoryBuildCard key="build" logs={logs} thumb={thumb} />,
    <StoryComposeCard key="compose" on={active === 2} sent={sent} annos={annos} />,
    <StoryReplyThread key="reply" on={active === 3} />,
    <StoryCompare key="compare" on={active === 4} vs={vs} />,
  ];

  return (
    <section id="story" className="scroll-mt-20">
      <h2 className="sr-only">Watch one campaign happen</h2>

      {/* pinned walkthrough (desktop, motion ok) */}
      <div ref={wrapRef} className="relative hidden h-[520vh] lg:motion-safe:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          {/* persistent kicker — who this example is about, always on screen */}
          <p className="m-0 text-center font-mono text-[14px] text-ink-soft">{STORY_KICKER}</p>

          {/* narrator caption — one grid cell so the tallest caption reserves the height */}
          <div className="mt-6 grid text-center">
            {STORY_CAPTIONS.map((caption, i) => (
              <p
                key={caption}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 mx-auto my-0 max-w-3xl text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-snug tracking-[-0.015em] transition-all duration-500 ease-out ${
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
        <p className="reveal m-0 font-mono text-[14px] leading-relaxed text-ink-soft">{STORY_KICKER}</p>
        <div className="mt-12 space-y-18">
          {[
            <StoryClientCard key="client" facts={CLIENT_FACTS.length} ideas={PROOF_IDEAS.length} />,
            <StoryBuildCard key="build" logs={STORY_LOGS.length} thumb />,
            <StoryComposeCard key="compose" on sent annos={3} inlineAnnos />,
            <StoryReplyThread key="reply" on />,
            <StoryCompare key="compare" on vs />,
          ].map((stage, i) => (
            <div key={STORY_CAPTIONS[i]} className="reveal">
              <p className="m-0 font-mono text-[13.5px] font-medium text-tide">0{i + 1}</p>
              <p className="mb-0 mt-2 max-w-150 text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-snug tracking-[-0.015em]">
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

/* ── proof of value: three real products, three ways to show them working for a prospect ── */

/* Autosana — a screen recording of a real bug, caught on the prospect's own checkout */
function RecordingProofMock() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#16181d] shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      {/* player title bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <span className="truncate font-mono text-[13px] text-white/75">bug recording &middot; acme.com checkout</span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[13px] font-medium text-white/90">
          <span className="pulse-dot size-1.5 rounded-full bg-[#e2574a]" />
          rec
        </span>
      </div>

      {/* the recorded browser */}
      <div className="px-4 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
          {/* browser chrome */}
          <div className="flex items-center gap-2 border-b border-[#e8eaee] bg-[#f6f7f9] px-3.5 py-2.5">
            <span className="size-2 rounded-full bg-[#d9dde3]" />
            <span className="size-2 rounded-full bg-[#d9dde3]" />
            <span className="size-2 rounded-full bg-[#d9dde3]" />
            <span className="ml-2 min-w-0 truncate rounded-md bg-white px-2.5 py-1 font-mono text-[13px] text-[#7a8190] ring-1 ring-[#e8eaee]">
              acme.com/checkout
            </span>
          </div>
          {/* the checkout, mid-bug */}
          <div className="space-y-2.5 px-3.5 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 truncate text-[15px] font-semibold text-[#16181d]">Checkout &mdash; order #4821</p>
                <p className="m-0 mt-0.5 font-mono text-[13px] text-[#7a8190]">1 item &middot; $84.00</p>
              </div>
              <span className="relative shrink-0 rounded-lg bg-[#16181d] px-4 py-2 text-[14px] font-semibold text-white">
                Pay $84.00
                <span className="absolute -right-2 -top-2 rounded-full bg-[#d4574a] px-1.5 py-0.5 font-mono text-[12px] font-bold leading-none text-white">
                  &times;2
                </span>
              </span>
            </div>
            <p className="m-0 pt-1 font-mono text-[13px] text-[#7a8190]">one click on Pay &middot; two charges posted</p>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f1f3f6] px-3 py-2.5 ring-1 ring-[#e6e9ee]">
              <span className="truncate font-mono text-[13.5px] font-medium text-[#3c424e]">Visa &middot;&middot;&middot;&middot; 4242</span>
              <span className="shrink-0 font-mono text-[13px] text-[#7a8190]">$84.00 &middot; 4:02:11 PM</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-[#fff5f4] px-3 py-2.5 ring-[1.5px] ring-[#d4574a]">
              <span className="flex min-w-0 items-center gap-2 font-mono text-[13.5px] font-medium text-[#3c424e]">
                <span className="truncate">Visa &middot;&middot;&middot;&middot; 4242</span>
                <span className="shrink-0 rounded-full bg-[#d4574a] px-2 py-0.5 text-[12px] font-bold text-white">duplicate</span>
              </span>
              <span className="shrink-0 font-mono text-[13px] font-semibold text-[#d4574a]">$84.00 &middot; 4:02:12 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* play bar with scrubber */}
      <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5 fill-white" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
        <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-white/15" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 w-[42%] rounded-full bg-white/80" />
          <span className="absolute left-[42%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </div>
        <span className="shrink-0 font-mono text-[13px] text-white/75">0:19 / 0:47</span>
      </div>

      {/* provenance */}
      <div className="border-t border-white/10 px-4 py-3 sm:px-6">
        <p className="m-0 truncate text-center font-mono text-[13px] text-white/60">
          recorded on acme.com &middot; nothing installed
        </p>
      </div>
    </div>
  );
}

/* Lopus — a real question about the prospect's business, already answered */
function AnsweredQuestionProofMock() {
  const sources = ["billing", "support", "stripe"];
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      {/* app header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#ecedf1] px-4 py-3 sm:px-5">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-tide font-mono text-[13px] font-semibold text-white">
            L
          </span>
          <span className="truncate font-mono text-[13.5px] font-medium text-ink">lopus &middot; northwind</span>
        </span>
        <span className="shrink-0 font-mono text-[13px] text-ink-faint">answered in 14s</span>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        {/* the question, in plain English */}
        <div className="flex items-center gap-2.5 rounded-xl border border-[#ecedf1] bg-paper/60 px-3.5 py-2.5">
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 stroke-ink-faint"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="min-w-0 truncate font-mono text-[13.5px] text-ink">why did refunds spike in march?</span>
        </div>

        {/* the answer: root cause + the chart behind it */}
        <div className="mt-3.5 rounded-xl border border-[#ecedf1] bg-paper/50 p-3.5 sm:p-4">
          <p className="m-0 text-[15.5px] font-semibold tracking-[-0.01em] text-ink">Almost all of it is one product.</p>
          <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-ink-soft">
            Refunds on the sampler box tripled after the March 9 packaging change. Support tickets from the same
            weeks mention crushed boxes.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <p className="m-0 font-mono text-[13px] text-ink-soft">refunds per week &middot; jan to may</p>
            <span className="flex shrink-0 items-center gap-1.5 font-mono text-[13px] text-[#c2503f]">
              <span className="size-1.5 rounded-full bg-[#c2503f]" />
              mar 9
            </span>
          </div>
          <svg viewBox="0 0 320 110" className="mt-2 h-auto w-full" fill="none" aria-hidden="true">
            <path d="M2 14H318 M2 50H318 M2 86H318" stroke="#e7e9ee" strokeWidth="1" />
            <path
              d="M2 84 C 30 84 55 83 80 82 C 105 81 124 80 140 76 C 154 72 164 28 178 24 C 192 28 206 52 224 64 C 250 76 290 79 318 78 L318 106 L2 106 Z"
              fill="var(--color-tide)"
              opacity="0.07"
            />
            <path d="M178 30 V104" stroke="#c2503f" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45" />
            <path
              d="M2 84 C 30 84 55 83 80 82 C 105 81 124 80 140 76 C 154 72 164 28 178 24 C 192 28 206 52 224 64 C 250 76 290 79 318 78"
              stroke="var(--color-tide)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="178" cy="24" r="4" fill="#c2503f" stroke="white" strokeWidth="1.5" />
          </svg>
          <div className="mt-1.5 flex justify-between font-mono text-[13px] text-ink-faint" aria-hidden="true">
            <span>jan</span>
            <span>feb</span>
            <span>mar</span>
            <span>apr</span>
            <span>may</span>
          </div>
        </div>

        {/* sources + how the answer was made */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[13px] text-ink-faint">sources</span>
          {sources.map((s) => (
            <span
              key={s}
              className="rounded-full bg-paper px-2.5 py-1 font-mono text-[12.5px] text-ink-soft ring-1 ring-[#e6e9ee]"
            >
              {s}
            </span>
          ))}
          <span className="rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[12.5px] font-medium text-tide">
            high confidence &middot; sql shown
          </span>
        </div>
      </div>

      {/* provenance */}
      <div className="border-t border-[#ecedf1] px-4 py-3 sm:px-5">
        <p className="m-0 truncate text-center font-mono text-[13px] text-ink-faint">
          built from Northwind's public numbers &middot; nothing connected yet
        </p>
      </div>
    </div>
  );
}

/* Tour.video — a finished tour of the prospect's own property, agent already answering */
function TourProofMock() {
  const chapters = ["floor plan", "kitchen", "amenities", "pricing"];
  return (
    <div className="overflow-hidden rounded-2xl bg-[#16181d] shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
      {/* player title bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <span className="truncate font-mono text-[13px] text-white/75">tour.video &middot; vista ridge apartments</span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[13px] font-medium text-white/90">
          <span className="pulse-dot size-1.5 rounded-full bg-[#3fb98a]" />
          agent on
        </span>
      </div>

      {/* the tour itself */}
      <div className="px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,#2b303b,#1a1d24)]">
          {/* sketched apartment interior */}
          <svg viewBox="0 0 320 196" className="h-auto w-full" fill="none" aria-hidden="true">
            <path d="M0 138 H320" stroke="white" strokeOpacity="0.14" strokeWidth="1.5" />
            <path d="M14 196 L66 138 M306 196 L258 138" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />
            <rect x="36" y="42" width="92" height="84" rx="2" stroke="white" strokeOpacity="0.28" strokeWidth="1.5" />
            <path d="M82 42 V126 M36 84 H128" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
            <rect x="192" y="106" width="98" height="32" rx="2" stroke="white" strokeOpacity="0.24" strokeWidth="1.5" />
            <path d="M198 138 V160 M284 138 V160" stroke="white" strokeOpacity="0.16" strokeWidth="1.5" />
            <path d="M222 8 V32 M258 8 V24" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
            <circle cx="222" cy="37" r="5" stroke="white" strokeOpacity="0.26" strokeWidth="1.5" />
            <circle cx="258" cy="29" r="5" stroke="white" strokeOpacity="0.26" strokeWidth="1.5" />
          </svg>

          {/* what's playing */}
          <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
            <p className="m-0 text-[13.5px] font-semibold text-white">Vista Ridge Apartments</p>
            <p className="m-0 mt-0.5 font-mono text-[12.5px] text-white/65">2br walkthrough &middot; unit 204</p>
          </div>

          {/* play button */}
          <span className="absolute left-[30%] top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-[#16181d]" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </div>

        {/* the leasing agent, mid-conversation, overlapping the player */}
        <div className="relative z-10 -mt-13 ml-auto flex w-[78%] max-w-66 flex-col items-end gap-1.5 pr-2 sm:pr-3">
          <span className="rounded-xl rounded-br-sm bg-[#2e333d] px-3 py-2 text-[12.5px] leading-snug text-white ring-1 ring-white/15">
            is the 2br available in july?
          </span>
          <div className="w-full rounded-xl rounded-bl-sm bg-white px-3 py-2.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)]">
            <p className="m-0 font-mono text-[11.5px] text-[#7a8190]">vista ridge ai &middot; 11:42 pm</p>
            <p className="m-0 mt-1 text-[12.5px] leading-snug text-[#16181d]">
              Yes, unit 204 opens July 8 at $1,450/mo. Want to see it in person?
            </p>
            <p className="m-0 mt-2 flex items-center gap-1.5 border-t border-[#ecedf1] pt-2 font-mono text-[12px] font-medium text-[#1e7a5f]">
              <svg
                viewBox="0 0 24 24"
                className="size-3.5 shrink-0 stroke-current"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
              tour booked &middot; sat 11:00 am
            </p>
          </div>
        </div>
      </div>

      {/* play bar with scrubber */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-4 sm:gap-4 sm:px-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
          <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5 fill-white" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
        <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-white/15" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 w-[31%] rounded-full bg-white/80" />
          <span className="absolute left-[31%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          <span className="absolute left-[25%] top-1/2 h-2.5 w-px -translate-y-1/2 bg-white/40" />
          <span className="absolute left-[50%] top-1/2 h-2.5 w-px -translate-y-1/2 bg-white/40" />
          <span className="absolute left-[75%] top-1/2 h-2.5 w-px -translate-y-1/2 bg-white/40" />
        </div>
        <span className="shrink-0 font-mono text-[13px] text-white/75">1:04 / 3:21</span>
      </div>

      {/* chapters */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-6" aria-hidden="true">
        {chapters.map((c, i) => (
          <span
            key={c}
            className={`rounded-full px-2.5 py-1 font-mono text-[12.5px] ${
              i === 1 ? "bg-white/15 font-medium text-white" : "bg-white/5 text-white/55 ring-1 ring-white/10"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      {/* provenance */}
      <div className="border-t border-white/10 px-4 py-3 sm:px-6">
        <p className="m-0 truncate text-center font-mono text-[13px] text-white/60">
          built from Vista Ridge's listing page &middot; answered after hours
        </p>
      </div>
    </div>
  );
}

const PROOF_EXAMPLES = [
  {
    format: "a bug recording",
    title: "A real bug, caught on the prospect's own site.",
    who: "Autosana sells an AI agent that tests apps automatically. Their prospects are engineering leaders who want to ship faster without breaking things.",
    sends: "A screen recording of a real bug Autosana's agent just found in the prospect's own checkout.",
    lands: "An engineering leader watches the product do its job on their own site before anyone asks for a call.",
    art: RecordingProofMock,
  },
  {
    format: "an answered question",
    title: "A real question about their business, already answered.",
    who: "Lopus sells AI analytics to ops teams. It connects CRM, billing, product and support data so anyone can ask questions in plain English.",
    sends: "A real question about the prospect's business, already answered: the root cause, the chart, and the sources, built from their public numbers.",
    lands: "They see the product thinking about their numbers before they've connected a single tool.",
    art: AnsweredQuestionProofMock,
  },
  {
    format: "a finished tour",
    title: "Their own property, already selling itself.",
    who: "Tour.video sells interactive video tours and an AI leasing agent to property managers.",
    sends: "A working tour of one of their own properties, with the AI agent answering a real renter question and booking the visit.",
    lands: "The leasing team watches their own property sell itself after hours, with no one on shift.",
    art: TourProofMock,
  },
];

function ProofExplainer({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="m-0 font-mono text-[13px] tracking-[0.02em] text-ink-faint">{label}</p>
      <p className="mb-0 mt-1 text-[16.5px] leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}

function ArtifactsSection() {
  return (
    <section id="artifacts" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
      <div className="reveal max-w-150">
        <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
          Give each prospect value upfront
        </h2>
        <p className="mb-0 mt-4 max-w-135 text-[17.5px] leading-relaxed text-ink-soft">
          Every email we send shows your product working on the prospect's own company. See what that looks like
          for these three products.
        </p>
      </div>

      <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-20">
        {PROOF_EXAMPLES.map((ex, i) => {
          const flip = i % 2 === 1;
          return (
            <div
              key={ex.format}
              className={`grid items-center gap-8 lg:gap-14 ${
                flip ? "lg:grid-cols-[1.2fr_0.8fr]" : "lg:grid-cols-[0.8fr_1.2fr]"
              }`}
            >
              <div className={`reveal ${flip ? "lg:order-2" : ""}`}>
                <h3 className="m-0 max-w-115 text-[22px] font-semibold leading-snug tracking-[-0.01em] sm:text-[24px]">
                  {ex.title}
                </h3>
                <div className="mt-5 max-w-115 space-y-4">
                  <ProofExplainer label="who's sending" text={ex.who} />
                  <ProofExplainer label="what their prospects get" text={ex.sends} />
                  <ProofExplainer label="why it lands" text={ex.lands} />
                </div>
              </div>
              <div className={`reveal min-w-0 ${flip ? "lg:order-1" : ""}`} style={{ transitionDelay: "0.08s" }}>
                <ex.art />
              </div>
            </div>
          );
        })}
      </div>

      <p className="reveal mb-0 mt-16 max-w-135 text-[17.5px] leading-relaxed text-ink-soft">
        If you sell software, there's a way to show it working on each prospect's own site, numbers, or listings.
        Finding yours is the first thing we do.
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
            Driftwood runs your whole cold email channel. Every prospect sees your product working on their own
            company, before they ever book a call.
          </p>
          <div className="relative mt-9 flex justify-center">
            <WaitlistForm id="email-hero" />
          </div>
          <p className="mt-4 font-mono text-[14px] text-ink-soft">Now onboarding a small group of design partners.</p>
          <a
            href="#story"
            className="mt-14 inline-flex flex-col items-center gap-2 font-mono text-[14px] text-ink-soft no-underline transition-colors hover:text-tide"
          >
            watch one campaign happen
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

        {/* works for any product */}
        <ArtifactsSection />

        {/* what we handle */}
        <HowSection />

        {/* working with us */}
        <section id="working" className="border-t border-line py-20 sm:py-26">
          <div className="reveal max-w-150">
            <p className="m-0 font-mono text-[14px] text-tide">Working with us</p>
            <h2 className="m-0 mt-3 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
              15 minutes of your time. We handle the rest.
            </h2>
          </div>

          <p
            className="reveal mb-0 mt-8 max-w-xl text-[18px] leading-relaxed text-ink-soft"
            style={{ transitionDelay: "0.08s" }}
          >
            After one short onboarding call, we set up and run your company's entire outbound email channel. We
            take full ownership of every email we send, and each one gets a human review before it goes out.
            Nothing will be spammy or out of context. We keep you updated on results and what we're improving.
          </p>
        </section>

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
