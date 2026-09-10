import assert from "node:assert/strict";
import test from "node:test";
import { assetAssignmentLabel, assetAssignmentsReady, assetDestination, assetKindLabel, filterAssets, formatBytes, uploadKindFor, type CompanyAsset } from "./model.ts";

const assets: CompanyAsset[] = [
  {
    id: "image-1",
    kind: "image",
    name: "Product overview",
    description: "Approved dashboard screenshot",
    tags: ["product", "approved"],
    originalFilename: "dashboard.webp",
    contentType: "image/webp",
    byteSize: 1536,
    externalUrl: null,
    contentUrl: "/api/v1/dashboard/assets/image-1/content",
    createdAt: "2026-08-21T00:00:00Z",
    updatedAt: "2026-08-21T00:00:00Z",
    assignmentMode: "all",
    assignedAgentIds: [],
  },
  {
    id: "audio-1",
    kind: "audio",
    name: "Founder interview",
    description: "Founder product context",
    tags: ["voice", "product"],
    originalFilename: "interview.mp3",
    contentType: "audio/mpeg",
    byteSize: 4096,
    externalUrl: null,
    contentUrl: "/api/v1/dashboard/assets/audio-1/content",
    createdAt: "2026-08-21T00:00:00Z",
    updatedAt: "2026-08-21T00:00:00Z",
    assignmentMode: "all",
    assignedAgentIds: [],
  },
  {
    id: "link-1",
    kind: "link",
    name: "Meridian case study",
    description: "Enterprise proof",
    tags: ["customer proof"],
    originalFilename: null,
    contentType: null,
    byteSize: null,
    externalUrl: "https://example.com/acme",
    contentUrl: null,
    createdAt: "2026-08-21T00:00:00Z",
    updatedAt: "2026-08-21T00:00:00Z",
    assignmentMode: "selected",
    assignedAgentIds: ["outbound", "demo"],
  },
  {
    id: "skill-1",
    kind: "skill",
    name: "Demo recording",
    description: "How to record a demo",
    tags: ["skill"],
    originalFilename: "demo-recording.zip",
    contentType: "application/zip",
    byteSize: 24576,
    externalUrl: null,
    contentUrl: "/api/v1/dashboard/assets/skill-1/content",
    createdAt: "2026-09-10T00:00:00Z",
    updatedAt: "2026-09-10T00:00:00Z",
    assignmentMode: "all",
    assignedAgentIds: [],
  },
  {
    id: "repo-1",
    kind: "repo",
    name: "Example app",
    description: "The product the agent demos",
    tags: ["code"],
    originalFilename: null,
    contentType: null,
    byteSize: null,
    externalUrl: "https://github.com/example/example-app",
    contentUrl: null,
    createdAt: "2026-09-10T00:00:00Z",
    updatedAt: "2026-09-10T00:00:00Z",
    assignmentMode: "all",
    assignedAgentIds: [],
  },
];

test("asset filtering searches metadata and respects type", () => {
  assert.deepEqual(filterAssets(assets, "all", "approved").map((asset) => asset.id), ["image-1"]);
  assert.deepEqual(filterAssets(assets, "link", "proof").map((asset) => asset.id), ["link-1"]);
  assert.deepEqual(filterAssets(assets, "image", "case"), []);
  assert.deepEqual(filterAssets(assets, "audio", "voice").map((asset) => asset.id), ["audio-1"]);
  assert.deepEqual(filterAssets(assets, "skill", "").map((asset) => asset.id), ["skill-1"]);
  assert.deepEqual(filterAssets(assets, "repo", "demos").map((asset) => asset.id), ["repo-1"]);
  assert.deepEqual(filterAssets(assets, "repo", "recording"), []);
});

test("asset assignment labels distinguish workspace, selected, and no-agent access", () => {
  const agents = [
    { id: "outbound", label: "Outbound agent", paused: false },
    { id: "demo", label: "Demo agent", paused: true },
  ];
  assert.equal(assetAssignmentLabel(assets[0], agents), "All workspace agents");
  assert.equal(assetAssignmentLabel(assets[2], agents), "Outbound agent, Demo agent");
  assert.equal(assetAssignmentLabel({ ...assets[2], assignedAgentIds: [] }, agents), "No agent access");
});

test("asset assignment remains gated until agent discovery resolves successfully", () => {
  assert.equal(assetAssignmentsReady(true, false), false);
  assert.equal(assetAssignmentsReady(false, true), false);
  assert.equal(assetAssignmentsReady(false, false), true);
});

test("asset metadata formatters keep file and link semantics distinct", () => {
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(null), "External link");
  assert.equal(assetDestination(assets[0]), assets[0].contentUrl);
  assert.equal(assetDestination(assets[2]), assets[2].externalUrl);
  assert.equal(assetKindLabel("audio"), "Audio");
  assert.equal(assetKindLabel("skill"), "Skill");
  assert.equal(assetKindLabel("repo"), "Repository");
  assert.equal(assetDestination(assets[3]), assets[3].contentUrl);
  assert.equal(assetDestination(assets[4]), assets[4].externalUrl);
});

test("upload kind follows the lowercased file name", () => {
  assert.equal(uploadKindFor("skill.zip"), "archive");
  assert.equal(uploadKindFor("repo.tar.gz"), "archive");
  assert.equal(uploadKindFor("repo.tgz"), "archive");
  assert.equal(uploadKindFor("SKILL.md"), "markdown");
  assert.equal(uploadKindFor("Repo.TAR.GZ"), "archive");
  assert.equal(uploadKindFor("ARCHIVE.ZIP"), "archive");
  assert.equal(uploadKindFor("screenshot.png"), "media");
  assert.equal(uploadKindFor("clip.mp4"), "media");
  assert.equal(uploadKindFor("notes.md.png"), "media");
});
