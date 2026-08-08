import Badge from './Badge'

const TONE_BY_STATUS = {
  undersized: 'danger',
  adequate: 'safe',
  optimal: 'safe',
  oversized: 'caution',
}

const BAR_COLOR = {
  undersized: 'bg-danger',
  adequate: 'bg-safe',
  optimal: 'bg-safe',
  oversized: 'bg-amber',
}

const MARGIN_TEXT_COLOR = {
  undersized: 'text-danger',
  adequate: 'text-safe',
  optimal: 'text-safe',
  oversized: 'text-amber',
}

/**
 * `status` is the exact shape returned by backend app/status.py:build_status().
 *
 * Deliberately does NOT render status.sizing_status_description — that field
 * still comes from the API (untouched), but this component only ever has 4
 * possible descriptions and previously printed one of them verbatim on every
 * instance, so a page with N cards repeated the same ~15-word sentence N
 * times. The 4 meanings are explained once per page instead, by
 * `EngineeringStatusLegend` below — render it once near a group of these
 * cards (see BOMGenerator, LoadCalculator, NameplateCalculator). Skip it
 * where this component only appears once on the page (e.g. CableBusbar) —
 * the badge label already carries the meaning at that point.
 */
export default function EngineeringStatus({ label, status }) {
  if (!status) return null
  const tone = TONE_BY_STATUS[status.sizing_status] || 'neutral'
  const barWidth = Math.max(4, Math.min(100, status.safety_margin_pct + 20))

  return (
    <div className="bg-inset border border-steel rounded-lg px-3.5 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <Badge tone={tone}>{status.sizing_status_label}</Badge>
      </div>

      <div className="h-1.5 bg-steel rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR[status.sizing_status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Was 3 separate labeled rows (Required / Selected / Margin) — same
          3 numbers, one line, since the bar above already shows the gap
          visually and doesn't need three full label words repeating it. */}
      <div className="flex items-baseline gap-x-2.5 gap-y-0.5 flex-wrap text-xs font-mono">
        <span className="text-text-dim">{status.selected_rating} <span className="text-text-dim/60">sel</span></span>
        <span className="text-text-dim">{status.required_rating} <span className="text-text-dim/60">req</span></span>
        <span className={`font-semibold ${MARGIN_TEXT_COLOR[status.sizing_status] || 'text-text-dim'}`}>
          {status.safety_margin_pct}% margin
        </span>
      </div>
    </div>
  )
}

/**
 * One shared line explaining what the 4 sizing_status badge colors mean —
 * render this ONCE per page, above/near a group of EngineeringStatus cards,
 * not once per card. Replaces what used to be a full sentence repeated
 * inside every single card.
 */
export function EngineeringStatusLegend({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-dim ${className}`}>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-danger" />
        Undersized — re-check inputs
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-safe" />
        Adequate / Optimal — within the recommended margin
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber" />
        Oversized — safe, but a smaller size may still clear it
      </span>
    </div>
  )
}
