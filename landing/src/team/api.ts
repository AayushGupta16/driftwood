/* Fetch layer for the workspace Team panel (GET/POST/DELETE/PUT
   /api/v1/dashboard/org) plus the two admin invite routes, which return the
   same membership row and so share its mapping. Same-origin relative paths,
   cookie auth. */

export type OrgMember = {
  membershipId: string | null;
  email: string;
  name: string | null;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
  /* When the seat was added; null on the owner's own row. */
  invitedAt: string | null;
  /* When the invite email last went out; null when none ever did. */
  inviteSentAt: string | null;
  /* The one-line note an admin attached to the invite, if any. */
  inviteNote: string | null;
};

export type OrgPage = {
  id: string;
  name: string;
  domain: string | null;
  yourRole: "owner" | "admin" | "member";
  members: OrgMember[];
};

/* What adding a seat reports back: the page (or row) plus whether the invite
   email actually went out and, when it did not, the reason in plain words. */
export type InviteReceipt = {
  emailSent: boolean;
  reason: string | null;
};

type RawMember = {
  membership_id: string | null;
  email: string;
  name: string | null;
  role: string;
  status: string;
  invited_at?: string | null;
  invite_sent_at?: string | null;
  invite_note?: string | null;
};

type RawPage = {
  id: string;
  name: string;
  domain: string | null;
  your_role: string;
  members: RawMember[];
};

type RawReceipt = {
  email_sent?: boolean;
  reason?: string | null;
};

function mapMember(m: RawMember): OrgMember {
  return {
    membershipId: m.membership_id,
    email: m.email,
    name: m.name,
    role: m.role as OrgMember["role"],
    status: m.status as OrgMember["status"],
    invitedAt: m.invited_at ?? null,
    inviteSentAt: m.invite_sent_at ?? null,
    inviteNote: m.invite_note ?? null,
  };
}

function mapPage(raw: RawPage): OrgPage {
  return {
    id: raw.id,
    name: raw.name,
    domain: raw.domain,
    yourRole: raw.your_role as OrgPage["yourRole"],
    members: raw.members.map(mapMember),
  };
}

/* A backend that predates invitation emails omits email_sent; a seat it
   added got no email, and the page says so rather than claiming a send. */
function mapReceipt(raw: RawReceipt): InviteReceipt {
  return {
    emailSent: raw.email_sent === true,
    reason: raw.email_sent === true ? null : (raw.reason ?? null),
  };
}

/* A resend answers with the refreshed row; tolerate a whole page too, and
   pick the row out of it. */
function rowFromResponse(body: RawMember | RawPage, membershipId: string): OrgMember {
  if ("members" in body) {
    const row = body.members.find((m) => m.membership_id === membershipId);
    if (!row) throw new Error("That seat is no longer on the page.");
    return mapMember(row);
  }
  return mapMember(body);
}

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

const request = async (path: string, init?: RequestInit): Promise<OrgPage> =>
  mapPage(await requestJson<RawPage>(path, init));

export const getOrg = () => request("/api/v1/dashboard/org");

export async function inviteMember(
  email: string,
  role: "admin" | "member",
): Promise<{ page: OrgPage } & InviteReceipt> {
  const raw = await requestJson<RawPage & RawReceipt>("/api/v1/dashboard/org/members", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
  return { page: mapPage(raw), ...mapReceipt(raw) };
}

export const removeMember = (membershipId: string) =>
  request(`/api/v1/dashboard/org/members/${encodeURIComponent(membershipId)}`, {
    method: "DELETE",
  });

/* Owner only, unclaimed seats only. Inside ten minutes of the last send the
   backend refuses with a plain message, which surfaces as the thrown error. */
export const resendInvite = async (membershipId: string): Promise<OrgMember> =>
  rowFromResponse(
    await requestJson<RawMember | RawPage>(
      `/api/v1/dashboard/org/members/${encodeURIComponent(membershipId)}/resend`,
      { method: "POST" },
    ),
    membershipId,
  );

export const setOrgDomain = (domain: string | null) =>
  request("/api/v1/dashboard/org/domain", {
    method: "PUT",
    body: JSON.stringify({ domain }),
  });

/* ---------- admin ---------- */

export type AdminInviteInput = {
  email: string;
  name?: string;
  note?: string;
  role?: "admin" | "member";
};

/* Invites someone into the workspace owned by userId and sends the email;
   answers with the new row plus the receipt. */
export async function adminInvite(
  userId: string,
  input: AdminInviteInput,
): Promise<{ member: OrgMember } & InviteReceipt> {
  const raw = await requestJson<RawMember & RawReceipt>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}/invite`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return { member: mapMember(raw), ...mapReceipt(raw) };
}

export const adminResendInvite = async (membershipId: string): Promise<OrgMember> =>
  rowFromResponse(
    await requestJson<RawMember | RawPage>(
      `/api/v1/admin/memberships/${encodeURIComponent(membershipId)}/resend`,
      { method: "POST" },
    ),
    membershipId,
  );
