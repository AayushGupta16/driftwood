import { Anno } from "./Anno";

/* Runway → Liquid Death: a finished custom ad, built from their own assets */

/* tiny abstract storyboard art for the filmstrip */
function FrameArt({ kind }: { kind: "drop" | "splash" | "tagline" | "endcard" }) {
  if (kind === "drop") {
    return (
      <div className="relative h-full w-full bg-[radial-gradient(circle_at_50%_20%,rgba(226,236,243,0.18),transparent_60%)]">
        <span className="absolute left-1/2 top-1 h-3 w-px -translate-x-3 bg-white/30" />
        <span className="absolute left-1/2 top-0.5 h-4 w-px translate-x-2 bg-white/20" />
        <span className="absolute left-1/2 top-[38%] h-[44%] w-[18%] -translate-x-1/2 rotate-3 rounded-[3px] bg-[linear-gradient(90deg,#7c828d,#dfe3e8_45%,#666d79)]" />
      </div>
    );
  }
  if (kind === "splash") {
    return (
      <svg viewBox="0 0 60 44" className="h-full w-full" aria-hidden="true">
        <path d="M8 36 Q 18 12 30 10" fill="none" stroke="#dbe9f2" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 34 Q 44 14 31 11" fill="none" stroke="#dbe9f2" strokeOpacity="0.4" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="14" cy="12" r="1.6" fill="#fff" fillOpacity="0.7" />
        <circle cx="46" cy="9" r="1.3" fill="#fff" fillOpacity="0.55" />
        <circle cx="30" cy="30" r="2" fill="#dbe9f2" fillOpacity="0.5" />
      </svg>
    );
  }
  if (kind === "tagline") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[radial-gradient(circle_at_50%_55%,rgba(226,236,243,0.16),transparent_65%)]">
        <span className="h-1 w-[62%] rounded-full bg-white/85" />
        <span className="h-1 w-[38%] rounded-full bg-white/55" />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="rounded-sm border border-white/55 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.12em] text-white/75">
        LD
      </span>
    </div>
  );
}

export function RunwayAdMock() {
  const frames = [
    { t: "0:00", label: "can drop", kind: "drop" as const, active: false },
    { t: "0:05", label: "splash", kind: "splash" as const, active: false },
    { t: "0:09", label: "tagline", kind: "tagline" as const, active: true },
    { t: "0:12", label: "end card", kind: "endcard" as const, active: false },
  ];
  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <Anno text="images sourced from their instagram" pos="-top-3 right-8 rotate-1" />
      <div className="flex flex-col gap-3 rounded-xl bg-[#16181d] p-4 sm:p-5">
        {/* player title row */}
        <div className="flex items-center justify-between gap-3 font-mono text-[13px] text-white/70">
          <span className="truncate">liquid_death_15s_v1.mp4 &middot; made with runway</span>
          <span className="shrink-0">1080 &times; 1080</span>
        </div>

        {/* the paused frame — square ad pillarboxed in a wide player */}
        <div className="relative h-52 w-full overflow-hidden rounded-lg bg-black sm:h-60">
          <div className="absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2 overflow-hidden bg-[linear-gradient(168deg,#262a32,#0c0e12_70%)]">
            {/* dramatic radial lighting + vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(226,236,243,0.3),transparent_58%)]" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_52%,rgba(0,0,0,0.6))]" aria-hidden="true" />

            {/* splash arcs, droplets, speed streaks */}
            <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <path d="M 32 158 Q 58 70 114 56" fill="none" stroke="#dbe9f2" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
              <path d="M 208 148 Q 184 66 128 54" fill="none" stroke="#dbe9f2" strokeOpacity="0.38" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M 52 182 Q 92 158 118 172" fill="none" stroke="#dbe9f2" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
              <path d="M 190 178 Q 152 156 124 170" fill="none" stroke="#dbe9f2" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="120" cy="188" rx="58" ry="9" fill="none" stroke="#dbe9f2" strokeOpacity="0.18" strokeWidth="2" />
              {/* droplets thrown off the splash */}
              <circle cx="54" cy="92" r="3" fill="#fff" fillOpacity="0.7" />
              <circle cx="186" cy="84" r="2.4" fill="#fff" fillOpacity="0.6" />
              <circle cx="72" cy="58" r="2" fill="#fff" fillOpacity="0.5" />
              <circle cx="168" cy="48" r="2.4" fill="#fff" fillOpacity="0.55" />
              <circle cx="42" cy="132" r="2" fill="#dbe9f2" fillOpacity="0.45" />
              <circle cx="200" cy="118" r="2" fill="#dbe9f2" fillOpacity="0.4" />
              <ellipse cx="92" cy="40" rx="2.6" ry="1.4" transform="rotate(-32 92 40)" fill="#fff" fillOpacity="0.45" />
              <ellipse cx="152" cy="34" rx="2.4" ry="1.3" transform="rotate(28 152 34)" fill="#fff" fillOpacity="0.4" />
              {/* speed streaks from the drop */}
              <line x1="86" y1="6" x2="94" y2="42" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="120" y1="2" x2="120" y2="34" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="152" y1="6" x2="146" y2="40" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.6" strokeLinecap="round" />
            </svg>

            {/* their tallboy can, cut out + mid-motion */}
            <div className="absolute left-1/2 top-[24%] h-[52%] w-[22%] -translate-x-1/2 -rotate-6 rounded-[10px] bg-[linear-gradient(90deg,#878e99,#eef1f4_42%,#646b77)] shadow-[0_22px_44px_-12px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-x-[8%] top-[3%] h-[3%] rounded-full bg-black/30" />
              <div className="absolute inset-x-0 top-[7%] h-px bg-white/50" />
              <div className="absolute inset-x-[10%] top-1/2 -translate-y-1/2 rounded-sm bg-[#101216] px-1 py-2 text-center font-mono text-[8px] font-bold leading-tight tracking-widest text-white">
                LIQUID
                <br />
                DEATH
              </div>
              <div className="absolute inset-x-[8%] bottom-[4%] h-px bg-black/30" />
            </div>

            <span className="absolute left-3 top-3 rounded-full border border-white/25 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-white/85">
              LIQUID DEATH
            </span>
            <p className="absolute inset-x-2 bottom-3 m-0 text-center text-[17px] font-bold tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.8)]">
              “Murder your thirst.”
            </p>
          </div>

          {/* paused-state play button */}
          <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/45 backdrop-blur-[2px]">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-4 fill-white" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </div>

        {/* storyboard filmstrip */}
        <div className="grid grid-cols-4 gap-2">
          {frames.map((f) => (
            <div
              key={f.t}
              className={`relative h-12 overflow-hidden rounded-md bg-[linear-gradient(165deg,#23262d,#101216)] sm:h-14 ${
                f.active ? "ring-2 ring-white/90" : "opacity-60 ring-1 ring-white/15"
              }`}
            >
              <FrameArt kind={f.kind} />
              <span className="absolute bottom-0.5 left-1 truncate font-mono text-[10px] leading-none text-white/75">
                {f.t} {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* scrubber */}
        <div className="flex items-center gap-3">
          <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-white/15" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 w-[60%] rounded-full bg-white/80" />
            <span className="absolute left-[60%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>
          <span className="shrink-0 font-mono text-[13px] text-white/70">0:09 / 0:15</span>
        </div>
      </div>
    </div>
  );
}
