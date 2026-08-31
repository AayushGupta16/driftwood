import { useRef } from "react";
import {
  managedInboxChip,
  ownMailboxRow,
  useDialogTrap,
  type ManagedMailbox,
  type OwnMailbox,
} from "./managed-inboxes";

/* The email box list, floated over the grid from the EmailCard's count
   line. A small dialog on the same overlay surface as the add-inboxes
   flow — the tile itself never grows past its siblings. Rows are address +
   state chip, nothing else: the customer's own connected mailbox first
   (so the list adds up to the tile's count), then the managed pool. An
   own_mailbox-less payload — an older backend — renders managed rows
   only, exactly as before. */

export default function InboxListOverlay({
  mailboxes,
  ownMailbox,
  onClose,
}: {
  mailboxes: ManagedMailbox[];
  ownMailbox?: OwnMailbox;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogTrap(dialogRef, onClose);
  const own = ownMailboxRow(ownMailbox);

  return (
    <div
      className="managed-overlay-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="managed-overlay-panel is-narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inbox-list-title"
        ref={dialogRef}
      >
        <h3 id="inbox-list-title">Email boxes</h3>
        <ul className="managed-inboxes-list">
          {own && (
            <li>
              <span className="managed-inboxes-addr">{own.label}</span>
              <span className="managed-inboxes-chip is-active">Connected</span>
            </li>
          )}
          {mailboxes.map((box) => {
            const chip = managedInboxChip(box);
            return (
              <li key={box.address}>
                <span className="managed-inboxes-addr">{box.address}</span>
                <span className={`managed-inboxes-chip${chip.tone}`}>
                  {chip.label}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="add-inboxes-actions">
          <button type="button" className="add-inboxes-quiet" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
