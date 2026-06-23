import { useEffect, useRef, useState, type ReactNode } from "react";
import WaitlistForm from "./components/WaitlistForm";
import { Nav, Footer } from "./components/Chrome";
import { useReveal } from "./components/useReveal";
import { StoryCallCard } from "./components/story/StoryCallCard";
import { StoryConsoleCard } from "./components/story/StoryConsoleCard";
import { StorySlackCard } from "./components/story/StorySlackCard";
import { StoryEmailCard } from "./components/story/StoryEmailCard";
import { MintlifyAskMock } from "./components/examples/MintlifyMock";
import { RunwayAdMock } from "./components/examples/RunwayMock";
import { RampSpendMock } from "./components/examples/RampMock";
import { ShopifyRebuildMock } from "./components/examples/ShopifyMock";
import { SquareOrderMock } from "./components/examples/SquareMock";

/* ---------- shared chrome ---------- */

/* the bug recording as email clients actually render video: a square thumbnail.
   `small` drops the frozen-frame preview — at thumbnail size only REC, play, and
   the duration survive, which is what a real inline video looks like in Gmail. */
function SquareVideoThumb({ small, className }: { small?: boolean; className?: string }) {
  return (
    <div
      className={`relative aspect-square ${small ? "w-28" : "w-40"} shrink-0 overflow-hidden rounded-xl bg-[#16181d] ${className ?? ""}`}
    >
      <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-black/60 py-0.5 pl-1.5 pr-2 font-mono text-[10.5px] font-medium text-white">
        <span className="size-1.5 rounded-full bg-[#e2574a]" />
        REC
      </span>
      {/* frozen frame: the duplicate charge, mid-recording */}
      {!small && (
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
      )}
      <span
        className={`absolute left-1/2 top-1/2 flex ${small ? "size-8" : "size-10"} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)]`}
      >
        <svg viewBox="0 0 24 24" className={`ml-0.5 ${small ? "size-3" : "size-3.5"} fill-[#16181d]`} aria-hidden="true">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-5 font-mono text-[10.5px] text-white/85">
        {!small && <span className="truncate">acme.com checkout bug</span>}
        <span className="ml-auto shrink-0">0:47</span>
      </span>
    </div>
  );
}

/* ---------- the story: one campaign, end to end ----------
   titles + subs describe driftwood's capabilities, generic on purpose;
   the graphics carry the Autosana worked example */

const BEATS = [
  {
    title: "We learn what you sell",
    sub: "One 15-minute call, and we walk away with your first demo ideas.",
  },
  {
    title: "An agent builds every prospect a demo of your product",
    sub: "It starts with a deep dive on the company, from the founders to their graphics.",
  },
  {
    title: "We review every email by hand, then send it",
    sub: "We also run the inboxes, the warming, and the follow-up sequences.",
  },
  {
    title: "Every email is an experiment",
    sub: "We test demos across ICPs, and the results land in your Slack every week.",
  },
];

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
  /* beat 3 — the reply lands partway through the beat */
  const replied = active > 2 || (active === 2 && local > 0.5);
  /* beat 4 — ranked rows land one by one */
  const rows = active === 3 ? Math.min(3, Math.floor(local / 0.18) + 1) : 0;

  const panes = [
    <StoryCallCard key="call" building={building} icps={icps} ideas={ideas} />,
    <StoryConsoleCard key="console" plans={plans} logs={logs} thumb={thumb} />,
    <StoryEmailCard key="email" on={active === 2} replied={replied} />,
    <StorySlackCard key="slack" rows={rows} />,
  ];

  return (
    <section id="story" className="scroll-mt-20">
      <h2 className="sr-only">See an example campaign</h2>

      {/* pinned walkthrough (desktop, motion ok) — pt-16 keeps the active
          title from sliding under the sticky nav on tall stages */}
      <div ref={wrapRef} className="relative hidden h-[420vh] lg:motion-safe:block">
        <div className="sticky top-0 isolate flex h-screen flex-col justify-center overflow-hidden pt-16">
          <HeroContours className="pointer-events-none absolute -bottom-48 -left-48 -z-10 size-155 text-tide opacity-[0.05]" />
          {/* beat title — items-end keeps the gap to the subheading constant
              whether the active title wraps to one line or two */}
          <div className="grid items-end text-center">
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

          {/* beat subheading — carries the worked example under the generic title */}
          <div className="mt-4 grid items-start text-center">
            {BEATS.map((beat, i) => (
              <p
                key={beat.title}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 mx-auto my-0 max-w-2xl text-[18px] leading-relaxed text-ink-soft transition-all duration-500 ease-out ${
                  i === active ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {beat.sub}
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
          <div className="mt-7 grid w-full">
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
      <div className="py-14 sm:py-18 lg:motion-safe:hidden">
        <div className="space-y-14">
          {[
            <StoryCallCard key="call" building icps ideas={3} />,
            <StoryConsoleCard key="console" plans={3} logs={2} thumb />,
            <StoryEmailCard key="email" on replied />,
            <StorySlackCard key="slack" rows={3} />,
          ].map((stage, i) => (
            <div key={BEATS[i].title} className="reveal">
              <p className="m-0 font-mono text-[14px] font-medium text-tide">0{i + 1}</p>
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

/* gmail-style frame shared by the two compare emails */
function EmailFrame({
  subject,
  highlight,
  children,
}: {
  subject: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex flex-1 flex-col rounded-2xl border bg-white p-5 ${
        highlight
          ? "border-tide/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_56px_-26px_rgba(13,60,91,0.48)]"
          : "border-line shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_40px_-26px_rgba(22,24,29,0.4)]"
      }`}
    >
      <p className="m-0 border-b border-[#eceef1] pb-3 text-[17px] font-semibold text-[#202124]">{subject}</p>
      <div className="mt-4 text-[14.5px] leading-[1.55] text-[#202124] [font-family:Arial,Helvetica,sans-serif]">
        {children}
      </div>
    </div>
  );
}

function UsualEmail() {
  return (
    <EmailFrame subject="Sarah — quick question (Acme x Autosana)">
      <p className="m-0">Hey Sarah,</p>
      <p className="m-0 mt-4">
        Huge fan of what you're building at Acme — saw you just crossed 200 employees. Incredible
        momentum.
      </p>
      <p className="m-0 mt-4">
        I'm the founder of Autosana, an <strong>AI-powered platform that automates QA end-to-end</strong>.
        We just closed our seed round and are growing <strong>40% month over month</strong> — teams like
        yours are seeing huge results.
      </p>
      <p className="m-0 mt-4">
        Would love to connect and show you what we're building. Any chance you have 15 minutes this
        week? You can <span className="cursor-pointer text-[#1a0dab] underline">grab time here</span>.
      </p>
    </EmailFrame>
  );
}

function DriftwoodEmail() {
  return (
    <EmailFrame subject="found a bug in Acme's checkout" highlight>
      <p className="m-0">Hi Sarah,</p>
      <p className="m-0 mt-4">
        Our QA agent ran Acme's checkout this morning and caught a real bug:{" "}
        <strong>double-clicking Pay charges the card twice</strong>. The 47-second recording is below.
      </p>
      <p className="m-0 mt-4">
        We already work with Y Combinator's engineering team to catch bugs before they ship.
      </p>
      <p className="m-0 mt-4">Open to a quick call this week?</p>
      <SquareVideoThumb className="mt-4 w-36" />
    </EmailFrame>
  );
}

const ARROW_PATH = "M 14 70 C 40 36, 72 20, 102 28 C 130 36, 132 64, 112 62 C 92 60, 98 32, 128 28 C 166 23, 208 36, 234 58";
const ARROW_HEAD = "M 234 58 l -15 -2 M 234 58 l -3 -14.5";

function CompareEmails() {
  return (
    <>
      <div className="flex h-full flex-col">
        <p className="mb-3 ml-1 font-mono text-[14px] tracking-[0.02em] text-ink-soft">what everyone else sends</p>
        <UsualEmail />
      </div>
      <div className="flex h-full flex-col">
        <p className="mb-3 ml-1 font-mono text-[14px] tracking-[0.02em] text-tide">what driftwood sent</p>
        <div className="tide-ring-pulse flex flex-1 flex-col rounded-2xl">
          <DriftwoodEmail />
        </div>
      </div>
    </>
  );
}

function CompareSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGPathElement>(null);

  /* pinned like the story: the screen holds while scroll scrubs the arrow,
     with a beat of hold time before it starts and after it lands */
  useEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    const head = headRef.current;
    if (!wrap || !path || !head) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    let raf = 0;
    const update = () => {
      raf = 0;
      const total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / total));
      const draw = Math.min(1, Math.max(0, (p - 0.14) / 0.62));
      path.style.strokeDashoffset = `${length * (1 - draw)}`;
      head.style.opacity = draw > 0.97 ? "1" : "0";
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

  return (
    <section id="compare" className="scroll-mt-20 border-t border-line">
      {/* pinned walkthrough (desktop, motion ok) */}
      <div ref={wrapRef} className="relative hidden h-[230vh] lg:motion-safe:block">
        <div className="sticky top-0 isolate flex h-screen flex-col justify-center overflow-hidden">
          <HeroContours className="pointer-events-none absolute -bottom-52 -right-44 -z-10 size-155 text-tide opacity-[0.05]" />
          <div className="mx-auto max-w-150 text-center">
            <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
              Don't send out AI slop
            </h2>
          </div>
          <div className="relative mx-auto mt-16 grid w-full max-w-5xl grid-cols-2 items-stretch gap-8 lg:gap-12">
            {/* hand-drawn arrow with a loop, scrubbed by the pinned scroll */}
            <svg
              viewBox="0 0 260 100"
              aria-hidden="true"
              className="pointer-events-none absolute -top-17 left-1/2 z-10 w-65 -translate-x-1/2 text-tide"
            >
              <path ref={pathRef} d={ARROW_PATH} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path
                ref={headRef}
                className="transition-opacity duration-300"
                d={ARROW_HEAD}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ opacity: 0 }}
              />
            </svg>
            <CompareEmails />
          </div>
        </div>
      </div>

      {/* stacked fallback (mobile + reduced motion) — arrow pre-drawn */}
      <div className="py-14 sm:py-18 lg:motion-safe:hidden">
        <div className="reveal mx-auto max-w-150 text-center">
          <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
            Don't send out AI slop
          </h2>
        </div>
        <div className="reveal relative mx-auto mt-16 grid w-full max-w-5xl items-stretch gap-8 sm:grid-cols-2 lg:gap-12">
          <svg
            viewBox="0 0 260 100"
            aria-hidden="true"
            className="pointer-events-none absolute -top-17 left-1/2 z-10 hidden w-65 -translate-x-1/2 text-tide sm:block"
          >
            <path d={ARROW_PATH} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d={ARROW_HEAD} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <CompareEmails />
        </div>
      </div>
    </section>
  );
}

/* ---------- examples carousel: a product you know pitching a company you know ---------- */

const SLIDES = [
  {
    key: "shopify",
    company: "Shopify",
    domain: "commerce",
    prospect: "Patagonia",
    to: "web@patagonia.com",
    time: "7:48 AM",
    subject: "we rebuilt patagonia.com overnight",
    body: "All 412 products imported, checkout cut from 6 clicks to 2. The live preview is below.",
    art: ShopifyRebuildMock,
  },
  {
    key: "ramp",
    company: "Ramp",
    domain: "spend management",
    prospect: "Notion",
    to: "finance@notion.so",
    time: "9:02 AM",
    subject: "is Notion paying list price for Salesforce?",
    body: "We mapped the 63 tools Notion runs and priced them against what companies your size pay on Ramp. If you're at list, Salesforce alone is 28% over. The full benchmark is below.",
    art: RampSpendMock,
  },
  {
    key: "mintlify",
    company: "Mintlify",
    domain: "developer docs",
    prospect: "Supabase",
    to: "docs@supabase.com",
    time: "8:32 AM",
    subject: "your Discord answers the same questions every week",
    body: "Hey, we built you a docs page that uses AI to answer the most common questions from your Discord. It's live below.",
    art: MintlifyAskMock,
  },
  {
    key: "runway",
    company: "Runway",
    domain: "AI video",
    prospect: "Liquid Death",
    to: "marketing@liquiddeath.com",
    time: "10:14 AM",
    subject: "we made Liquid Death a 15-second ad",
    body: "Built from your own Instagram assets this morning. The cut is below.",
    art: RunwayAdMock,
  },
  {
    key: "square",
    company: "Square",
    domain: "local commerce",
    prospect: "Joe's Pizza",
    to: "joe@joespizza.nyc",
    time: "6:51 PM",
    subject: "Joe's doesn't take online orders, so we built it",
    body: "Your full menu, live on a Square ordering page. We ran a test order. The receipt is below.",
    art: SquareOrderMock,
  },
];

function ExamplesSection() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  return (
    <section id="examples" className="scroll-mt-20 border-t border-line py-14 sm:py-18">
      <div className="reveal max-w-160">
        <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-tight tracking-[-0.015em]">
          What we'd build for companies you know
        </h2>
      </div>

      <div className="reveal mt-8 grid items-start gap-5 lg:mt-10 lg:grid-cols-[250px_1fr] lg:gap-9">
        {/* company picker */}
        <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-2.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`cursor-pointer rounded-xl border px-4 py-2.5 text-left transition-colors lg:py-3.5 ${
                i === index
                  ? "border-tide/40 bg-tide-wash/60"
                  : "border-line bg-surface hover:border-ink-faint/50"
              }`}
            >
              <span className={`block text-[16.5px] ${i === index ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>
                {s.company}
              </span>
              <span className="mt-0.5 block font-mono text-[13px] text-ink-faint">
                pitching <span className={i === index ? "text-tide" : "text-ink-soft"}>{s.prospect}</span>
              </span>
            </button>
          ))}
        </div>

        {/* the email the prospect receives, artifact inside */}
        <div className="min-w-0">
          <div
            key={slide.key}
            className="materialize flex flex-col rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)]"
          >
            {/* thread header: the subject is the pitch */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-4 sm:px-5">
              <p className="m-0 min-w-0 text-[17.5px] font-semibold leading-snug text-ink">{slide.subject}</p>
              <span className="shrink-0 rounded-full bg-paper px-2.5 py-0.5 font-mono text-[12.5px] text-ink-faint ring-1 ring-line">
                Inbox
              </span>
            </div>
            <div className="px-4 py-4 sm:px-5 sm:pb-5">
              {/* sender row */}
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tide font-mono text-[13px] font-semibold text-white">
                  {slide.company[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <p className="m-0 text-[15.5px] font-semibold text-ink">{slide.company}</p>
                    <span className="font-mono text-[13px] text-ink-faint">via driftwood</span>
                    <span className="ml-auto font-mono text-[13px] text-ink-faint">{slide.time}</span>
                  </div>
                  <p className="m-0 mt-0.5 font-mono text-[13px] text-ink-faint">to {slide.to}</p>
                </div>
              </div>
              {/* body, as the inbox renders it */}
              <p className="m-0 mt-4 text-[14.5px] leading-[1.55] text-[#202124] [font-family:Arial,Helvetica,sans-serif]">
                {slide.body}
              </p>
              <div className="mt-7 flex flex-col">
                <slide.art />
              </div>
              {/* reply chrome */}
              <div className="mt-6 flex gap-2" aria-hidden="true">
                <span className="rounded-full px-4 py-1.5 text-[13.5px] font-medium text-ink-soft ring-1 ring-line">
                  &#8617; Reply
                </span>
                <span className="rounded-full px-4 py-1.5 text-[13.5px] font-medium text-ink-soft ring-1 ring-line">
                  &#8618; Forward
                </span>
              </div>
            </div>
          </div>
          <p className="mb-0 mt-4 text-center font-mono text-[13.5px] text-ink-faint">
            made-up examples, not customers
          </p>
        </div>
      </div>
    </section>
  );
}

/* faint sea-chart contour lines — the hero's motif, reused for depth on pinned screens */
function HeroContours({
  className = "pointer-events-none absolute -right-44 -top-48 -z-10 hidden size-155 text-tide opacity-[0.06] lg:block",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 600 600" aria-hidden="true" className={className}>
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
        <section className="relative isolate flex flex-col items-center pb-8 pt-14 text-center sm:pt-16 lg:pt-20">
          <HeroContours />
          <h1 className="m-0 max-w-5xl text-[clamp(2.9rem,6.5vw,4.9rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Ship a custom demo in every cold email.
          </h1>
          <p className="mx-auto mt-6 max-w-145 text-[19px] leading-relaxed text-ink-soft sm:text-[20px]">
            We run your cold email end to end. Every prospect gets a demo built just for them.
          </p>
          <div className="relative mt-8 flex justify-center">
            <WaitlistForm id="email-hero" />
          </div>
          <a
            href="#story"
            className="mt-11 inline-flex flex-col items-center gap-2 font-mono text-[14.5px] text-ink-soft no-underline transition-colors hover:text-tide"
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
        <section id="join" className="scroll-mt-20 border-t border-line py-16 sm:py-20">
          <div className="reveal mx-auto max-w-150 text-center">
            <h2 className="m-0 text-[clamp(2rem,4.6vw,3rem)] font-semibold leading-tight tracking-[-0.015em]">
              See what we'd send your prospects.
            </h2>
            <p className="mt-4 text-[18.5px] leading-relaxed text-ink-soft">
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
