/* Pure logic behind /dashboard/demos — the customer's Staging, Queue and
   Sent segments. Nothing here touches the DOM or the network, so node --test
   pins the grouping and the copy (the sends-model.ts / overview-model.ts
   convention).

   The one idea this file encodes: a demo is not a review item. Today the
   agent files two pending items per demo (the bug_validation that carries
   the video and its evidence, the send_email that carries the subject and
   body) and the customer must see one card. Grouping happens here. */

/* ---------- API shapes (the fields these segments read) ---------- */

export type LeadContext = {
  lead_id: string;
  name: string | null;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  stage: string;
  prior_sends: number;
  last_sent_at: string | null;
};

export type BugEvidence = {
  repro_steps?: string[];
  url?: string;
  device?: string;
  video_timestamp?: string;
};

export type ReviewItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  subject: string | null;
  lead: LeadContext | null;
  attachment_slug: string | null;
  evidence: BugEvidence | null;
  status: string;
  created_at: string;
  can_decide: boolean;
  approval_policy_version: number;
};

export type SendRow = {
  id: string;
  kind: string;
  note: string;
  subject: string | null;
  attachment_slug: string | null;
  lead: LeadContext | null;
  status: string;
  error: string | null;
  due_at: string;
  /* "YYYY-MM-DD". The backend field is projected_date; projected_send_date
     is the newer name, so both are read and the newer one wins. */
  projected_date: string | null;
  projected_send_date?: string | null;
  created_at: string;
  sent_at: string | null;
  /* Neither field exists on the API yet: "held" arrives with the hold
     endpoint, sending_account with the sender read model. Both are read
     defensively so the page needs no change when they land. */
  held?: boolean;
  sending_account?: string | null;
};

export type QueueStat = {
  kind: string;
  queued: number;
  sent_24h: number;
  cap: number;
  runs_through: string | null;
};

/* ---------- what belongs on this page ---------- */

/* The two item kinds that make up one demo. Connection requests and plain
   messages are not demos, so they never reach this page. */
export const DEMO_ITEM_KINDS = ["bug_validation", "send_email"];

/* The send kinds a demo goes out as. */
export const QUEUE_SEND_KINDS = ["email", "message"];

export function isDemoItem(item: ReviewItem): boolean {
  return item.status === "pending" && DEMO_ITEM_KINDS.includes(item.kind);
}

/* ---------- Staging ---------- */

export type StagedDemo = {
  /* Stable across reloads: the lead the demo is for, or the lone item. */
  key: string;
  lead: LeadContext | null;
  /* Every pending item the card decides for, oldest first. */
  itemIds: string[];
  /* True only when the viewer may decide every item on the card. */
  canDecide: boolean;
  /* The version every decide POST must send as If-Match. */
  policyVersion: number;
  /* The oldest item's stamp: the demo's own age, and what expires it. */
  createdAt: string;
  heading: string;
  subject: string | null;
  /* The email as the prospect reads it. */
  body: string | null;
  videoSlug: string | null;
  evidence: BugEvidence | null;
  /* The bug the demo shows, in the agent's words on the bug item. */
  claim: string | null;
  /* What Pin acts on: the demo's leading item. */
  pinId: string;
};

/* Demos are hosted at /d/<slug>. Items should carry attachment_slug, but
   early bug_validation rows named their demo only inside the evidence text,
   so the slug is salvaged from there rather than losing the video. */
export function demoSlug(item: ReviewItem): string | null {
  if (item.attachment_slug) return item.attachment_slug;
  const text = `${item.evidence?.video_timestamp ?? ""} ${item.body}`;
  const match = /\/d\/([a-z0-9][a-z0-9_-]*)/i.exec(text);
  return match ? match[1] : null;
}

/* "Dana Whitfield, Meridian" — the customer's own words for who a demo is
   for. Falls back to the company, then to the item's title. */
export function demoHeading(lead: LeadContext | null, fallback: string): string {
  if (!lead) return fallback;
  const name = lead.name?.trim();
  const company = lead.company?.trim();
  if (name && company) return `${name}, ${company}`;
  return name || company || fallback;
}

/* One card per demo, oldest first: the oldest demo is the one about to
   expire, so it is the one to decide. Items for the same lead join; items
   with no lead stand alone rather than silently merging. */
export function groupStagedDemos(items: ReviewItem[]): StagedDemo[] {
  const groups = new Map<string, ReviewItem[]>();
  for (const item of items) {
    if (!isDemoItem(item)) continue;
    const key = item.lead ? `lead:${item.lead.lead_id}` : `item:${item.id}`;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  const demos: StagedDemo[] = [];
  for (const [key, group] of groups) {
    const sorted = [...group].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    const bug = sorted.find((item) => item.kind === "bug_validation") ?? null;
    const email = sorted.find((item) => item.kind === "send_email") ?? null;
    const lead = sorted.find((item) => item.lead)?.lead ?? null;
    demos.push({
      key,
      lead,
      itemIds: sorted.map((item) => item.id),
      canDecide: sorted.every((item) => item.can_decide),
      policyVersion: sorted[0].approval_policy_version,
      createdAt: sorted[0].created_at,
      heading: demoHeading(lead, sorted[0].title),
      subject: email?.subject ?? null,
      body: email?.body ?? null,
      videoSlug:
        (bug ? demoSlug(bug) : null) ?? (email ? demoSlug(email) : null),
      evidence: bug?.evidence ?? null,
      claim: bug?.body ?? null,
      pinId: (bug ?? sorted[0]).id,
    });
  }
  return demos.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/* Every pending item of one demo, as one decide POST. */
export function decisionsFor(
  demo: StagedDemo,
  decision: "approve" | "deny",
  reason?: string,
): { item_id: string; decision: "approve" | "deny"; reason?: string }[] {
  return demo.itemIds.map((id) =>
    reason
      ? { item_id: id, decision, reason }
      : { item_id: id, decision },
  );
}

/* ---------- Queue ---------- */

export type QueueRow = {
  send: SendRow;
  channel: string;
  /* "Tue Sep 16, 9:00 AM", or "Held". */
  planned: string;
  held: boolean;
  account: string;
};

/* The customer's word for the lane a demo goes out on. */
export function channelLabel(kind: string): string {
  if (kind === "email") return "Email";
  if (kind === "x_dm" || kind === "x_follow") return "X";
  return "LinkedIn";
}

/* A local-midnight Date for a "YYYY-MM-DD" string. new Date(dateOnly)
   parses as UTC, which reads as the day before in every western zone. */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/* "Tue Sep 16". */
export function dayShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* "Thursday, Sep 11" — the Sent segment's day heading. */
export function dayLong(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/* "9:00 AM". */
export function timeShort(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function projectedDateOf(send: SendRow): string | null {
  return send.projected_send_date ?? send.projected_date ?? null;
}

/* When the send is planned, in the customer's words. The projected date is
   the day the dispatcher expects; the time of day only shows when the due
   stamp falls on that same day, so a deferred send never claims a time it
   is not going to keep. */
export function plannedTime(send: SendRow, held: boolean): string {
  if (held) return "Held";
  const projected = projectedDateOf(send);
  const day = projected ? parseDateOnly(projected) : null;
  const due = new Date(send.due_at);
  const dueValid = !Number.isNaN(due.getTime());
  if (!day) return dueValid ? `${dayShort(due)}, ${timeShort(due)}` : "Next open slot";
  const sameDay = dueValid && due.toDateString() === day.toDateString();
  return sameDay ? `${dayShort(day)}, ${timeShort(due)}` : dayShort(day);
}

/* Whichever pool the send draws from picks the sender when it goes out, so
   a single connected account is named and anything else stays honest. */
export const ACCOUNT_UNKNOWN = "Picked when it sends";

export function sendingAccount(
  send: SendRow,
  accounts: { email: string[]; linkedin: string[] },
): string {
  if (send.sending_account) return send.sending_account;
  const pool = send.kind === "email" ? accounts.email : accounts.linkedin;
  return pool.length === 1 ? pool[0] : ACCOUNT_UNKNOWN;
}

export function isHeld(send: SendRow, heldIds: ReadonlySet<string>): boolean {
  return send.held === true || send.status === "held" || heldIds.has(send.id);
}

/* The queue holds demos that are going out: approved, still waiting, in due
   order (the API's own order). Failed rows are not scheduled, so they are
   not the queue; they stay on the internal surfaces that can act on them. */
export function queueSends(sends: SendRow[]): SendRow[] {
  return sends.filter(
    (send) =>
      QUEUE_SEND_KINDS.includes(send.kind) &&
      (send.status === "pending" || send.status === "sending" || send.status === "held"),
  );
}

export function queueRows(
  sends: SendRow[],
  heldIds: ReadonlySet<string>,
  accounts: { email: string[]; linkedin: string[] },
): QueueRow[] {
  return queueSends(sends).map((send) => {
    const held = isHeld(send, heldIds);
    return {
      send,
      channel: channelLabel(send.kind),
      planned: plannedTime(send, held),
      held,
      account: sendingAccount(send, accounts),
    };
  });
}

/* The last day the queue reaches, across the kinds this page shows. */
export function runsThrough(stats: QueueStat[]): string | null {
  const dates = stats
    .filter((stat) => QUEUE_SEND_KINDS.includes(stat.kind))
    .map((stat) => stat.runs_through)
    .filter((date): date is string => Boolean(date))
    .sort();
  return dates.length ? dates[dates.length - 1] : null;
}

/* "Queue runs through Thu Sep 17. Sends Monday to Friday, 9:00 AM to 6:00 PM
   PDT." Either half stands alone when the other is not known yet. */
export function queueHeadline(
  runsThroughDate: string | null,
  scheduleLine: string | null,
): string {
  const day = runsThroughDate ? parseDateOnly(runsThroughDate) : null;
  const parts: string[] = [];
  if (day) parts.push(`Queue runs through ${dayShort(day)}.`);
  if (scheduleLine) parts.push(`${scheduleLine}.`);
  return parts.join(" ");
}

/* ---------- Sent ---------- */

export type SentDay = { day: string; label: string; rows: SendRow[] };

/* Sent demos grouped by the day they went out, newest day first and newest
   row first inside each day. */
export function groupSentByDay(sends: SendRow[]): SentDay[] {
  const days = new Map<string, SendRow[]>();
  for (const send of sends) {
    if (!QUEUE_SEND_KINDS.includes(send.kind)) continue;
    const stamp = send.sent_at;
    if (!stamp) continue;
    const at = new Date(stamp);
    if (Number.isNaN(at.getTime())) continue;
    const day = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
    const rows = days.get(day);
    if (rows) rows.push(send);
    else days.set(day, [send]);
  }
  return [...days.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, rows]) => {
      const date = parseDateOnly(day);
      return {
        day,
        label: date ? dayLong(date) : day,
        rows: [...rows].sort((a, b) =>
          (b.sent_at ?? "").localeCompare(a.sent_at ?? ""),
        ),
      };
    });
}

/* The thread for one sent demo lives in the Inbox, keyed by the lead. */
export function threadHref(send: SendRow): string | null {
  const id = send.lead?.lead_id;
  return id ? `/dashboard/inbox?lead=${encodeURIComponent(id)}` : null;
}

/* ---------- copy ---------- */

export const STAGING_BOUND =
  "Staging holds up to 30. Anything older than 3 days expires unless you pin it.";
export const STAGING_AUTO =
  "Driftwood approves demos. Yours go straight to the queue.";
export const EMPTY_STAGING = "Nothing waiting for you.";
export const EMPTY_QUEUE = "Nothing scheduled.";
export const EMPTY_SENT = "Nothing sent yet.";
export const NOT_AVAILABLE = "Not available yet.";
