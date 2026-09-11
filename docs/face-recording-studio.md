# Continuous face recording

The Face cloning page records one continuous camera-and-microphone take. Eight sentence prompts share the same MediaRecorder instance; advancing a sentence only changes the visible words and delivery cue. The primary action requests camera access, then shows a three-second countdown. Finishing becomes available after one minute, and capture stops automatically before three minutes.

Finishing uploads the take privately, then completes it with `create_preview` and explicit face/voice consent. The backend repairs browser container timing without cutting or re-encoding the footage, validates the media, and commits the saved source together with a voice job and a waiting preview job. The worker releases the preview when its own voice is ready. Deterministic job IDs and an idempotent completion request prevent duplicate paid work after a lost response. The server continues after the page closes.

The ready state offers View preview. Custom scripts are available under Make another video. Source uploads, separate camera-enabling steps and the full recording-script panel are removed from the dashboard.

## Verification

- Browser QA: camera permission failure, countdown, one recorder across all eight prompts, minimum length, capture cleanup, automatic generation states, ready action, modal, desktop and mobile layout.
- Backend: live WebM and fragmented MP4 repair preserves 480 video frames and audio; consent, workspace permissions, atomic source replacement, quota reservation, dependent voice readiness, failure propagation and retry idempotency.
- Backend unit suite: 1,883 passing tests; all 296 database tests pass against a fresh local Postgres database with migrations applied.
- Frontend: TypeScript, focused ESLint, 170 tests and production build.

Local mock URLs use `?mock=1&face=empty|generating|ready|failed|save-error`. Add `&facecamera=fake` on the development server to use a synthetic canvas and generated audio, or `&facecamera=denied` to simulate a permission error. Camera test hooks are excluded from production builds. Mock mode never starts paid jobs.
