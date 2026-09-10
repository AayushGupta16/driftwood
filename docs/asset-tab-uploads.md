# Asset tab uploads

Images, Videos, Audio, Skills, and Repos each have a persistent drop area that also opens a file picker. The top-right **Add asset** menu chooses the destination before opening the form. Links use a URL form; Repos support both archives and repository URLs. Successful additions select their tab and clear the search so the new asset is visible.

The drop target rejects known incompatible MIME types during the drag, then checks the actual filename, type, and 25 MB limit on drop. Native drag events hide filenames until the drop; unknown MIME types therefore get their final validation at that point. Both dropped files and picker selections use the same validation, with another check before submission. One file can be added at a time. A valid drop opens the existing metadata form with the file selected; Upload completes it.

Archives keep the chosen Skill or Repo kind throughout the flow. Media uploads keep the existing API behavior, where the server detects the media kind. Server-side content validation remains authoritative. Read-only members have no creation controls.

## Validation (2026-09-10)

- `cd landing && npm test`: 153 tests pass, including media mismatches, WebM audio/video distinction, missing MIME types, archive/Markdown rules, size limits, and rejected drags.
- `npm run lint` and `npm run build` pass.
- Start Vite and open `/scripts/check-asset-uploads.html`, then run its checks. This isolated browser harness generates synthetic files and stubs the asset API in its own document. It verifies accepted/rejected drops in all five file tabs, resulting request kinds and visible cards, oversize/multiple-file rejection, all six dropdown destinations, modal focus restoration, repository source switching, and read-only access.
- Visually checked the normal desktop/tablet layout and a 390px Chromium frame, including the dropdown. WebKit was not available for a separate iPhone check.
- The Chrome extension could not select local fixture files because file URL access is disabled. The drop event checks above passed with synthetic browser files; no real assets were uploaded.

## Tracking and release

Prepared on `feat/asset-tab-uploads` from current `origin/main`, isolated from older local website checkouts. Production requires review of the preview per `design/design-language.md` and is not changed by this branch.

The Engineering Todos page could not be updated. Its browser page explicitly reports no access for the signed-in account, and no Notion connector or registered treg tool is available in this session. No access request was sent.
