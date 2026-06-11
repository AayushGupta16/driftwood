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
      <div className="flex h-14 items-center gap-2.5 text-[16px] font-medium text-tide">
        <svg viewBox="0 0 24 24" className="size-5 stroke-tide" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        You're on the list. We'll be in touch.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-md items-center gap-1.5 rounded-2xl border border-ink/12 bg-surface p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_-16px_rgba(22,24,29,0.3)] transition-shadow focus-within:border-tide/60 focus-within:ring-2 focus-within:ring-tide/20"
    >
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
        className="min-w-0 flex-1 appearance-none border-0 bg-transparent px-3.5 py-2.5 text-[16px] text-ink outline-none placeholder:text-ink-faint"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 shrink-0 cursor-pointer rounded-[11px] border-0 bg-tide px-4 text-[15px] font-semibold text-white transition-colors hover:bg-tide-deep disabled:opacity-60 sm:px-4.5"
      >
        {status === "loading" ? "Joining\u2026" : "Get early access"}
      </button>
      {status === "error" && (
        <p className="absolute m-0 translate-y-13 text-[14px] text-[#a04432]">
          Something broke on our end. Email aayush@driftwood.sh instead.
        </p>
      )}
    </form>
  );
}
