import { uploadKindFor, type AssetKind } from "./model.ts";

export type UploadDestination = Exclude<AssetKind, "link">;

export const UPLOAD_OPTIONS: Record<UploadDestination, { action: string; title: string; accept: string; formats: string }> = {
  image: {
    action: "Upload image", title: "Upload an image",
    accept: "image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp",
    formats: "PNG, JPEG, GIF, or WebP",
  },
  video: {
    action: "Upload video", title: "Upload a video",
    accept: "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm",
    formats: "MP4, MOV, or WebM",
  },
  audio: {
    action: "Upload audio", title: "Upload audio",
    accept: "audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,.mp3,.wav,.m4a,.ogg,.webm",
    formats: "MP3, WAV, M4A, OGG, or audio WebM",
  },
  skill: {
    action: "Upload skill", title: "Upload a skill",
    accept: ".md,.zip,.tar.gz,.tgz,text/markdown,application/zip,application/gzip",
    formats: "Markdown, ZIP, or TAR.GZ",
  },
  repo: {
    action: "Upload repository", title: "Upload a repository",
    accept: ".zip,.tar.gz,.tgz,application/zip,application/gzip",
    formats: "ZIP or TAR.GZ",
  },
};

/** The destination is chosen before the file, so reject a mismatch before sending it. */
export function uploadDestinationError(file: Pick<File, "name" | "type" | "size">, destination: UploadDestination): string | null {
  if (file.size > 25 * 1024 * 1024) return "Choose a file no larger than 25 MB.";
  const fileClass = uploadKindFor(file.name);
  const options = UPLOAD_OPTIONS[destination];
  if (destination === "skill" || destination === "repo") {
    if (fileClass === "archive" || (destination === "skill" && fileClass === "markdown")) return null;
  } else {
    const accepts = options.accept.split(",");
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    // Browsers sometimes omit MIME types. Use the extension only in that case,
    // so an audio WebM cannot silently land in Videos (or the reverse).
    if (accepts.includes(type) || ((!type || type === "application/octet-stream") && accepts.some((value) => value.startsWith(".") && name.endsWith(value)))) return null;
  }
  return `Choose ${options.formats} for this tab.`;
}

/** File names are hidden during a native drag. Reject known wrong MIME types
 * immediately, then validate the name and size when the file is dropped. */
export function uploadDragAllowed(items: Array<Pick<DataTransferItem, "kind" | "type">>, destination: UploadDestination): boolean {
  if (items.length !== 1 || items[0].kind !== "file") return false;
  const type = items[0].type.toLowerCase();
  if (!type || type === "application/octet-stream") return true;
  if (destination === "skill" || destination === "repo") {
    return ["application/zip", "application/x-zip-compressed", "application/gzip", "application/x-gzip"].includes(type)
      || (destination === "skill" && ["text/markdown", "text/plain", "text/x-markdown"].includes(type));
  }
  return UPLOAD_OPTIONS[destination].accept.split(",").includes(type);
}
