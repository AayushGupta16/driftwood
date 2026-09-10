import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDownIcon, PlusIcon } from "./icons";
import { ASSET_DESTINATIONS } from "./destinations";
import type { AssetKind } from "./model";


export function AssetAddMenu({ onChoose, secondary = false }: { onChoose: (kind: AssetKind) => void; secondary?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const initialIndex = useRef(0);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    itemRefs.current[initialIndex.current]?.focus();
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function menuKeyDown(event: KeyboardEvent) {
    const current = itemRefs.current.findIndex((item) => item === document.activeElement);
    let next: number;
    if (event.key === "ArrowDown") next = (current + 1) % ASSET_DESTINATIONS.length;
    else if (event.key === "ArrowUp") next = (current - 1 + ASSET_DESTINATIONS.length) % ASSET_DESTINATIONS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ASSET_DESTINATIONS.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      next = ASSET_DESTINATIONS.findIndex((item) => item.label.toLowerCase().startsWith(event.key.toLowerCase()));
    } else return;
    if (next < 0) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
  }

  return (
    <div className="asset-add-menu" ref={rootRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        className={`asset-button asset-button-${secondary ? "secondary" : "primary"}`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => { initialIndex.current = 0; setOpen((current) => !current); }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          initialIndex.current = event.key === "ArrowUp" ? ASSET_DESTINATIONS.length - 1 : 0;
          setOpen(true);
        }}
      >
        <PlusIcon size={16} /> Add asset <ChevronDownIcon size={14} />
      </button>
      {open && (
        <div className="asset-add-popover">
          <p>Add to</p>
          <div id={id} role="menu" aria-labelledby={`${id}-trigger`} onKeyDown={menuKeyDown}>
            {ASSET_DESTINATIONS.map(({ id: kind, label, description, icon: Icon }, index) => (
              <button key={kind} ref={(element) => { itemRefs.current[index] = element; }} type="button" role="menuitem" tabIndex={-1} onClick={() => {
                setOpen(false);
                // The composer restores focus to a persistent button when it closes.
                triggerRef.current?.focus();
                onChoose(kind);
              }}>
                <span className="asset-add-icon"><Icon size={19} /></span>
                <span><strong>{label}</strong><small>{description}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
