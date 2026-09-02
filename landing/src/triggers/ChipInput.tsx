/* A list field that holds chips: keywords, locations, employer terms.
   Enter, the field's separator (a comma, or a semicolon for locations so a
   city keeps its state) and leaving the field all turn the typed text into
   chips; pasted lists split the same way. Backspace on an empty field
   takes the last chip back. The splitting rules live in model.ts. */

import { useRef, useState, type KeyboardEvent } from "react";
import { addToList, hasListSeparator, splitList, type ListKind } from "./model";

type Props = {
  id: string;
  kind: ListKind;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  describedBy?: string;
};

export default function ChipInput({ id, kind, values, onChange, placeholder, disabled, describedBy }: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const terms = splitList(raw, kind);
    if (terms.length) onChange(addToList(values, terms));
    setText("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      // Enter adds a chip; it never submits the form from inside a list.
      event.preventDefault();
      if (text.trim()) commit(text);
    } else if (event.key === "Backspace" && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  function remove(term: string) {
    onChange(values.filter((value) => value !== term));
    inputRef.current?.focus();
  }

  return (
    <div
      className={`trigger-chipbox${disabled ? " is-disabled" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((term) => (
        <span className="trigger-chipbox-chip" key={term}>
          {term}
          <button
            type="button"
            aria-label={`Remove ${term}`}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              remove(term);
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={text}
        placeholder={values.length ? undefined : placeholder}
        disabled={disabled}
        aria-describedby={describedBy}
        autoComplete="off"
        onChange={(event) => {
          const value = event.target.value;
          if (hasListSeparator(value, kind)) commit(value);
          else setText(value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (text.trim()) commit(text);
        }}
      />
    </div>
  );
}
