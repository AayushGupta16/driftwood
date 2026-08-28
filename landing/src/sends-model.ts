/* Pure logic for the sends surfaces (the review page's Queued + Sent tabs):
   send-kind vocabulary, chip building, and the sent-ledger query string.
   Extracted from Review.tsx so it's testable without the view (the
   overview-model.ts pattern). */

/* ScheduledSend kinds use the stats-strip vocabulary, not the review-item
   one — same human labels either way. */
export function sendKindLabel(kind: string): string {
  if (kind === "message") return "message";
  if (kind === "connection_request") return "connection";
  if (kind === "email") return "email";
  if (kind === "x_dm") return "X DM";
  if (kind === "x_follow") return "X follow";
  return kind;
}

/* Kind order for chips and grouping; unknown kinds trail in queue order. */
export const SEND_KIND_ORDER = ["connection_request", "message", "email"];

export function sendKindRank(kind: string): number {
  const i = SEND_KIND_ORDER.indexOf(kind);
  return i === -1 ? SEND_KIND_ORDER.length : i;
}

export type SendKindChip = { kind: string; count: number };

/* The per-kind census (GET /sends `kind_counts`) as an ordered chip list —
   known kinds first in SEND_KIND_ORDER, unknown kinds after them in name
   order (stable whatever the backend adds); empty kinds are omitted, so a
   chip always has rows behind it. */
export function sendKindChips(
  kindCounts: Record<string, number>,
): SendKindChip[] {
  return Object.entries(kindCounts)
    .filter(([, count]) => count > 0)
    .sort(
      ([a], [b]) => sendKindRank(a) - sendKindRank(b) || a.localeCompare(b),
    )
    .map(([kind, count]) => ({ kind, count }));
}

export type SentOrder = "newest" | "oldest";

export type SentQuery = {
  kind: string | null; // null = all kinds
  order: SentOrder;
};

export const DEFAULT_SENT_QUERY: SentQuery = { kind: null, order: "newest" };

/* The sent ledger's GET /sends query string. Defaults are omitted so the
   plain first load stays byte-identical to what older builds sent (and an
   older backend simply ignores the params it predates). */
export function sentLedgerQuery(query: SentQuery, limit: number): string {
  const params = new URLSearchParams({ view: "sent", limit: String(limit) });
  if (query.kind !== null) params.set("kind", query.kind);
  if (query.order !== "newest") params.set("order", query.order);
  return params.toString();
}
