/* Pure helpers behind the Settings page's send-schedule card, split out so
   node --test can pin the copy and the save-button logic (same convention as
   team/team-model.ts). Nothing here touches the DOM. */

import type { DailyCaps, Holiday, SendSchedule } from "./api";

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type TimeOption = { value: string; label: string };

/* "18:00" -> "6:00 PM". A string that is not HH:MM comes back unchanged. */
export function formatTime12(hhmm: string): string {
  const minutes = minutesOf(hhmm);
  if (minutes === null) return hhmm;
  const hours = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, "0");
  const period = hours < 12 ? "AM" : "PM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${mm} ${period}`;
}

/* Every half hour from 00:00 to 23:30, as select options. */
export function timeOptions(): TimeOption[] {
  const out: TimeOption[] = [];
  for (let h = 0; h < 24; h += 1) {
    for (const mm of ["00", "30"]) {
      const value = `${String(h).padStart(2, "0")}:${mm}`;
      out.push({ value, label: formatTime12(value) });
    }
  }
  return out;
}

/* Minutes since midnight, or null when the string is not a valid HH:MM. */
function minutesOf(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/* Unique, in range, Monday first. */
function normalizeDays(days: number[]): number[] {
  return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
}

/* "Monday to Friday" for one contiguous run (Monday first, so Sat, Sun,
   Mon is a list and not a run), "Mon, Wed, Fri" otherwise, the full name
   for a single day, "Every day" for all seven. */
export function describeDays(days: number[]): string {
  const sorted = normalizeDays(days);
  if (sorted.length === 0) return "No days";
  if (sorted.length === 7) return "Every day";
  if (sorted.length === 1) return DAY_NAMES[sorted[0]];
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous) return `${DAY_NAMES[sorted[0]]} to ${DAY_NAMES[sorted[sorted.length - 1]]}`;
  return sorted.map((d) => DAY_LABELS[d]).join(", ");
}

/* "PDT" for America/Los_Angeles in September. The IANA name itself when
   the runtime cannot format that zone. */
export function tzAbbreviation(tz: string, at: Date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? tz;
  } catch {
    return tz;
  }
}

/* The one line the review queue shows above its runway strip. */
export function scheduleSentence(schedule: SendSchedule, at: Date = new Date()): string {
  const base = `Sends ${describeDays(schedule.days)}, ${formatTime12(schedule.start)} to ${formatTime12(schedule.end)} ${tzAbbreviation(schedule.tz, at)}`;
  return schedule.skip_us_holidays ? `${base}, skipping US holidays` : base;
}

/* Save is enabled only when the draft would change the saved schedule. Day
   order does not count as a change. */
export function isDirty(saved: SendSchedule, draft: SendSchedule): boolean {
  return (
    normalizeDays(saved.days).join(",") !== normalizeDays(draft.days).join(",") ||
    saved.start !== draft.start ||
    saved.end !== draft.end ||
    saved.tz !== draft.tz ||
    saved.skip_us_holidays !== draft.skip_us_holidays
  );
}

export const MIN_WINDOW_MINUTES = 30;

/* Mirrors the backend's rules so the Save button can explain itself before
   a round trip. null when the draft is valid. */
export function validateDraft(draft: SendSchedule): string | null {
  if (normalizeDays(draft.days).length === 0) return "Pick at least one day.";
  const start = minutesOf(draft.start);
  const end = minutesOf(draft.end);
  if (start === null || end === null) return "Pick a start and an end time.";
  if (start >= end) return "The window has to close after it opens.";
  if (end - start < MIN_WINDOW_MINUTES) return `The window has to be at least ${MIN_WINDOW_MINUTES} minutes.`;
  return null;
}

export type TimezoneOption = { value: string; label: string };

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "UTC", label: "UTC" },
];

/* Every zone the runtime knows; empty where Intl.supportedValuesOf is missing. */
function supportedTimezones(): string[] {
  try {
    return typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  } catch {
    return [];
  }
}

/* Two optgroups: the common zones, then every other zone the runtime knows.
   `current` is always present so a saved zone never falls out of the select. */
export function timezoneOptions(
  current: string,
  supported: string[] = supportedTimezones(),
): { common: TimezoneOption[]; all: TimezoneOption[] } {
  const commonValues = new Set(COMMON_TIMEZONES.map((o) => o.value));
  const rest = new Set(supported.filter((tz) => !commonValues.has(tz)));
  if (current && !commonValues.has(current)) rest.add(current);
  const all = [...rest].sort().map((value) => ({ value, label: value.replace(/_/g, " ") }));
  return { common: COMMON_TIMEZONES, all };
}

/* The browser's own zone, or null where the runtime will not say. */
export function browserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/* "Fri Sep 11, 9:00 AM PDT" in the schedule's zone. null when the stamp
   does not parse or the zone is unknown. */
export function formatNextOpen(iso: string | null, tz: string): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).formatToParts(at);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("weekday")} ${get("month")} ${get("day")}, ${get("hour")}:${get("minute")} ${get("dayPeriod")} ${get("timeZoneName")}`;
  } catch {
    return null;
  }
}

/* "Mon Oct 12" from "2026-10-12", built in UTC so the day never shifts (a
   bare date string parsed as local time can land a day early). */
function holidayDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).formatToParts(new Date(Date.UTC(y, m - 1, d)));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("month")} ${get("day")}`;
}

/* "Next: Columbus Day, Mon Oct 12 · Veterans Day, Wed Nov 11 · …", or null
   when nothing is coming up. */
export function holidayLine(holidays: Holiday[]): string | null {
  if (holidays.length === 0) return null;
  return `Next: ${holidays.map((h) => `${h.name}, ${holidayDate(h.date)}`).join(" · ")}`;
}

/* The note beside Save after a successful save. */
export function savedNote(moved: number | null): string {
  if (!moved || moved < 1) return "Saved.";
  return `Saved. ${moved.toLocaleString()} queued send${moved === 1 ? "" : "s"} moved to the next open window.`;
}

function count(n: number, noun: string): string {
  return `${n.toLocaleString()} ${noun}${n === 1 ? "" : "s"}`;
}

/* The gray line under the card. */
export function capsLine(caps: DailyCaps): string {
  return `Daily caps per connected account: ${count(caps.email, "email")}, ${count(caps.message, "LinkedIn message")}, ${count(caps.connection_request, "connection request")}, ${count(caps.x_dm, "X DM")}, ${count(caps.x_follow, "X follow")}.`;
}
