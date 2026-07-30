import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProjectStore } from '../../store/projectStore'
import { CRANE_TYPES } from '../../data/craneData'

const LEDS = [
  { key: 'crane', label: 'Crane' },
  { key: 'load', label: 'Load' },
  { key: 'cable', label: 'Cable' },
  { key: 'circuit', label: 'Circuit' },
  { key: 'bom', label: 'BOM' },
]

export default function ProjectStatusBar() {
  const project = useProjectStore((s) => s.project)
  const craneType = useProjectStore((s) => s.craneType)
  const motors = useProjectStore((s) => s.motors)
  const cableBusbar = useProjectStore((s) => s.cableBusbar)
  const starDelta = useProjectStore((s) => s.starDelta)
  const bom = useProjectStore((s) => s.bom)

  const steps = useMemo(() => ({
    crane: !!craneType,
    load: !!motors,
    cable: !!cableBusbar?.result,
    circuit: !!starDelta?.result,
    bom: !!bom?.result,
  }), [craneType, motors, cableBusbar?.result, starDelta?.result, bom?.result])

  const crane = craneType ? CRANE_TYPES[craneType] : null
  const total = Object.keys(steps).length
  const pct = Math.round((Object.values(steps).filter(Boolean).length / total) * 100)
  const todayFormatted = useMemo(() => new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }), [])

  return (
    <div
      role="region"
      aria-label="Project status"
      className="flex items-center gap-x-5 gap-y-1.5 flex-wrap rounded-xl border border-steel bg-inset px-4 py-2.5 mb-5 text-xs shadow-sm"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-text font-semibold truncate max-w-[180px]">
          {project.name || 'Untitled Project'}
        </span>
        {crane && <span className="text-text-dim truncate max-w-[160px]">· {crane.fullName}</span>}
      </div>

      <div className="hidden sm:flex items-center gap-3 ml-auto">
        {LEDS.map((led) => {
          const isDone = steps[led.key]
          return (
            <span
              key={led.key}
              className="flex items-center gap-1.5 text-xs"
              title={`${led.label}: ${isDone ? 'complete' : 'pending'}`}
            >
              <span
                role="status"
                aria-label={`${led.label} ${isDone ? 'complete' : 'pending'}`}
                className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isDone ? 'bg-safe shadow-[0_0_6px_var(--color-safe)]' : 'bg-steel-light'}`}
              />
              <span className={`font-medium ${isDone ? 'text-text-muted' : 'text-text-dim'}`}>{led.label}</span>
            </span>
          )
        })}
      </div>

      <div className="flex items-center gap-2 sm:ml-0 ml-auto">
        <div className="w-20 h-1.5 rounded-full bg-steel overflow-hidden" aria-hidden="true">
          <div className="h-full bg-amber rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-text-dim font-mono font-medium tabular-nums w-8">{pct}%</span>
      </div>

      <div className="flex items-center gap-3 text-text-dim font-mono text-xs">
        <span>REV A</span>
        <span className="hidden md:inline">{todayFormatted}</span>
      </div>

      <Link to="/dashboard" className="text-amber hover:underline underline-offset-2 font-medium whitespace-nowrap text-xs">
        Dashboard →
      </Link>
    </div>
  )
}

