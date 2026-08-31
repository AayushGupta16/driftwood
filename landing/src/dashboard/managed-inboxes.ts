import { useCallback, useEffect, useRef, useState } from "react";

/* Managed inboxes — data + labels for the EmailCard's compact pool view
   and its sender-first buy flow (GET /mailboxes/overview,
   GET /mailboxes/availability, POST /mailboxes/purchase — all proxied like
   the other backend routes).

   The pool surfaces ONLY when the API returns at least one domain. On an
   empty pool, a 404, or any fetch failure the hook stays null and the
   EmailCard shows only the customer's own mailbox — the pool must never
   break the page.

   No prices or billing anywhere: customers never see money here. From the
   customer's view they are choosing senders and domains, not purchasing —
   the button says Done and execution is immediate. */

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

export type SenderInput = {
  username: string;
};

export type PurchaseResult = {
  domains: { name: string; status: string }[];
  mailboxes_planned: number;
};

/* one workspace's ceiling — enforced in the UI before the backend sees it */
export const DOMAIN_CAP = 5;
export const INBOX_CAP = 10;

export function useManagedInboxes(): {
  pool: MailboxesOverview | null;
  applyPurchase: (result: PurchaseResult, senders: SenderInput[]) => void;
} {
  const [pool, setPool] = useState<MailboxesOverview | null>(null);

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
          setPool(data);
        }
      } catch {
        /* stay absent — never break the overview over this */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Optimistic refresh after a successful purchase: fold the response into
     the local pool so the tile shows the new counts immediately, with the
     bought domains in their registering state and one provisioning mailbox
     per sender × domain. Server truth replaces this on the next load. */
  const applyPurchase = useCallback(
    (result: PurchaseResult, senders: SenderInput[]) => {
      setPool((prev) => {
        const domains = [...(prev?.domains ?? [])];
        for (const bought of result.domains) {
          if (!domains.some((d) => d.name === bought.name)) {
            domains.push({
              name: bought.name,
              status: bought.status,
              registered_at: null,
            });
          }
        }
        const mailboxes = [...(prev?.mailboxes ?? [])];
        for (const bought of result.domains) {
          for (const sender of senders) {
            const address = `${sender.username}@${bought.name}`;
            if (mailboxes.some((m) => m.address === address)) continue;
            mailboxes.push({
              address,
              domain: bought.name,
              status: "provisioning",
              warming_day: null,
              warming_days_total: 14,
              todays_cap: 0,
              sent_today: 0,
              health: "unknown",
              paused_reason: null,
            });
          }
        }
        return {
          capacity: prev?.capacity ?? {
            current_per_day: 0,
            projected_per_day: 0,
          },
          domains,
          mailboxes,
        };
      });
    },
    [],
  );

  return { pool, applyPurchase };
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

/* ---------- buy-flow helpers ---------- */

/* Ordered variation shapes applied to any base. The five Autosana-slate
   originals lead (they're the proven favorites), then the wider set of
   credible business shapes the search sweeps through in order.
   All .com on purpose: exotic TLDs hurt cold-email deliverability. */
export function domainVariations(base: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean) return [];
  return [
    `${clean}-ai.com`,
    `${clean}hq.com`,
    `use${clean}.com`,
    `join${clean}.com`,
    `with${clean}.com`,
    `get${clean}.com`,
    `try${clean}.com`,
    `meet${clean}.com`,
    `hello${clean}.com`,
    `go${clean}.com`,
    `on${clean}.com`,
    `${clean}ai.com`,
    `${clean}-hq.com`,
    `${clean}app.com`,
    `${clean}-app.com`,
    `${clean}team.com`,
    `${clean}-team.com`,
  ];
}

/* Domain ideas seeded from the customer's company name. */
export const domainSuggestions = (companyName: string | null): string[] =>
  domainVariations(companyName ?? "");

/* Whether the domain search should offer "Show more": verified available
   names exist beyond the visible slice, or unchecked candidates remain.
   Deliberately independent of how many rows are visible right now —
   picking every visible suggestion must never hide the path to more.
   The one exception: while a sweep is filling an empty list the checking
   hint owns that state, so the control waits for results or exhaustion. */
export const hasMoreDomains = (state: {
  unselectedVerified: number;
  visibleTarget: number;
  exhausted: boolean;
  checkingEmpty: boolean;
}): boolean =>
  !state.checkingEmpty &&
  (state.unselectedVerified > state.visibleTarget || !state.exhausted);

/* mailbox names are the local part of an address: lowercase, no spaces */
export const deriveUsername = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");

export async function checkDomainAvailability(
  domain: string,
): Promise<boolean | null> {
  try {
    const res = await fetch(
      `/mailboxes/availability?domain=${encodeURIComponent(domain)}`,
      { credentials: "include" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { domain: string; available: boolean };
    return typeof data.available === "boolean" ? data.available : null;
  } catch {
    return null;
  }
}

export async function purchaseInboxes(
  domains: string[],
  senders: SenderInput[],
): Promise<
  { ok: true; result: PurchaseResult } | { ok: false; status: number }
> {
  try {
    const res = await fetch("/mailboxes/purchase", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains, senders }),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, result: (await res.json()) as PurchaseResult };
  } catch {
    return { ok: false, status: 0 };
  }
}

/* ---------- shared dialog chrome ---------- */

/* Focus trap + Esc + body scroll lock for the small overlays this feature
   floats over the grid (the add-inboxes flow and the inbox list). Focus
   moves into the dialog on open, Tab cycles inside it, Esc closes unless
   canClose says otherwise, and focus returns to the opener. */
export function useDialogTrap(
  dialogRef: { current: HTMLElement | null },
  onClose: () => void,
  canClose?: () => boolean,
): void {
  const closeRef = useRef(onClose);
  const canRef = useRef(canClose);
  useEffect(() => {
    closeRef.current = onClose;
    canRef.current = canClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog
      ?.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled])',
      )
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (canRef.current?.() ?? true) closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), [href]",
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = bodyOverflow;
      opener?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
