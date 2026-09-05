/* Admin panel: invite someone into the workspace the admin is currently
   viewing as (God mode). Renders only while impersonating, because the
   route needs the impersonated user's id and the seats it lists come from
   that user's org. Same outcome line and the same Resend as the Team page;
   the chrome is the admin panel's own (Tailwind idioms from Agents.tsx),
   so it adds no button family. */

import { useEffect, useState, type FormEvent } from "react";
import { adminInvite, adminResendInvite, getOrg, type OrgMember, type OrgPage } from "./api";
import { inviteOutcomeLine, pendingSeatLine } from "./team-model";

type Seats =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: OrgMember[] };

type Pending = { kind: "send" } | { kind: "resend"; membershipId: string } | null;

type Note = { spot: string; tone: "error" | "status"; message: string } | null;

/* The Impersonate dialog's field, minus its top margin. */
const FIELD =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-tide/60";
/* The page header's primary pill ("Refresh status"). */
const PRIMARY =
  "cursor-pointer rounded-full border border-tide bg-tide px-3.5 py-2 text-[12.5px] font-medium text-white hover:bg-tide-deep disabled:cursor-wait disabled:opacity-60";
/* The archived list's quiet accent pill ("Restore"). */
const QUIET =
  "cursor-pointer rounded-full border border-tide/40 bg-surface px-3 py-1.5 text-[12px] font-medium text-tide hover:bg-tide-wash disabled:cursor-wait disabled:opacity-50";

const pendingSeats = (page: OrgPage) => page.members.filter((m) => m.status === "invited");

function errorMessage(reason: unknown): string {
  return reason instanceof Error && reason.message ? reason.message : "Something went wrong. Try again.";
}

export default function AdminInvite({
  userId,
  email: ownerEmail,
  workspace,
}: {
  userId: string;
  email: string;
  workspace: string | null;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [pending, setPending] = useState<Pending>(null);
  const [note, setNote] = useState<Note>(null);
  const [seats, setSeats] = useState<Seats>({ status: "loading" });

  /* The org call resolves as the impersonated user, so these are that
     workspace's unclaimed seats (the Fleet mount-fetch idiom). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await getOrg();
        if (!cancelled) setSeats({ status: "ready", rows: pendingSeats(page) });
      } catch (reason) {
        if (!cancelled) setSeats({ status: "error", message: errorMessage(reason) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function retrySeats() {
    setSeats({ status: "loading" });
    try {
      setSeats({ status: "ready", rows: pendingSeats(await getOrg()) });
    } catch (reason) {
      setSeats({ status: "error", message: errorMessage(reason) });
    }
  }

  function upsertSeat(row: OrgMember) {
    setSeats((prev) => {
      if (prev.status !== "ready") return { status: "ready", rows: [row] };
      const present = prev.rows.some((m) => m.membershipId === row.membershipId);
      return {
        status: "ready",
        rows: present ? prev.rows.map((m) => (m.membershipId === row.membershipId ? row : m)) : [...prev.rows, row],
      };
    });
  }

  async function attempt<T>(spec: NonNullable<Pending>, spot: string, action: () => Promise<T>): Promise<T | null> {
    if (pending) return null;
    setPending(spec);
    setNote(null);
    try {
      return await action();
    } catch (reason) {
      setNote({ spot, tone: "error", message: errorMessage(reason) });
      return null;
    } finally {
      setPending(null);
    }
  }

  function handleSend(event: FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!address || pending) return;
    const input = {
      email: address,
      role,
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(noteText.trim() ? { note: noteText.trim() } : {}),
    };
    void attempt({ kind: "send" }, "send", () => adminInvite(userId, input)).then((result) => {
      if (!result) return;
      if (result.member.status === "invited") upsertSeat(result.member);
      setNote({
        spot: "send",
        tone: "status",
        message: inviteOutcomeLine({ email: address, emailSent: result.emailSent, reason: result.reason }),
      });
      setEmail("");
      setName("");
      setNoteText("");
    });
  }

  function handleResend(row: OrgMember) {
    const membershipId = row.membershipId;
    if (!membershipId || pending) return;
    const spot = `resend:${membershipId}`;
    void attempt({ kind: "resend", membershipId }, spot, () => adminResendInvite(membershipId)).then((fresh) => {
      if (!fresh) return;
      upsertSeat(fresh);
      setNote({ spot, tone: "status", message: `Invite sent again to ${fresh.email}.` });
    });
  }

  const noteAt = (spot: string) =>
    note?.spot === spot ? (
      <p
        className={`m-0 mt-2 text-[12.5px] ${note.tone === "error" ? "text-alert" : "text-ink-soft"}`}
        role={note.tone === "error" ? "alert" : "status"}
      >
        {note.message}
      </p>
    ) : null;

  const sending = pending?.kind === "send";
  const target = workspace ? `${workspace} (${ownerEmail})` : `${ownerEmail}'s workspace`;

  return (
    <section className="mt-6 rounded-[14px] border border-line bg-paper p-4" aria-labelledby="admin-invite-heading">
      <h2 id="admin-invite-heading" className="m-0 text-[14px] font-semibold">Invite to this workspace</h2>
      <p className="m-0 mt-1 text-[12px] text-ink-soft">
        Adds a seat in {target} and emails the invite to that address.
      </p>

      <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]" onSubmit={handleSend}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@company.com"
          aria-label="Email to invite"
          required
          className={FIELD}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          aria-label="Name"
          className={FIELD}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "member")}
          aria-label="Seat role"
          className={FIELD}
        >
          <option value="member">Member · read only</option>
          <option value="admin">Admin · can edit</option>
        </select>
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="One line for the email (optional)"
          aria-label="Note for the email"
          maxLength={200}
          className={`${FIELD} sm:col-span-2`}
        />
        <div className="flex items-center">
          <button
            type="submit"
            disabled={pending !== null}
            title={pending && !sending ? "Waiting for the current change to finish" : undefined}
            className={PRIMARY}
          >
            {sending ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>
      {noteAt("send")}

      <div className="mt-5">
        <h3 className="m-0 text-[12.5px] font-semibold text-ink">Pending seats</h3>
        {seats.status === "loading" && (
          <p className="m-0 mt-2 text-[12.5px] text-ink-soft" role="status">Loading seats…</p>
        )}
        {seats.status === "error" && (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-sand/50 px-4 py-3 text-[13px] text-ink" role="alert">
            <span>Couldn&rsquo;t load this workspace&rsquo;s seats. {seats.message}</span>
            <button
              type="button"
              onClick={() => void retrySeats()}
              className={QUIET}
            >
              Try again
            </button>
          </div>
        )}
        {seats.status === "ready" && seats.rows.length === 0 && (
          <p className="m-0 mt-2 text-[12.5px] text-ink-soft">No pending seats. Everyone invited so far has signed in.</p>
        )}
        {seats.status === "ready" && seats.rows.length > 0 && (
          <ul className="m-0 mt-2 grid list-none gap-2 p-0">
            {seats.rows.map((row) => {
              const resending = pending?.kind === "resend" && pending.membershipId === row.membershipId;
              return (
                // The row wraps on a phone: the text keeps the line and the
                // button drops under it, right-aligned, instead of being
                // pushed out past the card edge.
                <li key={row.membershipId ?? row.email} className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
                  <div className="min-w-0 flex-1 basis-[13rem]">
                    <strong className="block truncate text-[13.5px] font-semibold">{row.name || row.email}</strong>
                    <span className="mt-0.5 block text-[12px] text-ink-soft [overflow-wrap:anywhere]">
                      {row.name ? `${row.email} · ` : ""}{pendingSeatLine(row)}
                    </span>
                    {row.inviteNote && (
                      <span className="mt-0.5 block text-[12px] text-ink-faint [overflow-wrap:anywhere]">Note: {row.inviteNote}</span>
                    )}
                    {row.membershipId && noteAt(`resend:${row.membershipId}`)}
                  </div>
                  {row.membershipId && (
                    <button
                      type="button"
                      disabled={pending !== null}
                      title={pending && !resending ? "Waiting for the current change to finish" : undefined}
                      onClick={() => handleResend(row)}
                      className={`${QUIET} ml-auto shrink-0`}
                    >
                      {resending ? "Resending…" : "Resend invite"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
