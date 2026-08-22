export type AnalyticsChannel = "linkedin" | "email" | "x";

export type AnalyticsStatus =
  | "contacted"
  | "opened"
  | "clicked"
  | "replied"
  | "demos_booked";

export type MetricValue = {
  count: number | null;
  available: boolean;
};

export type ChannelMetric = {
  channel: AnalyticsChannel;
  contacted: MetricValue;
  opened: MetricValue;
  clicked: MetricValue;
  replied: MetricValue;
  demosBooked: MetricValue;
};

export type MetricDefinition = {
  id: AnalyticsStatus;
  label: string;
  available: boolean;
  definition: string;
  note: string | null;
};

export type MetricPerson = {
  leadId: string | null;
  name: string | null;
  title: string | null;
  email: string | null;
  companyName: string | null;
  channel: AnalyticsChannel | null;
  status: AnalyticsStatus;
  occurredAt: string;
  source: string;
};

export type ChannelAnalytics = {
  window: { start: string; end: string };
  channels: ChannelMetric[];
  definitions: MetricDefinition[];
  people: MetricPerson[];
  peopleStatus: AnalyticsStatus;
  peopleChannel: AnalyticsChannel | null;
  peopleTotal: number;
  limit: number;
  offset: number;
  unmatchedReplies: Record<AnalyticsChannel, number>;
  unattributedDemosBooked: number;
};

export const CHANNELS: AnalyticsChannel[] = ["linkedin", "email", "x"];

export const AVAILABLE_STATUSES: AnalyticsStatus[] = [
  "contacted",
  "replied",
  "demos_booked",
];

export function channelLabel(channel: AnalyticsChannel | null): string {
  if (channel === "linkedin") return "LinkedIn";
  if (channel === "email") return "Email";
  if (channel === "x") return "X";
  return "Unattributed";
}

export function statusLabel(status: AnalyticsStatus): string {
  if (status === "demos_booked") return "Demos booked";
  return status[0].toUpperCase() + status.slice(1);
}

export function formatMetric(metric: MetricValue): string {
  if (!metric.available || metric.count === null) return "—";
  return new Intl.NumberFormat("en-US").format(metric.count);
}

export function formatObservedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function analyticsWindow(days: number, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function appendAnalyticsPage(
  current: ChannelAnalytics,
  next: ChannelAnalytics,
): ChannelAnalytics {
  const people = new Map(
    current.people.map((person) => [
      [person.leadId, person.channel, person.status, person.occurredAt, person.source].join("|"),
      person,
    ]),
  );
  next.people.forEach((person) => {
    people.set(
      [person.leadId, person.channel, person.status, person.occurredAt, person.source].join("|"),
      person,
    );
  });
  return { ...next, people: [...people.values()] };
}

export function analyticsDataAfterFailure(
  current: ChannelAnalytics | null,
  failedOffset: number,
): ChannelAnalytics | null {
  return failedOffset > 0 ? current : null;
}
