/** Ship's wheel mark — reads as a helm at 16px and holds detail at nav size.
 *  `variant="line"` drops the brand tile and draws the wheel in the accent
 *  on whatever sits behind it (the dashboard's bought-inbox rows). */
export default function HelmMark({ className, variant = "tile" }: { className?: string; variant?: "tile" | "line" }) {
  const line = variant === "line";
  const stroke = line ? "#15557e" : "#f7f4ec";
  const hub = line ? "#eef2f5" : "#15557e";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {!line && <rect width="64" height="64" rx="14" fill="#15557e" />}
      <g
        transform="translate(32 32) scale(0.88)"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* outer rim */}
        <circle r="22.5" strokeWidth="3.4" />
        {/* grip pegs */}
        <g strokeWidth="3.6">
          <line y1="-22.5" y2="-27.5" />
          <g transform="rotate(45)">
            <line y1="-22.5" y2="-27.5" />
          </g>
          <g transform="rotate(90)">
            <line y1="-22.5" y2="-27.5" />
          </g>
          <g transform="rotate(135)">
            <line y1="-22.5" y2="-27.5" />
          </g>
          <g transform="rotate(180)">
            <line y1="-22.5" y2="-27.5" />
          </g>
          <g transform="rotate(225)">
            <line y1="-22.5" y2="-27.5" />
          </g>
          <g transform="rotate(270)">
            <line y1="-22.5" y2="-27.5" />
          </g>
          <g transform="rotate(315)">
            <line y1="-22.5" y2="-27.5" />
          </g>
        </g>
        {/* spokes */}
        <g strokeWidth="2.5">
          <line y1="-8.5" y2="-19.5" />
          <g transform="rotate(45)">
            <line y1="-8.5" y2="-19.5" />
          </g>
          <g transform="rotate(90)">
            <line y1="-8.5" y2="-19.5" />
          </g>
          <g transform="rotate(135)">
            <line y1="-8.5" y2="-19.5" />
          </g>
          <g transform="rotate(180)">
            <line y1="-8.5" y2="-19.5" />
          </g>
          <g transform="rotate(225)">
            <line y1="-8.5" y2="-19.5" />
          </g>
          <g transform="rotate(270)">
            <line y1="-8.5" y2="-19.5" />
          </g>
          <g transform="rotate(315)">
            <line y1="-8.5" y2="-19.5" />
          </g>
        </g>
        {/* hub */}
        <circle r="7.5" strokeWidth="2.6" fill={hub} />
        <circle r="2.8" fill={stroke} stroke="none" />
      </g>
    </svg>
  );
}
