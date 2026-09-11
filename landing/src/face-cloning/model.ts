export type Recording = { id: string; filename: string; duration: number; created_at: string };
export type Job = { id: string; kind: string; status: string; script: string | null; error: string | null; created_at: string; audio_available: boolean; video_available: boolean };
export type Studio = { voice: Job | null; preview: Job | null; jobs: Job[]; busy: boolean; video_cost_ceiling_usd: number };
export const inProgress = (job: Job | null | undefined) => !!job && ['waiting_for_voice', 'queued', 'launching', 'running'].includes(job.status);
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
export const PROMPTS = [
  ['Small smile', 'Hey, I’m glad you’re here, and I’d love to give you a quick look at what we’ve been working on.'],
  ['Speak naturally', 'Let me start with a simple example of how this could work for your team on a busy day, when there are more requests than hours.'],
  ['Curious tone', 'Have you ever noticed how much time goes into the little tasks that you find yourself doing over and over again?'],
  ['Explain calmly', 'We can walk through those steps together, one at a time, and find a way to make the whole process a little easier.'],
  ['Keep your eyes near the lens', 'First, we bring the information into one place so you can see what needs your attention and what is already done.'],
  ['Tell it like a story', 'Picture a typical Tuesday, where Kate opens her laptop, checks the board, and picks the three things that matter most before lunch.'],
  ['Steady pace', 'Second, every update gets written down in the same spot, so nobody has to dig through old messages or ask twice about the same detail.'],
  ['Ask it lightly', 'What would you do with an extra hour each week, if the busywork simply took care of itself while you focused on the bigger picture?'],
  ['Matter of fact', 'Third, when something changes, the people who need to know get a short note, and the rest of the team can keep working without interruption.'],
  ['Slow down a touch', 'Most people tell us the biggest surprise is how quickly the habit sticks, because the plan is right there each time they come back.'],
  ['Nod as you speak', 'It also helps to keep a record of what was decided and why, so that a question from next month has a clear and simple answer.'],
  ['A little energy', 'The exciting part is seeing everything come together, with fewer things to keep track of and more time to focus on the work you care about.'],
  ['Reassuring tone', 'You can take a closer look whenever you want, make a change, ask a question, and keep moving at a pace that feels right for you.'],
  ['Warm finish', 'Thanks for spending a minute with me, and I’m looking forward to hearing your thoughts about what we could do next.'],
] as const;
export function recordingMime(supported: (type: string) => boolean): string | undefined {
  return ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4'].find(supported);
}
export function cameraError(reason: unknown): string {
  if (reason instanceof DOMException) {
    if (reason.name === 'NotAllowedError') return 'Allow camera and microphone access in your browser, then try again.';
    if (reason.name === 'NotFoundError') return 'Connect a camera and microphone, then try again.';
    if (reason.name === 'NotReadableError') return 'Your camera or microphone is in use. Close the other app and try again.';
  }
  return reason instanceof Error ? reason.message : 'Could not start recording. Please try again.';
}
