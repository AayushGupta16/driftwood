import assert from "node:assert/strict";
import test from "node:test";
import { assetDestination, filterAssets, formatBytes, type CompanyAsset } from "./model.ts";

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
  },
  {
    id: "link-1",
    kind: "link",
    name: "Acme case study",
    description: "Enterprise proof",
    tags: ["customer proof"],
    originalFilename: null,
    contentType: null,
    byteSize: null,
    externalUrl: "https://example.com/acme",
    contentUrl: null,
    createdAt: "2026-08-21T00:00:00Z",
    updatedAt: "2026-08-21T00:00:00Z",
  },
];

test("asset filtering searches metadata and respects type", () => {
  assert.deepEqual(filterAssets(assets, "all", "approved").map((asset) => asset.id), ["image-1"]);
  assert.deepEqual(filterAssets(assets, "link", "proof").map((asset) => asset.id), ["link-1"]);
  assert.deepEqual(filterAssets(assets, "image", "case"), []);
});

test("asset metadata formatters keep file and link semantics distinct", () => {
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(null), "External link");
  assert.equal(assetDestination(assets[0]), assets[0].contentUrl);
  assert.equal(assetDestination(assets[1]), assets[1].externalUrl);
});
