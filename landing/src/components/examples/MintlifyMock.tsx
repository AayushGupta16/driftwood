import { Anno } from "./Anno";

/* Mintlify → Supabase: their docs site with the ⌘K assistant dialog open —
   a real Discord question, answered instantly from their own docs.
   Anatomy traced from mintlify.com/docs: logo left + centered tab pills +
   green CTA right; slim sidebar with bold group label and a green active
   item; green eyebrow over the page title; dialog = input row up top
   (query + esc), "Ask Assistant" section beneath, footer rail. */

const SUPA_GREEN = "#3ECF8E";
const SUPA_GREEN_DEEP = "#15835c"; // active/eyebrow text on white

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

function SearchGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="m13.5 13.5-3.2-3.2" />
    </svg>
  );
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M8 1.5 9.6 6.4 14.5 8 9.6 9.6 8 14.5 6.4 9.6 1.5 8l4.9-1.6L8 1.5Z" fill="currentColor" />
    </svg>
  );
}

export function MintlifyAskMock() {
  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <Anno text="answers come from their public docs" pos="-bottom-2 -left-3 -rotate-1" />

      {/* docs-site frame */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-white">
        {/* navbar: logo left, centered tab pills, search + CTA right */}
        <div className="flex items-center gap-3 border-b border-line/70 px-3.5 py-2">
          <span className="flex shrink-0 items-center gap-1.5">
            <SupaBolt />
            <span className="text-[14px] font-bold tracking-[-0.01em] text-ink">supabase</span>
          </span>
          <span className="mx-auto hidden items-center gap-1 sm:flex" aria-hidden="true">
            <span className="rounded-full bg-paper px-2.5 py-1 text-[12px] font-medium text-ink">Documentation</span>
            <span className="px-2 py-1 text-[12px] text-ink-faint">Guides</span>
            <span className="px-2 py-1 text-[12px] text-ink-faint">API reference</span>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2.5 sm:ml-0">
            <SearchGlyph className="h-3.5 w-3.5 text-ink-faint" />
            <span
              className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-[#063820]"
              style={{ backgroundColor: SUPA_GREEN }}
            >
              Get started
            </span>
          </span>
        </div>

        {/* page body: sidebar + content, dimmed under the dialog */}
        <div className="relative flex min-h-72 flex-1">
          <div className="flex min-w-0 flex-1" aria-hidden="true">
            {/* slim sidebar: bold group label, gray items, green active item */}
            <div className="flex w-31 shrink-0 flex-col gap-1.5 px-3.5 pt-4 max-[400px]:hidden">
              <span className="text-[11.5px] font-bold text-ink">Auth</span>
              <span className="text-[12.5px] text-ink-faint">Overview</span>
              <span className="text-[12.5px] text-ink-faint">Users</span>
              <span className="text-[12.5px] font-medium" style={{ color: SUPA_GREEN_DEEP }}>
                Server-side admin
              </span>
              <span className="text-[12.5px] text-ink-faint">Sessions</span>
            </div>

            {/* content column: green eyebrow, bold title, body skeleton */}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-4 pt-4">
              <span className="text-[11.5px] font-semibold" style={{ color: SUPA_GREEN_DEEP }}>
                Auth
              </span>
              <span className="-mt-1 text-[17px] font-bold text-ink">Server-side admin</span>
              <span className="h-2.5 w-full rounded bg-ink/10" />
              <span className="h-2.5 w-5/6 rounded bg-ink/10" />
              <span className="h-2.5 w-full rounded bg-ink/10" />
              <span className="h-2.5 w-2/3 rounded bg-ink/10" />
            </div>
          </div>
          <div className="absolute inset-0 bg-ink/25" aria-hidden="true" />

          {/* the ⌘K assistant dialog, floating high like the real one */}
          <div className="absolute left-1/2 top-5 flex w-[min(92%,460px)] -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-line">
            {/* input row: query typed at the top, esc hint right */}
            <div className="flex items-center gap-2.5 border-b border-line/70 px-3.5 py-2.5">
              <SearchGlyph className="h-4 w-4 shrink-0 text-ink-faint" />
              <p className="m-0 flex-1 truncate font-mono text-[14px] text-ink">
                How do I reset a user's password from the server?
              </p>
              <span className="shrink-0 rounded bg-paper px-1.5 py-px text-[11px] text-ink-faint ring-1 ring-line/80">
                esc
              </span>
            </div>

            {/* assistant section: label + provenance chip, answer, code */}
            <div className="flex flex-col gap-2.5 px-3.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
                  <span style={{ color: SUPA_GREEN_DEEP }}>
                    <Sparkle className="h-3 w-3" />
                  </span>
                  Ask Assistant
                </span>
                <span className="rounded-full bg-[#fdf3df] px-2 py-0.5 font-mono text-[12.5px] font-medium text-[#96660f] ring-1 ring-[#e3c98e]">
                  asked 14&times; in their Discord
                </span>
              </div>
              <p className="m-0 font-mono text-[13px] leading-snug text-ink-soft">
                Use the admin API with a service-role key:
              </p>
              <div className="overflow-x-auto rounded-lg bg-[#16181d] px-3 py-2 font-mono text-[12.5px] leading-relaxed">
                <code className="whitespace-pre text-paper/85">
                  <span className="text-[#7ee2b8]">supabase.auth.admin</span>
                  .updateUserById(id, {"{ password }"})
                </code>
              </div>
            </div>

            {/* footer rail: cited source + badge */}
            <div className="flex items-center justify-between gap-3 border-t border-line/70 bg-paper/60 px-3.5 py-2">
              <span className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 font-mono text-[12.5px] text-ink-soft ring-1 ring-line">
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
