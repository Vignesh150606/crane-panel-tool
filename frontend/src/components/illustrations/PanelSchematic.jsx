// The homepage's signature visual: not a stock photo, not a generic
// gradient blob — a schematic of the exact thing this tool designs. Built
// from the same tokens as the rest of the app (copper busbar, IEC 60204-1
// lamp colors, mono "data face" for the rating plate text) so it reads as
// part of the product, not an illustration bolted on top of it. Reuses the
// existing `.wire-flow` dash-animation class, which already respects
// prefers-reduced-motion globally (see index.css) — nothing extra needed
// here for that.
export default function PanelSchematic({ className = '' }) {
  const rows = [
    { y: 96, label: 'INCOMER MCCB', devices: 1 },
    { y: 160, label: 'CONTACTOR — HOIST', devices: 3 },
    { y: 224, label: 'CONTACTOR — LT / CT', devices: 3 },
    { y: 288, label: 'OVERLOAD RELAY', devices: 2 },
  ]

  return (
    <svg
      viewBox="0 0 560 460"
      className={className}
      role="img"
      aria-label="Schematic diagram of a crane control panel enclosure with DIN-rail mounted breakers, contactors and overload relays, wired to a copper busbar and indicator lamps"
    >
      <defs>
        <linearGradient id="busbarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-copper)" />
          <stop offset="100%" stopColor="var(--color-copper-dim)" />
        </linearGradient>
        <filter id="lampGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Panel door / frame */}
      <rect x="24" y="20" width="512" height="400" rx="14" fill="var(--color-surface)" stroke="var(--color-steel-light)" strokeWidth="1.5" />
      <rect x="24" y="20" width="512" height="400" rx="14" fill="none" stroke="var(--color-steel)" strokeWidth="10" opacity="0.35" />

      {/* Header strip */}
      <text x="48" y="50" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="1.5" fill="var(--color-text-dim)">
        EOT CRANE CONTROL PANEL
      </text>

      {/* Indicator lamps, top right — IEC 60204-1 convention */}
      {[
        { cx: 420, tone: 'var(--color-safe)', label: 'RUN' },
        { cx: 456, tone: 'var(--color-amber)', label: 'RDY' },
        { cx: 492, tone: 'var(--color-danger)', label: 'FLT' },
      ].map((lamp) => (
        <g key={lamp.label}>
          <circle cx={lamp.cx} cy="42" r="6" fill={lamp.tone} filter="url(#lampGlow)" />
          <text x={lamp.cx} y="64" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--color-text-dim)">
            {lamp.label}
          </text>
        </g>
      ))}

      {/* Copper busbar running down the left side of the device field */}
      <rect x="70" y="84" width="7" height="230" rx="2" fill="url(#busbarGrad)" />
      <text x="70" y="330" fontFamily="var(--font-mono)" fontSize="8" fill="var(--color-copper)" letterSpacing="0.5">
        BUSBAR
      </text>

      {/* Device rows */}
      {rows.map((row) => (
        <g key={row.label}>
          <text x="96" y={row.y - 10} fontFamily="var(--font-mono)" fontSize="8.5" letterSpacing="0.4" fill="var(--color-text-dim)">
            {row.label}
          </text>
          {Array.from({ length: row.devices }).map((_, i) => {
            const x = 96 + i * 58
            return (
              <g key={i}>
                <line x1="73.5" y1={row.y + 14} x2={x + 20} y2={row.y + 14} stroke="var(--color-copper)" strokeWidth="1.5" className="wire-flow" opacity="0.8" />
                <rect x={x} y={row.y} width="42" height="30" rx="4" fill="var(--color-inset)" stroke="var(--color-steel-light)" strokeWidth="1.25" />
                <rect x={x + 15} y={row.y + 6} width="12" height="6" rx="2" fill="var(--color-steel-light)" />
                <circle cx={x + 21} cy={row.y + 21} r="3" fill="var(--color-amber)" opacity="0.85" />
              </g>
            )
          })}
        </g>
      ))}

      {/* Terminal block strip along the bottom */}
      <g>
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={70 + i * 20} y="342" width="14" height="20" rx="2" fill="var(--color-inset)" stroke="var(--color-steel)" strokeWidth="1" />
        ))}
      </g>

      {/* Rating plate strip at the base — the design system's namesake, drawn literally */}
      <rect x="48" y="378" width="464" height="30" rx="4" fill="var(--color-ink)" stroke="var(--color-steel)" strokeWidth="1" />
      <text x="64" y="397" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--color-text-muted)" letterSpacing="0.5">
        TYPE: EOT-SG&nbsp;&nbsp;·&nbsp;&nbsp;IP54&nbsp;&nbsp;·&nbsp;&nbsp;415V&nbsp;3Ph&nbsp;50Hz&nbsp;&nbsp;·&nbsp;&nbsp;IS/IEC COMPLIANT
      </text>
    </svg>
  )
}
