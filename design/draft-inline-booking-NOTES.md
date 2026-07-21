# Inline booking calendar: integration notes

Companion to `draft-inline-booking.html`. Draft only; nothing here is applied.

The delta: the outbound Cal.com link becomes an inline embed in the existing
close section (`id="book"`). Nav and hero CTAs become `#book` anchors. Nothing
else on the page moves.

## a) vercel.json CSP edits (required, or the embed is blocked)

Current CSP (`landing/vercel.json`, the `headers` entry with source
`/((?!d/|api/|auth/|linkedin/|_vercel/).*)`):

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

Three precise edits, all in that one `value` string:

1. `script-src 'self'` becomes `script-src 'self' https://app.cal.com`
   (the loader fetches `https://app.cal.com/embed/embed.js`).
2. `connect-src 'self'` becomes `connect-src 'self' https://app.cal.com`
   (embed.js talks to app.cal.com from the parent page).
3. Add a new directive: `frame-src https://app.cal.com`
   (there is no frame-src today, so iframes fall back to `default-src 'self'`
   and the booking iframe would be blocked).

Full new value:

```
default-src 'self'; script-src 'self' https://app.cal.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://app.cal.com; frame-src https://app.cal.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

No other directive changes:

- `img-src` already allows `https:`, which covers any loader imagery.
- `style-src` already has `'unsafe-inline'`, which covers the inline styles
  embed.js sets on its container.
- Fonts and API calls inside the iframe are governed by app.cal.com's own CSP,
  not ours.
- `frame-ancestors 'none'` stays; that controls who can frame us, not who we
  frame.

Verify on the Vercel preview with the devtools console before prod: if Cal
reports a violation from another host (for example `cal.com` on a redirect),
add that exact host to the offending directive and nothing more.

## b) App.tsx / BookDemo.tsx integration sketch (client-only)

The landing is prerendered, so the render path must stay browser-API-free.
The embed loads only on the client, only when needed.

New component `landing/src/components/InlineBooking.tsx`:

```tsx
// render path: static markup only, no browser APIs. Prerender-safe.
export default function InlineBooking() {
  const slotRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const load = () => {
      if (started.current) return;
      started.current = true;
      // preconnect at load time, not in index.html (keeps startup lean)
      const pc = document.createElement("link");
      pc.rel = "preconnect"; pc.href = "https://app.cal.com";
      document.head.appendChild(pc);
      initCalSnippet(); // the official (C, A, L) loader IIFE, pasted verbatim;
                        // appends https://app.cal.com/embed/embed.js to <head>
      window.Cal("init", "30min", { origin: "https://app.cal.com" });
      window.Cal.ns["30min"]("inline", {
        elementOrSelector: el,
        calLink: "aayush-gupta-qyilz6/30min",
        config: { layout: "month_view" },
      });
      window.Cal.ns["30min"]("ui", {
        styles: { branding: { brandColor: "#15557e" } }, // tide, the one accent
      });
      window.Cal.ns["30min"]("on", {
        action: "bookingSuccessful",
        callback: () => trackBooking("booking_confirmed"),
      });
      trackBooking("booking_calendar_open");
    };
    // load when the section nears the viewport
    const io = new IntersectionObserver(
      (es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } },
      { rootMargin: "600px" },
    );
    io.observe(el);
    // or immediately on any CTA click, so the calendar is mounting while
    // the smooth scroll travels
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a[href="#book"]')) load();
    };
    document.addEventListener("click", onClick);
    return () => { io.disconnect(); document.removeEventListener("click", onClick); };
  }, []);

  return <div ref={slotRef} className="cal-slot" />;
}
```

Notes on the sketch:

- Vanilla snippet over `@calcom/embed-react`: no new dependency in the
  prerendered bundle, and zero risk of module-scope browser access at
  prerender time. If we prefer the package, `import("@calcom/embed-react")`
  dynamically inside `load()`, never at module scope.
- App.tsx deltas: nav and hero `<a>` get `href="#book"` (keep
  `trackCta("nav")` / `trackCta("hero")`); the close section keeps its `h2`
  and gains `id="book"`, the sub line, `<InlineBooking />` inside the
  `.cal-window` chrome, and the fallback line with `CAL_URL`.
- BookDemo.tsx: `CAL_URL` export stays (the fallback link and the other pages
  use it). The Pricing page and Chrome nav keep the outbound `BookDemo`
  component for now; out of scope for this delta.
- `.cal-window` reserves `min-height` (about 39rem desktop) so the mount
  causes no layout shift.
- Reduced motion changes nothing here; the embed is content, not motion.

## c) Lighthouse cost and the lazy-load gate

- Eager cost (if we loaded it at startup): embed.js plus a full booking app
  inside the iframe (several hundred KB of third-party JS and API calls).
  Expect a multi-point perf drop from added network weight and main-thread
  work; current perf is 92 and this is the kind of load that pulls it to the
  mid 80s.
- Mitigation (in the sketch above): the embed loads only when the `#book`
  section scrolls within 600px of the viewport or a CTA is clicked.
  Lighthouse audits the initial viewport and does not scroll, so measured
  scores should stay where they are (within normal variance). Nothing new
  loads in index.html at startup, including the preconnect.
- CLS: guarded by the reserved `min-height` on `.cal-window`.
- NEVER poll prod URLs to check this; verify Lighthouse on the Vercel preview
  build.

## d) Measuring win or loss (PostHog)

Existing signal: `book_demo` with `placement: nav | hero | close` fires on CTA
click (both sinks, see `track.ts`). Today that is a click on an outbound link;
the actual booking happens on cal.com where we cannot see it.

After the change:

- Keep `book_demo` firing exactly as today on the nav and hero anchors, so the
  click series stays comparable across the ship date.
- `placement: "close"` disappears (the button it measured is replaced by the
  calendar). Note this in the readout so the drop is not misread as lost
  intent.
- Add two events, same both-sinks pattern as `trackCta`:
  - `booking_calendar_open`: the embed mounted (section reached or CTA
    clicked).
  - `booking_confirmed`: Cal's `bookingSuccessful` embed event. This is the
    real conversion, which the outbound link never gave us.
- Win or loss call: bookings per week is ground truth on the Cal.com dashboard
  both before and after. Baseline is the pre-ship weeks of Cal bookings
  against PostHog unique visitors; after ship, compare bookings per visitor
  over at least two weeks. If bookings per visitor rises on flat traffic, the
  inline embed wins; if flat or down, revert is one commit (the CTAs point
  back at `CAL_URL`).
- Query the PostHog events API directly for these numbers (headless probes are
  client-dropped, and the UI undercounts; see the standing PostHog notes).
