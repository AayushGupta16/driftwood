import { useEffect, useRef, useState, type ReactNode } from "react";
import BookDemo from "./components/BookDemo";
import { Nav, Footer } from "./components/Chrome";
import { useReveal } from "./components/useReveal";
import { OrderDemoCard } from "./components/AgentDemo";
import { StorySlackCard } from "./components/story/StorySlackCard";
import { MintlifyAskMock } from "./components/examples/MintlifyMock";
import { RunwayAdMock } from "./components/examples/RunwayMock";
import { RampSpendMock } from "./components/examples/RampMock";
import { ShopifyRebuildMock } from "./components/examples/ShopifyMock";
import { SquareOrderMock } from "./components/examples/SquareMock";

/* ---------- the core: the agent builds a custom demo ----------
   embeds the standalone animated walkthrough (public/agent-walkthrough.html)
   at its 912x698 design size, scaled to fit the column width. */

function BuildSpeedSection() {
  const [h, setH] = useState(700);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { t?: string; h?: number } | null;
      if (d && d.t === "awh" && typeof d.h === "number") setH(d.h);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  return (
    <section id="build" className="scroll-mt-20 border-t border-line py-12 sm:py-16">
      <h2 className="sr-only">How an agent builds each prospect a custom demo</h2>
      <div className="reveal mx-auto w-full" style={{ maxWidth: 912 }}>
        <iframe
          src="/agent-walkthrough.html"
          title="How driftwood builds each prospect a custom demo"
          loading="lazy"
          scrolling="no"
          style={{ width: "100%", height: h, border: 0, background: "transparent", display: "block" }}
        />
      </div>
    </section>
  );
}

/* ---------- done-for-you: we run the whole channel ----------
   one idea: driftwood operates the outbound and reports back. supporting
   points on the left, the weekly Slack readout as the proof on the right. */

const RUN_POINTS: [string, string][] = [
  ["Every channel", "Inboxes and accounts on email, LinkedIn, and X, warmed and managed."],
  ["Human-reviewed", "A person reads every message before it sends. Nothing goes out off-brand."],
  ["You see what works", "A weekly readout on which demos are getting replies, and what's next."],
];

function RunSection() {
  return (
    <section id="run" className="scroll-mt-20 border-t border-line py-14 sm:py-18">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-14">
        {/* left: the one idea + supporting points */}
        <div className="reveal max-w-xl">
          <h2 className="m-0 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-[1.1] tracking-[-0.015em]">
            We run the whole channel for you.
          </h2>
          <dl className="mt-7 space-y-5">
            {RUN_POINTS.map(([term, def]) => (
              <div key={term} className="flex gap-3.5">
                <span
                  className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-tide-wash"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="size-3 stroke-tide" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <div>
                  <dt className="text-[17px] font-semibold text-ink">{term}</dt>
                  <dd className="m-0 mt-1 text-[16px] leading-relaxed text-ink-soft">{def}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* right: the weekly readout, the one unique proof visual */}
        <div className="reveal">
          <StorySlackCard rows={3} />
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
    <EmailFrame subject="Joe — quick question (Square x Joe's Pizza)">
      <p className="m-0">Hey Joe,</p>
      <p className="m-0 mt-4">
        Huge fan of what you're building at Joe's Pizza — a true NYC institution. Incredible legacy.
      </p>
      <p className="m-0 mt-4">
        I'm with Square, the <strong>all-in-one platform to run and grow your business</strong>. We power
        millions of merchants and are growing <strong>40% year over year</strong> — businesses like yours
        are seeing huge results.
      </p>
      <p className="m-0 mt-4">
        Would love to connect and show you what we offer. Any chance you have 15 minutes this week? You
        can <span className="cursor-pointer text-[#1a0dab] underline">grab time here</span>.
      </p>
    </EmailFrame>
  );
}

function DriftwoodEmail() {
  return (
    <EmailFrame subject="Joe's doesn't take online orders, so we built it" highlight>
      <p className="m-0">Hi Joe,</p>
      <p className="m-0 mt-4">
        We turned your menu into a <strong>live ordering page on Square</strong> this morning, then placed
        a test order to make sure it works. The link is below.
      </p>
      <p className="m-0 mt-4">We already run online ordering for hundreds of local spots like yours.</p>
      <p className="m-0 mt-4">Open to a quick call this week?</p>
      <div className="mt-4 max-w-xs">
        <OrderDemoCard compact />
      </div>
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
        <div className="reveal relative mx-auto mt-16 grid w-full max-w-5xl grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:gap-12">
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
    body: "All 412 products imported, checkout cut from 6 clicks to 2. Live preview below.",
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
    body: "We priced the 63 tools Notion runs against what companies their size pay. Salesforce alone looks 28% over. Benchmark below.",
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
    body: "We built a docs page that answers your most-asked Discord questions. Live below.",
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
    body: "Built from your Instagram assets this morning. Cut below.",
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
    body: "Your full menu, live on a Square ordering page. We placed a test order. Receipt below.",
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

      <div className="reveal mt-8 grid grid-cols-1 items-start gap-5 lg:mt-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-9">
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
            Ship a custom demo in every cold message.
          </h1>
          <p className="mx-auto mt-6 max-w-135 text-[19px] leading-relaxed text-ink-soft sm:text-[20px]">
            Grow your revenue with cold outbound that converts.
          </p>
          <div className="relative mt-8 flex justify-center">
            <BookDemo />
          </div>
        </section>

        {/* the core: an agent builds a custom demo, fast */}
        <BuildSpeedSection />

        {/* done-for-you: we run the whole channel */}
        <RunSection />

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
              We're onboarding a few design partners. Book 30 minutes and we'll build you a sample demo,
              live on the call.
            </p>
            <div className="relative mt-8 flex justify-center">
              <BookDemo />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
