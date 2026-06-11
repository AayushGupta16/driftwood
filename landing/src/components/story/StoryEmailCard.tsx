/* beat 3 — the full sent email (the drafted one the founder liked), with
   Sarah's reply animating in beneath it as the scroll progresses */

/* local replica of SquareVideoThumb's `small` rendering: at thumbnail size only
   REC, the play button, and the duration survive — like inline video in Gmail */
function SmallVideoThumb() {
  return (
    <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-[#16181d] sm:w-24">
      <span className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-black/60 py-0.5 pl-1.5 pr-2 font-mono text-[10.5px] font-medium text-white">
        <span className="size-1.5 rounded-full bg-[#e2574a]" />
        REC
      </span>
      <span className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)]">
        <svg viewBox="0 0 24 24" className="ml-0.5 size-3 fill-[#16181d]" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-5 font-mono text-[10.5px] text-white/85">
        0:47
      </span>
    </div>
  );
}

export function StoryEmailCard({ on, replied }: { on: boolean; replied: boolean }) {
  const block = (i: number) => (on ? { animationDelay: `${0.08 + i * 0.12}s` } : undefined);
  const blockClass = on ? "block-in" : "invisible";
  return (
    <div className="flex w-full max-w-135 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_24px_60px_-26px_rgba(13,60,91,0.42),0_4px_16px_-8px_rgba(22,24,29,0.1)] lg:min-h-110">
      {/* thread header: the subject is the pitch, plus the human review gate */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-5 py-3">
        <p className="m-0 min-w-0 text-[16.5px] font-semibold leading-snug text-ink">
          found a bug in Acme's checkout
        </p>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[13px] text-ink-soft">
          <svg
            viewBox="0 0 24 24"
            className="size-3.5 shrink-0 stroke-tide"
            fill="none"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          reviewed by a human &middot; 8:51 AM
        </span>
      </div>

      {/* the email itself, in full */}
      <div className="px-5 py-4">
        {/* sender row */}
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide font-mono text-[12px] font-semibold text-white">
            A
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[15px] font-semibold text-ink">Autosana</p>
            <p className="m-0 font-mono text-[13px] text-ink-faint">to sarah@acme.com &middot; 9:02 AM</p>
          </div>
        </div>
        {/* body — blocks fade in with the beat; `invisible` keeps the height reserved */}
        <div className="mt-3 text-[15px] leading-[1.55] text-ink-soft">
          <p className={`m-0 ${blockClass}`} style={block(0)}>
            Hi Sarah,
          </p>
          <p className={`m-0 mt-2.5 ${blockClass}`} style={block(0)}>
            Our QA agent ran Acme's checkout this morning and caught a real bug: double-clicking Pay charges the
            card twice. The 47-second recording is below.
          </p>
          <p className={`m-0 mt-2.5 ${blockClass}`} style={block(1)}>
            We already work with Y Combinator's engineering team to catch bugs before they ship.
          </p>
          <p className={`m-0 mt-2.5 ${blockClass}`} style={block(2)}>
            Open to a quick call this week?
          </p>
          <div className={`mt-3 ${on ? "pop-in" : "invisible"}`} style={block(3)}>
            <SmallVideoThumb />
          </div>
        </div>
      </div>

      {/* her reply — `invisible` before the beat lands, so the card never jumps */}
      <div
        className={`border-t border-line px-5 py-4 ${replied ? "block-in" : "invisible"}`}
        style={replied ? { animationDelay: "0.15s" } : undefined}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide-wash font-mono text-[12px] font-bold text-tide">
            SC
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <p className="m-0 text-[15px] font-semibold text-ink">Sarah Chen</p>
              <span className="font-mono text-[13px] text-ink-faint">sarah@acme.com &middot; 11:08 AM</span>
              <span className="ml-auto rounded-full bg-tide-wash px-2.5 py-0.5 font-mono text-[13px] font-medium text-tide">
                2h later
              </span>
            </div>
            <p className="m-0 mt-2 text-[16px] leading-relaxed text-ink">ok this is wild. got time Thursday?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
