/* Landing page — production port of design/landing-draft-v7.html.
   The markup, CSS (scoped under .landing in index.css), scroll scrubs, and
   the three.js sea are ported 1:1 from the approved draft. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CAL_URL } from "./components/BookDemo";
import HelmMark from "./components/HelmMark";

/* style={{ "--i": n }} helper for the thread stagger delays */
const iv = (n: number) => ({ "--i": n } as CSSProperties);

/* the reply dot grids (1-in-100 vs 1-in-7 shown as 14-in-100). The tide
   grid's hits ride a sine across the 20 columns so the replies read as a
   swell, not a pattern. */
function Dots({ total, hits, us }: { total: number; hits: number; us?: boolean }) {
  const cols = 20;
  const hitIdx = new Set<number>();
  if (us && hits > 1) {
    for (let k = 0; k < hits; k++) {
      const col = Math.round((k * (cols - 1)) / (hits - 1));
      const row = Math.max(0, Math.min(total / cols - 1, Math.round(2 + 1.9 * Math.sin(col * 0.55 + 0.9))));
      hitIdx.add(row * cols + col);
    }
  } else {
    for (let k = 0; k < hits; k++) hitIdx.add(Math.round(((k + 0.5) * total) / hits) - 1);
  }
  let d = 0;
  return (
    <div className={us ? "dots us" : "dots"} aria-hidden="true">
      {Array.from({ length: total }, (_, i) =>
        hitIdx.has(i) ? (
          <i key={i} className="hit" style={{ "--d": d++ } as CSSProperties} />
        ) : (
          <i key={i} />
        ),
      )}
    </div>
  );
}

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
  const weekWrapRef = useRef<HTMLDivElement>(null);
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

  /* the three pinned scrubs: week dots, how stage, compare arrow */
  useEffect(() => {
    const root = rootRef.current;
    const pinWrap = howWrapRef.current;
    const weekWrap = weekWrapRef.current;
    const cmpWrap = cmpWrapRef.current;
    const arrowPath = arrowPathRef.current;
    const arrowHead = arrowHeadRef.current;
    if (!root || !pinWrap || !weekWrap || !cmpWrap || !arrowPath || !arrowHead) return;

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

    // week-one: scroll populates the reply dots, then the attribution arrow
    // draws itself at the video clip as the payoff
    const beforeHits = [...root.querySelectorAll(".dots:not(.us) i.hit")];
    const usHits = [...root.querySelectorAll(".dots.us i.hit")];
    const note = root.querySelector(".clip-note") as HTMLElement | null;
    const notePath = note?.querySelector("path:nth-of-type(1)") as SVGPathElement | null;
    const noteHead = note?.querySelector("path:nth-of-type(2)") as SVGPathElement | null;
    const noteEm = note?.querySelector("em") as HTMLElement | null;
    let noteLen = 0;
    if (notePath && !reduceMotion) {
      noteLen = notePath.getTotalLength();
      notePath.style.strokeDasharray = `${noteLen}`;
    }
    if (scrubOk) {
      let rafW = 0;
      const updateW = () => {
        rafW = 0;
        const total = weekWrap.offsetHeight - innerHeight;
        if (total <= 0) return;
        const p = Math.min(1, Math.max(0, -weekWrap.getBoundingClientRect().top / total));
        beforeHits.forEach((d) => d.classList.toggle("lit", p > 0.14));
        const n = Math.min(
          usHits.length,
          Math.max(0, Math.floor(((p - 0.22) / 0.46) * usHits.length)),
        );
        usHits.forEach((d, i) => d.classList.toggle("lit", i < n));
        // the payoff: after the grid fills, credit the demo
        const np = Math.min(1, Math.max(0, (p - 0.72) / 0.2));
        if (notePath) notePath.style.strokeDashoffset = `${noteLen * (1 - np)}`;
        if (noteHead) noteHead.style.opacity = np > 0.96 ? "1" : "0";
        if (noteEm) noteEm.style.opacity = `${np}`;
      };
      const onScrollW = () => {
        if (!rafW) rafW = requestAnimationFrame(updateW);
      };
      addEventListener("scroll", onScrollW, { passive: true });
      cleanups.push(() => {
        removeEventListener("scroll", onScrollW);
        if (rafW) cancelAnimationFrame(rafW);
      });
      updateW();
    } else if (!reduceMotion) {
      // touch: no pin, but the same choreography rides the viewport — the
      // grids fill, each thread message scrubs in, then the arrow draws
      const rateViz = root.querySelector(".rate-viz");
      const msgs = [...root.querySelectorAll(".stagger .msg, .stagger .divider")] as HTMLElement[];
      let rafM = 0;
      const updateM = () => {
        rafM = 0;
        const vh = innerHeight;
        if (rateViz) {
          const r = rateViz.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85)));
          beforeHits.forEach((d) => d.classList.toggle("lit", p > 0.3));
          const n = Math.min(
            usHits.length,
            Math.max(0, Math.floor(((p - 0.38) / 0.5) * usHits.length)),
          );
          usHits.forEach((d, i) => d.classList.toggle("lit", i < n));
        }
        msgs.forEach((el) => {
          const r = el.getBoundingClientRect();
          const q = Math.min(1, Math.max(0, (vh - r.top - 30) / (vh * 0.22)));
          el.style.opacity = `${q}`;
          el.style.transform = `translateY(${(1 - q) * 12}px)`;
        });
        if (note && notePath && noteEm) {
          const nr = note.getBoundingClientRect();
          const np = Math.min(1, Math.max(0, (vh - nr.top) / (vh * 0.45)));
          notePath.style.strokeDashoffset = `${noteLen * (1 - np)}`;
          if (noteHead) noteHead.style.opacity = np > 0.96 ? "1" : "0";
          noteEm.style.opacity = `${np}`;
        }
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
      beforeHits.concat(usHits).forEach((d) => d.classList.add("lit"));
      /* the note stays fully visible under reduced motion */
    }

    // compare: the hand-drawn arrow scrubs with the pinned scroll
    const arrowLen = arrowPath.getTotalLength();
    arrowPath.style.strokeDasharray = `${arrowLen}`;
    if (scrubOk) {
      let raf2 = 0;
      const drawArrow = () => {
        raf2 = 0;
        const total = cmpWrap.offsetHeight - innerHeight;
        if (total <= 0) return;
        const p = Math.min(1, Math.max(0, -cmpWrap.getBoundingClientRect().top / total));
        const draw = Math.min(1, Math.max(0, (p - 0.14) / 0.62));
        arrowPath.style.strokeDashoffset = `${arrowLen * (1 - draw)}`;
        arrowHead.style.opacity = draw > 0.97 ? "1" : "0";
      };
      const onScroll2 = () => {
        if (!raf2) raf2 = requestAnimationFrame(drawArrow);
      };
      addEventListener("scroll", onScroll2, { passive: true });
      cleanups.push(() => {
        removeEventListener("scroll", onScroll2);
        if (raf2) cancelAnimationFrame(raf2);
      });
      drawArrow();
    } else if (!reduceMotion) {
      // touch: the arrow draws as it rides up the viewport, un-pinned
      const svgEl = arrowPath.ownerSVGElement;
      let raf3 = 0;
      const drawM = () => {
        raf3 = 0;
        if (!svgEl) return;
        const r = svgEl.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight - r.top - 30) / (innerHeight * 0.4)));
        arrowPath.style.strokeDashoffset = `${arrowLen * (1 - p)}`;
        arrowHead.style.opacity = p > 0.95 ? "1" : "0";
      };
      const onScroll3 = () => {
        if (!raf3) raf3 = requestAnimationFrame(drawM);
      };
      addEventListener("scroll", onScroll3, { passive: true });
      cleanups.push(() => {
        removeEventListener("scroll", onScroll3);
        if (raf3) cancelAnimationFrame(raf3);
      });
      drawM();
    } else {
      arrowPath.style.strokeDashoffset = "0";
      arrowHead.style.opacity = "1";
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
    const CHARS = [" ", "\u00b7", "-", "~", "\u2248", "\u224b"]; // · - ~ ≈ ≋ by wave height
    const CELL_W = 9;
    const CELL_H = 13;
    const WOOD = "\u2597\u2584\u2584\u2584\u2584\u2584\u2584\u2596"; // ▗▄▄▄▄▄▄▖ a drifting log
    const SAIL = "\u259f\u258c"; // ▟▌
    const HULL = "\u2580\u2580\u2580\u2580"; // ▀▀▀▀
    const ISLE = "\u2581\u2582\u2583\u2584\u2583\u2582\u2581"; // ▁▂▃▄▃▂▁

    type Mount = {
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      strip: boolean;
      phase: number;
      cols: number;
      rows: number;
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
    const resize = () =>
      mounts.forEach((m) => {
        const w = m.canvas.clientWidth,
          h = m.canvas.clientHeight;
        if (!w || !h) return;
        m.canvas.width = w * dpr;
        m.canvas.height = h * dpr;
        m.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        m.ctx.font = '12px ui-monospace, "SF Mono", Menlo, monospace';
        m.ctx.textBaseline = "middle";
        m.cols = Math.ceil(w / CELL_W);
        m.rows = Math.ceil(h / CELL_H);
      });
    addEventListener("resize", resize);
    cleanups.push(() => removeEventListener("resize", resize));
    const sizeMount = (m: Mount) => {
      const w = m.canvas.clientWidth,
        h = m.canvas.clientHeight;
      if (!w || !h) return;
      m.canvas.width = w * dpr;
      m.canvas.height = h * dpr;
      m.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      m.ctx.font = '11px ui-monospace, "SF Mono", Menlo, monospace';
      m.ctx.textBaseline = "middle";
      m.cols = Math.ceil(w / CELL_W);
      m.rows = Math.ceil(h / CELL_H);
      m.phase = (m.canvas.getBoundingClientRect().top + scrollY) * 0.02;
    };
    resize();

    const wave = (x: number, y: number, t: number, phase: number) =>
      Math.sin(x * 0.42 + t * 1.05 + phase) * 0.42 +
      Math.sin(y * 0.9 + t * 0.7 + phase) * 0.24 +
      Math.sin((x + y) * 0.23 + t * 1.3 + phase * 0.6) * 0.16 +
      Math.sin(x * 0.07 - t * 1.1 + phase) * 0.34; // the rolling swell

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
        const { ctx, cols, rows, strip, phase } = m;
        ctx.clearRect(0, 0, m.canvas.clientWidth, m.canvas.clientHeight);
        for (let r = 0; r < rows; r++) {
          // hero: sparse at the horizon, denser toward the bottom
          const depth = strip ? 0.85 : 0.5 + (r / rows) * 0.45;
          ctx.fillStyle = `rgba(21, 85, 126, ${depth * 0.88})`;
          const y = r * CELL_H + CELL_H / 2;
          for (let c = 0; c < cols; c++) {
            const v = wave(c, r, t, phase); // -1..1
            const idx = Math.max(
              0,
              Math.min(CHARS.length - 1, Math.round((v + 1.16) * 0.5 * (CHARS.length - 2) + (strip ? 0.7 : (r / rows) * 1.6 - 0.05) - 0.35)),
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
        const duck = (seed: number, rowF: number, dir: number) => {
          const span = cols + 16;
          const dx = -8 + ((((t * 1.15 * dir + seed) % span) + span) % span);
          const dy = rowF * rows + wave(dx, rowF * rows, t, phase) * 1.9;
          const y = dy * CELL_H + CELL_H / 2;
          ctx.fillStyle = "rgba(240, 195, 60, 0.95)";
          ctx.fillText("\u2586\u2586", dx * CELL_W, y); // body
          ctx.fillText(dir > 0 ? "\u259d" : "\u2598", (dir > 0 ? dx + 1.55 : dx - 0.55) * CELL_W, y - CELL_H * 0.52); // head
          ctx.fillStyle = "rgba(224, 138, 46, 0.95)";
          ctx.fillText(dir > 0 ? "\u2023" : "\u2039", (dir > 0 ? dx + 2.35 : dx - 1.15) * CELL_W, y - CELL_H * 0.45); // beak
        };
        if (strip) {
          // varies per strip; phone-width strips swap the ship for a duck —
          // at that scale the near-opaque sail reads as an ink blob
          const raw = Math.round(phase * 10) % 3;
          const sceneKind = cols < 70 && raw === 0 ? 2 : raw;
          if (sceneKind === 0) {
            // a small ship on the horizon, under sail
            const span = cols + 30;
            const sx = -10 + ((t * 2.2 + phase * 8 + 60) % span);
            const sy = rows * 0.58 + wave(sx, rows * 0.58, t, phase) * 0.7;
            ctx.fillStyle = "rgba(13, 60, 91, 0.95)";
            ctx.fillText(SAIL, (sx + 1) * CELL_W, (sy - 1) * CELL_H + CELL_H / 2);
            ctx.fillText(HULL, sx * CELL_W, sy * CELL_H + CELL_H / 2);
          } else if (sceneKind === 1) {
            // an island, holding still while the water moves
            const ix = 6 + (Math.abs(Math.round(phase * 53)) % Math.max(8, cols - 20));
            const iy = rows * 0.55;
            ctx.fillStyle = "rgba(110, 100, 80, 0.9)";
            ctx.fillText(ISLE, ix * CELL_W, iy * CELL_H + CELL_H / 2);
          } else {
            duck(Math.abs(Math.round(phase * 7)), 0.55, 1);
          }
        }
        if (!strip) {
          // a distant ship on the horizon, half in the haze
          const shx = -8 + ((t * 1.1 + 30) % (cols + 20));
          const shy = rows * 0.2 + wave(shx, rows * 0.2, t, phase) * 0.4;
          ctx.fillStyle = "rgba(13, 60, 91, 0.45)";
          ctx.fillText(SAIL, (shx + 1) * CELL_W, (shy - 1) * CELL_H + CELL_H / 2);
          ctx.fillText(HULL, shx * CELL_W, shy * CELL_H + CELL_H / 2);
          // one free swimmer
          duck(70, 0.78, -1);
          // the driftwood: adrift, riding the swell
          const span = cols + WOOD.length + 20;
          const wx = -WOOD.length - 8 + ((t * 1.7 + 6) % span); // west to east
          const wr = rows * 0.45 + wave(wx, rows * 0.45, t, phase) * 1.6;
          ctx.fillStyle = "rgba(121, 85, 52, 0.95)"; // driftwood-brown
          ctx.font = 'bold 13px ui-monospace, "SF Mono", Menlo, monospace';
          ctx.fillText(WOOD, wx * CELL_W, wr * CELL_H + CELL_H / 2);
          // and its captain: the duck rides the driftwood
          const cy = (wr - 0.72) * CELL_H + CELL_H / 2;
          ctx.fillStyle = "rgba(240, 195, 60, 0.98)";
          ctx.fillText("\u2586\u2586", (wx + 2.4) * CELL_W, cy);
          ctx.fillText("\u259d", (wx + 3.95) * CELL_W, cy - CELL_H * 0.52);
          ctx.fillStyle = "rgba(224, 138, 46, 0.98)";
          ctx.fillText("\u2023", (wx + 4.75) * CELL_W, cy - CELL_H * 0.45);
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
            <a className="btn" href={CAL_URL}>
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
                Ship <em className="voice">a custom demo</em> in every cold message.
              </h1>
              <p className="hero-sub">Grow your revenue with cold outbound that converts.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href={CAL_URL}>
                  Book a demo
                </a>
              </div>
            </div>
            <div className="app-window enter-window">
              <img
                src="/dw-demo-dashboard-hero.png"
                alt="The driftwood dashboard: LinkedIn connected and sending, 4 meetings booked, 7 replies, pipeline of 124 leads"
              />
            </div>
          </div>
          {!seaGone && <canvas id="sea" ref={seaRef} aria-hidden="true" />}
        </div>

        {/* week one + the founder */}
        <section id="week-one" className="sheet sheet-white">
          <div className="pin-wrap week-pin-wrap" ref={weekWrapRef}>
            <div className="pin pin-open">
              <div className="wrap week-sect">
                <div className="week-grid">
                  <div className="week-left">
                    <h2>
                      Send something <em className="voice">worth a reply.</em>
                    </h2>
                    <div
                      className="rate-viz"
                      aria-label="Reply rate: about 1 in 100 before driftwood, 1 in 7 with driftwood"
                    >
                      <p className="rate-mult">
                        Same leads. <em>14&times;</em> the replies.
                      </p>
                      <div className="dots-block">
                        <div className="dots-label">
                          <span>before</span>
                          <b>&lt;1 in 100</b>
                        </div>
                        <Dots total={100} hits={1} />
                      </div>
                      <div className="dots-block">
                        <div className="dots-label">
                          <span>with driftwood &middot; week one at Autosana</span>
                          <b>1 in 7</b>
                        </div>
                        <Dots total={100} hits={14} us />
                      </div>
                    </div>
                    <div className="founder">
                      <img
                        src="/yuvan.png"
                        alt="Yuvan Sundrani, founder of Autosana, speaking on stage"
                      />
                      <div>
                        <p className="founder-quote">&ldquo;amazing stuff, love the demo&rdquo;</p>
                        <p className="founder-attr">
                          <b>Yuvan Sundrani</b> &middot; Founder, Autosana (YC S25)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
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
                            <img src="/yuvan.png" alt="" />
                          </span>
                          <div>
                            <div className="msg-head">
                              <span className="who">Yuvan Sundrani</span>
                              <span className="when">&middot; 6:57 PM &middot; sent by driftwood</span>
                              <span className="seen" aria-label="seen">
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
                                src="/demo-still.png"
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
                        <p className="rail-sub">
                          Uses all publicly available information to understand the prospect.
                        </p>
                      </div>
                    </li>
                    <li data-step="1">
                      <span>02</span>
                      <div>
                        Builds them a custom demo
                        <p className="rail-sub">
                          Agents show them what using your product would actually look like.
                        </p>
                      </div>
                    </li>
                    <li data-step="2">
                      <span>03</span>
                      <div>
                        Sends it from your account
                        <p className="rail-sub">
                          <b>Every message is human reviewed</b> before it sends.
                        </p>
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
                        src="/slack-trace.png"
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
                        src="/brex-demo.png"
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
                        src="/review-queue.png"
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

        {/* the favorite: don't send out AI slop — pinned, the arrow draws as you scroll */}
        <section id="compare" className="sheet sheet-white">
          <div className="pin-wrap compare-pin-wrap" ref={cmpWrapRef}>
            <div className="pin">
              <div className="wrap" style={{ width: "100%" }}>
                <div className="compare-head">
                  <h2 style={{ marginInline: "auto" }}>
                    Don't send out <em className="voice">AI slop.</em>
                  </h2>
                </div>
                <div className="compare-grid">
                  <svg className="compare-arrow" viewBox="0 0 260 100" aria-hidden="true">
                    <path
                      ref={arrowPathRef}
                      d="M 14 70 C 40 36, 72 20, 102 28 C 130 36, 132 64, 112 62 C 92 60, 98 32, 128 28 C 166 23, 208 36, 234 58"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      ref={arrowHeadRef}
                      d="M 234 58 l -15 -2 M 234 58 l -3 -14.5"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{ opacity: 0, transition: "opacity 0.3s" }}
                    />
                  </svg>
                  <div>
                    <p className="compare-label">what everyone else sends</p>
                    <div className="email">
                      <p className="email-subject">Joe &mdash; quick question (Square x Joe's Pizza)</p>
                      <div className="email-body">
                        <p>Hey Joe,</p>
                        <p>
                          Huge fan of what you're building at Joe's Pizza &mdash; a true NYC
                          institution. Incredible legacy.
                        </p>
                        <p>
                          I'm with Square, the <b>all-in-one platform to run and grow your business</b>.
                          We power millions of merchants and are growing <b>40% year over year</b>{" "}
                          &mdash; businesses like yours are seeing huge results.
                        </p>
                        <p>
                          Would love to connect and show you what we offer. Any chance you have 15
                          minutes this week? You can <span className="fake-link">grab time here</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="compare-label us">what driftwood sent</p>
                    <div className="email us">
                      <p className="email-subject">Joe's doesn't take online orders, so we built it</p>
                      <div className="email-body">
                        <p>Hi Joe,</p>
                        <p>
                          We turned your menu into a <b>live ordering page on Square</b> this morning,
                          then placed a test order to make sure it works. The link is below.
                        </p>
                        <p>We already run online ordering for hundreds of local spots like yours.</p>
                        <p>Open to a quick call this week?</p>
                      </div>
                      <div className="order-demo">
                        <div className="overflow-hidden rounded-xl border border-line bg-white">
                          <div className="relative bg-[#eef0f3] p-2.5 pb-0">
                            <div className="overflow-hidden rounded-t-lg border border-b-0 border-[#d8dce2] bg-white shadow-sm">
                              <div className="flex items-center gap-1.5 border-b border-[#e8eaee] bg-[#f6f7f9] px-2.5 py-1.5">
                                <span className="size-1.5 rounded-full bg-[#d9dde3]" />
                                <span className="size-1.5 rounded-full bg-[#d9dde3]" />
                                <span className="size-1.5 rounded-full bg-[#d9dde3]" />
                                <span className="ml-1.5 rounded bg-white px-2 py-0.5 font-mono text-[10.5px] text-[#7a8190] ring-1 ring-[#e8eaee]">
                                  joespizza.nyc/order
                                </span>
                              </div>
                              <div className="px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[12px] font-bold text-ink">Joe's Pizza</span>
                                  <span className="rounded-full bg-tide-wash px-1.5 py-0.5 font-mono text-[9px] font-medium text-tide">
                                    order online
                                  </span>
                                </div>
                                <div className="mt-1.5 space-y-1">
                                  {[
                                    { name: "cheese slice", price: "$3.50" },
                                    { name: "pepperoni slice", price: "$4.75" },
                                    { name: "garlic knots (4)", price: "$4.00" },
                                  ].map((it) => (
                                    <div
                                      key={it.name}
                                      className="flex items-center justify-between rounded-md bg-[#f1f3f6] px-2 py-1 ring-1 ring-[#e6e9ee]"
                                    >
                                      <span className="font-mono text-[10px] font-medium text-[#3c424e]">{it.name}</span>
                                      <span className="flex items-center gap-1.5">
                                        <span className="font-mono text-[10px] text-[#7a8190]">{it.price}</span>
                                        <span className="flex size-3.5 items-center justify-center rounded-full bg-white font-mono text-[11px] leading-none text-tide ring-1 ring-[#e6e9ee]">
                                          +
                                        </span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-1.5 flex items-center justify-between rounded-md bg-[#16181d] px-2 py-1">
                                  <span className="font-mono text-[9.5px] text-white/70">2 slices &middot; $8.25</span>
                                  <span className="text-[9.5px] font-semibold text-white">Checkout &rarr;</span>
                                </div>
                              </div>
                            </div>
                            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 py-0.5 pl-1.5 pr-2 font-mono text-[10.5px] font-medium text-white">
                              <span className="size-1.5 rounded-full bg-[#3fb98a]" />
                              LIVE
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tide">
                                <svg viewBox="0 0 24 24" className="size-3 stroke-white" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 17 17 7M9 7h8v8" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="m-0 truncate text-[13.5px] font-semibold leading-tight text-ink">joespizza.nyc, live ordering page</p>
                                <p className="m-0 truncate text-[11.5px] leading-tight text-ink-faint">built from their menu, on Square</p>
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-tide-wash px-2 py-0.5 font-mono text-[10.5px] font-medium text-tide">live</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!seaGone && <canvas className="sea-strip" aria-hidden="true" />}
        </section>

        {/* close */}
        <section className="close-sect sheet wash-b">
          <div className="wrap sect">
            <h2>
              See what we'd send <em className="voice">your</em> prospects.
            </h2>
            <a className="btn btn-primary" href={CAL_URL}>
              Book a demo
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot">
          <a className="wordmark" href="#top" aria-label="back to top">
            <Wordmark label={false} />
          </a>
          <div className="foot-line">
            <a href="mailto:aayush@driftwood.sh">aayush@driftwood.sh</a>
            <span>&copy; 2026 driftwood</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
