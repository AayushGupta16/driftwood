/* Fetch layer for the workspace's pool of sending accounts (GET/DELETE
   /api/v1/dashboard/accounts). Same-origin relative paths, cookie auth.
   Connect stays on the per-channel endpoints (/linkedin/connect,
   /email/connect, /twitter/connect + /twitter/finish); this module only
   reads the pool and removes one account from it. */

export type AccountStatus = "pending" | "active" | "error";

/* Who linked the account. `name` is nullable defensively: the label falls
   back to the email when neither display nor name is present. */
export type ConnectedBy = {
  id: string;
  name: string | null;
  email: string;
};

export type LinkedInState = Record<string, never>;
export type EmailState = { provider: "gmail" | "outlook" | null; address: string | null };
export type XState = { handle: string | null; pending: boolean; chatLocked: boolean };

export type SendingAccount<S> = {
  id: string;
  /* What the row is called; null falls back to connectedBy.name, then
     connectedBy.email (see accountLabel in ./model). */
  display: string | null;
  connectedBy: ConnectedBy;
  isMine: boolean;
  canDisconnect: boolean;
  status: AccountStatus;
  /* User-facing text, present only while status is "error". */
  error: string | null;
  /* Null while pending. */
  connectedAt: string | null;
  channelState: S;
};

export type AccountsPage = {
  /* True when the viewer holds a write seat (owner or admin). */
  canConnect: boolean;
  linkedin: SendingAccount<LinkedInState>[];
  email: SendingAccount<EmailState>[];
  x: SendingAccount<XState>[];
};

type RawConnectedBy = { id: string; name?: string | null; email: string };

type RawAccount = {
  id: string;
  display?: string | null;
  connected_by: RawConnectedBy;
  is_mine?: boolean;
  can_disconnect?: boolean;
  status: string;
  error?: string | null;
  connected_at?: string | null;
  channel_state?: Record<string, unknown> | null;
};

type RawPage = {
  can_connect?: boolean;
  linkedin?: RawAccount[];
  email?: RawAccount[];
  x?: RawAccount[];
};

export class AccountApiError extends Error {
  readonly status: number;
  /* The backend's machine code, e.g. "cannot_disconnect" on a 403. */
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function mapStatus(raw: string): AccountStatus {
  return raw === "pending" || raw === "error" ? raw : "active";
}

function mapAccount<S>(raw: RawAccount, mapState: (state: Record<string, unknown>) => S): SendingAccount<S> {
  const status = mapStatus(raw.status);
  return {
    id: raw.id,
    display: raw.display ?? null,
    connectedBy: {
      id: raw.connected_by.id,
      name: raw.connected_by.name ?? null,
      email: raw.connected_by.email,
    },
    isMine: raw.is_mine === true,
    canDisconnect: raw.can_disconnect === true,
    status,
    error: status === "error" ? (raw.error ?? null) : null,
    connectedAt: raw.connected_at ?? null,
    channelState: mapState(raw.channel_state ?? {}),
  };
}

const linkedInState = (): LinkedInState => ({});

function emailState(state: Record<string, unknown>): EmailState {
  const provider = state.provider;
  return {
    provider: provider === "gmail" || provider === "outlook" ? provider : null,
    address: typeof state.address === "string" ? state.address : null,
  };
}

function xState(state: Record<string, unknown>): XState {
  return {
    handle: typeof state.handle === "string" ? state.handle : null,
    pending: state.pending === true,
    chatLocked: state.chat_locked === true,
  };
}

function mapPage(raw: RawPage): AccountsPage {
  return {
    canConnect: raw.can_connect === true,
    linkedin: (raw.linkedin ?? []).map((a) => mapAccount(a, linkedInState)),
    email: (raw.email ?? []).map((a) => mapAccount(a, emailState)),
    x: (raw.x ?? []).map((a) => mapAccount(a, xState)),
  };
}

async function responseError(response: Response): Promise<AccountApiError> {
  let message = `Request failed (${response.status})`;
  let code: string | null = null;
  try {
    const body = (await response.json()) as {
      error?: { detail?: string; code?: string };
      detail?: string;
      code?: string;
    };
    message = body.error?.detail ?? body.detail ?? message;
    code = body.error?.code ?? body.code ?? null;
  } catch {
    // A proxy can return HTML. Keep the useful status fallback.
  }
  return new AccountApiError(message, response.status, code);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init });
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as T;
}

const request = async (path: string, init?: RequestInit): Promise<AccountsPage> =>
  mapPage(await requestJson<RawPage>(path, init));

export const getAccounts = () => request("/api/v1/dashboard/accounts");

/* Answers with the page after the removal. A 403 carries
   code "cannot_disconnect" and a plain-words detail. */
export const disconnectAccount = (id: string) =>
  request(`/api/v1/dashboard/accounts/${encodeURIComponent(id)}`, { method: "DELETE" });
