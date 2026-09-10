import { useRef, useState, type DragEvent } from "react";
import { ASSET_DESTINATIONS } from "./destinations";
import { UploadIcon } from "./icons";
import { formatBytes } from "./model";
import { UPLOAD_OPTIONS, uploadDestinationError, uploadDragAllowed, type UploadDestination } from "./upload-options";

export function AssetFileDropzone({ destination, file, disabled = false, compact = false, onFile }: {
  destination: UploadDestination;
  file?: File | null;
  disabled?: boolean;
  compact?: boolean;
  onFile: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const options = UPLOAD_OPTIONS[destination];
  const label = ASSET_DESTINATIONS.find((item) => item.id === destination)?.label;
  const noun = destination === "image" ? "an image" : destination === "audio" ? "an audio file" : destination === "repo" ? "a repository archive" : `a ${destination} file`;

  function chooseFiles(files: File[]) {
    if (disabled || files.length === 0) return;
    const next = files[0];
    const problem = files.length !== 1 ? "Add one file at a time." : uploadDestinationError(next, destination);
    setError(problem);
    onFile(problem ? null : next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function dragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const allowed = !disabled && uploadDragAllowed(Array.from(event.dataTransfer.items), destination);
    event.dataTransfer.dropEffect = allowed ? "copy" : "none";
    setDrag(allowed ? "accepted" : "rejected");
  }

  return (
    <div className={`asset-file-picker${compact ? " is-compact" : ""}`}>
      <button
        className={`asset-dropzone${drag ? ` is-${drag}` : ""}`}
        type="button"
        aria-label={`${options.action}: drop a file or choose file`}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={dragOver}
        onDragLeave={(event) => {
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
          setDrag(null);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(null);
          if (!disabled) event.currentTarget.focus();
          chooseFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <UploadIcon size={23} />
        <span className="asset-dropzone-copy">
          <strong>{drag === "rejected" ? `This drop isn’t supported in ${label}` : drag === "accepted" ? `Drop to add to ${label}` : file ? file.name : `Drop ${noun} here`}</strong>
          <span>{file && !drag ? formatBytes(file.size) : `${options.formats} · up to 25 MB · one file at a time`}</span>
        </span>
        <span className="asset-dropzone-browse">{file ? "Change file" : "Choose file"}</span>
      </button>
      <input ref={inputRef} className="sr-only" type="file" tabIndex={-1} aria-hidden="true" accept={options.accept} disabled={disabled} onChange={(event) => chooseFiles(Array.from(event.target.files ?? []))} />
      {error && <p className="asset-dialog-error" role="alert">{error}</p>}
    </div>
  );
}
