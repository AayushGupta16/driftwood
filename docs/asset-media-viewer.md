# Asset media previews

Uploaded images, videos, and audio open in a private, in-page viewer from the
Assets card. External links still open in a separate tab. Download original is
an explicit action inside the viewer; opening a card never navigates to a media
file or publishes it.

Images render in the library. Video cards load metadata when near the viewport
and seek to an early frame without playing. The viewer uses native media controls
and does not autoplay. Native modal dialog semantics provide focus containment
and Escape dismissal; the close button and backdrop also dismiss it, restore the
previous focus, and stop/release media playback. Images and videos preserve their
aspect ratio. Unsupported codecs and failed requests show a fallback with the
original file still available to download. Playback depends on browser codec
support; in particular, a MOV container does not guarantee HEVC playback.

Media requests continue to use the authenticated content URL returned by the
asset API. No signed/public URLs or extra authorization paths are introduced.
The current backend returns full inline responses without byte-range support;
large files may need to buffer before seeking. A future streaming optimization
belongs in the content endpoint, not a public copy of the asset.

## Verification

Run `npm run lint`, `npm test`, and `npm run build` from `landing/`.
For browser review, run the Vite dev server and open
`/dashboard/assets?mock=1`. Mock uploads now preview the actual selected file via
a browser-local object URL (revoked on removal and discarded with the document),
so private test media need not be copied into the repository or published.

Check image, video, and audio uploads; preview appearance; playback and seeking;
Escape, close-button, and backdrop dismissal; focus returning to the original
card; no sound after dismissal; repeated reopening; unsupported media fallback;
external-link navigation; and the explicit download action. Check a narrow
viewport and keyboard focus as well. Mock files are temporary and disappear on
reload.

Browser QA completed in Chrome on 2026-09-08 with local-only fixtures: original
HEVC MOV and H.264 MP4 rendered and played, MOV seeking worked after buffering,
audio playback worked, and unavailable media displayed the fallback. Verified
full portrait thumbnails, backdrop and Escape dismissal, focus returning to the
preview button, and paused thumbnails after closing. Image preview and Escape
focus return also passed. No customer media or local QA fixtures are deployed.

The mock library includes the already-public `/compare.mp4` messaging clip for
reviewing video behavior without uploading a file.

Production rollout approved by Aayush on 2026-09-08 after the committed preview
and Chrome QA. Deploy through a fast-forward push to `main` and Vercel's git
integration; no CLI production deploy.
The Engineering Todos Notion page could not be updated: Chrome's signed-in
account returned “No access.” No tracker content was changed.
