/** Ship's wheel mark — reads as a helm at 16px and holds detail at nav size. */
export default function HelmMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#15557e" />
      <g
        transform="translate(32 32)"
        fill="none"
        stroke="#f7f4ec"
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
        <circle r="7.5" strokeWidth="2.6" fill="#15557e" />
        <circle r="2.8" fill="#f7f4ec" stroke="none" />
      </g>
    </svg>
  );
}
