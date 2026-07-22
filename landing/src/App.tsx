/* Landing page — production port of design/landing-draft-v7.html.
   The markup, CSS (scoped under .landing in index.css), scroll scrubs, and
   the 2D-canvas ASCII sea are ported 1:1 from the approved draft. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { trackCta } from "./track";
import { CAL_URL } from "./components/BookDemo";
import HelmMark from "./components/HelmMark";
import InlineBooking from "./components/InlineBooking";

/* style={{ "--i": n }} helper for the thread stagger delays */
const iv = (n: number) => ({ "--i": n } as CSSProperties);

function Wordmark({ label = true }: { label?: boolean }) {
  return (
    <>
      <HelmMark />
      {label ? <span style={{ color: "var(--ink)" }}>driftwood</span> : "driftwood"}
    </>
  );
}

export default function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const seaRef = useRef<HTMLCanvasElement>(null);
  const howWrapRef = useRef<HTMLDivElement>(null);
  const cmpWrapRef = useRef<HTMLDivElement>(null);
  const arrowPathRef = useRef<SVGPathElement>(null);
  const arrowHeadRef = useRef<SVGPathElement>(null);
  // sea state: null = trying, true = live (strips shown), false = fallback (canvases removed)
  const [seaLive, setSeaLive] = useState<boolean | null>(null);

  /* thread stagger, fire once — desktop only; on touch the scroll-link
     scrubs each message in 1:1 with the finger instead */
  useEffect(() => {
    const t = rootRef.current?.querySelector(".stagger");
    if (!t) return;
    const touchScrubbed =
      !(matchMedia("(min-width: 52rem)").matches && matchMedia("(pointer: fine)").matches) &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (touchScrubbed) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            t.classList.add("seen");
            io.disconnect();
          }
      },
      { threshold: 0.25 },
    );
    io.observe(t);
    return () => io.disconnect();
  }, []);

  /* the two pinned scrubs: the slop-vs-real section, the how stage */
  useEffect(() => {
    const root = rootRef.current;
    const pinWrap = howWrapRef.current;
    const cmpWrap = cmpWrapRef.current;
    const arrowPath = arrowPathRef.current;
    const arrowHead = arrowHeadRef.current;
    if (!root || !pinWrap || !cmpWrap || !arrowPath || !arrowHead) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // full pinned scrubs on big pointer screens; the week/compare pins hold
    // content taller than a phone screen, so those two go scroll-linked
    // (un-pinned) on touch instead
    const scrubOk =
      matchMedia("(min-width: 52rem)").matches &&
      matchMedia("(pointer: fine)").matches &&
      !reduceMotion;
    const cleanups: (() => void)[] = [];

    // pinned scrub: scroll cycles the stage while the rail highlights.
    // This one fits a phone screen, so it scrubs everywhere motion is on.
    const cards = [...root.querySelectorAll(".stage-card")];
    const items = [...root.querySelectorAll(".rail-list li")];
    const howPin = pinWrap.querySelector(".pin") as HTMLElement | null;
    if (!reduceMotion) {
      let raf = 0;
      const update = () => {
        raf = 0;
        // measure the pin, not innerHeight — iOS toolbar collapse changes
        // innerHeight mid-scroll and would make the scrub jump
        const total = pinWrap.offsetHeight - (howPin?.offsetHeight ?? innerHeight);
        if (total <= 0) return;
        const p = Math.min(0.999, Math.max(0, -pinWrap.getBoundingClientRect().top / total));
        // one artifact at a time: a scrubbed crossfade, each photo fully visible
        const prog = p * (cards.length - 1) * 1.18 - 0.09; // small dwell at both ends
        cards.forEach((c, i) => {
          const el = c as HTMLElement;
          const d = i - Math.min(cards.length - 1, Math.max(0, prog));
          const a = Math.max(0, 1 - Math.abs(d));
          el.style.opacity = `${a}`;
          el.style.transform = `translateY(${d * 46}px) scale(${1 - Math.abs(d) * 0.015})`;
          el.style.zIndex = `${10 + Math.round(a * 10)}`;
          el.style.pointerEvents = a > 0.5 ? "auto" : "none";
        });
        const step = Math.min(cards.length - 1, Math.max(0, Math.round(prog)));
        items.forEach((li, i) => {
          const el = li as HTMLElement;
          const d = Math.min(1, Math.abs(i - prog));
          el.style.transform = `translateX(${(1 - d) * 10}px) scale(${1 + (1 - d) * 0.14})`;
          el.style.opacity = `${1 - d * 0.55}`;
          li.classList.toggle("active", i === step);
        });
      };
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => {
        removeEventListener("scroll", onScroll);
        if (raf) cancelAnimationFrame(raf);
      });
      update();
    } else {
      /* static stack on mobile / reduced motion via CSS */
    }

    // slop vs. real: the scrub drives the arrow across the cards
    const arrowLen = arrowPath.getTotalLength();
    arrowPath.style.strokeDasharray = `${arrowLen}`;
    if (scrubOk) {
      const cmpPin = cmpWrap.querySelector(".pin") as HTMLElement | null;
      const cmpInner = cmpPin?.querySelector(".wrap") as HTMLElement | null;
      let raf2 = 0;
      const updateC = () => {
        raf2 = 0;
        const total = cmpWrap.offsetHeight - innerHeight;
        if (total <= 0) return;
        const p = Math.min(1, Math.max(0, -cmpWrap.getBoundingClientRect().top / total));
        // content taller than the pin drifts up as the scrub advances, so
        // the reply grids surface for the payoff (no-op on tall screens)
        if (cmpPin && cmpInner) {
          const over = Math.max(0, cmpPin.scrollHeight - cmpPin.clientHeight);
          cmpInner.style.transform = `translateY(${-over * Math.min(1, p * 1.2)}px)`;
        }
        const draw = Math.min(1, Math.max(0, (p - 0.03) / 0.22));
        arrowPath.style.strokeDashoffset = `${arrowLen * (1 - draw)}`;
        arrowHead.style.opacity = draw > 0.95 ? "1" : "0";
        arrowHead.style.transform = draw > 0.95 ? "scale(1)" : "scale(0.3)";
      };
      const onScroll2 = () => {
        if (!raf2) raf2 = requestAnimationFrame(updateC);
      };
      addEventListener("scroll", onScroll2, { passive: true });
      cleanups.push(() => {
        removeEventListener("scroll", onScroll2);
        if (raf2) cancelAnimationFrame(raf2);
      });
      updateC();
    } else if (!reduceMotion) {
      // touch: un-pinned, the same choreography rides the viewport — the
      // arrow draws, each thread message scrubs in
      const svgEl = arrowPath.ownerSVGElement;
      const msgs = [...root.querySelectorAll(".stagger .msg, .stagger .divider")] as HTMLElement[];
      let rafM = 0;
      const updateM = () => {
        rafM = 0;
        const vh = innerHeight;
        if (svgEl) {
          const r = svgEl.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, (vh - r.top - 30) / (vh * 0.28)));
          arrowPath.style.strokeDashoffset = `${arrowLen * (1 - p)}`;
          arrowHead.style.opacity = p > 0.93 ? "1" : "0";
          arrowHead.style.transform = p > 0.93 ? "scale(1)" : "scale(0.3)";
        }
        msgs.forEach((el) => {
          const r = el.getBoundingClientRect();
          const q = Math.min(1, Math.max(0, (vh - r.top - 30) / (vh * 0.22)));
          el.style.opacity = `${q}`;
          el.style.transform = `translateY(${(1 - q) * 12}px)`;
        });
      };
      const onScrollM = () => {
        if (!rafM) rafM = requestAnimationFrame(updateM);
      };
      addEventListener("scroll", onScrollM, { passive: true });
      cleanups.push(() => {
        removeEventListener("scroll", onScrollM);
        if (rafM) cancelAnimationFrame(rafM);
      });
      updateM();
    } else {
      arrowPath.style.strokeDashoffset = "0";
      arrowHead.style.opacity = "1";
      /* the note stays fully visible under reduced motion */
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  /* one body of water, drawn as ASCII: the hero sea and the thin divider
     strips are character grids animated by a shared wave field, phase-seeded
     by document position. A lone piece of driftwood bobs across the hero.
     Static wave-cut seams remain the fallback on mobile / reduced motion. */
  useEffect(() => {
    const root = rootRef.current;
    const heroCanvas = seaRef.current;
    const motionOk = matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (!root || !heroCanvas || !motionOk) {
      setSeaLive(false);
      return;
    }

    const cleanups: (() => void)[] = [];
    const proofEl = root.querySelector(".hero-proof") as HTMLElement | null;
    const winEl = root.querySelector(".app-window") as HTMLElement | null;
    const CHARS = [" ", "\u00b7", "-", "~", "\u2248", "\u224b"]; // · - ~ ≈ ≋ by wave height
    const CELL_W = 8;
    const CELL_H = 10.5;
    const WOOD = "\u2597\u2584\u2584\u2584\u2584\u2584\u2584\u2596"; // ▗▄▄▄▄▄▄▖ a drifting log
    const SAIL = "\u259f\u258c"; // ▟▌
    const SAILW = "\u2590\u2599"; // ▐▙ westbound (mirrored)
    const HULL = "\u2580\u2580\u2580\u2580"; // ▀▀▀▀
    const ISLE = "\u2581\u2582\u2583\u2584\u2583\u2582\u2581"; // ▁▂▃▄▃▂▁

    type Mount = {
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      strip: boolean;
      phase: number;
      cols: number;
      rows: number;
      w: number;
      h: number;
      visible: boolean;
    };
    const mounts: Mount[] = [];

    function mountSea(canvas: HTMLCanvasElement, strip: boolean) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const m: Mount = {
        canvas,
        ctx,
        strip,
        phase: (canvas.getBoundingClientRect().top + scrollY) * 0.02,
        cols: 0,
        rows: 0,
        w: 0,
        h: 0,
        visible: false,
      };
      const io = new IntersectionObserver((es) => {
        for (const e of es) m.visible = e.isIntersecting;
      });
      io.observe(canvas);
      cleanups.push(() => io.disconnect());
      mounts.push(m);
    }

    mountSea(heroCanvas, false);
    root
      .querySelectorAll<HTMLCanvasElement>(".sea-strip")
      .forEach((c) => mountSea(c, true));
    setSeaLive(true);

    const dpr = Math.min(devicePixelRatio, 2);
    const sizeMount = (m: Mount) => {
      const w = m.canvas.clientWidth,
        h = m.canvas.clientHeight;
      if (!w || !h) return;
      m.canvas.width = w * dpr;
      m.canvas.height = h * dpr;
      m.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // strips run a size down: their 112px bands read denser that way
      m.ctx.font = `${m.strip ? 11 : 12}px ui-monospace, "SF Mono", Menlo, monospace`;
      m.ctx.textBaseline = "middle";
      m.cols = Math.ceil(w / CELL_W);
      m.rows = Math.ceil(h / CELL_H);
      m.w = w;
      m.h = h;
      m.phase = (m.canvas.getBoundingClientRect().top + scrollY) * 0.02;
    };
    const resize = () => mounts.forEach(sizeMount);
    addEventListener("resize", resize);
    cleanups.push(() => removeEventListener("resize", resize));
    resize();

    const wave = (x: number, y: number, t: number, phase: number) =>
      Math.sin(x * 0.42 + t * 1.05 + phase) * 0.42 +
      Math.sin(y * 0.9 + t * 0.7 + phase) * 0.24 +
      Math.sin((x + y) * 0.23 + t * 1.3 + phase * 0.6) * 0.16 +
      Math.sin(x * 0.07 - t * 1.1 + phase) * 0.34; // the rolling swell

    // patrol: movers cruise back and forth across the visible span instead
    // of sliding off one edge and teleporting in from the other — nothing
    // in the scene ever disappears, it just turns around
    const patrol = (tt: number, speed: number, seed: number, min: number, max: number) => {
      const L = Math.max(4, max - min);
      const c = (((tt * speed + seed) % (2 * L)) + 2 * L) % (2 * L);
      return c < L ? { x: min + c, dir: 1 } : { x: min + 2 * L - c, dir: -1 };
    };

    let last = 0;
    let rafId = 0;
    const tick = (ms: number) => {
      rafId = requestAnimationFrame(tick);
      if (ms - last < 66) return; // ~15fps: water at terminal cadence
      last = ms;
      const t = ms / 1000;
      for (const m of mounts) {
        if (!m.visible) continue;
        if (!m.cols) sizeMount(m); // strips are display:none until sea-live commits
        if (!m.cols) continue;
        if (m.canvas.clientWidth !== m.w || m.canvas.clientHeight !== m.h) sizeMount(m);
        const { ctx, cols, rows, strip, phase } = m;
        ctx.clearRect(0, 0, m.canvas.clientWidth, m.canvas.clientHeight);
        // the proof island: the hero sea reserves ground under the quote and
        // draws it in the same character grid, waves lapping at the coast
        let isl: { cx: number; cy: number; rx: number; ry: number } | null = null;
        if (!strip && proofEl) {
          const pr = proofEl.getBoundingClientRect();
          const cr = m.canvas.getBoundingClientRect();
          if (pr.width > 0 && pr.bottom > cr.top + 6 && pr.top < cr.bottom) {
            isl = {
              cx: (pr.left + pr.width / 2 - cr.left) / CELL_W,
              cy: (pr.top + pr.height / 2 - cr.top) / CELL_H,
              rx: pr.width / 2 / CELL_W + 4.5,
              ry: pr.height / 2 / CELL_H + 2,
            };
          }
        }
        const islE = (c: number, r: number) =>
          isl ? ((c - isl.cx) / isl.rx) ** 2 + ((r - isl.cy) / isl.ry) ** 2 : 99;
        // the dashboard window sails over the sea's right side on desktop.
        // A mover whose lane passes behind it must turn around at the
        // window's edge, not the canvas edge — patrolling the full width
        // means vanishing behind the window for most of every lap
        let openCols = cols;
        let winBottomRow = -1;
        if (!strip && winEl) {
          const wr2 = winEl.getBoundingClientRect();
          const cr2 = m.canvas.getBoundingClientRect();
          if (wr2.bottom > cr2.top + CELL_H && wr2.left > cr2.left && wr2.left < cr2.right) {
            const leftCols = (wr2.left - cr2.left) / CELL_W - 1;
            if (leftCols > 40) {
              // enough open water to be worth confining the patrol to
              openCols = leftCols;
              winBottomRow = (wr2.bottom - cr2.top) / CELL_H;
            }
          }
        }
        const laneMax = (laneRow: number, span: number) =>
          Math.max(6, (laneRow < winBottomRow ? openCols : cols) - span);
        for (let r = 0; r < rows; r++) {
          // hero: sparse at the horizon, denser toward the bottom
          const depth = strip ? 0.85 : 0.5 + (r / rows) * 0.45;
          ctx.fillStyle = `rgba(21, 85, 126, ${depth * 0.88})`;
          const y = r * CELL_H + CELL_H / 2;
          for (let c = 0; c < cols; c++) {
            const e = islE(c, r);
            if (e <= 1) continue; // dry land: the island is drawn below
            const v = wave(c, r, t, phase); // -1..1
            if (e <= 1.5) {
              // surf: water piles up against the coastline
              if (v > -0.2) {
                ctx.fillStyle = `rgba(21, 85, 126, ${Math.min(0.9, depth * (0.7 + v * 0.4))}`.concat(")");
                ctx.fillText(v > 0.5 ? CHARS[5] : CHARS[4], c * CELL_W, y);
                ctx.fillStyle = `rgba(21, 85, 126, ${depth * 0.88})`;
              }
              continue;
            }
            const idx = Math.max(
              0,
              Math.min(CHARS.length - 1, Math.round((v + 1.16) * 0.5 * (CHARS.length - 2) + (strip ? 0.85 : (r / rows) * 1.7 + 0.1) - 0.35)),
            );
            if (idx === 0) continue;
            if (v > 0.82) {
              ctx.fillStyle = `rgba(21, 85, 126, ${Math.min(0.95, depth * 1.15)})`;
              ctx.fillText(CHARS[5], c * CELL_W, y);
              ctx.fillStyle = `rgba(21, 85, 126, ${depth * 0.88})`;
            } else {
              ctx.fillText(CHARS[idx], c * CELL_W, y);
            }
          }
        }
        if (isl) {
          // dry land in the same grid: solid blocks inland, dithered beach
          const r0 = Math.max(0, Math.floor(isl.cy - isl.ry)),
            r1 = Math.min(rows, Math.ceil(isl.cy + isl.ry) + 1);
          const c0 = Math.max(0, Math.floor(isl.cx - isl.rx)),
            c1 = Math.min(cols, Math.ceil(isl.cx + isl.rx) + 1);
          for (let r = r0; r < r1; r++) {
            const y = r * CELL_H + CELL_H / 2;
            for (let c = c0; c < c1; c++) {
              const e = islE(c, r);
              if (e > 1) continue;
              if (e > 0.62) {
                ctx.fillStyle = "rgba(176, 149, 106, 0.5)";
                ctx.fillText("▒", c * CELL_W, y); // ▒ beach, wet sand — warm, not gold
              } else {
                ctx.fillStyle = "rgba(206, 186, 146, 0.32)";
                ctx.fillText("█", c * CELL_W, y); // █ dry sand, soft ivory under the text
              }
            }
          }
          // the palm stands out on the island's far right shoulder: five
          // fronds fanning from the crown, a coconut, a curved trunk
          const tx = (isl.cx + isl.rx * 0.82) * CELL_W;
          const ty = (isl.cy - isl.ry * 0.28) * CELL_H;
          const prevFont = ctx.font;
          ctx.font = "15px ui-monospace, Menlo, monospace";
          ctx.fillStyle = "rgba(101, 125, 106, 0.92)"; // sea-glass, not tropical green
          ctx.fillText("▂", tx - 3, ty - 52);
          ctx.fillText("▚", tx - 16, ty - 46);
          ctx.fillText("▞", tx + 8, ty - 46);
          ctx.fillText("▄", tx - 26, ty - 40);
          ctx.fillText("▄", tx + 20, ty - 40);
          ctx.fillText("▖", tx - 30, ty - 32);
          ctx.fillText("▗", tx + 26, ty - 32);
          ctx.fillStyle = "rgba(178, 94, 66, 0.92)"; // coconut joins the terracotta family
          ctx.font = "10px ui-monospace, Menlo, monospace";
          ctx.fillText("●", tx - 4, ty - 36);
          ctx.fillStyle = "rgba(121, 85, 52, 0.95)";
          ctx.font = "15px ui-monospace, Menlo, monospace";
          ctx.fillText("▐", tx - 4, ty - 26);
          ctx.fillText("▐", tx - 1, ty - 14);
          ctx.fillText("▌", tx + 2, ty - 2);
          // the crab, v2 (v1's bare block read as a red staple): round ∩
          // pincers over a low body, skittering sideways along the beach
          const scut = Math.sin(t * 0.45 + 1.3) * isl.rx * 0.45 + Math.sin(t * 5.2) * 0.22;
          const crx = (isl.cx + scut) * CELL_W;
          const cry = (isl.cy + isl.ry * 0.74) * CELL_H;
          ctx.fillStyle = "rgba(178, 94, 66, 0.95)"; // terracotta, the one warm accent
          ctx.font = "bold 9px ui-monospace, Menlo, monospace";
          ctx.fillText("∩", crx - 6.5, cry - 7.5);
          ctx.fillText("∩", crx + 3, cry - 7.5);
          ctx.font = "bold 11px ui-monospace, Menlo, monospace";
          ctx.fillText("▄▄", crx - 6, cry - 3);
          ctx.font = "7px ui-monospace, Menlo, monospace";
          ctx.fillText("ʌʌʌ", crx - 4.5, cry + 2); // legs, tucked under the body
          ctx.font = prevFont;
        }
        const duck = (seed: number, rowF: number, max = cols - 3.5) => {
          // the rubber duck stays rubber-duck yellow \u2014 it's the debugging
          // duck, the one deliberate in-joke; a gray gull was tried and
          // rejected (the yellow IS the point)
          const { x: dx, dir } = patrol(t, 1.15, seed, 1, max);
          const dy = rowF * rows + wave(dx, rowF * rows, t, phase) * 1.9;
          if (islE(dx + 0.8, dy) <= 1.3) return; // ducks paddle behind the island
          const y = dy * CELL_H + CELL_H / 2;
          ctx.fillStyle = "rgba(240, 195, 60, 0.95)";
          ctx.fillText("\u2586\u2586", dx * CELL_W, y); // body
          ctx.fillText(dir > 0 ? "\u259d" : "\u2598", (dir > 0 ? dx + 1.55 : dx - 0.55) * CELL_W, y - CELL_H * 0.52); // head
          ctx.fillStyle = "rgba(224, 138, 46, 0.95)";
          // mirrored solid triangles \u2014 the old \u2023/\u2039 pair gave the
          // eastbound duck a filled beak and the westbound one a thin chevron
          ctx.fillText(dir > 0 ? "\u25b8" : "\u25c2", (dir > 0 ? dx + 2.3 : dx - 1.3) * CELL_W, y - CELL_H * 0.45); // beak
        };
        const ship = (speed: number, seed: number, rowF: number, alpha: number, amp: number, max = cols - 6) => {
          const { x: sx, dir } = patrol(t, speed, seed, 1, max);
          const sy = rowF * rows + wave(sx, rowF * rows, t, phase) * amp;
          ctx.fillStyle = `rgba(13, 60, 91, ${alpha})`;
          // the sail flips to face the way she's headed
          ctx.fillText(dir > 0 ? SAIL : SAILW, (sx + 1) * CELL_W, (sy - 1) * CELL_H + CELL_H / 2);
          ctx.fillText(HULL, sx * CELL_W, sy * CELL_H + CELL_H / 2);
        };
        if (strip) {
          // every strip keeps a yellow duck on patrol — the silhouettes
          // (ship, island) are company, not stand-ins
          duck(Math.abs(Math.round(phase * 7)), 0.36);
          // scenes vary per strip; phone-width strips skip the ship — at
          // that scale the near-opaque sail reads as an ink blob
          const raw = Math.round(phase * 10) % 3;
          const sceneKind = cols < 70 && raw === 0 ? 2 : raw;
          if (sceneKind === 0) {
            // a small ship tacking back and forth along the horizon
            ship(2.2, phase * 8 + 60, 0.58, 0.95, 0.7);
          } else if (sceneKind === 1) {
            // an island, holding still while the water moves
            const ix = 6 + (Math.abs(Math.round(phase * 53)) % Math.max(8, cols - 20));
            const iy = rows * 0.55;
            ctx.fillStyle = "rgba(110, 100, 80, 0.9)";
            ctx.fillText(ISLE, ix * CELL_W, iy * CELL_H + CELL_H / 2);
          }
          // wide strips hold a second scene: an island for the ship to pass,
          // or a ship for the island to watch
          if (cols >= 110) {
            if (sceneKind === 1) {
              ship(1.8, phase * 5 + 20, 0.5, 0.95, 0.7);
            } else {
              const ix = 6 + (Math.abs(Math.round(phase * 29)) % Math.max(8, cols - 20));
              ctx.fillStyle = "rgba(110, 100, 80, 0.9)";
              ctx.fillText(ISLE, ix * CELL_W, rows * 0.5 * CELL_H + CELL_H / 2);
            }
          }
          // a terracotta buoy holds station while the water moves under it
          const bx = 4 + (Math.abs(Math.round(phase * 37)) % Math.max(6, cols - 8));
          const by = rows * 0.5 + wave(bx, rows * 0.5, t, phase) * 1.6;
          ctx.fillStyle = "rgba(178, 94, 66, 0.9)";
          ctx.fillText("▀", bx * CELL_W, by * CELL_H + CELL_H / 2);
          ctx.fillText("▘", (bx + 0.18) * CELL_W, (by - 0.75) * CELL_H + CELL_H / 2);
          // now and then a fish arcs clear of the swell
          const cyc = (t * 0.9 + phase * 5) % 9;
          if (cyc < 1.1) {
            const fp = cyc / 1.1;
            const fx = cols * 0.25 + (Math.abs(Math.round(phase * 23)) % Math.max(4, Math.floor(cols * 0.5))) + fp * 4;
            const fy = rows * 0.62 - Math.sin(fp * Math.PI) * 2.4;
            ctx.fillStyle = "rgba(90, 130, 160, 0.9)";
            ctx.fillText(fp < 0.5 ? "▞" : "▚", fx * CELL_W, fy * CELL_H + CELL_H / 2);
          }
        }
        if (!strip) {
          // a distant ship on the horizon, half in the haze
          ship(1.1, 30, 0.2, 0.45, 0.4, laneMax(rows * 0.2, 6));
          // one free swimmer, keeping its distance from the log's lane
          duck(70, 0.8, laneMax(rows * 0.8, 3.5));
          // the driftwood: adrift, riding the swell, tacking back and forth.
          // Its lane stays clear of the island \u2014 clamped above the beach so
          // log and captain never run aground (or vanish behind it)
          const lane = isl ? Math.max(3, Math.min(rows * 0.45, isl.cy - isl.ry - 3.2)) : rows * 0.45;
          const { x: wx, dir: wdir } = patrol(t, 1.7, 6, 1, laneMax(lane, WOOD.length + 1));
          const wr = lane + wave(wx, lane, t, phase) * 1.6;
          ctx.fillStyle = "rgba(121, 85, 52, 0.95)"; // driftwood-brown
          ctx.font = 'bold 13px ui-monospace, "SF Mono", Menlo, monospace';
          ctx.fillText(WOOD, wx * CELL_W, wr * CELL_H + CELL_H / 2);
          // and its captain: the debugging duck rides the driftwood, facing
          // wherever the log is headed
          const bx = wx + 2.7;
          const cy = (wr - 0.72) * CELL_H + CELL_H / 2;
          ctx.fillStyle = "rgba(240, 195, 60, 0.98)";
          ctx.fillText("\u2586\u2586", bx * CELL_W, cy);
          ctx.fillText(wdir > 0 ? "\u259d" : "\u2598", (wdir > 0 ? bx + 1.55 : bx - 0.55) * CELL_W, cy - CELL_H * 0.52);
          ctx.fillStyle = "rgba(224, 138, 46, 0.98)";
          ctx.fillText(wdir > 0 ? "\u25b8" : "\u25c2", (wdir > 0 ? bx + 2.3 : bx - 1.3) * CELL_W, cy - CELL_H * 0.45);
          ctx.font = '12px ui-monospace, "SF Mono", Menlo, monospace';
        }
      }
    };
    rafId = requestAnimationFrame(tick);
    cleanups.push(() => cancelAnimationFrame(rafId));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const seaGone = seaLive === false;

  return (
    <div ref={rootRef} className={`landing${seaLive ? " sea-live" : ""}`}>
      <header>
        <div className="wrap nav">
          <a className="wordmark" href="#top" aria-label="driftwood home">
            <Wordmark />
          </a>
          <nav className="nav-right" aria-label="primary">
            <a className="nav-login" href="/dashboard">
              Log in
            </a>
            <a
              className="btn btn-primary"
              href="#book"
              onClick={() => trackCta("nav")}
            >
              Book a demo
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* hero */}
        <div className="hero">
          <div className="wrap hero-grid">
            <div>
              <h1>
                Ship a <em className="voice">custom demo</em>
                <br className="h1-br" /> in every cold message.
              </h1>
              <p className="hero-sub">Grow your revenue with cold outbound that converts.</p>
              <div className="hero-actions">
                <a
                  className="btn btn-primary"
                  href="#book"
                  onClick={() => trackCta("hero")}
                >
                  Book a demo
                </a>
              </div>
              <div className="hero-proof">
                <img src="/yuvan.webp" width="128" height="128" alt="Yuvan Sundrani, founder of Autosana" />
                <div>
                  <p className="proof-quote">&ldquo;amazing stuff, the demos are working so well&rdquo;</p>
                  <p className="proof-attr">
                    <b>Yuvan Sundrani</b> &middot; Founder, Autosana (YC S25)
                  </p>
                </div>
              </div>
            </div>
            <div className="app-window enter-window">
              <img
                src="/dw-demo-dashboard-hero.webp"
                width="2000"
                height="1940"
                fetchPriority="high"
                alt="The driftwood dashboard: LinkedIn connected and sending, 4 meetings booked, 7 replies, pipeline of 124 leads"
              />
            </div>
          </div>
          {!seaGone && <canvas id="sea" ref={seaRef} aria-hidden="true" />}
        </div>

        {/* the favorite: don't send out AI slop — pinned, the arrow draws as you scroll */}
        <section id="compare" className="sheet sheet-white">
          <div className="pin-wrap compare-pin-wrap" ref={cmpWrapRef}>
            <div className="pin">
              <div className="wrap" style={{ width: "100%" }}>
                <div className="compare-head">
                  <h2 style={{ marginInline: "auto" }}>
                    Don't send out <em className="voice">AI slop.</em>
                  </h2>
                  <p className="compare-sub">
                    Same leads, <b>14&times;</b> the replies. Week one at Autosana.
                  </p>
                </div>
                <div className="compare-grid">
                  <svg className="compare-arrow" viewBox="0 0 260 100" aria-hidden="true">
                    <path
                      ref={arrowPathRef}
                      d="M 14 70 C 40 36, 72 20, 102 28 C 130 36, 132 64, 112 62 C 92 60, 98 32, 128 28 C 166 23, 208 36, 234 58"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="3.75"
                      strokeLinecap="round"
                    />
                    <path
                      ref={arrowHeadRef}
                      d="M 234 58 l -15 -2 M 234 58 l -3 -14.5"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="3.75"
                      strokeLinecap="round"
                      style={{ opacity: 0, transition: "opacity 0.3s" }}
                    />
                  </svg>
                  <div>
                    <p className="compare-label">what everyone else sends</p>
                    <div className="email">
                      <p className="email-subject">
                        <span className="redact" role="img" aria-label="name redacted"></span>{" "}
                        &mdash; quick question
                      </p>
                      <div className="email-body">
                        <p>
                          Hey <span className="redact" role="img" aria-label="name redacted"></span>,
                        </p>
                        <p>
                          Hope you're doing well! Huge fan of what you're building &mdash; truly
                          impressive momentum.
                        </p>
                        <p>
                          I'm with an AI-powered QA platform, the{" "}
                          <b>all-in-one way to ship faster with confidence</b>. Teams like yours
                          are seeing <b>huge results</b> &mdash; we'd love to show you how.
                        </p>
                        <p>A few things teams love:</p>
                        <ul>
                          <li>Cut regression time by up to 90%</li>
                          <li>Seamless integration with your existing stack</li>
                          <li>Enterprise-grade security (SOC 2 Type II)</li>
                        </ul>
                        <p>
                          Any chance you have 15 minutes this week? You can{" "}
                          <span className="fake-link">grab time here</span>.
                        </p>
                        <p>
                          Best,
                          <br />
                          <span className="redact" role="img" aria-label="name redacted"></span>
                          <br />
                          SDR @ <span className="redact" role="img" aria-label="company redacted"></span>
                        </p>
                        <p>P.S. Happy to send over a case study if that's easier!</p>
                      </div>
                      <p className="email-fate">Left on opened.</p>
                    </div>
                  </div>
                  <div>
                    <p className="compare-label us">what driftwood sent</p>
                    <div className="thread">
                      <div className="li-head">
                        <span className="li-name">
                          CTO @ <span className="redact" role="img" aria-label="company withheld"></span>
                        </span>
                        <span className="li-presence" aria-hidden="true"></span>
                        <span className="li-icons" aria-hidden="true">
                          &#8943;&nbsp;&nbsp;&#10530;&nbsp;&nbsp;&#10005;
                        </span>
                      </div>
                      <div className="li-body stagger">
                        <div className="divider" role="separator" style={iv(0)}>
                          <hr />
                          <span>4 months of outreach, no reply</span>
                          <hr />
                        </div>
                        <div className="divider" role="separator" style={iv(1)}>
                          <hr />
                          <span>Jul 9</span>
                          <hr />
                        </div>
                        <div className="msg" style={iv(2)}>
                          <span className="avatar">
                            <img src="/yuvan.webp" width="128" height="128" alt="" loading="lazy" decoding="async" />
                          </span>
                          <div>
                            <div className="msg-head">
                              <span className="who">Yuvan Sundrani</span>
                              <span className="when">&middot; 6:57 PM &middot; sent by driftwood</span>
                              <span className="seen" role="img" aria-label="seen">
                                <svg viewBox="0 0 16 16" fill="currentColor">
                                  <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" />
                                  <path
                                    d="M4.5 8.2l2.3 2.3 4.7-4.8"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                  />
                                </svg>
                              </span>
                            </div>
                            <p className="msg-body">
                              hey <span className="redact" role="img" aria-label="name redacted"></span>,
                              found a bug on{" "}
                              <span className="redact" role="img" aria-label="company withheld"></span>.
                              our agents caught your pricing page still promising early access for
                              features lower tiers already have&hellip;
                            </p>
                            <div className="clip">
                              <img
                                src="/demo-still.webp"
                                width="900"
                                height="508"
                                loading="lazy"
                                decoding="async"
                                alt="19 second demo video of Autosana's agent catching a pricing bug on the prospect's site"
                              />
                              <span className="play" aria-hidden="true"></span>
                            </div>
                            <p className="clip-note">
                              <svg viewBox="0 0 46 26" aria-hidden="true">
                                <path
                                  d="M 5 23 C 17 24, 31 19, 38 8"
                                  fill="none"
                                  stroke="var(--accent)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M 38 8 l -8.5 1 M 38 8 l -0.5 8.5"
                                  fill="none"
                                  stroke="var(--accent)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <em>driftwood built this demo</em>
                            </p>
                          </div>
                        </div>
                        <div className="divider" role="separator" style={iv(3)}>
                          <hr />
                          <span>Jul 10 &middot; 12 hours later</span>
                          <hr />
                        </div>
                        <div className="msg" style={iv(4)}>
                          <span className="avatar" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5zm0 2c-4.4 0-9 2.2-9 6.5V24h18v-3.5c0-4.3-4.6-6.5-9-6.5z" />
                            </svg>
                          </span>
                          <div>
                            <div className="msg-head">
                              <span className="who">CTO</span>
                              <span className="when">&middot; 7:18 AM</span>
                            </div>
                            <p className="msg-body">
                              send me a blurb + demos to{" "}
                              <span
                                className="redact"
                                role="img"
                                aria-label="address redacted"
                                style={{ width: "6.5em" }}
                              ></span>{" "}
                              and I'll forward to my team - best
                            </p>
                          </div>
                        </div>
                        <div className="divider win" role="separator" style={iv(5)}>
                          <hr />
                          <span>Call booked &middot; Jul 12</span>
                          <hr />
                        </div>
                      </div>
                      <div className="li-compose" aria-hidden="true">
                        <span className="li-input">Write a message&hellip;</span>
                        <span className="li-send">Send</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!seaGone && <canvas className="sea-strip" aria-hidden="true" />}
        </section>

        {/* how it works: pinned scrub */}
        <section id="how" className="sheet sheet-white">
          <div className="pin-wrap" ref={howWrapRef}>
            <div className="pin">
              <div className="wrap how-grid">
                <div>
                  <h2>
                    The agent does the <em className="voice">whole job.</em>
                  </h2>
                  <ol className="rail-list">
                    <li data-step="0" className="active">
                      <span>01</span>
                      <div>
                        Researches the prospect
                        <p className="rail-sub">Reads everything public about them.</p>
                      </div>
                    </li>
                    <li data-step="1">
                      <span>02</span>
                      <div>
                        Builds them a custom demo
                        <p className="rail-sub">Shows what your product does for them.</p>
                      </div>
                    </li>
                    <li data-step="2">
                      <span>03</span>
                      <div>
                        Sends it from your account
                        <p className="rail-sub">Human reviewed before it sends.</p>
                      </div>
                    </li>
                  </ol>
                </div>
                <div className="stage">
                  <div className="stage-card on">
                    <div className="artifact">
                      <div className="artifact-bar" aria-hidden="true">
                        #driftwood-sh &middot; the agent at work
                      </div>
                      <img
                        src="/slack-trace.webp"
                        width="2000"
                        height="1350"
                        loading="lazy"
                        decoding="async"
                        alt="The driftwood agent in Slack: asked for a Brex demo, it reads its build skill and spawns research subagents for Brex and Ramp"
                      />
                    </div>
                  </div>
                  <div className="stage-card">
                    <div className="artifact">
                      <div className="artifact-bar" aria-hidden="true">
                        the demo it built &middot; a live page for Brex
                      </div>
                      <img
                        src="/brex-demo.webp"
                        width="1280"
                        height="1420"
                        loading="lazy"
                        decoding="async"
                        alt="The demo the agent built: a Brex-branded pitch page it could send Notion's finance team"
                      />
                    </div>
                  </div>
                  <div className="stage-card">
                    <div className="artifact">
                      <div className="artifact-bar" aria-hidden="true">
                        your review queue &middot; nothing sends without you
                      </div>
                      <img
                        src="/review-queue.webp"
                        width="2020"
                        height="2426"
                        loading="lazy"
                        decoding="async"
                        alt="The driftwood review queue: each outbound message waiting for your approve or deny"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <canvas className="sea-strip" aria-hidden="true" />
        </section>

        {/* close → the booking section: the Cal.com calendar lives inline
            here, and all three CTAs resolve to it */}
        <section id="book" className="close-sect sheet wash-b">
          <div className="wrap sect">
            <h2>
              See what we'd send <em className="voice">your</em> prospects.
            </h2>
            <p className="book-sub">Pick a time below. 30 minutes with Aayush, the founder.</p>
            <div className="cal-window">
              <InlineBooking />
            </div>
            {/* the old link survives as the fallback path (embed blocked or slow) */}
            <p className="cal-fallback">
              If the calendar does not load, book at{" "}
              <a href={CAL_URL}>cal.com/aayush-gupta-qyilz6/30min</a> or email{" "}
              <a href="mailto:aayush@driftwood.sh">aayush@driftwood.sh</a>.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <div className="foot-top">
            <a className="wordmark" href="#top" aria-label="back to top">
              <Wordmark label={false} />
            </a>
            <nav className="foot-links" aria-label="site">
              <a href="/customers/autosana">Customers</a>
              <a href="/demo-led-outbound">Demo-led outbound</a>
              <a href="/faq">FAQ</a>
              <a href="/founder-led-sales">Founder-led sales</a>
              <a href="/cold-outbound-benchmarks">Outbound benchmarks</a>
              <a href="/ai-sdr">What is an AI SDR</a>
            </nav>
            <nav className="foot-links foot-compare" aria-label="compare">
              <span>Compare:</span>
              <a href="/best-ai-sdr-tools">Compare AI SDR tools</a>
              <a href="/alternatives/instantly">Instantly alternatives</a>
              <a href="/alternatives/clay">Clay alternatives</a>
              <a href="/alternatives/apollo">Apollo alternatives</a>
              <a href="/alternatives/artisan">Artisan alternatives</a>
              <a href="/alternatives/11x">11x alternatives</a>
              <a href="/vs/artisan">driftwood vs Artisan</a>
              <a href="/vs/11x">driftwood vs 11x</a>
            </nav>
          </div>
          <div className="foot-bottom">
            <p className="foot-def">
              driftwood is an AI sales agent for demo-led outbound: it researches each prospect,
              builds a working demo of your product for their business, and sends from your account
              after human review.
            </p>
            <div className="foot-line">
              <a href="mailto:aayush@driftwood.sh">aayush@driftwood.sh</a>
              <span>&copy; 2026 driftwood</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
