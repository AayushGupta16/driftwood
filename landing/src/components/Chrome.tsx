import HelmMark from "./HelmMark";

export function Wordmark({ className, markSize = "size-7" }: { className?: string; markSize?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <HelmMark className={`${markSize} shrink-0`} />
      <span className="font-brand lowercase leading-none tracking-[0.09em]">driftwood</span>
    </span>
  );
}

export function Nav({ homePrefix = "" }: { homePrefix?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 shadow-[0_10px_28px_-24px_rgba(22,24,29,0.5)] backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href={homePrefix || "#top"} className="text-[19px] text-ink no-underline">
          <Wordmark markSize="size-8" />
        </a>
        <a
          href="#join"
          className="rounded-xl bg-ink px-4.5 py-2 text-[14px] font-semibold text-paper no-underline shadow-[0_3px_12px_-5px_rgba(22,24,29,0.45)] transition-all hover:-translate-y-px hover:bg-tide-deep"
        >
          Get early access
        </a>
      </nav>
    </header>
  );
}

export function Footer({ homePrefix = "" }: { homePrefix?: string }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
        <a href={homePrefix || "#top"} className="text-[15px] text-ink no-underline">
          <Wordmark markSize="size-5" />
        </a>
        <div className="flex items-center gap-5 font-mono text-[13px] text-ink-soft">
          <a href="mailto:aayush@driftwood.sh" className="text-ink-faint no-underline transition-colors hover:text-ink">
            aayush@driftwood.sh
          </a>
          <span>&copy; 2026 driftwood</span>
        </div>
      </div>
    </footer>
  );
}
