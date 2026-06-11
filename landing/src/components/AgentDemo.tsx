import { useEffect, useRef, useState } from "react";

const EMAIL_BODY =
  "Hi Sarah,\n\nOur QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay charges the card twice. Here's the 47-second recording:";

const EMAIL_CLOSING =
  "We already work with Y Combinator's engineering team to catch bugs before they ship, and our customers save an average of 10 hours a week on QA.\n\nOpen to a quick call this week?";

const LOG_LINES = [
  "crawling acme.com \u00b7 14 pages",
  "testing checkout with Autosana's QA agent",
  "bug found: double-clicking Pay charges twice",
  "recording bug video \u00b7 0:47",
];

type Stage = "build" | "send" | "reply";

type Frame = {
  stage: Stage;
  exiting: boolean;
  logs: number;
  thumb: boolean;
  typed: number;
  card: boolean;
  closing: boolean;
  sent: boolean;
  toast: boolean;
};

const INITIAL: Frame = {
  stage: "build",
  exiting: false,
  logs: 0,
  thumb: false,
  typed: 0,
  card: false,
  closing: false,
  sent: false,
  toast: false,
};

const DONE: Frame = {
  stage: "reply",
  exiting: false,
  logs: LOG_LINES.length,
  thumb: true,
  typed: EMAIL_BODY.length,
  card: true,
  closing: true,
  sent: true,
  toast: true,
};

/* The artifact: a recorded bug repro on the prospect's own checkout. */
export function BugDemoCard({ compact }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* mini browser */}
      <div className={`relative bg-[#eef0f3] ${compact ? "p-2.5 pb-0" : "p-3 pb-0"}`}>
        <div className="overflow-hidden rounded-t-lg border border-b-0 border-[#d8dce2] bg-white shadow-sm">
          {/* chrome */}
          <div className="flex items-center gap-1.5 border-b border-[#e8eaee] bg-[#f6f7f9] px-2.5 py-1.5">
            <span className="size-1.5 rounded-full bg-[#d9dde3]" />
            <span className="size-1.5 rounded-full bg-[#d9dde3]" />
            <span className="size-1.5 rounded-full bg-[#d9dde3]" />
            <span className="ml-1.5 rounded bg-white px-2 py-0.5 font-mono text-[9.5px] text-[#7a8190] ring-1 ring-[#e8eaee]">
              acme.com/checkout
            </span>
          </div>
          {/* checkout result */}
          <div className={`space-y-1.5 px-3 ${compact ? "py-2" : "py-2.5"}`}>
            <div className="flex items-center justify-between">
              <div className="h-1.5 w-16 rounded-full bg-[#dfe3e9]" />
              <span className="relative rounded-md bg-[#16181d] px-2.5 py-1 text-[9px] font-semibold text-white">
                Pay $84
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#d4574a] px-1 py-px font-mono text-[8px] font-bold leading-none text-white">
                  &times;2
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#f1f3f6] px-2 py-1.5 ring-1 ring-[#e6e9ee]">
              <span className="font-mono text-[9px] font-medium text-[#3c424e]">Visa &middot;&middot;&middot;&middot;4242</span>
              <span className="font-mono text-[9px] text-[#7a8190]">$84.00 &middot; 4:02 PM</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#fff5f4] px-2 py-1.5 ring-[1.5px] ring-[#d4574a]">
              <span className="flex items-center gap-1.5 font-mono text-[9px] font-medium text-[#3c424e]">
                Visa &middot;&middot;&middot;&middot;4242
                <span className="rounded-full bg-[#d4574a] px-1.5 py-px text-[8px] font-bold text-white">duplicate</span>
              </span>
              <span className="font-mono text-[9px] font-semibold text-[#d4574a]">$84.00 &middot; 4:02 PM</span>
            </div>
          </div>
        </div>
        {/* rec badge */}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 py-0.5 pl-1.5 pr-2 font-mono text-[9.5px] font-medium text-white">
          <span className="size-1.5 rounded-full bg-[#e2574a]" />
          REC 0:47
        </span>
      </div>
      {/* meta */}
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tide">
            <svg viewBox="0 0 24 24" className="ml-px size-2.5 fill-white">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="m-0 truncate text-[12.5px] font-semibold leading-tight text-ink">acme.com checkout, bug recording</p>
            <p className="m-0 truncate text-[10.5px] leading-tight text-ink-faint">recorded by Autosana's QA agent</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[9.5px] font-medium text-tide">0:47</span>
      </div>
    </div>
  );
}

export default function AgentDemo() {
  const [f, setF] = useState<Frame>(INITIAL);
  const timers = useRef<number[]>([]);
  const jumpRef = useRef<(stage: Stage) => void>(() => {});

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;

    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const at = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(() => !cancelled && fn(), ms));
    };

    /* schedules the send + reply beats; `offset` is when the compose window appears */
    const scheduleSend = (offset: number) => {
      const typeStart = offset + 620;
      const typeDur = 2200;
      const steps = 40;
      for (let i = 1; i <= steps; i += 1) {
        at(typeStart + (typeDur / steps) * i, () =>
          setF((p) => ({ ...p, typed: Math.round((EMAIL_BODY.length / steps) * i) })),
        );
      }
      at(offset + 3270, () => setF((p) => ({ ...p, card: true })));
      at(offset + 3900, () => setF((p) => ({ ...p, closing: true })));
      at(offset + 4520, () => setF((p) => ({ ...p, sent: true })));
      at(offset + 5620, () => setF((p) => ({ ...p, stage: "reply", toast: true })));
      at(offset + 9520, () => setF((p) => ({ ...p, exiting: true })));
      at(offset + 10120, () => run("build"));
    };

    const run = (from: Stage) => {
      if (cancelled) return;
      clearAll();

      if (reduced) {
        /* static frames only; dots switch between finished states */
        setF(
          from === "build"
            ? { ...INITIAL, logs: LOG_LINES.length, thumb: true }
            : from === "send"
              ? { ...DONE, stage: "send", toast: false }
              : DONE,
        );
        return;
      }

      if (from === "build") {
        setF(INITIAL);
        at(450, () => setF((p) => ({ ...p, logs: 1 })));
        at(1150, () => setF((p) => ({ ...p, logs: 2 })));
        at(1900, () => setF((p) => ({ ...p, logs: 3 })));
        at(2600, () => setF((p) => ({ ...p, logs: 4 })));
        at(3250, () => setF((p) => ({ ...p, thumb: true })));
        at(5300, () => setF((p) => ({ ...p, exiting: true })));
        at(5780, () => setF((p) => ({ ...p, stage: "send", exiting: false })));
        scheduleSend(5780);
      } else if (from === "send") {
        setF({ ...INITIAL, logs: LOG_LINES.length, thumb: true, stage: "send" });
        scheduleSend(0);
      } else {
        setF({ ...DONE, toast: false });
        at(450, () => setF((p) => ({ ...p, toast: true })));
        at(4350, () => setF((p) => ({ ...p, exiting: true })));
        at(4950, () => run("build"));
      }
    };

    jumpRef.current = run;
    run("build");
    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-152">
      {/* stage — both cards stay mounted in one grid cell so the stage sizes to the tallest */}
      <div className="grid" aria-hidden="true">
        {/* BUILD */}
        <div
          className={`col-start-1 row-start-1 ${
            f.stage === "build" ? (f.exiting ? "stage-exit" : "stage-enter") : "invisible"
          }`}
        >
            <div className="flex h-full flex-col rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-wide text-ink-soft">
                  <span className="pulse-dot size-1.5 rounded-full bg-tide" />
                  AUTOSANA &times; driftwood
                </span>
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                  prospect: Sarah Chen &middot; Acme
                </span>
              </div>
              <div className="space-y-2.5 px-5 pb-2 pt-4 font-mono text-[12.5px] text-ink-soft">
                {LOG_LINES.slice(0, f.logs).map((line, i) => (
                  <p key={line} className="log-line m-0 flex items-center gap-2.5" style={{ animationDelay: `${i * 0.04}s` }}>
                    <svg
                      viewBox="0 0 24 24"
                      className={`size-3.5 shrink-0 ${i === 2 ? "stroke-[#d4574a]" : "stroke-tide"}`}
                      fill="none"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {i === 2 ? <path d="M12 4.5v10M12 19v.5" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
                    </svg>
                    <span className={i === 2 ? "text-ink" : undefined}>{line}</span>
                  </p>
                ))}
              </div>
              <div className="mt-auto px-5 pb-5 pt-2">
                <div className={f.thumb ? "materialize" : "invisible"}>
                  <BugDemoCard />
                </div>
              </div>
            </div>
          </div>

        {/* SEND + REPLY */}
        <div
          className={`relative col-start-1 row-start-1 ${
            f.stage !== "build" ? (f.exiting ? "stage-exit" : "stage-enter") : "invisible"
          }`}
        >
            <div className="rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(13,60,91,0.35),0_4px_16px_-8px_rgba(22,24,29,0.08)]">
              {/* title bar */}
              <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                <span className="size-2.5 rounded-full bg-[#e8b4a8]" />
                <span className="size-2.5 rounded-full bg-[#e6d3a3]" />
                <span className="size-2.5 rounded-full bg-[#b5cfae]" />
                <span className="ml-2 font-mono text-[11px] text-ink-faint">New message</span>
                <span
                  className={`ml-auto rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-medium transition-colors duration-500 ${
                    f.sent ? "bg-tide-wash text-tide" : "bg-paper text-ink-faint"
                  }`}
                >
                  {f.sent ? "Sent" : "Draft"}
                </span>
              </div>

              {/* headers */}
              <div className="space-y-1.5 border-b border-line px-5 py-2.5 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className="w-13 shrink-0 text-ink-faint">To</span>
                  <span className="rounded-full bg-paper px-2 py-0.5 font-medium text-ink-soft">sarah@acme.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-13 shrink-0 text-ink-faint">Subject</span>
                  <span className="font-medium text-ink">found a bug in Acme's checkout</span>
                </div>
              </div>

              {/* body */}
              <div className="px-5 py-3.5 text-[13.5px] leading-relaxed text-ink-soft">
                {/* full text sits invisibly underneath so the card height never changes while typing */}
                <p className="relative m-0 whitespace-pre-wrap">
                  <span className="invisible">{EMAIL_BODY}</span>
                  <span className={`absolute inset-0 ${f.typed < EMAIL_BODY.length ? "caret" : ""}`}>
                    {EMAIL_BODY.slice(0, f.typed)}
                  </span>
                </p>
                <div className={`mt-2 ${f.card ? "pop-in" : "invisible"}`}>
                  <BugDemoCard compact />
                </div>
                {/* space stays reserved via `invisible` so the card height never changes */}
                <p className={`m-0 mt-2.5 whitespace-pre-wrap ${f.closing ? "pop-in" : "invisible"}`}>{EMAIL_CLOSING}</p>
              </div>

              {/* footer */}
              <div className="flex items-center justify-between border-t border-line px-5 py-3">
                <span className="font-mono text-[10.5px] text-ink-faint">recording attached by driftwood</span>
                <span
                  className={`rounded-lg px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors duration-300 ${
                    f.sent ? "send-fill bg-tide-deep" : "bg-tide"
                  }`}
                >
                  {f.sent ? "Sent" : "Send"}
                </span>
              </div>
            </div>

            {/* reply toast */}
            <div className={`mt-3 sm:absolute sm:-bottom-6 sm:-right-5 sm:mt-0 sm:w-72 ${f.toast ? "toast-in" : "invisible"}`}>
              <div className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-[0_18px_44px_-18px_rgba(22,24,29,0.3)]">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide-wash text-[11.5px] font-bold text-tide">
                  SC
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[12px] font-semibold text-ink">
                    Sarah Chen <span className="font-normal text-ink-faint">&middot; replied 2h later</span>
                  </p>
                  <p className="m-0 mt-0.5 truncate text-[12px] text-ink-soft">ok this is wild. got time Thursday?</p>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* stage navigation */}
      <div className="mt-12 flex justify-center">
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-[0_2px_10px_-4px_rgba(22,24,29,0.12)]">
          {(["build", "send", "reply"] as const).map((stage) => (
            <button
              key={stage}
              type="button"
              aria-label={`Jump to ${stage} step`}
              onClick={() => jumpRef.current(stage)}
              className={`flex cursor-pointer items-center gap-2 rounded-full border-0 px-4 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300 ${
                f.stage === stage ? "bg-tide text-white" : "bg-transparent text-ink-faint hover:text-ink"
              }`}
            >
              <span className={`size-1.5 rounded-full ${f.stage === stage ? "bg-white/80" : "bg-line"}`} />
              {stage}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
