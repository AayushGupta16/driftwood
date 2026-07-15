/* One call, both sinks: Vercel Web Analytics (custom events are dropped on
   the free plan today, but they light up if the team ever upgrades) and
   PostHog (the queryable one — first-party proxied via /ingest, see
   vercel.json). posthog.init happens in main.tsx before any CTA can be
   clicked, so capture() here never fires pre-init. */
import { track } from "@vercel/analytics";
import posthog from "posthog-js";

export function trackCta(placement: "nav" | "hero" | "close") {
  track("book_demo", { placement });
  posthog.capture("book_demo", { placement });
}
