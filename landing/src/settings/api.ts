/* Fetch layer for the workspace Settings page: GET /api/v1/dashboard/settings
   and PUT /api/v1/dashboard/settings/send-schedule. Same-origin relative
   paths, cookie auth. Wire names stay snake_case, as in team/api.ts. */

export type SendSchedule = {
  /* Monday = 0 … Sunday = 6. */
  days: number[];
  /* 24h "HH:MM". */
  start: string;
  end: string;
  /* IANA name, e.g. "America/Los_Angeles". */
  tz: string;
  skip_us_holidays: boolean;
};

export type Holiday = {
  /* "YYYY-MM-DD", date only. */
  date: string;
  name: string;
};

export type DailyCaps = {
  email: number;
  message: number;
  connection_request: number;
  x_dm: number;
  x_follow: number;
};

export type SettingsPage = {
  send_schedule: SendSchedule;
  window_open_now: boolean;
  /* ISO stamp of the next window opening; null when the backend has none. */
  next_open_at: string | null;
  upcoming_holidays: Holiday[];
  daily_caps: DailyCaps;
  your_role: "owner" | "admin" | "member";
  /* After a save: how many queued sends moved to the next open window.
     null on a plain GET. */
  moved_sends: number | null;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as {
        error?: { detail?: string };
        detail?: string;
      };
      message = body.error?.detail ?? body.detail ?? message;
    } catch {
      // keep the fallback
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export const getSettings = () => requestJson<SettingsPage>("/api/v1/dashboard/settings");

/* Owners and admins only (403 otherwise). A 422 carries a plain message,
   which surfaces as the thrown error. */
export const saveSendSchedule = (body: SendSchedule) =>
  requestJson<SettingsPage>("/api/v1/dashboard/settings/send-schedule", {
    method: "PUT",
    body: JSON.stringify(body),
  });
