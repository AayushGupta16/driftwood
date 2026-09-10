import assert from "node:assert/strict";
import test from "node:test";

import {
  browserTimezone,
  capsLine,
  COMMON_TIMEZONES,
  DAY_LABELS,
  describeDays,
  formatNextOpen,
  formatTime12,
  holidayLine,
  isDirty,
  savedNote,
  scheduleSentence,
  timeOptions,
  timezoneOptions,
  tzAbbreviation,
  validateDraft,
} from "./model.ts";

const WEEKDAYS = { days: [0, 1, 2, 3, 4], start: "09:00", end: "18:00", tz: "America/Los_Angeles", skip_us_holidays: true };
/* Thu Sep 10 2026, mid-day UTC: Pacific is on daylight time. */
const SEPTEMBER = new Date("2026-09-10T12:00:00Z");

test("day labels run Monday first", () => {
  assert.deepEqual(DAY_LABELS, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
});

test("24h times render as 12h with AM/PM", () => {
  assert.equal(formatTime12("00:00"), "12:00 AM");
  assert.equal(formatTime12("09:00"), "9:00 AM");
  assert.equal(formatTime12("12:00"), "12:00 PM");
  assert.equal(formatTime12("18:00"), "6:00 PM");
  assert.equal(formatTime12("23:30"), "11:30 PM");
  assert.equal(formatTime12("nope"), "nope");
  assert.equal(formatTime12("25:00"), "25:00");
});

test("time options step every 30 minutes across the day", () => {
  const options = timeOptions();
  assert.equal(options.length, 48);
  assert.deepEqual(options[0], { value: "00:00", label: "12:00 AM" });
  assert.deepEqual(options[18], { value: "09:00", label: "9:00 AM" });
  assert.deepEqual(options[47], { value: "23:30", label: "11:30 PM" });
});

test("a contiguous run of days reads first to last", () => {
  assert.equal(describeDays([0, 1, 2, 3, 4]), "Monday to Friday");
  assert.equal(describeDays([0, 1]), "Monday to Tuesday");
  assert.equal(describeDays([4, 3, 2]), "Wednesday to Friday");
});

test("non-contiguous days read as a short list", () => {
  assert.equal(describeDays([0, 2, 4]), "Mon, Wed, Fri");
  assert.equal(describeDays([0, 1, 2, 3, 4, 6]), "Mon, Tue, Wed, Thu, Fri, Sun");
});

test("Sat, Sun, Mon is not a run in Monday-first order", () => {
  assert.equal(describeDays([5, 6, 0]), "Mon, Sat, Sun");
});

test("one day, every day, and no days each have their own line", () => {
  assert.equal(describeDays([2]), "Wednesday");
  assert.equal(describeDays([0, 1, 2, 3, 4, 5, 6]), "Every day");
  assert.equal(describeDays([]), "No days");
  assert.equal(describeDays([3, 3, 9, -1]), "Thursday");
});

test("the zone abbreviation follows daylight time and falls back to the name", () => {
  assert.equal(tzAbbreviation("America/Los_Angeles", SEPTEMBER), "PDT");
  assert.equal(tzAbbreviation("America/Los_Angeles", new Date("2026-01-15T12:00:00Z")), "PST");
  assert.equal(tzAbbreviation("America/New_York", SEPTEMBER), "EDT");
  assert.equal(tzAbbreviation("Not/AZone", SEPTEMBER), "Not/AZone");
});

test("the review queue line states days, hours, zone and the holiday rule", () => {
  assert.equal(
    scheduleSentence(WEEKDAYS, SEPTEMBER),
    "Sends Monday to Friday, 9:00 AM to 6:00 PM PDT, skipping US holidays",
  );
  assert.equal(
    scheduleSentence({ ...WEEKDAYS, skip_us_holidays: false }, SEPTEMBER),
    "Sends Monday to Friday, 9:00 AM to 6:00 PM PDT",
  );
});

test("a draft is dirty only when it would change the saved schedule", () => {
  assert.equal(isDirty(WEEKDAYS, { ...WEEKDAYS }), false);
  assert.equal(isDirty(WEEKDAYS, { ...WEEKDAYS, days: [4, 3, 2, 1, 0] }), false);
  assert.equal(isDirty(WEEKDAYS, { ...WEEKDAYS, days: [0, 1, 2, 3, 4, 5] }), true);
  assert.equal(isDirty(WEEKDAYS, { ...WEEKDAYS, end: "17:00" }), true);
  assert.equal(isDirty(WEEKDAYS, { ...WEEKDAYS, tz: "America/New_York" }), true);
  assert.equal(isDirty(WEEKDAYS, { ...WEEKDAYS, skip_us_holidays: false }), true);
});

test("validation mirrors the backend rules in plain words", () => {
  assert.equal(validateDraft(WEEKDAYS), null);
  assert.equal(validateDraft({ ...WEEKDAYS, days: [] }), "Pick at least one day.");
  assert.equal(validateDraft({ ...WEEKDAYS, start: "18:00", end: "09:00" }), "The window has to close after it opens.");
  assert.equal(validateDraft({ ...WEEKDAYS, start: "09:00", end: "09:00" }), "The window has to close after it opens.");
  assert.equal(validateDraft({ ...WEEKDAYS, start: "09:00", end: "09:15" }), "The window has to be at least 30 minutes.");
  assert.equal(validateDraft({ ...WEEKDAYS, start: "09:00", end: "09:30" }), null);
  assert.equal(validateDraft({ ...WEEKDAYS, start: "", end: "09:30" }), "Pick a start and an end time.");
});

test("timezone options group the common zones and keep the current one", () => {
  const supported = ["America/Los_Angeles", "Asia/Tokyo", "Europe/Paris"];
  const grouped = timezoneOptions("Asia/Tokyo", supported);
  assert.deepEqual(grouped.common, COMMON_TIMEZONES);
  assert.deepEqual(grouped.all, [
    { value: "Asia/Tokyo", label: "Asia/Tokyo" },
    { value: "Europe/Paris", label: "Europe/Paris" },
  ]);
  assert.deepEqual(timezoneOptions("Pacific/Port_Moresby", supported).all, [
    { value: "Asia/Tokyo", label: "Asia/Tokyo" },
    { value: "Europe/Paris", label: "Europe/Paris" },
    { value: "Pacific/Port_Moresby", label: "Pacific/Port Moresby" },
  ]);
  assert.deepEqual(timezoneOptions("UTC", []).all, []);
  assert.equal(timezoneOptions("America/Los_Angeles").common.length, COMMON_TIMEZONES.length);
});

test("the browser zone is a name or null", () => {
  const tz = browserTimezone();
  assert.ok(tz === null || typeof tz === "string");
});

test("the next opening renders in the schedule's zone", () => {
  assert.equal(formatNextOpen("2026-09-11T16:00:00Z", "America/Los_Angeles"), "Fri Sep 11, 9:00 AM PDT");
  assert.equal(formatNextOpen("2026-09-11T16:00:00Z", "America/New_York"), "Fri Sep 11, 12:00 PM EDT");
  assert.equal(formatNextOpen("not a date", "America/Los_Angeles"), null);
  assert.equal(formatNextOpen(null, "America/Los_Angeles"), null);
  assert.equal(formatNextOpen("2026-09-11T16:00:00Z", "Not/AZone"), null);
});

test("the holiday line names each date by weekday without shifting the day", () => {
  assert.equal(
    holidayLine([
      { date: "2026-10-12", name: "Columbus Day" },
      { date: "2026-11-11", name: "Veterans Day" },
      { date: "2026-11-26", name: "Thanksgiving" },
    ]),
    "Next: Columbus Day, Mon Oct 12 · Veterans Day, Wed Nov 11 · Thanksgiving, Thu Nov 26",
  );
  assert.equal(holidayLine([{ date: "2027-01-01", name: "New Year's Day" }]), "Next: New Year's Day, Fri Jan 1");
  assert.equal(holidayLine([]), null);
});

test("the saved note counts moved sends", () => {
  assert.equal(savedNote(null), "Saved.");
  assert.equal(savedNote(0), "Saved.");
  assert.equal(savedNote(1), "Saved. 1 queued send moved to the next open window.");
  assert.equal(savedNote(14), "Saved. 14 queued sends moved to the next open window.");
});

test("the caps line lists every channel", () => {
  assert.equal(
    capsLine({ email: 20, message: 25, connection_request: 20, x_dm: 5, x_follow: 10 }),
    "Daily caps per connected account: 20 emails, 25 LinkedIn messages, 20 connection requests, 5 X DMs, 10 X follows.",
  );
  assert.equal(
    capsLine({ email: 1, message: 1, connection_request: 1, x_dm: 1, x_follow: 1 }),
    "Daily caps per connected account: 1 email, 1 LinkedIn message, 1 connection request, 1 X DM, 1 X follow.",
  );
});
