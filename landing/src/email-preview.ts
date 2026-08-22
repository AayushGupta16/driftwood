export type EmailPreviewLine =
  | { kind: "text"; text: string }
  | { kind: "image"; alt: string; imageUrl: string; linkUrl: string };

export type EmailPreviewParagraph = {
  lines: EmailPreviewLine[];
};

/* Keep this deliberately narrow and in lockstep with
   backend/app/composio.py::_INLINE_IMAGE. Only a whole line containing a
   linked driftwood.sh image becomes media; everything else stays literal. */
const INLINE_IMAGE =
  /^\[!\[([^\]]*)\]\((https:\/\/driftwood\.sh\/[^\s()]+)\)\]\((https:\/\/driftwood\.sh\/[^\s()]+)\)$/;

function parseLine(line: string): EmailPreviewLine {
  const match = INLINE_IMAGE.exec(line.trim());
  if (!match) return { kind: "text", text: line };
  return {
    kind: "image",
    alt: match[1],
    imageUrl: match[2],
    linkUrl: match[3],
  };
}
/**
 * Mirrors the mailbox renderer's paragraph contract without producing HTML:
 * blank lines start paragraphs, while single newlines remain line breaks.
 * React escapes text nodes for us, so unapproved markup cannot execute.
 */
export function parseEmailBody(text: string): EmailPreviewParagraph[] {
  return text
    .split(/\n[ \t]*\n/)
    .map((block) => ({ lines: block.split("\n").map(parseLine) }))
    .filter((paragraph) =>
      paragraph.lines.some(
        (line) => line.kind === "image" || line.text.trim().length > 0,
      ),
    );
}

/** Plain list-row copy that never leaks the transport marker into the UI. */
export function emailBodySummary(text: string): string {
  return parseEmailBody(text)
    .flatMap((paragraph) =>
      paragraph.lines.map((line) =>
        line.kind === "image" ? line.alt || "Linked image" : line.text,
      ),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
