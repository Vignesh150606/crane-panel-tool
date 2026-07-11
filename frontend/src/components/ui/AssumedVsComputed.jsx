import { CheckCircle2, CircleDashed } from 'lucide-react'

/** `assumptions` is a list of app/status.py:assumed_or_computed() objects */
export default function AssumedVsComputed({ assumptions }) {
  if (!assumptions?.length) return null
  return (
    <div className="bg-inset border border-steel rounded-lg px-3.5 py-3">
      <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-2">Assumed vs. computed inputs</div>
      <div className="space-y-1.5">
        {assumptions.map((a) => (
          <div key={a.field} className="flex items-start gap-2 text-xs">
            {a.source === 'computed' ? (
              <CheckCircle2 size={13} className="text-safe shrink-0 mt-0.5" />
            ) : (
              <CircleDashed size={13} className="text-amber shrink-0 mt-0.5" />
            )}
            <span className="text-text-muted">
              <span className="font-mono text-text">{a.field}</span> = <span className="font-mono">{a.value}{a.unit}</span>
              <span className="text-text-dim"> — {a.note}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
