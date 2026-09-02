/* Triggers: a standing watch on a job board. Every new posting it finds
   becomes a company in the pipeline. Types here are the camelCase shapes the
   pages render; the snake_case wire shapes live in api.ts. */

export type TriggerSourceKind = "mycnajobs" | "indeed" | "custom_url";
export type TriggerCadence = "daily" | "weekly";
export type TriggerStatus = "active" | "paused";
export type RunState = "queued" | "running" | "done" | "failed";
export type PostingStatus =
  | "new"
  | "in_progress"
  | "no_lead"
  | "demo_pending"
  | "ready"
  | "enrolled"
  | "dismissed"
  | "duplicate"
  | "failed";

export type TriggerFilters = {
  keywords: string[];
  locations: string[];
  url: string | null;
};

export type TriggerCounts = {
  postings: number;
  new: number;
  agenciesAdded: number;
  leads: number;
  demos: number;
  enrolled: number;
  held: number;
};

export type Trigger = {
  id: string;
  name: string;
  sourceKind: TriggerSourceKind;
  filters: TriggerFilters;
  cadence: TriggerCadence;
  fireHour: number;
  campaignId: string | null;
  campaignName: string | null;
  status: TriggerStatus;
  lastRunAt: string | null;
  lastRunState: string | null;
  counts: TriggerCounts;
  createdAt: string;
};

export type TriggerRun = {
  id: string;
  state: RunState;
  triggeredBy: "schedule" | "manual";
  postingsSeen: number;
  postingsNew: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type TriggerPosting = {
  id: string;
  sourceUrl: string;
  employerName: string;
  title: string;
  city: string | null;
  state: string | null;
  locationText: string | null;
  payText: string | null;
  postedAt: string | null;
  status: PostingStatus;
  note: string | null;
  companyId: string | null;
  leadId: string | null;
  demoUrl: string | null;
  createdAt: string;
};

export type TriggerDetail = {
  trigger: Trigger;
  runs: TriggerRun[];
  postings: TriggerPosting[];
};

export type NewTriggerInput = {
  name: string;
  sourceKind: TriggerSourceKind;
  keywords: string[];
  locations: string[];
  url: string | null;
  cadence: TriggerCadence;
  fireHour: number;
  campaignId: string | null;
};

/* The job boards a customer chooses to watch are named the way the accounts
   they connect are (ux-principles rule 18): they are the customer's pick,
   not our plumbing. */
const SOURCE_LABELS: Record<TriggerSourceKind, string> = {
  mycnajobs: "myCNAjobs",
  indeed: "Indeed",
  custom_url: "Another site",
};

export function sourceLabel(kind: string): string {
  return SOURCE_LABELS[kind as TriggerSourceKind] ?? "Another site";
}

/* 6 -> "6 AM", 0 -> "12 AM", 12 -> "12 PM", 15 -> "3 PM". */
export function fireHourLabel(hour: number): string {
  const clamped = Math.min(23, Math.max(0, Math.trunc(hour)));
  const twelve = clamped % 12 === 0 ? 12 : clamped % 12;
  return `${twelve} ${clamped < 12 ? "AM" : "PM"}`;
}

export function cadenceLabel(cadence: string, fireHour: number): string {
  if (cadence === "weekly") return "Weekly";
  return `${fireHour < 12 ? "Every morning" : "Every day"}, ${fireHourLabel(fireHour)} PT`;
}

export type PostingTone = "plain" | "tide" | "hold" | "skip" | "alert";

const POSTING_STATUS: Record<PostingStatus, { label: string; tone: PostingTone }> = {
  new: { label: "New", tone: "plain" },
  in_progress: { label: "In progress", tone: "plain" },
  no_lead: { label: "Held: no contact found", tone: "hold" },
  demo_pending: { label: "Demo pending", tone: "plain" },
  ready: { label: "Ready", tone: "plain" },
  enrolled: { label: "Enrolled", tone: "tide" },
  dismissed: { label: "Dismissed", tone: "skip" },
  duplicate: { label: "Skipped: duplicate", tone: "skip" },
  failed: { label: "Failed", tone: "alert" },
};

export function postingStatusLabel(status: string): string {
  return POSTING_STATUS[status as PostingStatus]?.label ?? "In progress";
}

export function postingStatusTone(status: string): PostingTone {
  return POSTING_STATUS[status as PostingStatus]?.tone ?? "plain";
}

const RUN_STATE_LABELS: Record<RunState, string> = {
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

export function runStateLabel(state: string): string {
  return RUN_STATE_LABELS[state as RunState] ?? "Queued";
}

export function runIsOpen(state: string | null | undefined): boolean {
  return state === "queued" || state === "running";
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : pluralForm}`;
}

/* Only the non-zero parts, in pipeline order. The postings total is left
   out: the detail page already heads its table with it, and on the card the
   "new" figure is the one that tells you whether the watch is finding
   anything. Empty string when nothing has happened yet. */
export function countsLine(counts: TriggerCounts): string {
  const parts: string[] = [];
  if (counts.new) parts.push(plural(counts.new, "new posting", "new postings"));
  if (counts.agenciesAdded) parts.push(plural(counts.agenciesAdded, "agency added", "agencies added"));
  if (counts.leads) parts.push(plural(counts.leads, "lead found", "leads found"));
  if (counts.demos) parts.push(plural(counts.demos, "demo built", "demos built"));
  if (counts.enrolled) parts.push(`${counts.enrolled.toLocaleString()} enrolled`);
  if (counts.held) parts.push(`${counts.held.toLocaleString()} held for review`);
  return parts.join(", ");
}

/* "Atlanta, GA; Phoenix, AZ" -> two locations; "caregiver, CNA" -> two
   keywords. Locations split on ";" or newline so a city keeps its state;
   keywords split on ",". Trimmed, empties dropped, case-insensitive dedupe
   (the backend cleans the same way). */
export function splitList(value: string, kind: "keywords" | "locations"): string[] {
  const separator = kind === "keywords" ? /[,\n]/ : /[;\n]/;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value.split(separator)) {
    const term = raw.trim().replace(/\s+/g, " ");
    const key = term.toLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    out.push(term);
  }
  return out;
}

function joinList(items: string[], separator: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(separator)} and ${items[items.length - 1]}`;
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* One line saying what the trigger watches, from its filters:
   "Caregiver and CNA postings, Atlanta, GA and Phoenix, AZ". */
export function watchLine(filters: TriggerFilters, sourceKind: string): string {
  const what = filters.keywords.length
    ? `${joinList(filters.keywords, ", ")} postings`
    : "All postings";
  const where = filters.locations.length ? joinList(filters.locations, "; ") : "anywhere";
  const host = sourceKind === "custom_url" ? hostOf(filters.url) : null;
  return host ? `${what} on ${host}, ${where}` : `${what}, ${where}`;
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

/* Always carries the year: the "watching since" fact reads as a date. */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return DAY_YEAR.format(date);
}

/* "Aug 31, 6:02 AM" for the runs log. */
export function formatMoment(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return MOMENT.format(date);
}

export function postingLocation(posting: Pick<TriggerPosting, "city" | "state" | "locationText">): string {
  const cityState = [posting.city, posting.state].filter(Boolean).join(", ");
  return cityState || posting.locationText || "Location not listed";
}
