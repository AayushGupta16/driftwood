import { useEffect, useRef, useState, type ReactNode } from "react";
import AgentDemo, { BugDemoCard } from "./components/AgentDemo";
import WaitlistForm from "./components/WaitlistForm";
import { Nav, Footer, useReveal } from "./components/Chrome";

const STEPS = [
  {
    title: "Source",
    body: "Lead lists built from your ICP and live intent signals, then re-cut based on who actually replies.",
    art: SourceArt,
  },
  {
    title: "Personalize",
    body: "A demo artifact for every prospect, made from their own data and checked before it ships.",
    art: PersonalizeArt,
  },
  {
    title: "Deliver",
    body: "Domains, inboxes, warming, send windows. We watch deliverability daily so reply rates don't quietly die.",
    art: DeliverArt,
  },
  {
    title: "Iterate",
    body: "Opens, clicks, and replies feed back into targeting, copy, and timing. Whatever wins gets the volume.",
    art: IterateArt,
  },
];

const WORKING = [
  {
    title: "A 15-minute call to start",
    body: "Tell us what you sell and who buys it. We handle the rest: domains, inboxes, leads, the first campaign.",
  },
  {
    title: "We test, then ramp",
    body: "Angles, subject lines, and segments run head to head. Whatever gets replies gets the budget.",
  },
  {
    title: "A human reviews every send",
    body: "Nothing reaches a prospect on autopilot. We check every email and demo before it goes out.",
  },
];

function HowHeading() {
  return (
    <>
      <p className="m-0 font-mono text-[12px] font-medium tracking-[0.02em] text-tide">What we handle</p>
      <h2 className="mb-0 mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
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
        <span className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.02em] text-ink-soft">
          <span className="pulse-dot size-1.5 rounded-full bg-tide" />
          {label}
        </span>
        <span className="rounded-full bg-sand px-2.5 py-0.5 font-mono text-[10.5px] text-ink-soft">{meta}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </div>
  );
}

/* Source — a lead list scored by live intent signals */
function SourceArt() {
  const rows = [
    { initials: "MP", name: "Maya Patel", company: "Northwind", tags: [{ text: "hiring SDRs", tone: "signal" }] },
    {
      initials: "SC",
      name: "Sarah Chen",
      company: "Acme",
      tags: [
        { text: "raised Series A", tone: "signal" },
        { text: "qualified", tone: "qualified" },
      ],
      hot: true,
    },
    { initials: "TO", name: "Tom Okafor", company: "Brightline", tags: [{ text: "hiring SDRs", tone: "signal" }] },
    { initials: "JR", name: "Jess Romero", company: "Cobalt", tags: [{ text: "no signal", tone: "none" }], dim: true },
    { initials: "DW", name: "Dan Walsh", company: "Hearth", tags: [{ text: "switched CRMs", tone: "signal" }] },
  ];
  return (
    <VignetteFrame label="lead sourcing" meta="2,140 accounts scanned">
      <div className="flex flex-1 flex-col justify-center gap-2">
        {rows.map((row) => (
          <div
            key={row.name}
            className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 ${
              row.hot ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-paper/70"
            } ${row.dim ? "opacity-50" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-sand font-mono text-[9px] font-semibold text-ink-soft">
                {row.initials}
              </span>
              <span className="truncate text-[12.5px] font-medium text-ink">
                {row.name} <span className="font-normal text-ink-faint">&middot; {row.company}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {row.tags.map((tag) => (
                <span
                  key={tag.text}
                  className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] font-medium ${
                    tag.tone === "qualified"
                      ? "bg-tide text-white"
                      : tag.tone === "signal"
                        ? "bg-tide-wash text-tide"
                        : "bg-surface text-ink-faint ring-1 ring-line"
                  }`}
                >
                  {tag.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <p className="mb-0 mt-4 text-center font-mono text-[10.5px] text-ink-faint">re-cut weekly from who actually replies</p>
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
      <p className="mb-0 mt-4 text-center font-mono text-[10.5px] text-ink-faint">one artifact per prospect, never reused</p>
    </VignetteFrame>
  );
}

/* Deliver — domains warming, send windows, inbox placement */
function DeliverArt() {
  const domains = [
    { host: "mail.acmedemos.com", width: "88%", label: "warm · day 24" },
    { host: "try-acmedemos.co", width: "54%", label: "warming · day 9" },
  ];
  const hours = [3, 4, 6, 9, 13, 16, 14, 10, 7, 5, 4, 3];
  return (
    <VignetteFrame label="deliverability" meta="checked daily">
      <div className="flex flex-1 flex-col justify-center gap-7">
        <div className="space-y-4">
          {domains.map((d) => (
            <div key={d.host}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[11px] font-medium text-ink">{d.host}</span>
                <span className="font-mono text-[10px] text-ink-faint">{d.label}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/50">
                <div className="h-full rounded-full bg-tide" style={{ width: d.width }} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[10px] tracking-[0.02em] text-ink-faint">send window</span>
            <span className="font-mono text-[10px] text-ink-faint">Tue&ndash;Thu &middot; 8:40&ndash;11:10 am local</span>
          </div>
          <div className="mt-2 flex h-9 items-end gap-1">
            {hours.map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-t-sm ${i >= 3 && i <= 6 ? "bg-tide" : "bg-line"}`}
                style={{ height: `${h * 6}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="m-0 font-mono text-[10px] tracking-[0.02em] text-ink-faint">inbox placement</p>
          <p className="m-0 mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ink">
            98.6%
            <span className="ml-2.5 rounded-full bg-tide-wash px-2 py-0.5 align-middle font-mono text-[10px] font-medium text-tide">
              &#8599; 30 days
            </span>
          </p>
        </div>
        <svg viewBox="0 0 120 36" className="h-9 w-30 shrink-0 overflow-visible" fill="none" aria-hidden="true">
          <path
            d="M2 30 C 20 28 28 24 42 24 C 58 24 64 18 78 16 C 92 14 100 9 118 6"
            stroke="var(--color-tide)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="118" cy="6" r="3" fill="var(--color-tide)" />
        </svg>
      </div>
    </VignetteFrame>
  );
}

/* Iterate — which angles and templates are actually working */
function IterateArt() {
  const angles = [
    {
      subject: "“found a bug on your checkout”",
      opens: "61% open",
      replies: "4.9% reply",
      width: "82%",
      tone: "win",
      tag: "gets the budget",
    },
    {
      subject: "“what manual QA costs you”",
      opens: "47% open",
      replies: "2.6% reply",
      width: "44%",
      tone: "mid",
      tag: undefined,
    },
    {
      subject: "“quick question about QA”",
      opens: "31% open",
      replies: "1.1% reply",
      width: "18%",
      tone: "cut",
      tag: "cut this week",
    },
  ] as const;
  return (
    <VignetteFrame label="angle testing" meta="re-ranked weekly">
      <div className="flex flex-1 flex-col justify-center gap-3">
        {angles.map((a, i) => (
          <div
            key={a.subject}
            className={`rounded-xl px-3.5 py-3 ${
              a.tone === "win" ? "bg-tide-wash/70 ring-1 ring-tide/35" : "bg-paper/70"
            } ${a.tone === "cut" ? "opacity-55" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2.5">
                <span className="shrink-0 font-mono text-[10px] text-ink-faint">0{i + 1}</span>
                <span
                  className={`truncate font-mono text-[11.5px] ${
                    a.tone === "win" ? "font-medium text-ink" : "text-ink-soft"
                  }`}
                >
                  {a.subject}
                </span>
              </span>
              {a.tag && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-medium ${
                    a.tone === "win" ? "bg-tide text-white" : "bg-surface text-ink-faint ring-1 ring-line"
                  }`}
                >
                  {a.tag}
                </span>
              )}
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50">
                <div
                  className={`h-full rounded-full ${a.tone === "win" ? "bg-tide" : "bg-ink-faint/50"}`}
                  style={{ width: a.width }}
                />
              </div>
              <span
                className={`shrink-0 font-mono text-[10px] ${
                  a.tone === "win" ? "font-medium text-tide" : "text-ink-faint"
                }`}
              >
                {a.opens} &rarr; {a.replies}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mb-0 mt-4 text-center font-mono text-[10.5px] text-ink-faint">
        the loser rotates out &middot; a new angle takes its slot
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
                      i === active ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                      <h3 className="m-0 text-[19px] font-semibold tracking-[-0.01em]">{step.title}</h3>
                      <span className="font-mono text-[11px] text-ink-faint">0{i + 1}</span>
                    </div>
                    <p className="mb-0 mt-2 max-w-105 text-[14.5px] leading-relaxed text-ink-soft">{step.body}</p>
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
      <div className="py-20 sm:py-26 lg:motion-safe:hidden">
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
              <h3 className="m-0 text-[18px] font-semibold">{step.title}</h3>
              <p className="mb-0 mt-2 max-w-110 text-[14.5px] leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
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
        <section className="relative isolate grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:gap-12 lg:py-24">
          <HeroContours />
          <div>
            <h1 className="m-0 max-w-130 text-[clamp(2.1rem,5.2vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.02em]">
              Ship every cold email with a custom demo.
            </h1>
            <p className="mt-5 max-w-110 text-[16.5px] leading-relaxed text-ink-soft">
              We run your whole cold email channel and build each prospect a demo of your product, so more sends
              convert into meetings.
            </p>
            <div className="relative mt-8">
              <WaitlistForm id="email-hero" />
            </div>
            <p className="mt-3.5 font-mono text-[11.5px] text-ink-faint">Now onboarding a small group of design partners.</p>
          </div>
          <AgentDemo />
        </section>

        {/* what we send */}
        <section id="wedge" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
          <div className="reveal max-w-150">
            <h2 className="m-0 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
              Don't send slop.
            </h2>
          </div>

          <div className="reveal wedge-reveal mt-12 grid gap-6 lg:grid-cols-2">
            {/* generic email */}
            <div className="wedge-usual flex flex-col">
              <p className="mb-3 ml-1 font-mono text-[11.5px] tracking-[0.02em] text-ink-faint">The usual</p>
              <div className="flex flex-1 flex-col rounded-2xl border border-line bg-surface/60 p-5">
                <div className="space-y-1.5 border-b border-line pb-3 text-[12.5px]">
                  <p className="m-0 text-ink-faint">
                    Subject: <span className="text-ink-soft">Sarah — quick question (Acme x Skylith AI)</span>
                  </p>
                </div>
                <div className="mb-0 mt-4 space-y-5 text-[13.5px] leading-relaxed text-ink-faint">
                  <p>Hey Sarah,</p>
                  <p>
                    Huge fan of what you're building at Acme — saw you just crossed 200 employees. Incredible
                    momentum.
                  </p>
                  <p>
                    I'm the founder of Skylith, an AI-powered platform that automates workflows end-to-end. We
                    just closed our seed round and are growing 40% month over month — teams like yours are
                    seeing huge results.
                  </p>
                  <p>
                    Would love to connect and show you what we're building. Any chance you have 15 minutes this
                    week?
                  </p>
                  <p>Best,</p>
                </div>
                <span className="mt-auto self-start pt-4">
                  <span className="inline-block rounded-full bg-paper px-2.5 py-1 font-mono text-[10.5px] text-ink-faint">
                    read in 4 seconds, archived
                  </span>
                </span>
              </div>
            </div>

            {/* driftwood email */}
            <div className="wedge-drift flex flex-col">
              <p className="mb-3 ml-1 font-mono text-[11.5px] tracking-[0.02em] text-tide">A driftwood send</p>
              <div className="wedge-drift-card flex flex-1 flex-col rounded-2xl border border-tide/30 bg-surface p-5 shadow-[0_20px_50px_-28px_rgba(13,60,91,0.4)]">
                <div className="space-y-1.5 border-b border-line pb-3 text-[12.5px]">
                  <p className="m-0 text-ink-faint">
                    Subject: <span className="font-medium text-ink">found a bug in Acme's checkout</span>
                  </p>
                </div>
                <div className="mb-3 mt-4 space-y-5 text-[13.5px] leading-relaxed text-ink-soft">
                  <p>Hi Sarah,</p>
                  <p>
                    Our QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay
                    charges the card twice. Here's the 47-second recording:
                  </p>
                </div>
                <BugDemoCard compact />
                <div className="mb-0 mt-4 space-y-5 text-[13.5px] leading-relaxed text-ink-soft">
                  <p>
                    We already work with Y Combinator's engineering team to catch bugs before they ship, and
                    our customers save an average of 10 hours a week on QA.
                  </p>
                  <p>Open to a quick call this week?</p>
                </div>
                <span className="mt-auto self-start pt-4">
                  <span className="wedge-reply inline-block rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[10.5px] font-medium text-tide">
                    "ok this is wild. got time Thursday?"
                  </span>
                </span>
              </div>
            </div>
          </div>

        </section>

        {/* what we handle */}
        <HowSection />

        {/* working with us */}
        <section id="working" className="border-t border-line py-20 sm:py-26">
          <div className="reveal max-w-150">
            <p className="m-0 font-mono text-[12px] font-medium tracking-[0.02em] text-tide">Working with us</p>
            <h2 className="mb-0 mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
              You talk to founders, not agents.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {WORKING.map((item, i) => (
              <div
                key={item.title}
                className="reveal rounded-2xl border border-line bg-surface/60 p-6"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <h3 className="m-0 text-[16.5px] font-semibold">{item.title}</h3>
                <p className="mb-0 mt-2.5 text-[14px] leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* final cta */}
        <section id="join" className="scroll-mt-20 border-t border-line py-20 sm:py-26">
          <div className="reveal mx-auto max-w-150 text-center">
            <h2 className="m-0 text-[clamp(1.8rem,4.2vw,2.8rem)] font-semibold leading-tight tracking-[-0.015em]">
              See what we'd send your prospects.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
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
