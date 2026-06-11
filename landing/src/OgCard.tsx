import { BugDemoCard } from "./components/AgentDemo";
import { Wordmark } from "./components/Chrome";

/* Social share card, rendered at /og and screenshotted to public/og-2.png
   (bump the filename + the og:image metas in index.html on every regen so
   link scrapers re-fetch). Regenerate with: playwright screenshot of /og
   at 1200x630. */
export default function OgCard() {
  return (
    <div className="relative flex h-[630px] w-[1200px] flex-col overflow-hidden bg-paper px-18 py-14">
      {/* faint sea-chart contours, echoing the hero */}
      <svg
        viewBox="0 0 600 600"
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-40 size-150 text-tide opacity-[0.07]"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M300 40 C 420 50 540 140 555 280 C 568 400 480 530 330 555 C 190 575 60 480 45 340 C 32 210 150 55 300 40 Z" />
          <path d="M300 90 C 400 95 495 170 508 285 C 518 380 445 480 320 502 C 205 520 100 440 90 330 C 80 225 180 92 300 90 Z" />
          <path d="M300 140 C 380 145 445 200 458 290 C 468 360 410 432 315 450 C 222 465 150 405 140 320 C 132 240 215 142 300 140 Z" />
          <path d="M300 190 C 360 195 398 235 408 295 C 416 348 372 392 308 402 C 245 412 198 372 192 312 C 186 255 240 192 300 190 Z" />
        </g>
      </svg>

      <div className="text-[26px] text-ink">
        <Wordmark markSize="size-10" />
      </div>

      <div className="flex flex-1 items-center gap-14">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tide-wash px-4 py-1.5 font-mono text-[17px] font-medium text-tide ring-1 ring-tide/25 -rotate-1">
            a real bug, found this morning
          </span>
          <h1 className="mb-0 mt-6 text-[64px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
            Ship a custom
            <br />
            demo in every
            <br />
            cold email.
          </h1>
        </div>
        <div className="w-105 shrink-0 scale-110 origin-center">
          <div className="rounded-2xl shadow-[0_36px_80px_-36px_rgba(13,60,91,0.45)]">
            <BugDemoCard />
          </div>
        </div>
      </div>

      <p className="m-0 font-mono text-[15px] text-ink-faint">driftwood.sh</p>
    </div>
  );
}
