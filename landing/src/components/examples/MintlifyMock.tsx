import { Anno } from "./Anno";

/* Mintlify → Supabase: their docs site with the Ask-AI modal open —
   a real Discord question, answered instantly from their own docs. */

const SUPA_GREEN = "#3ECF8E";

function SupaBolt() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M9.5 1 3 9.5h4.5L6.5 15 13 6.5H8.5L9.5 1Z"
        fill={SUPA_GREEN}
        stroke="#2aa56f"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MintlifyAskMock() {
  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <Anno text="answers come from their public docs" pos="-bottom-2 -left-3 -rotate-1" />

      {/* docs-site frame */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-white">
        {/* slim header */}
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-3.5 py-2.5">
          <span className="flex items-center gap-1.5">
            <SupaBolt />
            <span className="text-[14px] font-bold tracking-[-0.01em] text-ink">supabase</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1 font-mono text-[12.5px] text-ink-faint ring-1 ring-line">
            Search or ask&hellip;
            <span className="rounded bg-paper px-1 py-px text-[11px] ring-1 ring-line/80">&#8984;K</span>
          </span>
        </div>

        {/* dimmed docs page behind the modal — min-h keeps the modal from
            overflowing the frame's clipped edges */}
        <div className="relative flex min-h-66 flex-1 flex-col">
          <div className="flex flex-col gap-3 p-5 opacity-40 blur-[1.5px]" aria-hidden="true">
            <span className="text-[17px] font-bold text-ink">Auth</span>
            <span className="h-2.5 w-3/4 rounded bg-ink/15" />
            <span className="h-2.5 w-full rounded bg-ink/10" />
            <span className="h-2.5 w-5/6 rounded bg-ink/10" />
            <span className="h-2.5 w-full rounded bg-ink/10" />
            <span className="h-2.5 w-2/3 rounded bg-ink/10" />
          </div>
          <div className="absolute inset-0 bg-ink/10" aria-hidden="true" />

          {/* the ask-AI modal */}
          <div className="absolute left-1/2 top-1/2 flex w-[min(92%,440px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-2.5 rounded-xl bg-white p-4 shadow-xl ring-1 ring-line">
            {/* typed question + provenance chip */}
            <div className="flex flex-col gap-1.5">
              <p className="m-0 font-mono text-[15px] leading-snug text-ink">
                How do I reset a user's password from the server?
              </p>
              <span className="self-start rounded-full bg-[#fdf3df] px-2 py-0.5 font-mono text-[12.5px] font-medium text-[#96660f] ring-1 ring-[#e3c98e]">
                asked 14&times; in their Discord
              </span>
            </div>

            {/* answer */}
            <p className="m-0 font-mono text-[13px] leading-snug text-ink-soft">
              Use the admin API with a service-role key:
            </p>
            <div className="overflow-x-auto rounded-lg bg-[#16181d] px-3 py-2 font-mono text-[12.5px] leading-relaxed">
              <code className="whitespace-pre text-paper/85">
                <span className="text-[#7ee2b8]">supabase.auth.admin</span>
                .updateUserById(id, {"{ password }"})
              </code>
            </div>

            {/* cited source + badge */}
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[12.5px] text-ink-soft ring-1 ring-line">
                Auth &rarr; Server-side admin
                <span className="text-ink-faint">&#8599;</span>
              </span>
              <span className="font-mono text-[11.5px] text-ink-faint">Powered by Mintlify</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
