/* Pure helpers behind the Team panel's auto-join domain card, split out so
   node --test can pin the save-button logic (same convention as
   sends-model.ts). */

/* What actually gets saved: trimmed, lowercased, any pasted leading "@"
   dropped. Empty input means "turn auto-join off" and saves as null. */
export function normalizeDomain(value: string): string | null {
  const cleaned = value.trim().toLowerCase().replace(/^@+/, "");
  return cleaned || null;
}

/* Save is enabled only when the draft would change the saved value — an
   untouched field (draft null) or a draft that normalizes back to what is
   already saved leaves the button disabled, with a title saying why. */
export function domainDirty(saved: string | null, draft: string | null): boolean {
  if (draft === null) return false;
  const savedNormalized = saved ? normalizeDomain(saved) : null;
  return normalizeDomain(draft) !== savedNormalized;
}

/* ---------- invitation emails ---------- */

/* The line under the invite form once a seat exists. It reports what
   happened, not what was attempted: the backend says whether the email went
   out and, when it did not, why. Same line on the Team page and in the
   admin panel. */
export function inviteOutcomeLine(outcome: {
  email: string;
  emailSent: boolean;
  reason?: string | null;
}): string {
  if (outcome.emailSent) return `Invite sent to ${outcome.email}.`;
  const reason = outcome.reason?.trim();
  if (!reason) return "Seat added. No email was sent.";
  return `Seat added. No email was sent: ${/[.!?]$/.test(reason) ? reason : `${reason}.`}`;
}

const DAY = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const DAY_YEAR = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

function inviteDay(iso: string, now: number): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getFullYear() === new Date(now).getFullYear() ? DAY : DAY_YEAR).format(date);
}

/* The sub-line on a seat nobody has claimed yet. The date is the day the
   email went out when one did (a resend moves it), else the day the seat
   was added. */
export function pendingSeatLine(
  seat: { inviteSentAt: string | null; invitedAt: string | null },
  now: number = Date.now(),
): string {
  const sent = seat.inviteSentAt !== null;
  const iso = seat.inviteSentAt ?? seat.invitedAt;
  const day = iso ? inviteDay(iso, now) : null;
  return `${day ? `Invited ${day}` : "Invited"}, ${sent ? "email sent" : "no email sent"}`;
}

/* The backend refuses a second send inside ten minutes of the last one.
   The mock uses these to refuse the same way; the pages only show whatever
   message the server sends back. */
export const RESEND_COOLDOWN_MS = 10 * 60_000;

/* Whole minutes until a resend is allowed again, or null when it is. */
export function resendWaitMinutes(inviteSentAt: string | null, now: number = Date.now()): number | null {
  if (!inviteSentAt) return null;
  const sentAt = new Date(inviteSentAt).getTime();
  if (Number.isNaN(sentAt)) return null;
  const remaining = RESEND_COOLDOWN_MS - (now - sentAt);
  if (remaining <= 0) return null;
  return Math.max(1, Math.ceil(remaining / 60_000));
}

function minutes(n: number): string {
  return `${n} minute${n === 1 ? "" : "s"}`;
}

export function resendRefusalMessage(inviteSentAt: string, now: number = Date.now()): string {
  const wait = resendWaitMinutes(inviteSentAt, now) ?? 1;
  const since = Math.floor((now - new Date(inviteSentAt).getTime()) / 60_000);
  const ago = since < 1 ? "less than a minute ago" : `${minutes(since)} ago`;
  return `An invite went to this address ${ago}. You can send another in ${minutes(wait)}.`;
}
