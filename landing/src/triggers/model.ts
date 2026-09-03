/* Triggers: when something new appears on a site, then the agent acts on
   it. A trigger is a site URL, a line saying what counts as new, filters, a
   schedule and the actions that follow. Types here are the camelCase shapes
   the pages render; the snake_case wire shapes live in api.ts. */

export type TriggerSourceKind = "mycnajobs" | "indeed" | "custom_url";
export type TriggerCadence = "daily" | "weekly" | "every_n_hours";
export type TriggerStatus = "active" | "paused" | "needs_setup";
export type PullMethod =
  | "api"
  | "firecrawl_pages"
  | "firecrawl_monitor"
  | "firecrawl_search"
  | "adapter"
  | "needs_puller"
  | "unsupported";
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
  excludeEmployerTerms: string[];
  url: string | null;
};

export type TriggerSchedule = {
  cadence: TriggerCadence;
  fireHour: number;
  intervalHours: number | null;
};

export type TriggerActions = {
  addCompany: boolean;
  findContact: boolean;
  buildDemo: boolean;
  enroll: boolean;
};

export type TriggerPull = {
  method: PullMethod;
  label: string;
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
  sourceUrl: string | null;
  sourceHost: string | null;
  watch: string | null;
  filters: TriggerFilters;
  schedule: TriggerSchedule;
  actions: TriggerActions;
  pull: TriggerPull | null;
  campaignId: string | null;
  campaignName: string | null;
  status: TriggerStatus;
  lastRunAt: string | null;
  lastRunState: string | null;
  counts: TriggerCounts;
  createdAt: string;
};

/* Who started a run: the schedule, a press of Check now, or the setup
   step right after the trigger was created. */
export type RunTrigger = "schedule" | "manual" | "setup";

export type TriggerRun = {
  id: string;
  state: RunState;
  triggeredBy: RunTrigger;
  postingsSeen: number;
  postingsNew: number;
  /* The pull counters arrived after the first rows were written; null means
     the row predates them and the log shows a dash. */
  pagesFetched: number | null;
  creditsUsed: number | null;
  /* Dollars the pull cost, when the backend metered it. */
  costUsd: number | null;
  idsSeen: number | null;
  idsNew: number | null;
  idsFiltered: number | null;
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
  name: string | null;
  /* Null watches the whole web instead of one site. */
  sourceUrl: string | null;
  watch: string;
  keywords: string[];
  locations: string[];
  excludeEmployerTerms: string[];
  cadence: TriggerCadence;
  fireHour: number;
  intervalHours: number | null;
  actions: TriggerActions;
  campaignId: string | null;
};

/* What Edit can change: everything but the site. The filters travel as a
   whole, so keywords and employer terms the form does not show are sent
   back as they were. */
export type EditTriggerInput = Omit<NewTriggerInput, "sourceUrl">;

/* Employers a home care trigger skips unless the customer says otherwise:
   the posting is real, but the employer is not an agency they sell to. */
export const DEFAULT_EXCLUDE_EMPLOYER_TERMS = [
  "senior living",
  "health system",
  "hospital",
  "medical center",
  "nursing home",
  "assisted living",
  "memory care",
  "hospice",
];

export const INTERVAL_HOUR_OPTIONS = [2, 4, 6, 8, 12];

/* Rows from before source_url existed only carry a source kind; these are
   the sites those kinds stood for, so the sentence still names a site. */
const LEGACY_HOSTS: Record<string, string> = {
  mycnajobs: "mycnajobs.com",
  indeed: "indeed.com",
};

export function legacyHost(sourceKind: string): string | null {
  return LEGACY_HOSTS[sourceKind] ?? null;
}

/* "https://www.mycnajobs.com/jobs?x=1" -> "mycnajobs.com". Tolerates a bare
   host without a scheme, so the name preview works while the customer is
   still typing. Null when nothing host-like is there. */
export function hostFromUrl(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const host = new URL(candidate).hostname.replace(/^www\./i, "").toLowerCase();
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}

export function isSiteUrl(value: string): boolean {
  return /^https?:\/\/\S+\.\S+/i.test(value.trim());
}

/* The name a trigger gets when the customer does not type one: the site,
   or, for a trigger that watches the whole web, the first three words of
   what counts as new ("Home care agencies"). */
export function deriveTriggerName(watch: string, host: string | null): string {
  if (host) return host;
  const words = watch.trim().split(/\s+/).filter(Boolean).slice(0, 3).join(" ").replace(/[.,;:!?]+$/, "");
  return words || "New trigger";
}

const TITLE_WORDS = 5;
/* A name longer than this is a sentence that got stored as a name. */
const NAME_WORDS_MAX = 8;

function normalizeSentence(text: string): string {
  return text.trim().replace(/\s+/g, " ").replace(/[.,;:!?]+$/, "").toLowerCase();
}

function firstWords(text: string, count: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const head = words.slice(0, count).join(" ").replace(/[.,;:!?]+$/, "");
  return words.length > count ? `${head}…` : head;
}

/* The title the card and the detail page show. A trigger with no site can
   arrive named after its whole sentence, and fifteen words over five lines
   is not a title. So: a name the customer typed (short, and not the
   sentence itself), else the site, else the first five words of the
   sentence with an ellipsis. The full sentence is the lede beneath. */
export function triggerTitle(trigger: Pick<Trigger, "name" | "sourceHost" | "watch">): string {
  const name = (trigger.name ?? "").trim();
  const watch = (trigger.watch ?? "").trim();
  const typed =
    name !== "" &&
    name.split(/\s+/).length <= NAME_WORDS_MAX &&
    (watch === "" || normalizeSentence(name) !== normalizeSentence(watch));
  if (typed) return name;
  if (trigger.sourceHost) return trigger.sourceHost;
  return firstWords(watch || name, TITLE_WORDS) || "Trigger";
}

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
   Review queue is ready in the morning. */
export const DEFAULT_FIRE_HOUR = 2;
export const DEFAULT_SCHEDULE: TriggerSchedule = { cadence: "daily", fireHour: DEFAULT_FIRE_HOUR, intervalHours: null };

/* "Every night, 2 AM PT" before 6, "Every morning, 6 AM PT" from 6 to 11,
   "Daily, 3 PM PT" after; "Weekly"; "Every 4 hours". Hours are Pacific,
   as the form says. */
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

/* What the card and the detail page show for a trigger: its status, except
   that a site the agent could not work out how to read is "unsupported"
   whatever the row's status says, and a row still waiting on its pull is
   "building". Only active and paused triggers can be checked. */
export type TriggerView = "active" | "paused" | "building" | "unsupported";

export function triggerView(trigger: Pick<Trigger, "status" | "pull">): TriggerView {
  if (trigger.pull?.method === "unsupported") return "unsupported";
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

/* Shown on the card and the detail page while the agent is still working
   out how to check a site. The trigger is greyed out and cannot be checked
   by hand until it is done. */
export const BUILDING_LINE = "Your agent is setting up the pull for this site.";

/* Shown when the agent gave up on a site. */
export const UNSUPPORTED_LINE =
  "We cannot watch this site yet. It needs a sign-in, or it is not a list of items we can read.";

/* The one line that replaces the counts on a card that cannot run yet;
   null for a trigger that runs. */
export function viewNotice(view: TriggerView): string | null {
  if (view === "building") return BUILDING_LINE;
  if (view === "unsupported") return UNSUPPORTED_LINE;
  return null;
}

const PULL_LABELS: Record<PullMethod, string> = {
  api: "Job board search",
  firecrawl_pages: "Page watch",
  firecrawl_monitor: "Site monitor",
  firecrawl_search: "Web search",
  adapter: "Site search",
  needs_puller: "Building",
  unsupported: "Not supported yet",
};

/* The "Source" fact: how the site gets checked, in the backend's own
   customer-facing label ("Job board search", "Building"), with a plain
   fallback per method when the label is empty. Never the method key, which
   can name plumbing. Null when the row predates pulls. */
export function pullLabel(pull: TriggerPull | null | undefined): string | null {
  if (!pull) return null;
  const label = (pull.label ?? "").trim();
  if (label && label.toLowerCase() !== pull.method.toLowerCase()) return label;
  return PULL_LABELS[pull.method] ?? null;
}

export type PostingTone = "plain" | "tide" | "hold" | "skip" | "alert";

/* "New" read two ways after a check (queued for the agent, or reviewed?),
   so the two open statuses say who has the posting. */
const WORKING_LABEL = "Your agent is working on it";

const POSTING_STATUS: Record<PostingStatus, { label: string; tone: PostingTone }> = {
  new: { label: "Waiting for your agent", tone: "plain" },
  in_progress: { label: WORKING_LABEL, tone: "plain" },
  no_lead: { label: "Held: no contact found", tone: "hold" },
  demo_pending: { label: "Demo pending", tone: "plain" },
  ready: { label: "Ready", tone: "plain" },
  enrolled: { label: "Enrolled", tone: "tide" },
  dismissed: { label: "Dismissed", tone: "skip" },
  duplicate: { label: "Skipped: duplicate", tone: "skip" },
  failed: { label: "Failed", tone: "alert" },
};

export function postingStatusLabel(status: string): string {
  return POSTING_STATUS[status as PostingStatus]?.label ?? WORKING_LABEL;
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

const RUN_TRIGGER_LABELS: Record<RunTrigger, string> = {
  schedule: "Scheduled",
  manual: "Check now",
  setup: "First check",
};

/* The runs log's sub-line: what started the run. The check the backend
   starts on its own right after a trigger is created is "First check",
   not "Check now", which nobody pressed. */
export function runTriggerLabel(triggeredBy: string): string {
  return RUN_TRIGGER_LABELS[triggeredBy as RunTrigger] ?? "Scheduled";
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : pluralForm}`;
}

/* The counts a trigger row carries are a lifetime tally by posting
   status, not one check's result, so the card says so: "So far: 40
   postings · 34 agencies added · 13 contacts · 13 demos". Only the
   non-zero parts after the total, in pipeline order; empty when nothing
   has been found yet. Per-check numbers live in the runs log, which the
   list call does not carry. */
export function countsLine(counts: TriggerCounts): string {
  if (!counts.postings) return "";
  const parts = [plural(counts.postings, "posting", "postings")];
  if (counts.agenciesAdded) parts.push(plural(counts.agenciesAdded, "agency added", "agencies added"));
  if (counts.leads) parts.push(plural(counts.leads, "contact", "contacts"));
  if (counts.demos) parts.push(plural(counts.demos, "demo", "demos"));
  if (counts.enrolled) parts.push(`${counts.enrolled.toLocaleString()} enrolled`);
  if (counts.held) parts.push(`${counts.held.toLocaleString()} held for review`);
  return `So far: ${parts.join(" · ")}`;
}

/* A run's counter for the log: the number, or a dash for a row that
   predates the counter. */
export function counterCell(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toLocaleString();
}

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/* "$0.05"; null for nothing, zero, or a value the backend did not send.
   A cost too small to show in cents says so instead of rounding to $0.00. */
export function formatUsd(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value < 0.005 ? "Under $0.01" : USD.format(value);
}

/* The Spend cell: credits the pull used and, when metered, the dollars,
   "12 credits · $0.05". A dash when the row carries neither. */
export function spendCell(run: Pick<TriggerRun, "creditsUsed" | "costUsd">): string {
  const parts: string[] = [];
  if (run.creditsUsed !== null && run.creditsUsed !== undefined) {
    parts.push(plural(run.creditsUsed, "credit", "credits"));
  }
  const cost = formatUsd(run.costUsd);
  if (cost) parts.push(cost);
  return parts.length ? parts.join(" · ") : "—";
}

function epoch(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

/* Newest first by when the posting went up; postings with no date go
   last, and ties (or no dates) fall back to when we found them. Returns
   a new array. */
export function sortPostings<T extends Pick<TriggerPosting, "postedAt" | "createdAt">>(postings: T[]): T[] {
  return [...postings].sort((a, b) => {
    const aPosted = epoch(a.postedAt);
    const bPosted = epoch(b.postedAt);
    if (aPosted !== bPosted) {
      if (aPosted === null) return 1;
      if (bPosted === null) return -1;
      return bPosted - aPosted;
    }
    return (epoch(b.createdAt) ?? 0) - (epoch(a.createdAt) ?? 0);
  });
}

export type ListKind = "keywords" | "locations" | "terms";

/* "Atlanta, GA; Phoenix, AZ" -> two locations; "caregiver, CNA" -> two
   keywords. Locations split on ";" or newline so a city keeps its state;
   keywords and employer terms split on ",". Trimmed, empties dropped,
   case-insensitive dedupe (the backend cleans the same way). The chip
   fields split typed and pasted text with this too. */
export function splitList(value: string, kind: ListKind): string[] {
  const separator = kind === "locations" ? /[;\n]/ : /[,\n]/;
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

/* True when the text a chip field holds contains that field's separator,
   which is when the typed run turns into chips. */
export function hasListSeparator(value: string, kind: ListKind): boolean {
  return kind === "locations" ? /[;\n]/.test(value) : /[,\n]/.test(value);
}

/* Adds terms to a chip list, dropping duplicates case-insensitively. */
export function addToList(list: string[], terms: string[]): string[] {
  const seen = new Set(list.map((term) => term.toLowerCase()));
  const out = [...list];
  for (const term of terms) {
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(term);
  }
  return out;
}

function joinList(items: string[], separator: string, last: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(separator)} ${last} ${items[items.length - 1]}`;
}

const ALL_US = /^(all\s+us|us|usa|united\s+states|all\s+of\s+the\s+us)$/i;

function isAllUs(locations: string[]): boolean {
  return locations.length === 1 && ALL_US.test(locations[0].trim());
}

/* "All US" means something only on its own: next to real places it is
   noise, so the sentence and the chip field both drop it then. */
export function withoutAllUs(locations: string[]): string[] {
  const places = locations.filter((place) => !ALL_US.test(place.trim()));
  return places.length ? places : locations;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/* Places keep their commas ("Atlanta, GA"), so a list of them is joined
   with a middle dot: "Atlanta, GA · Phoenix, AZ · Dallas, TX". Used by
   the when line and the form's summary alike. */
export function joinLocations(locations: string[]): string {
  return locations.map((place) => place.trim()).filter(Boolean).join(" · ");
}

/* The "when" half of the sentence, minus the word When itself (the page
   sets that in bold): "a new caregiver or CNA job posting from a home care
   agency appears on mycnajobs.com in Atlanta, Phoenix or Tampa". A trigger
   with no site "appears anywhere on the web". Falls back to the keywords
   when the row has no watch line. */
export type WhenSource = Pick<Trigger, "watch" | "sourceHost" | "sourceUrl" | "filters"> & {
  sourceKind: string;
};

export function whenLine(trigger: WhenSource): string {
  const watch = (trigger.watch ?? "").trim().replace(/\.+$/, "");
  const subject = watch
    ? lowerFirst(watch)
    : trigger.filters.keywords.length
      ? `a new ${joinList(trigger.filters.keywords, ", ", "or")} posting`
      : "a new posting";
  const host =
    trigger.sourceHost ??
    hostFromUrl(trigger.sourceUrl) ??
    hostFromUrl(trigger.filters.url) ??
    legacyHost(trigger.sourceKind);
  const locations = withoutAllUs(trigger.filters.locations);
  const where = locations.length === 0
    ? ""
    : isAllUs(locations)
      ? host ? " anywhere in the US" : " in the US"
      : ` in ${joinLocations(locations)}`;
  return `${subject} appears${host ? ` on ${host}` : " anywhere on the web"}${where}`;
}

/* The "then" half: "add the agency as a company, find the owner or
   administrator, build a demo and enroll them in "MochaCare intro"". */
export function thenLine(actions: TriggerActions, campaignName: string | null): string {
  const parts: string[] = [];
  if (actions.addCompany) parts.push("add the agency as a company");
  if (actions.findContact) parts.push("find the owner or administrator");
  if (actions.buildDemo) parts.push("build a demo");
  if (actions.enroll) parts.push(campaignName ? `enroll them in "${campaignName}"` : "enroll them in a campaign");
  if (parts.length === 0) return "record the posting";
  return joinList(parts, ", ", "and");
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

/* Where a trigger stands with its checks. Read from the newest run when
   the page has the runs log (the detail page), else from the row's own
   last_run_state and last_run_at (the list). A queued or running check
   wins over everything, including a row that has never finished one: the
   first check used to read "Has not checked yet" while it ran. */
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

/* The card's line: "Checking now…", "Has not checked yet", "Last check
   Aug 31", "Last check Aug 31 failed". */
export function lastCheckLine(trigger: LastCheckSource, newestRun?: NewestRun | null, now: Date = new Date()): string {
  const check = lastCheck(trigger, newestRun);
  if (check.kind === "checking") return CHECKING_LINE;
  if (check.kind === "never") return NEVER_CHECKED_LINE;
  const day = formatDay(check.at, now) ?? "recently";
  return check.failed ? `Last check ${day} failed` : `Last check ${day}`;
}

/* The detail page's "Last check" fact: "Checking now…", "Has not checked
   yet", or the moment the newest check finished, "Aug 31, 6:02 AM" (", failed"
   when it did). */
export function lastCheckFact(trigger: LastCheckSource, newestRun?: NewestRun | null): string {
  const check = lastCheck(trigger, newestRun);
  if (check.kind === "checking") return CHECKING_LINE;
  if (check.kind === "never") return NEVER_CHECKED_LINE;
  const moment = formatMoment(check.at) ?? "Recently";
  return check.failed ? `${moment}, failed` : moment;
}

export function postingLocation(posting: Pick<TriggerPosting, "city" | "state" | "locationText">): string {
  const cityState = [posting.city, posting.state].filter(Boolean).join(", ");
  return cityState || posting.locationText || "Location not listed";
}

/* The Posted cell: the day the posting went up, or, for one the board
   listed without a date, the day we found it, said as such so its place
   at the bottom of a newest-first table makes sense. */
export function postedCell(posting: Pick<TriggerPosting, "postedAt" | "createdAt">, now: Date = new Date()): string {
  const posted = formatDay(posting.postedAt, now);
  if (posted) return posted;
  const found = formatDay(posting.createdAt, now);
  return found ? `Found ${found}` : "Unknown";
}
