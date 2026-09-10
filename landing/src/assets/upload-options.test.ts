import assert from "node:assert/strict";
import test from "node:test";
import { uploadDestinationError, uploadDragAllowed } from "./upload-options.ts";

test("a file cannot be added to a different media tab", () => {
  const image = { name: "photo.png", type: "image/png", size: 1024 };
  assert.equal(uploadDestinationError(image, "image"), null);
  for (const kind of ["video", "audio", "skill", "repo"] as const) {
    assert.ok(uploadDestinationError(image, kind));
    assert.equal(uploadDragAllowed([{ kind: "file", type: image.type }], kind), false);
  }
  assert.ok(uploadDestinationError({ ...image, name: "vector.svg", type: "image/svg+xml" }, "image"));
});

test("WebM uses its media type to distinguish audio from video", () => {
  const audio = { name: "recording.webm", type: "audio/webm", size: 500 };
  assert.equal(uploadDestinationError(audio, "audio"), null);
  assert.ok(uploadDestinationError(audio, "video"));
  assert.equal(uploadDragAllowed([{ kind: "file", type: "audio/webm" }], "video"), false);
  assert.ok(uploadDestinationError({ ...audio, type: "video/webm" }, "audio"));
});

test("a supported extension can resolve a missing browser MIME type", () => {
  assert.equal(uploadDestinationError({ name: "Photo.JPEG", type: "", size: 500 }, "image"), null);
  assert.equal(uploadDestinationError({ name: "clip.mov", type: "application/octet-stream", size: 500 }, "video"), null);
  assert.ok(uploadDestinationError({ name: "photo.png", type: "application/pdf", size: 500 }, "image"));
});

test("skills accept markdown and archives; repos only accept archives", () => {
  const markdown = { name: "SKILL.md", type: "text/plain", size: 500 };
  assert.equal(uploadDestinationError(markdown, "skill"), null);
  assert.ok(uploadDestinationError(markdown, "repo"));
  for (const name of ["skill.zip", "repo.TAR.GZ", "repo.tgz"]) {
    assert.equal(uploadDestinationError({ name, type: "", size: 500 }, "skill"), null);
    assert.equal(uploadDestinationError({ name, type: "", size: 500 }, "repo"), null);
  }
  assert.ok(uploadDestinationError({ ...markdown, name: "notes.txt" }, "skill"));
  assert.ok(uploadDestinationError({ ...markdown, name: "repo.rar" }, "repo"));
});

test("the size limit is checked before an upload can start", () => {
  const file = { name: "photo.png", type: "image/png", size: 25 * 1024 * 1024 };
  assert.equal(uploadDestinationError(file, "image"), null);
  assert.match(uploadDestinationError({ ...file, size: file.size + 1 }, "image")!, /25 MB/);
});

test("dragging text or multiple files never advertises an accepted drop", () => {
  assert.equal(uploadDragAllowed([{ kind: "string", type: "text/plain" }], "skill"), false);
  assert.equal(uploadDragAllowed([{ kind: "file", type: "image/png" }, { kind: "file", type: "image/png" }], "image"), false);
  assert.equal(uploadDragAllowed([], "image"), false);
});

test("an unknown drag type is checked by filename at drop time", () => {
  assert.equal(uploadDragAllowed([{ kind: "file", type: "" }], "image"), true);
  assert.ok(uploadDestinationError({ name: "document.pdf", type: "", size: 500 }, "image"));
  assert.equal(uploadDragAllowed([{ kind: "file", type: "text/plain" }], "skill"), true);
  assert.ok(uploadDestinationError({ name: "notes.txt", type: "text/plain", size: 500 }, "skill"));
});
