/* Pure helpers behind the Sending accounts lists, split out so node --test
   can pin the label fallback and the "channel is connected" rule (same
   convention as team-model.ts). Type-only import keeps this file free of
   fetch code. */

import type { AccountsPage, SendingAccount, XState } from "./api";

/* What a row is called: the backend's display, then the linker's name,
   then their email. */
export function accountLabel(account: SendingAccount<unknown>): string {
  return account.display ?? account.connectedBy.name ?? account.connectedBy.email;
}

/* Who the row's second line names: "you" on the viewer's own row, else
   the linker's name, then their email. */
export function linkedBy(account: SendingAccount<unknown>): string {
  if (account.isMine) return "you";
  return account.connectedBy.name ?? account.connectedBy.email;
}

/* The row's second line as one string (the title attribute, tests). */
export function linkedByLine(account: SendingAccount<unknown>): string {
  return `Linked by ${linkedBy(account)}`;
}

/* A row that can send now. An X login that still sits behind the chat PIN
   wall is active as far as the backend is concerned, but DMs cannot go out,
   so the card and the "N of 3 connected" count treat it as not yet usable,
   exactly as the single-account card did. */
export function isUsable(account: SendingAccount<unknown>): boolean {
  if (account.status !== "active") return false;
  const state = account.channelState as Partial<XState> | null;
  return !(state && state.chatLocked === true);
}

export function channelConnected(rows: SendingAccount<unknown>[]): boolean {
  return rows.some(isUsable);
}

/* The viewer's own row in a channel, or null. LinkedIn and X hold at most
   one per person; email may hold several, and the first is returned. */
export function ownAccount<S>(rows: SendingAccount<S>[]): SendingAccount<S> | null {
  return rows.find((row) => row.isMine) ?? null;
}

/* "N of 3 connected": channels with at least one usable row. */
export function connectedChannelCount(page: AccountsPage): number {
  return [page.linkedin, page.email, page.x].filter(channelConnected).length;
}
