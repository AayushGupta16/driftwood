import assert from "node:assert/strict";
import test from "node:test";
import { assetAssignmentLabel, assetAssignmentsReady, assetDestination, assetKindLabel, filterAssets, formatBytes, type CompanyAsset } from "./model.ts";

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
];

test("asset filtering searches metadata and respects type", () => {
  assert.deepEqual(filterAssets(assets, "all", "approved").map((asset) => asset.id), ["image-1"]);
  assert.deepEqual(filterAssets(assets, "link", "proof").map((asset) => asset.id), ["link-1"]);
  assert.deepEqual(filterAssets(assets, "image", "case"), []);
  assert.deepEqual(filterAssets(assets, "audio", "voice").map((asset) => asset.id), ["audio-1"]);
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
});
