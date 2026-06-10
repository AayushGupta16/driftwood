import { useEffect, useRef, useState } from "react";
import AgentDemo, { BugDemoCard } from "./components/AgentDemo";
import WaitlistForm from "./components/WaitlistForm";
import { Nav, Footer, useReveal } from "./components/Chrome";
import { IconRadar, IconSwell, IconDemo, IconLoop } from "./components/Icons";

const STEPS = [
  {
    icon: IconRadar,
    title: "Source",
    body: "Lead lists built from your ICP and live intent signals, then re-cut based on who actually replies.",
  },
  {
    icon: IconDemo,
    title: "Personalize",
    body: "A demo artifact for every prospect, made from their own data and checked before it ships.",
    highlight: true,
  },
  {
    icon: IconSwell,
    title: "Deliver",
    body: "Domains, inboxes, warming, send windows. We watch deliverability daily so reply rates don't quietly die.",
  },
  {
    icon: IconLoop,
    title: "Iterate",
    body: "Opens, clicks, and replies feed back into targeting, copy, and timing. Sequences branch on behavior, not timers.",
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
      <p className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-tide">What we handle</p>
      <h2 className="mb-0 mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
        You take the meetings. We run everything else.
      </h2>
    </>
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
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="grid w-full grid-cols-[0.85fr_1.15fr] items-center gap-20">
            <div>
              <HowHeading />
              <div className="mt-10 flex items-center gap-2">
                {STEPS.map((step, i) => (
                  <button
                    key={step.title}
                    type="button"
                    aria-label={`Go to ${step.title}`}
                    onClick={() => jumpTo(i)}
                    className={`h-1.5 cursor-pointer rounded-full border-0 p-0 transition-all duration-500 ${
                      i === active ? "w-10 bg-tide" : "w-2.5 bg-line hover:bg-ink-faint"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative h-80">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-out ${
                    i === active
                      ? "translate-y-0 opacity-100"
                      : i < active
                        ? "pointer-events-none -translate-y-8 opacity-0"
                        : "pointer-events-none translate-y-8 opacity-0"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-4 right-0 select-none font-mono text-[170px] font-semibold leading-none text-ink/[0.045]"
                  >
                    0{i + 1}
                  </span>
                  <span className="flex size-13 items-center justify-center rounded-2xl bg-tide shadow-[0_14px_30px_-14px_rgba(13,60,91,0.65)]">
                    <step.icon className="size-6.5 text-white" />
                  </span>
                  <div className="mt-7 flex flex-wrap items-baseline gap-x-3.5 gap-y-2">
                    <h3 className="m-0 text-[30px] font-semibold tracking-[-0.01em]">{step.title}</h3>
                    <span className="font-mono text-[12px] text-ink-faint">0{i + 1} / 04</span>
                    {step.highlight && (
                      <span className="rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[11px] font-medium text-tide">
                        why prospects reply
                      </span>
                    )}
                  </div>
                  <p className="mb-0 mt-3.5 max-w-120 text-[16.5px] leading-relaxed text-ink-soft">{step.body}</p>
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
              <span className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-tide/40 bg-tide-wash">
                <step.icon className="size-5 text-tide" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <h3 className="m-0 text-[18px] font-semibold">{step.title}</h3>
                <span className="font-mono text-[11px] text-ink-faint">0{i + 1}</span>
                {step.highlight && (
                  <span className="rounded-full bg-tide-wash px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-tide">
                    why prospects reply
                  </span>
                )}
              </div>
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
              Every cold email ships with a custom demo.
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

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* generic email */}
            <div className="reveal flex flex-col">
              <p className="mb-3 ml-1 font-mono text-[11.5px] uppercase tracking-[0.14em] text-ink-faint">The usual</p>
              <div className="flex flex-1 flex-col rounded-2xl border border-line bg-surface/60 p-5">
                <div className="space-y-1.5 border-b border-line pb-3 text-[12.5px]">
                  <p className="m-0 text-ink-faint">
                    Subject: <span className="text-ink-soft">Sarah, AI startup asked me to reach out</span>
                  </p>
                </div>
                <div className="mb-0 mt-4 space-y-5 text-[13.5px] leading-relaxed text-ink-faint">
                  <p>Hey Sarah,</p>
                  <p>
                    Saw Acme just crossed 200 employees while keeping NPS above 60. That's the kind of growth that
                    gets noticed.
                  </p>
                  <p>
                    I'm working with an AI-powered platform that helps companies like Acme streamline their
                    workflows - they're growing incredibly fast and I thought you might be interested.
                  </p>
                  <p>
                    Do you want me to set up a quick intro call? Happy to share more details or other options if
                    this one isn't a fit.
                  </p>
                  <p>Cheers,</p>
                </div>
                <span className="mt-auto self-start pt-4">
                  <span className="inline-block rounded-full bg-paper px-2.5 py-1 font-mono text-[10.5px] text-ink-faint">
                    read in 4 seconds, archived
                  </span>
                </span>
              </div>
            </div>

            {/* driftwood email */}
            <div className="reveal flex flex-col" style={{ transitionDelay: "0.12s" }}>
              <p className="mb-3 ml-1 font-mono text-[11.5px] uppercase tracking-[0.14em] text-tide">A driftwood send</p>
              <div className="flex flex-1 flex-col rounded-2xl border border-tide/30 bg-surface p-5 shadow-[0_20px_50px_-28px_rgba(13,60,91,0.4)]">
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
                    It flagged two more in your signup flow. Y Combinator's engineering team runs Autosana on
                    their releases, and Lucra cut most of their regression work with it.
                  </p>
                  <p>Worth 15 minutes Thursday to walk through all three?</p>
                </div>
                <span className="mt-auto self-start pt-4">
                  <span className="inline-block rounded-full bg-tide-wash px-2.5 py-1 font-mono text-[10.5px] font-medium text-tide">
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
            <p className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-tide">Working with us</p>
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
