/* Week batching for the review + queued views: group items by their
   scheduled day. Pure — no fetch, no React — so node:test covers it. */

export type DayGroup<T> = {
  /** ISO date ("2026-09-01") or null for the undated bucket. */
  day: string | null;
  items: T[];
};

/* Groups by ISO day, dated days ascending, the undated bucket last.
   Original order is preserved inside each group (the caller sorts first).
   When NOTHING carries a day the single null group is the flat list —
   callers use `hasScheduledDays` to decide whether to render headers. */
export function groupByDay<T>(
  items: T[],
  dayOf: (item: T) => string | null | undefined,
): DayGroup<T>[] {
  const dated = new Map<string, T[]>();
  const undated: T[] = [];
  for (const item of items) {
    const day = dayOf(item) ?? null;
    if (day === null) undated.push(item);
    else {
      const bucket = dated.get(day);
      if (bucket) bucket.push(item);
      else dated.set(day, [item]);
    }
  }
  const groups: DayGroup<T>[] = [...dated.keys()]
    .sort()
    .map((day) => ({ day, items: dated.get(day) ?? [] }));
  if (undated.length > 0) groups.push({ day: null, items: undated });
  return groups;
}

export function hasScheduledDays<T>(
  items: T[],
  dayOf: (item: T) => string | null | undefined,
): boolean {
  return items.some((item) => (dayOf(item) ?? null) !== null);
}

/* "Today" / "Tomorrow" / "Mon, Sep 1" — relative names only for the two
   days a founder acts on without thinking; everything else is absolute.
   `today` is injectable for tests. */
export function dayGroupLabel(
  day: string | null,
  today: Date = new Date(),
): string {
  if (day === null) return "As pacing allows";
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  const date = new Date(y, m - 1, d);
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffDays = Math.round(
    (date.getTime() - startOfToday.getTime()) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
