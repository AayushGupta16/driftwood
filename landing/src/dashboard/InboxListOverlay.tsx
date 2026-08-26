import { useRef } from "react";
import {
  managedInboxChip,
  useDialogTrap,
  type ManagedMailbox,
} from "./managed-inboxes";

/* The managed inbox list, floated over the grid from the EmailCard's count
   line. A small dialog on the same overlay surface as the add-inboxes
   flow — the tile itself never grows past its siblings. Rows are address +
   state chip, nothing else. */

export default function InboxListOverlay({
  mailboxes,
  onClose,
}: {
  mailboxes: ManagedMailbox[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogTrap(dialogRef, onClose);

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
        <h3 id="inbox-list-title">Managed inboxes</h3>
        <ul className="managed-inboxes-list">
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
