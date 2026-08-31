/* Workspace team panel: everyone with a seat, invite by email, remove,
   and the auto-join domain. Rendered inside WorkspacePage; management
   affordances only appear for the owner (the backend enforces the same). */

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CARD, prefetch, useToast } from "../dashboard-shared";
import {
  getOrg,
  inviteMember,
  removeMember,
  setOrgDomain,
  type OrgMember,
  type OrgPage,
} from "./api";
import { domainDirty, normalizeDomain } from "./team-model";
import "./team.css";

/* The org fetch starts at module eval (chunk load), in parallel with
   WorkspacePage's /auth/me — the first load consumes it exactly once (see
   prefetch() in dashboard-shared); retries and reloads fetch fresh. */
const initialOrg = prefetch(() => getOrg());

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: OrgPage };

/* Which control is mid-flight. The active one narrates ("Inviting…"); the
   rest just disable until it lands. */
type Pending =
  | { kind: "invite" }
  | { kind: "domain" }
  | { kind: "remove"; membershipId: string }
  | null;

/* Where an action's failure message renders: next to the control it belongs
   to, not in a toast that floats away. */
type ActionError = { spot: string; message: string } | null;

const ROLE_LABEL: Record<OrgMember["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const INVITED_NOTE = "Invited · activates on first sign-in";

export default function Team() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [domainDraft, setDomainDraft] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [armedRemove, setArmedRemove] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ActionError>(null);
  const toast = useToast();

  const load = useCallback(async (initial?: Promise<OrgPage> | null) => {
    setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));
    try {
      setState({ status: "ready", page: await (initial ?? getOrg()) });
    } catch (reason) {
      setState((prev) =>
        prev.status === "ready"
          ? prev
          : {
              status: "error",
              message:
                reason instanceof Error && reason.message
                  ? reason.message
                  : "The request never made it. Check your connection.",
            },
      );
    }
  }, []);

  useEffect(() => {
    void load(initialOrg.take());
  }, [load]);

  /* An armed Remove disarms itself after a beat — no stale confirm lying in
     wait (the Review-queue idiom). */
  useEffect(() => {
    if (armedRemove === null) return;
    const timer = window.setTimeout(() => setArmedRemove(null), 5000);
    return () => window.clearTimeout(timer);
  }, [armedRemove]);

  async function run(
    spec: NonNullable<Pending>,
    spot: string,
    action: () => Promise<OrgPage>,
    done: string,
  ): Promise<boolean> {
    if (pending) return false;
    setPending(spec);
    setActionError(null);
    try {
      const page = await action();
      setState({ status: "ready", page });
      toast(done, "success");
      return true;
    } catch (reason) {
      setActionError({
        spot,
        message:
          reason instanceof Error && reason.message
            ? reason.message
            : "Something went wrong. Try again.",
      });
      return false;
    } finally {
      setPending(null);
    }
  }

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!value || pending) return;
    void run(
      { kind: "invite" },
      "invite",
      () => inviteMember(value, role),
      `Invited ${value}. Their seat activates on their first Google sign-in.`,
    ).then((ok) => {
      if (ok) setEmail("");
    });
  }

  function handleRemove(member: OrgMember) {
    const membershipId = member.membershipId;
    if (!membershipId || pending) return;
    if (armedRemove !== membershipId) {
      setArmedRemove(membershipId);
      return;
    }
    setArmedRemove(null);
    void run(
      { kind: "remove", membershipId },
      `remove:${membershipId}`,
      () => removeMember(membershipId),
      `Removed ${member.email}.`,
    );
  }

  function handleDomainSave(page: OrgPage) {
    if (pending || !domainDirty(page.domain, domainDraft)) return;
    const next = normalizeDomain(domainDraft ?? "");
    void run(
      { kind: "domain" },
      "domain",
      () => setOrgDomain(next),
      next
        ? `Auto-join saved. Anyone @ ${next} gets a read-only seat on sign-in.`
        : "Auto-join turned off.",
    ).then((ok) => {
      if (ok) setDomainDraft(null);
    });
  }

  const inlineError = (spot: string) =>
    actionError?.spot === spot ? (
      <p className="team-inline-error" role="alert">
        {actionError.message}
      </p>
    ) : null;

  return (
    <section className="team-page" aria-labelledby="team-heading">
      <header className="team-heading">
        <h1 id="team-heading">Team</h1>
        <p>
          Everyone here shares this workspace&rsquo;s pipeline, audiences, and
          review queue.
        </p>
      </header>

      {state.status === "loading" && <TeamSkeleton />}

      {state.status === "error" && (
        <div className={`${CARD} team-error`} role="alert">
          <p className="team-error-lead">Couldn&rsquo;t load your team.</p>
          <p className="team-error-detail">{state.message}</p>
          <button type="button" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <TeamView
          page={state.page}
          email={email}
          setEmail={setEmail}
          role={role}
          setRole={setRole}
          domainDraft={domainDraft}
          setDomainDraft={setDomainDraft}
          pending={pending}
          armedRemove={armedRemove}
          onInvite={handleInvite}
          onRemove={handleRemove}
          onDomainSave={handleDomainSave}
          inlineError={inlineError}
        />
      )}
    </section>
  );
}

/* Mirrors the loaded members card row for row — same disc, same two text
   lines, same trailing chip — so nothing jumps when data lands. */
function TeamSkeleton() {
  return (
    <>
      <div className={`${CARD} team-members`} aria-hidden="true">
        <div className="team-card-head">
          <h2>Members</h2>
        </div>
        <ul className="team-member-list">
          {[0, 1, 2].map((row) => (
            <li key={row} className="team-member-row is-skeleton">
              <span className="team-avatar team-skel" />
              <div className="team-member-id">
                <span className="team-skel team-skel-line" style={{ width: row === 1 ? "9rem" : "7rem" }} />
                <span className="team-skel team-skel-line is-faint" style={{ width: row === 1 ? "12rem" : "10rem" }} />
              </div>
              <span className="team-skel team-skel-chip" />
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only" role="status">
        Loading team…
      </p>
    </>
  );
}

function TeamView({
  page,
  email,
  setEmail,
  role,
  setRole,
  domainDraft,
  setDomainDraft,
  pending,
  armedRemove,
  onInvite,
  onRemove,
  onDomainSave,
  inlineError,
}: {
  page: OrgPage;
  email: string;
  setEmail: (value: string) => void;
  role: "admin" | "member";
  setRole: (value: "admin" | "member") => void;
  domainDraft: string | null;
  setDomainDraft: (value: string | null) => void;
  pending: Pending;
  armedRemove: string | null;
  onInvite: (event: FormEvent) => void;
  onRemove: (member: OrgMember) => void;
  onDomainSave: (page: OrgPage) => void;
  inlineError: (spot: string) => ReactNode;
}) {
  const isOwner = page.yourRole === "owner";
  const busyElsewhere = "Waiting for the current change to finish";
  const domainIsDirty = domainDirty(page.domain, domainDraft);
  const domainValue = domainDraft ?? page.domain ?? "";

  return (
    <>
      <div className={`${CARD} team-members`}>
        <div className="team-card-head">
          <h2>Members</h2>
          <span className="team-count tabular-nums">
            {page.members.length.toLocaleString()}
          </span>
        </div>
        <ul className="team-member-list">
          {page.members.map((member) => {
            const membershipId = member.membershipId;
            const removing =
              pending?.kind === "remove" &&
              pending.membershipId === membershipId;
            const armed = armedRemove !== null && armedRemove === membershipId;
            return (
              <li key={membershipId ?? "owner"} className="team-member-row">
                <span className="team-avatar" aria-hidden="true">
                  {(member.name || member.email).charAt(0).toUpperCase()}
                </span>
                <div className="team-member-id">
                  <div className="team-member-name">
                    {member.name || member.email}
                  </div>
                  <div className="team-member-sub">
                    {member.status === "invited"
                      ? member.name
                        ? `${member.email} · ${INVITED_NOTE}`
                        : INVITED_NOTE
                      : member.email}
                  </div>
                  {membershipId && inlineError(`remove:${membershipId}`)}
                </div>
                <span className={`team-role is-${member.role}`}>
                  {ROLE_LABEL[member.role]}
                </span>
                {isOwner && membershipId && (
                  <button
                    type="button"
                    className={`team-remove${armed || removing ? " is-armed" : ""}`}
                    disabled={pending !== null}
                    title={pending && !removing ? busyElsewhere : undefined}
                    onClick={() => onRemove(member)}
                  >
                    {removing ? "Removing…" : armed ? "Remove? Confirm" : "Remove"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {isOwner && (
        <form className={`${CARD} team-invite`} onSubmit={onInvite}>
          <h2>Invite a teammate</h2>
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
              <option value="member">Member · read only</option>
              <option value="admin">Admin · can edit</option>
            </select>
            <button
              type="submit"
              disabled={pending !== null || !email.trim()}
              title={
                pending
                  ? pending.kind === "invite"
                    ? undefined
                    : busyElsewhere
                  : email.trim()
                    ? undefined
                    : "Enter a teammate's email first"
              }
            >
              {pending?.kind === "invite" ? "Inviting…" : "Invite"}
            </button>
          </div>
          {inlineError("invite")}
          <p className="team-hint">
            They sign in with Google using that email. Nothing else to set up.
          </p>
        </form>
      )}

      {isOwner && (
        <div className={`${CARD} team-invite`}>
          <h2>Auto-join domain</h2>
          <p className="team-hint">
            Anyone who signs in with a verified email @ this domain joins
            automatically with a read-only seat.
          </p>
          <div className="team-invite-row">
            <input
              type="text"
              value={domainValue}
              onChange={(e) => setDomainDraft(e.target.value)}
              placeholder="yourcompany.com"
              aria-label="Auto-join domain"
            />
            <button
              type="button"
              disabled={pending !== null || !domainIsDirty}
              title={
                pending
                  ? pending.kind === "domain"
                    ? undefined
                    : busyElsewhere
                  : domainIsDirty
                    ? undefined
                    : domainValue
                      ? "This already matches the saved domain"
                      : "Enter a domain first"
              }
              onClick={() => onDomainSave(page)}
            >
              {pending?.kind === "domain" ? "Saving…" : "Save"}
            </button>
          </div>
          {inlineError("domain")}
        </div>
      )}
    </>
  );
}
