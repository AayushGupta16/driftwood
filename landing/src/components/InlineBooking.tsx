/* Cal.com inline booking embed — client-only. The landing is prerendered
   (renderToString), so the render path here is static markup with no browser
   APIs; everything Cal happens inside the effect, and only once the #book
   section nears the viewport or a CTA is clicked. Vanilla loader over
   @calcom/embed-react: no new dependency in the prerendered bundle, zero
   risk of module-scope browser access at prerender time. */
import { useEffect, useRef } from "react";
import { trackBooking } from "../track";

/* the official Cal.com (C, A, L) loader, ported 1:1 to TS: it stubs
   window.Cal with a command queue that embed.js drains once it loads */
interface CalApi {
  (...args: unknown[]): void;
  q: unknown[];
  ns: Record<string, CalApi>;
  loaded?: boolean;
}
declare global {
  interface Window {
    Cal?: CalApi;
  }
}

function initCalLoader(): CalApi {
  const p = (a: CalApi, ar: unknown) => {
    a.q.push(ar);
  };
  if (!window.Cal) {
    const cal = function (...ar: unknown[]) {
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        document.head.appendChild(document.createElement("script")).src =
          "https://app.cal.com/embed/embed.js";
        cal.loaded = true;
      }
      if (ar[0] === "init") {
        const api = function (...args: unknown[]) {
          p(api, args);
        } as CalApi;
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === "string") {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar);
          p(cal, ["initNamespace", namespace]);
        } else p(cal, ar);
        return;
      }
      p(cal, ar);
    } as CalApi;
    window.Cal = cal;
  }
  return window.Cal;
}

export default function InlineBooking() {
  const slotRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const load = () => {
      if (started.current) return;
      started.current = true;
      // preconnect at load time, not in index.html — startup stays lean
      const pc = document.createElement("link");
      pc.rel = "preconnect";
      pc.href = "https://app.cal.com";
      document.head.appendChild(pc);
      const cal = initCalLoader();
      cal("init", "30min", { origin: "https://app.cal.com" });
      cal.ns["30min"]("inline", {
        elementOrSelector: el,
        calLink: "aayush-gupta-qyilz6/30min",
        config: { layout: "month_view" },
      });
      cal.ns["30min"]("ui", {
        styles: { branding: { brandColor: "#15557e" } }, // tide, the one accent
        hideEventTypeDetails: false,
        layout: "month_view",
      });
      cal.ns["30min"]("on", {
        action: "bookingSuccessful",
        callback: () => trackBooking("booking_confirmed"),
      });
      trackBooking("booking_calendar_open");
    };
    // load when the section nears the viewport…
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    // …or immediately on any CTA click, so the calendar is mounting while
    // the smooth scroll travels
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a[href="#book"]')) load();
    };
    document.addEventListener("click", onClick);
    return () => {
      io.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, []);

  return <div ref={slotRef} className="cal-slot" />;
}
