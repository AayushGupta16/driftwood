/* Triggers: the customer types one sentence saying what to watch, and the
   agent works out the source, the words, the places and the schedule from
   it. Types here are the camelCase shapes the pages render; the snake_case
   wire shapes live in api.ts.

   Two strings carry everything the agent decided: the trigger's short name
   and `summary`, the plain line the agent writes back ("Checks
   mycnajobs.com every night for caregiver and CNA jobs in five metros,
   skipping hospitals and senior living."). Nothing in this file may name
   jobs, agencies, employers, pay, credits or a pull method: a trigger is
   just as likely to be watching funding rounds or a competitor. The one
   exception is the field picker's key lists (rowFields), which name every
   schema they know, jobs and raises and tenders alike, so a row leads
   with the right fact whichever it is. */

export type TriggerStatus = "active" | "paused" | "needs_setup";
export type RunState = "queued" | "running" | "done" | "failed";
export type ItemStatus =
  | "new"
  | "in_progress"
  | "no_lead"
  | "demo_pending"
  | "ready"
  | "enrolled"
  | "dismissed"
  | "duplicate"
  | "failed";

export type TriggerCadence = "daily" | "weekly" | "every_n_hours";

export type TriggerSchedule = {
  cadence: TriggerCadence;
  fireHour: number;
  intervalHours: number | null;
};

/* How the agent reads the source. The method is a plain string because the
   backend renames its kinds; the page only asks two questions of it, so
   nothing here depends on the rest. The reason is the agent's own words
   for a source it could not read, and is shown in that state only. */
export type TriggerPull = {
  method: string;
  reason: string | null;
};

export const UNSUPPORTED_METHOD = "unsupported";

export type TriggerCounts = {
  items: number;
  new: number;
  companiesAdded: number;
  leads: number;
  demos: number;
  enrolled: number;
};

/* What the agent does with each new item. The page reads these only to
   say what "done" looks like on a row: a trigger that builds demos ends
   an item at "Demo ready", one that only adds companies ends it at
   "Added". */
export type TriggerActions = {
  addCompany: boolean;
  findContact: boolean;
  buildDemo: boolean;
  enroll: boolean;
};

/* The backend's own defaults, used for a row that did not say. */
export const DEFAULT_ACTIONS: TriggerActions = { addCompany: true, findContact: true, buildDemo: true, enroll: false };

export type Trigger = {
  id: string;
  /* A short name the backend writes. Never derived from the sentence
     here: a whole sentence with an ellipsis is not a name. */
  name: string;
  watch: string | null;
  /* The agent's readback, one or two plain sentences. Null while the
     trigger is still being set up. */
  summary: string | null;
  schedule: TriggerSchedule;
  pull: TriggerPull | null;
  actions: TriggerActions;
  campaignId: string | null;
  campaignName: string | null;
  status: TriggerStatus;
  lastRunAt: string | null;
  lastRunState: string | null;
  counts: TriggerCounts;
  createdAt: string;
  /* When the row last changed, so an edited trigger's Building clock
     starts again. Falls back to createdAt. */
  updatedAt: string | null;
};

/* Who started a check: the schedule, a press of Check now, or the setup
   step right after the trigger was created. */
export type RunTrigger = "schedule" | "manual" | "setup";

export type TriggerRun = {
  id: string;
  state: RunState;
  triggeredBy: RunTrigger;
  itemsSeen: number;
  itemsNew: number;
  /* The counters that update while a check runs; null on rows that
     predate them, where the item counts stand in. */
  idsSeen: number | null;
  idsNew: number | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

/* One extracted key and value from an item, whatever the customer's
   schema is: "Round: Series B", "Due: Oct 4", "Pay: $16 to $19/hr". */
export type ItemField = { label: string; value: string };

export type TriggerItem = {
  id: string;
  sourceUrl: string;
  /* Who the item is about: a company, an organisation, a person. */
  entityName: string;
  /* What it is called. Can be empty: not every item has a title. */
  title: string;
  fields: ItemField[];
  foundAt: string | null;
  status: ItemStatus;
  note: string | null;
  companyId: string | null;
  leadId: string | null;
  demoUrl: string | null;
  createdAt: string;
};

export type TriggerDetail = {
  trigger: Trigger;
  runs: TriggerRun[];
  items: TriggerItem[];
};

/* Everything a customer sends: one sentence, and a campaign if they want
   the new leads to feed one. The agent fills in the rest. */
export type NewTriggerInput = {
  watch: string;
  campaignId: string | null;
};

/* Edit sends only what changed. Changing the sentence puts the trigger
   back into Building while the agent rebuilds how it checks. */
export type EditTriggerInput = {
  watch?: string;
  campaignId?: string | null;
};

export function normalizeCadence(value: string | null | undefined): TriggerCadence {
  return value === "weekly" || value === "every_n_hours" ? value : "daily";
}

export function normalizeStatus(value: string | null | undefined): TriggerStatus {
  return value === "paused" || value === "needs_setup" ? value : "active";
}

/* 6 -> "6 AM", 0 -> "12 AM", 12 -> "12 PM", 15 -> "3 PM". */
export function fireHourLabel(hour: number): string {
  const clamped = Math.min(23, Math.max(0, Math.trunc(hour)));
  const twelve = clamped % 12 === 0 ? 12 : clamped % 12;
  return `${twelve} ${clamped < 12 ? "AM" : "PM"}`;
}

/* Nightly at 2 AM Pacific: the agent has the night to build demos and the
   Review queue is ready in the morning. The backend picks this; the page
   only reads it. */
export const DEFAULT_FIRE_HOUR = 2;
export const DEFAULT_SCHEDULE: TriggerSchedule = { cadence: "daily", fireHour: DEFAULT_FIRE_HOUR, intervalHours: null };

/* "Every night, 2 AM PT" before 6, "Every morning, 6 AM PT" from 6 to 11,
   "Daily, 3 PM PT" after; "Weekly"; "Every 4 hours". */
export function scheduleLabel(schedule: TriggerSchedule | null | undefined): string {
  if (!schedule) return "On a schedule";
  if (schedule.cadence === "weekly") return "Weekly";
  if (schedule.cadence === "every_n_hours") {
    const hours = schedule.intervalHours;
    if (!hours) return "Every few hours";
    return hours === 1 ? "Every hour" : `Every ${hours} hours`;
  }
  const hour = schedule.fireHour;
  const when = hour < 6 ? "Every night" : hour < 12 ? "Every morning" : "Daily";
  return `${when}, ${fireHourLabel(hour)} PT`;
}

/* What the row and the detail page show for a trigger: its status, except
   that a source the agent could not work out how to read is "unsupported"
   whatever the row's status says, and a row still waiting is "building".
   Only active and paused triggers can be checked. */
export type TriggerView = "active" | "paused" | "building" | "unsupported";

export function triggerView(trigger: Pick<Trigger, "status" | "pull">): TriggerView {
  if (trigger.pull?.method === UNSUPPORTED_METHOD) return "unsupported";
  if (trigger.status === "needs_setup") return "building";
  return trigger.status === "paused" ? "paused" : "active";
}

const VIEW_LABELS: Record<TriggerView, string> = {
  active: "Active",
  paused: "Paused",
  building: "Building",
  unsupported: "Not supported",
};

export function viewLabel(view: TriggerView): string {
  return VIEW_LABELS[view];
}

/* One tone vocabulary for every state the pages show: the trigger's own,
   an item's, and a check's result. The tone picks the dot; the shape is
   the page's business (bare beside a heading, pilled in a table cell).
   `accent` is the single accent and marks what a customer scans for;
   `alert` exists only as the needs-attention dot the design language
   sanctions for a dashboard surface, never as a fill. */
export type Tone = "live" | "accent" | "neutral" | "quiet" | "alert";

const VIEW_TONES: Record<TriggerView, Tone> = {
  active: "live",
  paused: "neutral",
  building: "accent",
  unsupported: "quiet",
};

export function viewTone(view: TriggerView): Tone {
  return VIEW_TONES[view];
}

/* The trigger's title. The backend names it; the page never re-derives a
   name from the sentence, which is how "New caregiver, CNA or home…"
   became a title nobody chose. */
export function triggerTitle(trigger: Pick<Trigger, "name">): string {
  return (trigger.name ?? "").trim() || "Trigger";
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/* How long a trigger has been building: under an hour, over an hour, or
   long enough that something is wrong. */
export type BuildingStage = "fresh" | "slow" | "stalled";

export const BUILDING_LINES: Record<BuildingStage, string> = {
  fresh: "Your agent is working out how to check this. Usually under an hour.",
  slow: "Taking longer than usual. Your agent is still on it.",
  stalled: "Could not set this up yet.",
};

export function buildingStage(since: string | null | undefined, now: Date = new Date()): BuildingStage {
  const started = since ? new Date(since).getTime() : Number.NaN;
  if (Number.isNaN(started)) return "fresh";
  const age = now.getTime() - started;
  if (age >= DAY_MS) return "stalled";
  return age >= HOUR_MS ? "slow" : "fresh";
}

/* The Building line, which changes twice: an edited sentence restarts the
   clock, so the last change wins over the created date. */
export function buildingLine(
  trigger: Pick<Trigger, "createdAt" | "updatedAt">,
  now: Date = new Date(),
): string {
  return BUILDING_LINES[buildingStage(trigger.updatedAt ?? trigger.createdAt, now)];
}

export const UNSUPPORTED_LINE = "Your agent could not read this. Edit what you want watched and it will try again.";

/* A reason worth printing: the agent's sentence, not an identifier that
   leaked out of the plumbing ("dataforseo_google_jobs"). */
export function plainReason(reason: string | null | undefined): string | null {
  const text = (reason ?? "").trim();
  if (!text) return null;
  if (!/\s/.test(text) && /^[a-z0-9][a-z0-9_.:-]*$/.test(text)) return null;
  return text;
}

export function unsupportedLine(trigger: Pick<Trigger, "pull">): string {
  return plainReason(trigger.pull?.reason) ?? UNSUPPORTED_LINE;
}

/* The one gray line under the trigger's name, everywhere it appears: the
   agent's readback, the reason it could not read the source, or, while it
   is still being set up, how long that takes. */
export function readbackLine(
  trigger: Pick<Trigger, "status" | "pull" | "summary" | "createdAt" | "updatedAt">,
  now: Date = new Date(),
): string | null {
  const view = triggerView(trigger);
  if (view === "unsupported") return unsupportedLine(trigger);
  const summary = (trigger.summary ?? "").trim();
  if (summary) return summary;
  if (view === "building") return buildingLine(trigger, now);
  return null;
}

const WORKING_LABEL = "Working";

const ITEM_STATUS: Record<ItemStatus, { label: string; tone: Tone }> = {
  new: { label: "Waiting", tone: "neutral" },
  in_progress: { label: WORKING_LABEL, tone: "neutral" },
  no_lead: { label: "No contact found", tone: "quiet" },
  demo_pending: { label: "Building demo", tone: "neutral" },
  ready: { label: "Demo ready", tone: "accent" },
  enrolled: { label: "Enrolled", tone: "accent" },
  dismissed: { label: "Dismissed", tone: "quiet" },
  duplicate: { label: "Duplicate", tone: "quiet" },
  failed: { label: "Failed", tone: "alert" },
};

/* "ready" means the agent is done with this item. What that looks like
   depends on what the trigger asked for: a demo, a contact, or just the
   company in Companies. Seventy rows reading "Demo ready" with no demo
   link on any of them was the label contradicting the trigger. */
export function readyLabel(actions: TriggerActions): string {
  if (actions.buildDemo) return "Demo ready";
  if (actions.findContact) return "Contact found";
  return "Added";
}

export function itemStatusLabel(status: string, actions: TriggerActions = DEFAULT_ACTIONS): string {
  if (status === "ready") return readyLabel(actions);
  return ITEM_STATUS[status as ItemStatus]?.label ?? WORKING_LABEL;
}

/* Demo ready and Enrolled take the accent so a customer can scan for the
   wins; everything finished-without-a-win goes quiet. No second accent. */
export function itemStatusTone(status: string): Tone {
  return ITEM_STATUS[status as ItemStatus]?.tone ?? "neutral";
}

export function runIsOpen(state: string | null | undefined): boolean {
  return state === "queued" || state === "running";
}

const RUN_TRIGGER_LABELS: Record<RunTrigger, string> = {
  schedule: "Scheduled",
  manual: "Check now",
  setup: "First check",
};

/* The checks log's sub-line: what started the check. The one the backend
   starts on its own right after a trigger is created is "First check",
   not "Check now", which nobody pressed. */
export function runTriggerLabel(triggeredBy: string): string {
  return RUN_TRIGGER_LABELS[triggeredBy as RunTrigger] ?? "Scheduled";
}

/* The Result cell: did it run, and did it fail. A check that hit a snag,
   retried and finished is "Done" — an error the customer cannot act on is
   not their news. The detail is a short reason; the row keeps the full
   text in a title attribute. The tone is the page's one chip vocabulary:
   a check in flight is the accent, a finished one is neutral, and only a
   failure takes the needs-attention dot. */
export type RunResult = { label: string; detail: string | null; tone: Tone };

export function runResult(run: Pick<TriggerRun, "state" | "error">): RunResult {
  if (run.state === "queued") return { label: "Queued", detail: null, tone: "accent" };
  if (run.state === "running") return { label: "Running", detail: null, tone: "accent" };
  if (run.state === "failed") return { label: "Failed", detail: shortReason(run.error), tone: "alert" };
  return { label: "Done", detail: null, tone: "neutral" };
}

/* The Checks table's columns, pinned here so the header and the cell under
   it cannot drift apart. The second column is every listing a check
   scanned, which is not the trigger's "found": a run that scanned 2,095
   listings on a trigger showing "90 found" read as two numbers under one
   word. "Seen" is the scan; "New" is what it had not seen before. */
export type RunColumn = { label: string; numeric: boolean };

export const RUN_COLUMNS: readonly RunColumn[] = [
  { label: "When", numeric: false },
  { label: "Seen", numeric: true },
  { label: "New", numeric: true },
  { label: "Result", numeric: false },
];

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : pluralForm}`;
}

/* The counts a trigger row carries are a lifetime tally, not one check's
   result: "12 found · 9 companies added". Empty until something is
   found. */
export function countsLine(counts: TriggerCounts): string {
  if (!counts.items) return "";
  const parts = [`${counts.items.toLocaleString()} found`];
  if (counts.companiesAdded) parts.push(plural(counts.companiesAdded, "company added", "companies added"));
  if (counts.demos) parts.push(plural(counts.demos, "demo", "demos"));
  if (counts.enrolled) parts.push(`${counts.enrolled.toLocaleString()} enrolled`);
  return parts.join(" · ");
}

/* The row's one gray meta line: "Every night, 2 AM PT · 12 found · 9
   companies added". */
export function metaLine(trigger: Pick<Trigger, "schedule" | "counts">): string {
  const counts = countsLine(trigger.counts);
  return counts ? `${scheduleLabel(trigger.schedule)} · ${counts}` : scheduleLabel(trigger.schedule);
}

/* A check's counter: the number, or a dash for a row that predates it. */
export function counterCell(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toLocaleString();
}

function epoch(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

/* Newest first by when the item went up; items with no date go last, and
   ties (or no dates) fall back to when we found them. Returns a new
   array. */
export function sortItems<T extends Pick<TriggerItem, "foundAt" | "createdAt">>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aFound = epoch(a.foundAt);
    const bFound = epoch(b.foundAt);
    if (aFound !== bFound) {
      if (aFound === null) return 1;
      if (bFound === null) return -1;
      return bFound - aFound;
    }
    return (epoch(b.createdAt) ?? 0) - (epoch(a.createdAt) ?? 0);
  });
}

const MD_IMAGE = /!\[([^\]]*)\]\([^)]*\)/g;
const MD_LINK = /\[([^\]]*)\]\([^)]*\)/g;
const BARE_URL = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S+$/i;

/* Whatever an extraction produced, read as words. A bad parse can store a
   markdown link or an image ("[Skip to main content](https://…)",
   "![Fermilab](…logo.png)"); the link text or the alt is the most a
   customer can use, and a bare address is nothing at all. */
export function plainText(text: string | null | undefined): string {
  let out = String(text ?? "");
  /* A link inside a link text needs a second pass; three is plenty and
     stops a pathological string from spinning. */
  for (let pass = 0; pass < 3; pass += 1) {
    const next = out.replace(MD_IMAGE, "$1").replace(MD_LINK, "$1");
    if (next === out) break;
    out = next;
  }
  out = out.replace(/[`*]+/g, " ").replace(/^\s*[#>\-+]+\s*/, "");
  out = out.replace(/\s+/g, " ").trim();
  return BARE_URL.test(out) ? "" : out;
}

/* Long text in a table cell, cut on a word boundary. The caller keeps the
   whole thing in a title attribute. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[.,;:!?]+$/, "")}…`;
}

const TITLE_MAX = 90;

/* The What cell. Empty when the item has no usable title, so the row
   shows a dash rather than an address or a navigation crumb. */
export function itemTitle(item: Pick<TriggerItem, "title">): string {
  return truncate(plainText(item.title), TITLE_MAX);
}

export function itemName(item: Pick<TriggerItem, "entityName">): string {
  return truncate(plainText(item.entityName), 60);
}

const REASON_WORDS = 10;

/* A one-line version of prose the backend wrote, for a cell. Null when
   there is nothing to say. */
export function shortReason(text: string | null | undefined, words: number = REASON_WORDS): string | null {
  const clean = plainText(text);
  if (!clean) return null;
  const parts = clean.split(" ");
  if (parts.length <= words) return clean;
  return `${parts.slice(0, words).join(" ").replace(/[.,;:!?]+$/, "")}…`;
}

const FIELD_VALUE_MAX = 40;
const ROW_FIELDS = 2;

/* A field's key the way the extraction stored it, whatever the backend
   did to the label on the way: "Rank absolute", "rank_absolute" and
   "Rank-Absolute" all read as rank_absolute. */
export function fieldKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/* Keys that are the scraper's business, not the item's. A Google Jobs pull
   stores its type, its xpath and its rank first, and those were the first
   two "facts" every row showed. */
const TECHNICAL_KEYS = new Set([
  "type", "xpath", "rank_absolute", "rank_group", "rectangle", "timestamp",
  "source_url", "url", "link", "id", "job_id", "employer_image_url", "image", "logo",
  "position", "domain", "slug", "uuid", "guid", "hash", "html",
]);
const TECHNICAL_SUFFIXES = ["_url", "_id", "_xpath", "_hash", "_key", "_html"];

export function isTechnicalKey(key: string): boolean {
  return TECHNICAL_KEYS.has(key) || TECHNICAL_SUFFIXES.some((suffix) => key.endsWith(suffix));
}

/* A value that is a path or an identifier rather than a fact: an xpath, an
   address, an anchor, or one long token with no space in it. */
export function isTechnicalValue(value: string): boolean {
  const text = value.trim();
  if (/^(\/|http|www\.|#)/i.test(text)) return true;
  return text.length >= 24 && !/\s/.test(text);
}

/* The facts a customer reads first, whatever the schema: pay before place,
   place before when; the round and the amount for a raise; the due date
   for a tender. Anything else follows in the order it was stored. */
const PREFERRED_KEYS = [
  "pay", "pay_text", "salary", "compensation", "location", "city", "shifts", "schedule",
  "employment_type", "contract_type", "posted", "posted_text", "time_ago", "round", "amount",
  "investors", "category", "platform", "due_on", "deadline", "contact_name",
];
const PREFERRED_RANK = new Map(PREFERRED_KEYS.map((key, index) => [key, index]));

/* Up to two extracted fields to show on a row, chosen by what the item
   actually carries rather than by a fixed schema: an item can be a job, a
   funding round or a tender, and each brings its own keys. Human keys
   come first, in a fixed order of usefulness; technical keys and values
   never show; fields that only repeat the name or the title earn no
   room. */
export function rowFields(item: Pick<TriggerItem, "fields" | "entityName" | "title">, limit: number = ROW_FIELDS): ItemField[] {
  const seen = new Set([plainText(item.entityName).toLowerCase(), plainText(item.title).toLowerCase()]);
  const usable: { field: ItemField; rank: number; order: number }[] = [];
  item.fields.forEach((field, order) => {
    const label = plainText(field.label);
    const value = plainText(field.value);
    if (!label || !value) return;
    const key = fieldKey(label);
    if (!key || isTechnicalKey(key)) return;
    /* The raw value too: plainText drops a leading "#", which is the
       very thing that marks an anchor or a ticket number. */
    if (isTechnicalValue(field.value) || isTechnicalValue(value)) return;
    usable.push({ field: { label, value }, rank: PREFERRED_RANK.get(key) ?? PREFERRED_KEYS.length, order });
  });
  usable.sort((a, b) => a.rank - b.rank || a.order - b.order);
  const out: ItemField[] = [];
  for (const { field } of usable) {
    if (out.length >= limit) break;
    const repeat = field.value.toLowerCase();
    if (seen.has(repeat)) continue;
    seen.add(repeat);
    out.push({ label: field.label, value: truncate(field.value, FIELD_VALUE_MAX) });
  }
  return out;
}

const DAY = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const DAY_YEAR = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
const MOMENT = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/* "Aug 31" this year, "Aug 31, 2025" otherwise; null/invalid -> null. */
export function formatDay(iso: string | null, now: Date = new Date()): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear() === now.getFullYear() ? DAY.format(date) : DAY_YEAR.format(date);
}

/* "Aug 31, 6:02 AM" for the checks log. */
export function formatMoment(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return MOMENT.format(date);
}

/* Where a trigger stands with its checks. Read from the newest check when
   the page has the log (the detail page), else from the row's own
   last_run_state and last_run_at (the list). A queued or running check
   wins over everything, including a row that has never finished one. */
export type LastCheck =
  | { kind: "never" }
  | { kind: "checking" }
  | { kind: "checked"; at: string | null; failed: boolean };

export type LastCheckSource = Pick<Trigger, "lastRunAt" | "lastRunState">;
/* The state is a plain string here: only "open" and "failed" matter. */
export type NewestRun = { state: string; finishedAt: string | null; startedAt: string | null; createdAt: string };

export function lastCheck(trigger: LastCheckSource, newestRun?: NewestRun | null): LastCheck {
  const state = newestRun?.state ?? trigger.lastRunState;
  if (runIsOpen(state)) return { kind: "checking" };
  const at = newestRun?.finishedAt ?? trigger.lastRunAt ?? newestRun?.startedAt ?? newestRun?.createdAt ?? null;
  if (!at) return { kind: "never" };
  return { kind: "checked", at, failed: state === "failed" };
}

export const CHECKING_LINE = "Checking now…";
export const NEVER_CHECKED_LINE = "Has not checked yet";

/* The row's check line: "Checking now…", "Has not checked yet", "Last
   check Aug 31", "Last check Aug 31 failed". */
export function lastCheckLine(trigger: LastCheckSource, newestRun?: NewestRun | null, now: Date = new Date()): string {
  const check = lastCheck(trigger, newestRun);
  if (check.kind === "checking") return CHECKING_LINE;
  if (check.kind === "never") return NEVER_CHECKED_LINE;
  const day = formatDay(check.at, now) ?? "recently";
  return check.failed ? `Last check ${day} failed` : `Last check ${day}`;
}

/* The detail page's meta line carries the same thing to the minute:
   "Last check Aug 31, 6:02 AM" (", failed" when it did). */
export function lastCheckFact(trigger: LastCheckSource, newestRun?: NewestRun | null): string {
  const check = lastCheck(trigger, newestRun);
  if (check.kind === "checking") return CHECKING_LINE;
  if (check.kind === "never") return NEVER_CHECKED_LINE;
  const moment = formatMoment(check.at) ?? "recently";
  return check.failed ? `Last check ${moment}, failed` : `Last check ${moment}`;
}

/* The When cell: the day the item went up, or, for one the source listed
   without a date, the day we found it.

   Both come back as a bare day, because a column of dates with one cell
   reading "Found Sep 1" looks like a rendering bug rather than a
   distinction. The distinction survives on the flag: the page prints a
   gray "Undated" under the borrowed date, which is the same
   date-plus-sub-line grammar the Checks table already uses, and it is
   what explains why a Sep 1 row sits below an Aug 29 one in a
   newest-first table. A row with no usable date at all says so outright
   and needs no sub-line. */
export type FoundCell = { day: string; undated: boolean };

export function foundCell(item: Pick<TriggerItem, "foundAt" | "createdAt">, now: Date = new Date()): FoundCell {
  const found = formatDay(item.foundAt, now);
  if (found) return { day: found, undated: false };
  const seen = formatDay(item.createdAt, now);
  return seen ? { day: seen, undated: true } : { day: "Unknown", undated: false };
}
