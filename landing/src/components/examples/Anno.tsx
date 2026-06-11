/* floating annotation chip, same voice as the story compose card */
export function Anno({ text, pos }: { text: string; pos: string }) {
  return (
    <span
      className={`absolute z-10 hidden items-center gap-1.5 rounded-full bg-tide-wash px-3 py-1 font-mono text-[14px] font-medium text-tide shadow-[0_8px_20px_-10px_rgba(13,60,91,0.45)] ring-1 ring-tide/25 md:inline-flex ${pos}`}
    >
      {text}
    </span>
  );
}

