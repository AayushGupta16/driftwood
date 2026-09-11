import type { Sentiment } from "./api";

export type FeedbackState = {
  mode: "idle" | "changes" | "note";
  message: string;
  timestamp: number | null;
  pending: Sentiment | null;
  sent: Sentiment | null;
  error: string | null;
};

export const EMPTY_FEEDBACK: FeedbackState = {
  mode: "idle", message: "", timestamp: null, pending: null, sent: null, error: null,
};

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const remainder = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}` : `${minutes}:${remainder}`;
}

export function feedbackMessage(message: string, timestamp: number | null): string {
  return timestamp === null ? message.trim() : `At ${formatTimestamp(timestamp)} in the video:\n${message.trim()}`;
}

export function feedbackLimit(timestamp: number | null): number {
  return 2000 - feedbackMessage("", timestamp).length;
}
