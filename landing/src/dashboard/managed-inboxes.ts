import { useEffect, useState } from "react";

/* Managed inboxes — data + labels for the EmailCard's compact pool view
   (GET /mailboxes/overview, proxied like the other backend routes).

   The pool surfaces ONLY when the API returns at least one domain. On an
   empty pool, a 404, or any fetch failure the hook stays null and the
   EmailCard is byte-identical to today — the feature must be invisible to
   every customer without a pool and must never break the page.

   View-only: no buy/add flow yet, and no approval states — purchases will
   execute immediately when the buy flow lands. */

export type ManagedMailbox = {
  address: string;
  domain: string;
  status: "provisioning" | "warming" | "ready" | "active" | "paused";
  warming_day: number | null;
  warming_days_total: number;
  todays_cap: number;
  sent_today: number;
  health: "good" | "warning" | "unknown";
  paused_reason: string | null;
};

export type ManagedDomain = {
  name: string;
  status: string;
  registered_at: string | null;
};

export type MailboxesOverview = {
  /* managed pool only — the customer's own connected mailbox adds 20/day
     client-side, from the same email_connected flag the EmailCard uses. */
  capacity: { current_per_day: number; projected_per_day: number };
  domains: ManagedDomain[];
  mailboxes: ManagedMailbox[];
};

export function useManagedInboxes(): MailboxesOverview | null {
  const [overview, setOverview] = useState<MailboxesOverview | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/mailboxes/overview", {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as MailboxesOverview;
        if (cancelled) return;
        // Only a well-formed payload with at least one domain surfaces the
        // pool; anything else keeps the EmailCard exactly as it is today.
        if (
          Array.isArray(data.domains) &&
          data.domains.length > 0 &&
          Array.isArray(data.mailboxes)
        ) {
          setOverview(data);
        }
      } catch {
        /* stay absent — never break the overview over this */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return overview;
}

/* What the managed pool can carry today. The cap rising day by day as
   inboxes warm is the feature's whole visible behavior. */
export const managedInboxCap = (mailboxes: ManagedMailbox[]) =>
  mailboxes.reduce((sum, box) => sum + box.todays_cap, 0);

/* One small state chip per inbox. Sentence case in the string — the chip
   deliberately carries no text-transform, so "Warming · day 5" can't get
   Title-Cased. Paused reads amber, never red. */
export function managedInboxChip(box: ManagedMailbox): {
  label: string;
  tone: "" | " is-active" | " is-warming" | " is-paused";
} {
  if (box.status === "warming") {
    return {
      label:
        box.warming_day === null
          ? "Warming"
          : `Warming · day ${box.warming_day}`,
      tone: " is-warming",
    };
  }
  if (box.status === "active") return { label: "Active", tone: " is-active" };
  if (box.status === "paused") return { label: "Paused", tone: " is-paused" };
  // ready and provisioning stay on the sand chip
  return {
    label: box.status.charAt(0).toUpperCase() + box.status.slice(1),
    tone: "",
  };
}
