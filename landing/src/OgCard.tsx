import { useEffect, useRef } from "react";
import { Wordmark } from "./components/Chrome";

/* Social share card, rendered at /og and screenshotted to public/og-5.png
   (bump the filename + the og:image metas in index.html on every regen so
   link scrapers re-fetch). Regenerate with: playwright screenshot of /og
   at 1200x630, deviceScaleFactor 2. */
export default function OgCard() {
  const seaRef = useRef<HTMLCanvasElement>(null);

  // one still frame of the landing page's ASCII sea, duck captaining the log
  useEffect(() => {
    const cv = seaRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height); // StrictMode runs effects twice
    const CW = 12;
    const CH = 17;
    const COLS = Math.ceil(1200 / CW);
    const ROWS = Math.ceil(150 / CH);
    const CHARS = [" ", "·", "-", "~", "≈", "≋"];
    ctx.font = "15px ui-monospace, Menlo, monospace";
    ctx.textBaseline = "middle";
    const t = 2.0;
    for (let r = 0; r < ROWS; r++) {
      const depth = r / (ROWS - 1);
      for (let c = 0; c < COLS; c++) {
        const v =
          0.5 +
          0.26 * Math.sin(c * 0.13 + t + r * 0.7) +
          0.2 * Math.sin(c * 0.07 - t * 1.1) +
          0.12 * Math.sin(c * 0.23 + t * 0.6 + r);
        const level = Math.max(0, Math.min(0.999, v * (0.35 + depth * 0.85)));
        const ch = CHARS[Math.floor(level * CHARS.length)];
        if (ch === " ") continue;
        ctx.fillStyle = `rgba(21,85,126,${0.16 + depth * 0.5})`;
        ctx.fillText(ch, c * CW, r * CH + CH / 2);
      }
    }
    // the log + its captain, drawn a size up so they read at preview scale
    ctx.font = "21px ui-monospace, Menlo, monospace";
    const wx = 16;
    const wr = 3.1;
    ctx.fillStyle = "rgba(121,85,52,0.95)";
    ctx.fillText("▗▄▄▄▄▄▄▖", wx * CW, wr * CH + CH / 2);
    const cy = (wr - 0.72) * CH + CH / 2;
    ctx.fillStyle = "rgba(240,195,60,0.98)";
    ctx.fillText("▆▆", (wx + 2.4) * CW, cy);
    ctx.fillText("▝", (wx + 3.95) * CW, cy - CH * 0.52);
    ctx.fillStyle = "rgba(224,138,46,0.98)";
    ctx.fillText("‣", (wx + 4.75) * CW, cy - CH * 0.45);
    // a distant ship, starboard
    ctx.fillStyle = "rgba(21,85,126,0.4)";
    ctx.fillText("▟▌", 78 * CW, 1.4 * CH + CH / 2);
    ctx.fillText("▀▀▀▀", 77.2 * CW, 2.3 * CH + CH / 2);
  }, []);

  return (
    <div className="relative h-[630px] w-[1200px] overflow-hidden bg-white">
      <div className="absolute left-16 top-14 text-[36px] text-ink">
        <Wordmark markSize="size-14" />
      </div>

      <h1 className="absolute left-16 top-[200px] m-0 w-[900px] text-[84px] font-semibold leading-[1.12] tracking-[-0.015em] text-ink">
        Ship{" "}
        <em className="font-medium text-tide" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic" }}>
          a custom demo
        </em>{" "}
        in every cold message.
      </h1>

      <canvas ref={seaRef} width={1200} height={150} className="absolute bottom-0 left-0" />
    </div>
  );
}
