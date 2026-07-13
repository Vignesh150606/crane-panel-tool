import { Link, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { WORKFLOW_ITEMS } from '../../config/navigation'
import { useProjectStore } from '../../store/projectStore'

export default function WorkflowStepper() {
  const location = useLocation()
  const completed = useProjectStore((s) => s.completedSteps())

  return (
    <nav aria-label="Project workflow" className="flex items-center gap-0.5 overflow-x-auto pb-1 -mx-1 px-1">
      {WORKFLOW_ITEMS.map((step, i) => {
        const isDone = step.key ? completed[step.key] : false
        const isCurrent = location.pathname === step.path
        return (
          <div key={step.path} className="flex items-center shrink-0">
            <Link
              to={step.path}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors
                ${isCurrent ? 'bg-amber text-ink' : isDone ? 'text-safe hover:bg-surface-hover' : 'text-text-dim hover:text-text-muted hover:bg-surface-hover'}`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[0.6rem] font-mono shrink-0
                ${isCurrent ? 'bg-ink text-amber' : isDone ? 'bg-safe text-ink' : 'border border-steel-light'}`}>
                {isDone && !isCurrent ? <Check size={10} strokeWidth={3} /> : step.step}
              </span>
              {step.shortLabel}
            </Link>
            {i < WORKFLOW_ITEMS.length - 1 && <span className="w-3 h-px bg-steel mx-0.5" />}
          </div>
        )
      })}
    </nav>
  )
}
