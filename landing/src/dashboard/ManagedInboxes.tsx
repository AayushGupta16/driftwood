import { useEffect, useState } from "react";
import "./managed-inboxes.css";

/* Managed inboxes — view-only panel on the overview, its own full-width row
   directly below the sending-accounts grid. Shows the workspace's purchased
   sending domains, the warming mailboxes on them, and the pool's sending
   capacity (GET /mailboxes/overview, proxied like the other backend routes).

   The panel renders ONLY when the API returns at least one domain. On an
   empty pool, a 404, or any fetch failure it stays absent and the overview
   is exactly what it was before this feature existed — the panel must be
   invisible to every customer without a pool and must never break the page.

   No buy/add flow yet — display only. The design reference is
   design/managed-inboxes-2026-08-25.html (chip, meter, and row recipes). */

type ManagedMailbox = {
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

type ManagedDomain = {
  name: string;
  status: string;
  registered_at: string | null;
};

type MailboxesOverview = {
  /* managed pool only — the customer's own connected mailbox is added
     client-side from the same email_connected flag the EmailCard uses. */
  capacity: { current_per_day: number; projected_per_day: number };
  domains: ManagedDomain[];
  mailboxes: ManagedMailbox[];
};

export default function ManagedInboxes({
  emailConnected,
}: {
  emailConnected: boolean;
}) {
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
        // Only a well-formed payload with at least one domain shows the
        // panel; anything else keeps the overview byte-identical to today.
        if (
          Array.isArray(data.domains) &&
          data.domains.length > 0 &&
          Array.isArray(data.mailboxes) &&
          typeof data.capacity?.current_per_day === "number" &&
          typeof data.capacity?.projected_per_day === "number"
        ) {
          setOverview(data);
        }
      } catch {
        /* stay absent — never break the overview over this panel */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (overview === null) return null;

  // The customer's own connected mailbox carries 20/day on top of the
  // managed pool. email_connected is the EmailCard's source of truth,
  // passed down — not refetched.
  const ownMailbox = emailConnected ? 20 : 0;
  const current = overview.capacity.current_per_day + ownMailbox;
  const projected = overview.capacity.projected_per_day + ownMailbox;
  const stillWarming = projected > current;
  const pausedCount = overview.mailboxes.filter(
    (box) => box.status === "paused",
  ).length;

  // Domains group their mailboxes. A mailbox on a domain the API didn't
  // list still renders, under its own heading, rather than dropping.
  const byDomain = new Map<string, ManagedMailbox[]>();
  for (const box of overview.mailboxes) {
    const group = byDomain.get(box.domain);
    if (group) group.push(box);
    else byDomain.set(box.domain, [box]);
  }
  const groups = overview.domains.map((domain) => ({
    name: domain.name,
    status: domain.status,
    boxes: byDomain.get(domain.name) ?? [],
  }));
  const listed = new Set(overview.domains.map((domain) => domain.name));
  for (const [name, boxes] of byDomain) {
    if (!listed.has(name)) groups.push({ name, status: "", boxes });
  }

  return (
    <section
      className="overview-panel overview-mailboxes"
      aria-labelledby="managed-inboxes-title"
    >
      <div className="overview-panel-heading">
        <h2 id="managed-inboxes-title">Managed inboxes</h2>
      </div>
      <span className="overview-mailboxes-label">Sending capacity</span>
      <div className="overview-mailboxes-meter">
        <span className="overview-mailboxes-now">
          {current}
          <small>/day</small>
        </span>
        {stillWarming ? (
          <span className="overview-mailboxes-proj">
            → {projected}/day when warm
          </span>
        ) : (
          <span className="overview-mailboxes-aside">
            {pausedCount > 0
              ? `${pausedCount} ${pausedCount === 1 ? "inbox" : "inboxes"} paused`
              : "All inboxes warm"}
          </span>
        )}
      </div>
      <p className="overview-mailboxes-explain">
        Limits rise automatically as inboxes warm. This protects
        deliverability.
      </p>
      {stillWarming && projected > 0 && (
        <div
          className="overview-mailboxes-bar"
          role="img"
          aria-label={`${current} of ${projected} per day`}
        >
          <i
            style={{
              width: `${Math.min(100, Math.round((current / projected) * 100))}%`,
            }}
          />
        </div>
      )}
      {groups.map((group) => (
        <div key={group.name}>
          <p className="overview-mailboxes-domain">
            {group.name}
            {group.status && <span>· {group.status}</span>}
          </p>
          {group.boxes.map((box) => (
            <MailboxRow key={box.address} box={box} />
          ))}
        </div>
      ))}
    </section>
  );
}

const sentenceCase = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

/* One mailbox: address, state chip, today's cap, sent today, health dot.
   Paused rows carry the reason as a quiet amber line under the row. */
function MailboxRow({ box }: { box: ManagedMailbox }) {
  const paused = box.status === "paused";
  const chipTone =
    box.status === "active"
      ? " is-active"
      : box.status === "warming"
        ? " is-warming"
        : paused
          ? " is-paused"
          : ""; // ready and provisioning stay on the sand chip
  const chipLabel =
    box.status === "warming" && box.warming_day !== null
      ? `Warming · day ${box.warming_day} of ${box.warming_days_total}`
      : sentenceCase(box.status);
  const healthTone =
    box.health === "warning"
      ? " is-warning"
      : box.health === "unknown"
        ? " is-unknown"
        : "";
  const healthLabel =
    box.health === "warning"
      ? "Needs attention"
      : box.health === "unknown"
        ? "No health signal yet"
        : "Healthy";

  return (
    <>
      <div className="overview-mailboxes-row">
        <span className="overview-mailboxes-addr">{box.address}</span>
        <span className={`overview-mailboxes-chip${chipTone}`}>{chipLabel}</span>
        <span className={`overview-mailboxes-cap${paused ? " is-na" : ""}`}>
          {paused ? "—" : `${box.todays_cap}/day`}
        </span>
        <span className="overview-mailboxes-sent">{box.sent_today} sent</span>
        <span
          className={`overview-mailboxes-dot${healthTone}`}
          role="img"
          aria-label={healthLabel}
          title={healthLabel}
        />
      </div>
      {paused && box.paused_reason && (
        <p className="overview-mailboxes-note">{box.paused_reason}</p>
      )}
    </>
  );
}
