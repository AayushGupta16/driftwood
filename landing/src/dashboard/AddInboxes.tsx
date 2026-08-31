import { useEffect, useRef, useState } from "react";
import {
  DOMAIN_CAP,
  INBOX_CAP,
  checkDomainAvailability,
  deriveUsername,
  domainVariations,
  hasMoreDomains,
  purchaseInboxes,
  useDialogTrap,
  type PurchaseResult,
  type SenderInput,
} from "./managed-inboxes";

/* Add inboxes — the EmailCard's sender-first flow, floated over the grid.
   Senders are one input each: the mailbox name, previewed inline as
   name@domain. Domains are found by search: candidate variations are
   generated client-side from the search term and the company name, then
   verified against GET /mailboxes/availability progressively — in order, a
   small batch at a time, never the whole slate per keystroke — and only
   available ones are listed, up to eight at first with a quiet "Show more"
   that sweeps further until the candidates run out. Picking a name refills
   the list from the remaining candidates, so it stays stocked as domains
   move to chips. A taken exact-domain query gets one quiet line instead.
   Picked domains collect as removable chips above the search box.

   Done POSTs /mailboxes/purchase and the tile updates optimistically. No
   prices or billing words anywhere — customers never see money; they are
   choosing, not purchasing. Failures get one plain line (the founder
   handles them manually by design). */

type SenderRow = {
  id: number;
  username: string;
};

const DOMAIN_RE = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]{2,})+$/;

/* progressive availability sweep: how many unpicked results the list aims
   to hold (initially and per "Show more"), how many candidates one round
   takes, and how many checks run at once */
const VISIBLE_STEP = 8;
const SWEEP_BATCH = 8;
const SWEEP_CONCURRENCY = 4;

const normalizeDomain = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");

export default function AddInboxes({
  companyName,
  ownedDomains,
  existingDomains,
  existingInboxes,
  onClose,
  onPurchased,
}: {
  companyName: string | null;
  ownedDomains: string[];
  existingDomains: number;
  existingInboxes: number;
  onClose: () => void;
  onPurchased: (result: PurchaseResult, senders: SenderInput[]) => void;
}) {
  const [senders, setSenders] = useState<SenderRow[]>([
    { id: 1, username: "" },
  ]);
  const nextSenderId = useRef(2);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [visibleTarget, setVisibleTarget] = useState(VISIBLE_STEP);
  const [exhausted, setExhausted] = useState(true);
  const [searching, setSearching] = useState(false);
  const [takenQuery, setTakenQuery] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);
  const availCache = useRef(new Map<string, boolean>());
  const searchGen = useRef(0);
  // the current sweep: ordered candidates, how far it has verified, and the
  // exact-domain query (if any) for the taken hint. results mirrored in a
  // ref so a resumed sweep sees what's already verified.
  const sweepRef = useRef<{
    gen: number;
    candidates: string[];
    cursor: number;
    exact: string | null;
  } | null>(null);
  const resultsRef = useRef<string[]>([]);
  // selected mirrored in a ref so a mid-flight sweep counts fresh picks
  const selectedRef = useRef<string[]>([]);
  // captured once — company name and owned domains don't change mid-flow
  const seedRef = useRef({ companyName, ownedDomains });

  useDialogTrap(dialogRef, onClose, () => !submittingRef.current);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function cachedCheck(name: string): Promise<boolean | null> {
    const cache = availCache.current;
    const hit = cache.get(name);
    if (hit !== undefined) return hit;
    const available = await checkDomainAvailability(name);
    if (available !== null) cache.set(name, available);
    return available;
  }

  /* one round of availability checks through a small worker pool, results
     kept in candidate order */
  async function checkBatch(
    names: string[],
  ): Promise<(readonly [string, boolean | null])[]> {
    const out: (readonly [string, boolean | null])[] = new Array(names.length);
    let next = 0;
    const worker = async () => {
      while (next < names.length) {
        const index = next++;
        out[index] = [names[index], await cachedCheck(names[index])] as const;
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(SWEEP_CONCURRENCY, names.length) }, worker),
    );
    return out;
  }

  /* verified names not yet picked — what the visible list can draw on */
  const unselectedVerifiedCount = () =>
    resultsRef.current.filter((name) => !selectedRef.current.includes(name))
      .length;

  /* Verify candidates in order, a batch at a time, appending available ones
     as they land, until `target` unpicked results exist or the list runs
     out. Counting unpicked names means a pick mid-sweep makes the sweep dig
     further on its own. A new keystroke bumps the generation and strands
     any in-flight sweep. */
  async function runSweep(gen: number, target: number) {
    const sweep = sweepRef.current;
    if (!sweep || sweep.gen !== gen) return;
    setSearching(true);
    while (
      sweep.cursor < sweep.candidates.length &&
      unselectedVerifiedCount() < target
    ) {
      const batch = sweep.candidates.slice(
        sweep.cursor,
        sweep.cursor + SWEEP_BATCH,
      );
      sweep.cursor += batch.length;
      const checks = await checkBatch(batch);
      if (gen !== searchGen.current || !mountedRef.current) return;
      const found = checks
        .filter(([, available]) => available === true)
        .map(([name]) => name);
      if (found.length > 0) {
        resultsRef.current = [...resultsRef.current, ...found];
        setResults(resultsRef.current);
      }
      if (
        sweep.exact !== null &&
        checks.some(
          ([name, available]) => name === sweep.exact && available === false,
        )
      ) {
        setTakenQuery(sweep.exact);
      }
    }
    if (sweep.cursor >= sweep.candidates.length) setExhausted(true);
    setSearching(false);
  }

  /* the search: debounced, generation-guarded, available results only */
  useEffect(() => {
    const gen = ++searchGen.current;
    const term = normalizeDomain(query);
    const timer = window.setTimeout(
      () => {
        void (async () => {
          const { companyName, ownedDomains } = seedRef.current;
          const candidates: string[] = [];
          const push = (name: string) => {
            if (name && !candidates.includes(name) && !ownedDomains.includes(name)) {
              candidates.push(name);
            }
          };
          const exact = DOMAIN_RE.test(term) ? term : null;
          if (exact) push(exact);
          for (const name of domainVariations(term.split(".")[0])) push(name);
          for (const name of domainVariations(companyName ?? "")) push(name);
          if (gen !== searchGen.current || !mountedRef.current) return;
          sweepRef.current = { gen, candidates, cursor: 0, exact };
          resultsRef.current = [];
          setResults([]);
          setTakenQuery(null);
          setVisibleTarget(VISIBLE_STEP);
          setExhausted(candidates.length === 0);
          if (candidates.length === 0) {
            setSearching(false);
            return;
          }
          await runSweep(gen, VISIBLE_STEP);
        })();
      },
      term ? 350 : 0,
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateSender(id: number, username: string) {
    setSenders((current) =>
      current.map((sender) =>
        sender.id === id ? { ...sender, username } : sender,
      ),
    );
  }

  function addSender() {
    setSenders((current) => [
      ...current,
      { id: nextSenderId.current++, username: "" },
    ]);
  }

  function removeSender(id: number) {
    setSenders((current) => current.filter((sender) => sender.id !== id));
  }

  function selectDomain(name: string) {
    setSelected((current) =>
      current.includes(name) ? current : [...current, name],
    );
    if (!selectedRef.current.includes(name)) {
      selectedRef.current = [...selectedRef.current, name];
    }
    // refill: a pick can leave the list short, so resume the sweep for
    // fresh verified names (an in-flight sweep digs further on its own)
    if (!searching && !exhausted && unselectedVerifiedCount() < visibleTarget) {
      void runSweep(searchGen.current, visibleTarget);
    }
  }

  function removeDomain(name: string) {
    setSelected((current) => current.filter((n) => n !== name));
    selectedRef.current = selectedRef.current.filter((n) => n !== name);
  }

  /* live math + the caps, counting what the workspace already has */
  const validSenders = senders.filter((sender) => sender.username !== "");
  const usernames = validSenders.map((sender) => sender.username);
  const duplicateUsernames = new Set(usernames).size !== usernames.length;
  const senderCount = validSenders.length;
  const domainCount = selected.length;
  const newInboxes = senderCount * domainCount;
  const totalDomains = existingDomains + domainCount;
  const totalInboxes = existingInboxes + newInboxes;
  const reason = duplicateUsernames
    ? "Each sender needs a different name."
    : totalDomains > DOMAIN_CAP
      ? `Up to ${DOMAIN_CAP} domains per workspace (this would make ${totalDomains}).`
      : totalInboxes > INBOX_CAP
        ? `Up to ${INBOX_CAP} inboxes per workspace (this would make ${totalInboxes}).`
        : null;
  const canSubmit =
    !submitting && senderCount > 0 && domainCount > 0 && reason === null;

  const previewDomain = selected[0] ?? "domain";
  const unselectedResults = results.filter((name) => !selected.includes(name));
  const visibleResults = unselectedResults.slice(0, visibleTarget);
  const hasMore = hasMoreDomains({
    unselectedVerified: unselectedResults.length,
    visibleTarget,
    exhausted,
    // while a sweep fills an empty list, the checking hint owns the state
    checkingEmpty: searching && visibleResults.length === 0,
  });

  function showMore() {
    const target = visibleTarget + VISIBLE_STEP;
    setVisibleTarget(target);
    void runSweep(searchGen.current, target);
  }

  async function handleDone() {
    if (!canSubmit) return;
    setSubmitting(true);
    submittingRef.current = true;
    setError(null);
    const senderInputs: SenderInput[] = validSenders.map((sender) => ({
      username: sender.username,
    }));
    const names = [...selected];
    const res = await purchaseInboxes(names, senderInputs);
    if (!mountedRef.current) return;
    submittingRef.current = false;
    if (res.ok) {
      onPurchased(res.result, senderInputs);
      return;
    }
    setSubmitting(false);
    if (res.status === 409) {
      setError(
        "One or more of those domains just got taken. Availability has been refreshed.",
      );
      // re-mark: drop the cached answers, re-check, and let now-taken
      // domains fall out of the picked list
      for (const name of names) {
        availCache.current.delete(name);
        void (async () => {
          const available = await cachedCheck(name);
          if (!mountedRef.current) return;
          if (available === false) removeDomain(name);
        })();
      }
    } else if (res.status === 503) {
      setError("Purchasing isn't set up yet.");
    } else {
      setError("Purchase didn't go through; we're on it.");
    }
  }

  return (
    <div
      className="managed-overlay-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="managed-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-inboxes-title"
        ref={dialogRef}
      >
        <h3 id="add-inboxes-title">Add inboxes</h3>
        <p className="add-inboxes-sub">
          Each sender gets an inbox on every domain. New inboxes warm up for
          about two weeks before they carry full volume.
        </p>

        <p className="add-inboxes-section">Senders</p>
        {senders.map((sender, index) => (
          <div className="add-inboxes-sender" key={sender.id}>
            <input
              type="text"
              value={sender.username}
              placeholder="name"
              aria-label={`Sender ${index + 1} mailbox name`}
              disabled={submitting}
              onChange={(event) =>
                updateSender(sender.id, deriveUsername(event.target.value))
              }
            />
            <span className="add-inboxes-at">@{previewDomain}</span>
            {senders.length > 1 && (
              <button
                type="button"
                className="add-inboxes-remove"
                aria-label={`Remove sender ${index + 1}`}
                disabled={submitting}
                onClick={() => removeSender(sender.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="add-inboxes-quiet"
          disabled={submitting}
          onClick={addSender}
        >
          Add sender
        </button>

        <p className="add-inboxes-section">Domains</p>
        {selected.length > 0 && (
          <ul className="add-inboxes-chips">
            {selected.map((name) => (
              <li key={name}>
                <span className="add-inboxes-chip-name">{name}</span>
                <button
                  type="button"
                  className="add-inboxes-remove"
                  aria-label={`Remove ${name}`}
                  disabled={submitting}
                  onClick={() => removeDomain(name)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          type="text"
          className="add-inboxes-search"
          value={query}
          placeholder="Search or type a domain"
          aria-label="Search domains"
          disabled={submitting}
          onChange={(event) => setQuery(event.target.value)}
        />
        {takenQuery && (
          <p className="add-inboxes-hint">{takenQuery} isn&rsquo;t available.</p>
        )}
        {visibleResults.length > 0 && (
          <div className="add-inboxes-results">
            {visibleResults.map((name) => (
              <button
                type="button"
                className="add-inboxes-result"
                key={name}
                disabled={submitting}
                onClick={() => selectDomain(name)}
              >
                <span className="add-inboxes-domain-name">{name}</span>
                <span className="add-inboxes-mark">Add</span>
              </button>
            ))}
          </div>
        )}
        {hasMore && (
          <button
            type="button"
            className="add-inboxes-quiet"
            disabled={submitting || searching}
            onClick={showMore}
          >
            {searching ? "Checking…" : "Show more"}
          </button>
        )}
        {searching && visibleResults.length === 0 && (
          <p className="add-inboxes-hint">Checking…</p>
        )}
        {!searching &&
          visibleResults.length === 0 &&
          takenQuery === null &&
          normalizeDomain(query) !== "" && (
            <p className="add-inboxes-hint">Nothing available for that search.</p>
          )}

        <p className="add-inboxes-math" aria-live="polite">
          {senderCount} {senderCount === 1 ? "sender" : "senders"} ×{" "}
          {domainCount} {domainCount === 1 ? "domain" : "domains"} ={" "}
          {newInboxes} {newInboxes === 1 ? "inbox" : "inboxes"}
        </p>
        {reason && <p className="add-inboxes-reason">{reason}</p>}
        {error && (
          <p className="add-inboxes-error" role="alert">
            {error}
          </p>
        )}
        <div className="add-inboxes-actions">
          <button
            type="button"
            className="add-inboxes-done"
            disabled={!canSubmit}
            onClick={() => void handleDone()}
          >
            {submitting ? "Setting up…" : "Done"}
          </button>
          <button
            type="button"
            className="add-inboxes-quiet"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
