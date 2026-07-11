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

/** `status` is the exact shape returned by backend app/status.py:build_status() */
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

      <div className="flex justify-between text-[0.7rem] text-text-dim font-mono mb-1.5">
        <span>Required: {status.required_rating}</span>
        <span>Selected: {status.selected_rating}</span>
        <span>Margin: {status.safety_margin_pct}%</span>
      </div>

      <p className="text-xs text-text-dim leading-relaxed">{status.sizing_status_description}</p>
    </div>
  )
}
