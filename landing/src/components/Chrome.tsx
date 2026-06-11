import { useEffect } from "react";
import HelmMark from "./HelmMark";

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

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
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href={homePrefix || "#top"} className="text-[17px] text-ink no-underline">
          <Wordmark />
        </a>
        <a
          href="#join"
          className="rounded-lg bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-paper no-underline transition-colors hover:bg-tide-deep"
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
        <div className="flex items-center gap-5 font-mono text-[12px] text-ink-faint">
          <a href="mailto:aayush@driftwood.ai" className="text-ink-faint no-underline transition-colors hover:text-ink">
            aayush@driftwood.ai
          </a>
          <span>&copy; 2026 driftwood</span>
        </div>
      </div>
    </footer>
  );
}
