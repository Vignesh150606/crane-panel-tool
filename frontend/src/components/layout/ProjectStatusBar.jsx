import { Link } from 'react-router-dom'
import { useProjectStore } from '../../store/projectStore'
import { CRANE_TYPES } from '../../data/craneData'

const TODAY = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })

// A slim, title-block-style strip: project name, selected crane, a live
// completion percentage, and a small bank of status LEDs — one per
// workflow milestone (crane / load / cable / circuit / bom). "REV A" is a
// fixed drawing-title-block convention (every design starts at Rev A),
// not a claim about this specific project's revision history.
export default function ProjectStatusBar() {
  const { project, craneType, completedSteps } = useProjectStore()
  const crane = craneType ? CRANE_TYPES[craneType] : null
  const steps = completedSteps()
  const total = Object.keys(steps).length
  const pct = Math.round((Object.values(steps).filter(Boolean).length / total) * 100)

  const LEDS = [
    { key: 'crane', label: 'Crane' },
    { key: 'load', label: 'Load' },
    { key: 'cable', label: 'Cable' },
    { key: 'circuit', label: 'Circuit' },
    { key: 'bom', label: 'BOM' },
  ]

  return (
    <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap rounded-lg border border-steel bg-inset px-4 py-2.5 mb-5 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-text font-semibold truncate max-w-[180px]">
          {project.name || 'Untitled Project'}
        </span>
        {crane && <span className="text-text-dim truncate max-w-[160px]">· {crane.fullName}</span>}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 ml-auto">
        {LEDS.map((led) => (
          <span key={led.key} className="flex items-center gap-1" title={`${led.label}: ${steps[led.key] ? 'complete' : 'pending'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${steps[led.key] ? 'bg-safe shadow-[0_0_5px_var(--color-safe)]' : 'bg-steel-light'}`} />
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5 sm:ml-0 ml-auto">
        <div className="w-20 h-1.5 rounded-full bg-steel overflow-hidden">
          <div className="h-full bg-amber rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-text-dim font-mono tabular-nums w-8">{pct}%</span>
      </div>

      <div className="flex items-center gap-3 text-text-dim font-mono">
        <span>REV A</span>
        <span className="hidden md:inline">{TODAY}</span>
      </div>

      <Link to="/dashboard" className="text-amber hover:underline underline-offset-2 font-medium whitespace-nowrap">
        Dashboard →
      </Link>
    </div>
  )
}
