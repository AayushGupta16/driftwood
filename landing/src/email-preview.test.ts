import assert from "node:assert/strict";
import test from "node:test";
import { emailBodySummary, parseEmailBody } from "./email-preview.ts";

test("email paragraphs and single line breaks match the outbound renderer", () => {
  assert.deepEqual(parseEmailBody("one\nline two\n \ntwo"), [
    {
      lines: [
        { kind: "text", text: "one" },
        { kind: "text", text: "line two" },
      ],
    },
    { lines: [{ kind: "text", text: "two" }] },
  ]);
});
test("a linked driftwood image marker becomes recipient-facing media", () => {
  const body =
    "Hey,\n\n" +
    "[![Autosana demo](https://driftwood.sh/d/demo.gif)](https://driftwood.sh/d/demo)";
  assert.deepEqual(parseEmailBody(body)[1], {
    lines: [
      {
        kind: "image",
        alt: "Autosana demo",
        imageUrl: "https://driftwood.sh/d/demo.gif",
        linkUrl: "https://driftwood.sh/d/demo",
      },
    ],
  });
  assert.equal(emailBodySummary(body), "Hey, Autosana demo");
});

test("foreign, malformed, and trailing-text markers remain literal", () => {
  const foreign = "[![x](https://evil.example/a.gif)](https://evil.example/b)";
  const trailing =
    "[![x](https://driftwood.sh/d/a.gif)](https://driftwood.sh/d/b) ps";
  assert.deepEqual(parseEmailBody(`${foreign}\n${trailing}`), [
    {
      lines: [
        { kind: "text", text: foreign },
        { kind: "text", text: trailing },
      ],
    },
  ]);
});

test("empty blocks are omitted", () => {
  assert.deepEqual(parseEmailBody("\n \n\t"), []);
});
