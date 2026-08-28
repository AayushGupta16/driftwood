/* Fetch layer for the workspace Team panel (GET/POST/DELETE/PUT
   /api/v1/dashboard/org). Same-origin relative paths, cookie auth. */

export type OrgMember = {
  membershipId: string | null;
  email: string;
  name: string | null;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
};

export type OrgPage = {
  id: string;
  name: string;
  domain: string | null;
  yourRole: "owner" | "admin" | "member";
  members: OrgMember[];
};

type RawMember = {
  membership_id: string | null;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

type RawPage = {
  id: string;
  name: string;
  domain: string | null;
  your_role: string;
  members: RawMember[];
};

function mapPage(raw: RawPage): OrgPage {
  return {
    id: raw.id,
    name: raw.name,
    domain: raw.domain,
    yourRole: raw.your_role as OrgPage["yourRole"],
    members: raw.members.map((m) => ({
      membershipId: m.membership_id,
      email: m.email,
      name: m.name,
      role: m.role as OrgMember["role"],
      status: m.status as OrgMember["status"],
    })),
  };
}

async function request(path: string, init?: RequestInit): Promise<OrgPage> {
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
  return mapPage((await response.json()) as RawPage);
}

export const getOrg = () => request("/api/v1/dashboard/org");

export const inviteMember = (email: string, role: "admin" | "member") =>
  request("/api/v1/dashboard/org/members", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });

export const removeMember = (membershipId: string) =>
  request(`/api/v1/dashboard/org/members/${encodeURIComponent(membershipId)}`, {
    method: "DELETE",
  });

export const setOrgDomain = (domain: string | null) =>
  request("/api/v1/dashboard/org/domain", {
    method: "PUT",
    body: JSON.stringify({ domain }),
  });
