import { Anno } from "./Anno";

/* Mintlify → Supabase: their public docs, ingested overnight — now answering
   the exact questions their users keep asking in Discord and GitHub. */

const SUPA_GREEN = "#3ECF8E";

const navItems = [
  { label: "Database", active: false },
  { label: "Auth", active: true },
  { label: "Storage", active: false },
  { label: "Realtime", active: false },
  { label: "Edge Functions", active: false },
];

const queued = [
  { q: "Why is RLS blocking my service role?", count: "asked 9×" },
  { q: "Can I self-host?", count: "asked 23×" },
];

function SupaBolt() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M9.5 1 3 9.5h4.5L6.5 15 13 6.5H8.5L9.5 1Z" fill={SUPA_GREEN} stroke="#2aa56f" strokeWidth="0.5" strokeLinejoin="round" />
    </svg>
  );
}

export function MintlifyAskMock() {
  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <Anno text="docs: pulled from supabase.com/docs" pos="-top-3 left-8 -rotate-1" />
      <Anno text="questions: from their Discord + GitHub" pos="-bottom-2 right-6 rotate-1" />

      {/* docs-site frame */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-white">
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-line/70 bg-paper/50 px-3.5 py-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <SupaBolt />
            <span className="text-[14px] font-bold tracking-[-0.01em] text-ink">supabase</span>
            <span className="ml-1 hidden truncate font-mono text-[12px] text-ink-faint sm:inline">
              docs &middot; on Mintlify
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-mono text-[12px] text-ink-soft ring-1 ring-line">
            <span className="rounded bg-paper px-1 py-px text-[11px] text-ink-faint ring-1 ring-line/80">&#8984;K</span>
            Ask AI
          </span>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* sidebar */}
          <nav className="hidden w-[118px] shrink-0 flex-col gap-1 border-r border-line/80 bg-paper/50 px-2 py-3 sm:flex">
            {navItems.map((item) => (
              <span
                key={item.label}
                className={`truncate rounded-md px-2 py-1.5 font-mono text-[12px] ${
                  item.active
                    ? "bg-[#3ECF8E]/12 font-medium text-[#1f8a5d] ring-1 ring-[#3ECF8E]/30"
                    : "text-ink-faint"
                }`}
              >
                {item.label}
              </span>
            ))}
          </nav>

          {/* main panel: the Ask AI conversation */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-2.5">
              <span className="font-mono text-[13.5px] font-semibold text-ink">Ask AI &middot; Auth</span>
              <span className="font-mono text-[12.5px] text-ink-faint">trained on your live docs</span>
            </div>

            {/* user question */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="max-w-[88%] rounded-xl rounded-br-sm bg-tide-wash px-3 py-2 font-mono text-[13px] leading-snug text-ink ring-1 ring-tide/20">
                How do I reset a user's password from the server?
              </div>
              <span className="rounded-full bg-[#fdf3df] px-2 py-0.5 font-mono text-[11.5px] font-medium text-[#96660f] ring-1 ring-[#e3c98e]">
                asked 14&times; in your Discord
              </span>
            </div>

            {/* assistant answer */}
            <div className="flex max-w-[94%] flex-col gap-2 rounded-xl rounded-bl-sm bg-paper/60 px-3 py-2.5 ring-1 ring-line/70">
              <p className="m-0 font-mono text-[13px] leading-snug text-ink">
                Use the admin API with the service role key:
              </p>
              <div className="overflow-x-auto rounded-lg bg-[#16181d] px-3 py-2 font-mono text-[12.5px] leading-relaxed">
                <code className="whitespace-pre text-paper/85">
                  <span className="text-[#7ee2b8]">supabase.auth.admin</span>
                  .updateUserById(id, {"{ password }"})
                </code>
              </div>
              <span className="self-start rounded-full bg-white px-2 py-0.5 font-mono text-[11.5px] text-ink-soft ring-1 ring-line">
                from /docs/auth/server-side
              </span>
            </div>

            {/* more harvested questions, queued */}
            <div className="mt-auto space-y-1.5 border-t border-line/60 pt-2.5">
              {queued.map((item) => (
                <div
                  key={item.q}
                  className="flex items-center justify-between gap-3 rounded-lg bg-paper/40 px-2.5 py-1.5 ring-1 ring-line/50"
                >
                  <span className="truncate font-mono text-[13px] text-ink-soft">{item.q}</span>
                  <span className="shrink-0 font-mono text-[11.5px] text-ink-faint">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
