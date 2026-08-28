/* Workspace team panel: everyone with a seat, invite by email, remove,
   and the auto-join domain. Rendered inside WorkspacePage; management
   affordances only appear for the owner (the backend enforces the same). */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CARD, useToast } from "../dashboard-shared";
import {
  getOrg,
  inviteMember,
  removeMember,
  setOrgDomain,
  type OrgPage,
} from "./api";
import "./team.css";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; page: OrgPage };

export default function Team() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [domainDraft, setDomainDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setState({ status: "ready", page: await getOrg() });
    } catch {
      setState((prev) => (prev.status === "ready" ? prev : { status: "error" }));
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  async function run(action: () => Promise<OrgPage>, done: string) {
    if (busy) return;
    setBusy(true);
    try {
      const page = await action();
      setState({ status: "ready", page });
      toast(done, "success");
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "That didn't work.", "error");
    } finally {
      setBusy(false);
    }
  }

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;
    void run(
      () => inviteMember(value, role),
      `${value} invited — their seat activates on their first Google sign-in.`,
    ).then(() => setEmail(""));
  }

  if (state.status === "loading")
    return <p className="m-0 py-10 text-center text-sm text-ink-soft">Loading team…</p>;
  if (state.status === "error")
    return (
      <p className="m-0 py-10 text-center text-sm text-red-700" role="alert">
        Couldn&rsquo;t load your team. Please refresh.
      </p>
    );

  const { page } = state;
  const isOwner = page.yourRole === "owner";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline gap-3">
        <h1 className="m-0 text-xl font-semibold text-ink">Team</h1>
        <p className="m-0 text-sm text-ink-soft">
          Everyone here shares this workspace&rsquo;s pipeline, audiences, and
          review queue.
        </p>
      </header>

      <div className={`${CARD} team-members`}>
        {page.members.map((member) => (
          <div key={member.membershipId ?? "owner"} className="team-member-row">
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold text-ink">
                {member.name || member.email}
              </div>
              <div className="truncate text-[12px] text-ink-faint">{member.email}</div>
            </div>
            <span className={`team-role is-${member.role}`}>{member.role}</span>
            {member.status === "invited" && (
              <span className="team-invited">invited — activates on first sign-in</span>
            )}
            {isOwner && member.membershipId && (
              <button
                className="team-remove"
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => removeMember(member.membershipId!),
                    `${member.email} removed.`,
                  )
                }
              >
                remove
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <form className={`${CARD} team-invite`} onSubmit={handleInvite}>
          <h2 className="m-0 text-[13px] font-semibold text-ink">Invite a teammate</h2>
          <div className="team-invite-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@yourcompany.com"
              aria-label="Teammate email"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              aria-label="Seat role"
            >
              <option value="member">member — read only</option>
              <option value="admin">admin — can edit</option>
            </select>
            <button type="submit" disabled={busy || !email.trim()}>
              Invite
            </button>
          </div>
          <p className="m-0 text-[12px] text-ink-faint">
            They sign in with Google using that email — nothing else to set up.
          </p>
        </form>
      )}

      {isOwner && (
        <div className={`${CARD} team-invite`}>
          <h2 className="m-0 text-[13px] font-semibold text-ink">
            Auto-join domain
          </h2>
          <p className="m-0 text-[12px] text-ink-soft">
            Anyone who signs in with a verified email @ this domain joins
            automatically with a read-only seat.
          </p>
          <div className="team-invite-row">
            <input
              type="text"
              value={domainDraft ?? page.domain ?? ""}
              onChange={(e) => setDomainDraft(e.target.value)}
              placeholder="yourcompany.com"
              aria-label="Auto-join domain"
            />
            <button
              type="button"
              disabled={busy || domainDraft === null}
              onClick={() =>
                void run(
                  () => setOrgDomain((domainDraft ?? "").trim() || null),
                  "Auto-join domain updated.",
                ).then(() => setDomainDraft(null))
              }
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
