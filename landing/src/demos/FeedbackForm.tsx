import { useRef, type FormEvent, type RefObject } from "react";
import { CheckIcon, ClockIcon, LockIcon, MessageIcon, ThumbsUpIcon } from "../assets/icons";
import { useWorkspacePermissions } from "../dashboard/workspace-permissions-context";
import type { Sentiment } from "./api";
import { feedbackLimit, feedbackMessage, formatTimestamp, type FeedbackState } from "./feedback";

type Props = {
  state: FeedbackState;
  onChange: (patch: Partial<FeedbackState>) => void;
  onSend: (message: string, sentiment: Sentiment) => Promise<boolean>;
  videoRef: RefObject<HTMLVideoElement | null>;
  playbackTime: number | null;
  isVideo: boolean;
};

export default function FeedbackForm({ state, onChange, onSend, videoRef, playbackTime, isVideo }: Props) {
  const { canWrite } = useWorkspacePermissions();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const changesRef = useRef<HTMLButtonElement>(null);
  const anotherRef = useRef<HTMLButtonElement>(null);
  const sending = state.pending !== null;
  const expanded = state.mode !== "idle";
  const limit = feedbackLimit(state.timestamp);
  const tooLong = state.message.length > limit;
  const submitDisabled = sending || !state.message.trim() || tooLong;
  const busyHint = sending ? "Your feedback is being sent." : undefined;

  function openNote(mode: "changes" | "note") {
    onChange({ mode, sent: null, error: null });
    // The composer stays mounted, so focus follows the initiating button.
    requestAnimationFrame(() => noteRef.current?.focus());
  }

  async function send(message: string, sentiment: Sentiment) {
    if (await onSend(message, sentiment)) requestAnimationFrame(() => anotherRef.current?.focus());
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (submitDisabled) return;
    void send(feedbackMessage(state.message, state.timestamp), state.mode === "changes" ? "needs_changes" : "general");
  }

  function attachTime() {
    if (state.timestamp !== null) {
      onChange({ timestamp: null });
      return;
    }
    const video = videoRef.current;
    if (!video || video.readyState < 1 || !Number.isFinite(video.currentTime)) return;
    video.pause();
    onChange({ timestamp: Math.floor(video.currentTime) });
  }

  return (
    <section className="demo-feedback" aria-labelledby="demo-feedback-title" aria-busy={sending}>
      <header className="demo-feedback-heading">
        <div><h3 id="demo-feedback-title">How’s this demo?</h3><p>Help us get the next version right.</p></div>
        <span className="demo-feedback-private"><LockIcon size={13} /> Private to our team</span>
      </header>
      {!canWrite ? <p className="demo-notice">Your workspace seat is read-only. An owner or admin can leave feedback.</p> : (
        <>
          {!state.sent && state.mode !== "note" && <div className="demo-feedback-actions">
            <button type="button" className="demo-button" disabled={sending} title={busyHint} onClick={() => { void send("Looks good.", "looks_good"); }}>
              <ThumbsUpIcon size={16} />{state.pending === "looks_good" ? "Sending…" : "Looks good"}
            </button>
            <button ref={changesRef} type="button" className={`demo-button ${state.mode === "changes" ? "is-selected" : ""}`} disabled={sending} title={busyHint} aria-expanded={state.mode === "changes"} aria-controls="demo-feedback-compose" onClick={() => state.mode === "changes" ? onChange({ mode: "idle", error: null }) : openNote("changes")}>
              <MessageIcon size={16} />Request changes
            </button>
          </div>}
          <form id="demo-feedback-compose" className="demo-feedback-compose" hidden={!expanded} onSubmit={submit}>
            <div className="demo-feedback-label">
              <label htmlFor="demo-feedback-message">{state.mode === "note" ? "Anything else you’d like to share?" : "What should we change?"}</label>
              {state.message.length >= limit - 200 && <span>{Math.max(0, limit - state.message.length).toLocaleString()} characters left</span>}
            </div>
            <textarea ref={noteRef} id="demo-feedback-message" value={state.message} required maxLength={limit} disabled={sending} title={busyHint} aria-describedby={tooLong ? "demo-feedback-length-error" : undefined} aria-invalid={tooLong || undefined} placeholder={state.mode === "note" ? "What worked well, or what could be better?" : "e.g. Lead with their hiring challenge and shorten the intro."} onChange={(event) => onChange({ message: event.target.value, error: null })} />
            {tooLong && <p id="demo-feedback-length-error" className="demo-feedback-hint" role="alert">Shorten your note by {(state.message.length - limit).toLocaleString()} characters to include this timestamp, or remove it.</p>}
            <div className="demo-feedback-footer">
              {isVideo && <button type="button" className={`demo-button demo-feedback-time ${state.timestamp !== null ? "is-selected" : ""}`} disabled={sending || (playbackTime === null && state.timestamp === null)} title={busyHint ?? (playbackTime === null && state.timestamp === null ? "Available once the video loads." : undefined)} aria-pressed={state.timestamp !== null} onClick={attachTime}>
                <ClockIcon size={15} />{state.timestamp !== null ? `${formatTimestamp(state.timestamp)} attached · Remove` : playbackTime === null ? "Attach current time" : `Attach ${formatTimestamp(playbackTime)}`}
              </button>}
              <div className="demo-feedback-submit-actions">
                <button type="button" className="demo-button is-quiet" disabled={sending} title={busyHint} onClick={() => { onChange({ mode: "idle", error: null }); requestAnimationFrame(() => changesRef.current?.focus()); }}>Cancel</button>
                <button type="submit" className="demo-button is-primary" disabled={submitDisabled} title={busyHint ?? (tooLong ? "Shorten your note or remove the timestamp." : !state.message.trim() ? "Add a short note to send feedback." : undefined)}>{sending ? "Sending…" : "Send feedback"}</button>
              </div>
            </div>
          </form>
          {state.error && <p className="demo-notice" role="alert">{state.error}</p>}
          {state.sent && <div className="demo-feedback-sent">
            <div className="demo-feedback-confirmation" role="status"><CheckIcon size={19} /><div><strong>{state.sent === "looks_good" ? "Glad you like it. Feedback sent." : "Thanks for your feedback."}</strong><p>The Driftwood team has been notified.</p></div></div>
            <button ref={anotherRef} type="button" className="demo-button is-quiet" onClick={() => openNote("note")}>{state.sent === "looks_good" ? "Add a note" : "Leave another note"}</button>
          </div>}
        </>
      )}
    </section>
  );
}
