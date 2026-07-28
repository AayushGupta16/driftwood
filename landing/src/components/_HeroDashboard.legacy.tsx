/* _HeroDashboard.legacy.tsx — PRESERVED, not deleted.

   This is the original hero right-column dashboard window, lifted out of
   App.tsx on 2026-07-23 when the hero switched to the "surfacing" gif card.
   Kept verbatim so it can be brought back later.

   To restore: import it in App.tsx and drop <HeroDashboard /> back into the
   hero-grid's right cell where the `TODO: dashboard preserved for later`
   comment is. The .app-window / .enter-window CSS it relies on is still in
   index.css (search "app-window"). If that CSS has since been pruned, the
   git history at this commit has it.

   Not imported anywhere right now — that's intentional. */
export default function HeroDashboard() {
  return (
    <div className="app-window enter-window">
      <img
        src="/dw-demo-dashboard-hero.webp"
        width="2000"
        height="1940"
        fetchPriority="high"
        alt="The driftwood dashboard: LinkedIn connected and sending, 4 meetings booked, 7 replies, pipeline of 124 leads"
      />
    </div>
  );
}
