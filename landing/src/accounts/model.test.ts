import assert from "node:assert/strict";
import test from "node:test";

import type { AccountsPage, SendingAccount } from "./api.ts";
import {
  accountLabel,
  channelConnected,
  connectedChannelCount,
  isUsable,
  linkedBy,
  linkedByLine,
  ownAccount,
} from "./model.ts";

function account<S>(overrides: Partial<SendingAccount<S>> & { channelState: S }): SendingAccount<S> {
  return {
    id: "a-1",
    display: "Yuvan Sharma",
    connectedBy: { id: "u-1", name: "Yuvan Sharma", email: "yuvan@autosana.ai" },
    isMine: false,
    canDisconnect: false,
    status: "active",
    error: null,
    connectedAt: "2026-09-09T18:04:00Z",
    ...overrides,
  };
}

test("the label falls back from display to the linker's name, then their email", () => {
  assert.equal(accountLabel(account({ channelState: {} })), "Yuvan Sharma");
  assert.equal(accountLabel(account({ display: null, channelState: {} })), "Yuvan Sharma");
  assert.equal(
    accountLabel(
      account({
        display: null,
        connectedBy: { id: "u-1", name: null, email: "yuvan@autosana.ai" },
        channelState: {},
      }),
    ),
    "yuvan@autosana.ai",
  );
});

test("the second line names the linker, or says 'you' on the viewer's own row", () => {
  assert.equal(linkedBy(account({ channelState: {} })), "Yuvan Sharma");
  assert.equal(linkedBy(account({ isMine: true, channelState: {} })), "you");
  assert.equal(linkedByLine(account({ channelState: {} })), "Linked by Yuvan Sharma");
  assert.equal(linkedByLine(account({ isMine: true, channelState: {} })), "Linked by you");
  assert.equal(
    linkedByLine(
      account({ connectedBy: { id: "u-2", name: null, email: "sam@example.com" }, channelState: {} }),
    ),
    "Linked by sam@example.com",
  );
});

test("only an active row is usable, and a chat-locked X row is not", () => {
  assert.equal(isUsable(account({ channelState: {} })), true);
  assert.equal(isUsable(account({ status: "pending", channelState: {} })), false);
  assert.equal(isUsable(account({ status: "error", error: "Signed out.", channelState: {} })), false);
  assert.equal(
    isUsable(account({ channelState: { handle: "pmarca", pending: false, chatLocked: true } })),
    false,
  );
  assert.equal(
    isUsable(account({ channelState: { handle: "pmarca", pending: false, chatLocked: false } })),
    true,
  );
});

test("a channel is connected when any row is usable", () => {
  assert.equal(channelConnected([]), false);
  assert.equal(channelConnected([account({ status: "pending", channelState: {} })]), false);
  assert.equal(
    channelConnected([account({ status: "pending", channelState: {} }), account({ id: "a-2", channelState: {} })]),
    true,
  );
});

test("ownAccount picks the viewer's row and null when there is none", () => {
  const mine = account({ id: "mine", isMine: true, channelState: {} });
  assert.equal(ownAccount([account({ channelState: {} }), mine]), mine);
  assert.equal(ownAccount([account({ channelState: {} })]), null);
});

test("the section count is the number of channels with a usable row", () => {
  const page: AccountsPage = {
    canConnect: true,
    linkedin: [account({ channelState: {} })],
    email: [account({ status: "pending", channelState: { provider: "outlook", address: "sam@example.com" } })],
    x: [account({ channelState: { handle: "pmarca", pending: false, chatLocked: true } })],
  };
  assert.equal(connectedChannelCount(page), 1);
  assert.equal(connectedChannelCount({ ...page, x: [account({ channelState: { handle: null, pending: false, chatLocked: false } })] }), 2);
});
