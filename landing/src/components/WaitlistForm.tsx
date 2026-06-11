import { useState } from "react";
import type { FormEvent } from "react";

type Status = "idle" | "loading" | "done" | "error";

export default function WaitlistForm({ id }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="flex h-15 items-center gap-2.5 text-[16px] font-medium text-tide">
        <svg viewBox="0 0 24 24" className="size-5 stroke-tide" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        You're on the list. We'll be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor={id ?? "email"}>
        Work email
      </label>
      <input
        id={id ?? "email"}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        className="flex-1 appearance-none rounded-xl border border-ink/15 bg-surface px-5 py-[19px] text-[17px] leading-[20px] text-ink shadow-[0_2px_12px_-6px_rgba(22,24,29,0.16)] outline-none transition-shadow placeholder:text-ink-faint focus:border-tide focus:ring-2 focus:ring-tide/25"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-15 shrink-0 cursor-pointer rounded-xl bg-tide px-5.5 text-[16.5px] font-semibold text-white transition-colors hover:bg-tide-deep disabled:opacity-60"
      >
        {status === "loading" ? "Joining\u2026" : "Get early access"}
      </button>
      {status === "error" && (
        <p className="m-0 text-[14px] text-[#a04432] sm:absolute sm:translate-y-16">
          Something broke on our end. Email aayush@driftwood.ai instead.
        </p>
      )}
    </form>
  );
}
