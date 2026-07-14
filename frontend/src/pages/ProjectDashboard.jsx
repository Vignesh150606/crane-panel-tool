import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, RotateCcw, ArrowRight, AlertTriangle,
  FileText, Factory, Zap, Cable as CableIcon, ClipboardList, Compass, ShieldAlert,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useProjectStore } from '../store/projectStore'
import { CRANE_TYPES } from '../data/craneData'
import { WORKFLOW_ITEMS } from '../config/navigation'

const MOTOR_LABEL = { hoist: 'Hoist', lt: 'Long Travel', ct: 'Cross Travel' }
const COMPONENT_LABEL = { contactor: 'contactor', mpcb: 'MPCB', cable: 'cable' }

/**
 * Distinct from "incomplete sections" below — this scans data that DOES
 * exist for engineering-level concerns (a component came back undersized,
 * or a voltage drop exceeds the IS 732 limit), the same sizing_status /
 * voltage_drop_exceeds_limit fields the individual pages already surface,
 * just rolled up in one place so a warning doesn't stay buried on a page
 * nobody's revisited.
 */
function getEngineeringWarnings(store) {
  const warnings = []
  if (store.motors) {
    for (const [key, m] of Object.entries(store.motors.motors)) {
      for (const comp of ['contactor', 'mpcb', 'cable']) {
        if (m.status[comp].sizing_status === 'undersized') {
          warnings.push({
            id: `${key}-${comp}`,
            text: `${MOTOR_LABEL[key]} motor's ${COMPONENT_LABEL[comp]} is undersized for the calculated load.`,
            link: '/calculator',
          })
        }
      }
    }
  }
  if (store.cableBusbar?.result) {
    const r = store.cableBusbar.result
    if (r.status.cable.sizing_status === 'undersized') {
      warnings.push({ id: 'cable-undersized', text: 'Selected feeder cable is undersized for the required current.', link: '/cable-busbar' })
    }
    if (r.voltage_drop_exceeds_limit) {
      warnings.push({ id: 'voltage-drop', text: `Voltage drop (${r.voltage_drop_pct}%) exceeds the ${r.voltage_drop_limit_pct}% IS 732 limit.`, link: '/cable-busbar' })
    }
  }
  return warnings
}

export default function ProjectDashboard() {
  const store = useProjectStore()
  const { project, craneType, motors, cableBusbar, starDelta, bom, resetProject } = store
  const steps = store.completedSteps()
  const crane = craneType ? CRANE_TYPES[craneType] : null

  const doneCount = Object.values(steps).filter(Boolean).length
  const totalCount = Object.keys(steps).length
  const pct = Math.round((doneCount / totalCount) * 100)

  // Which numbered workflow steps have no data yet — used for both the
  // recommended-next-task callout and the incomplete-sections list.
  const incomplete = WORKFLOW_ITEMS.filter((w) => w.key && !steps[w.key])
  const nextTask = incomplete[0] || (doneCount === totalCount ? WORKFLOW_ITEMS.find((w) => w.path === '/report') : null)
  const warnings = getEngineeringWarnings(store)

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Project Dashboard"
        description="A live snapshot of your current design. Updates automatically as you move through the workflow — nothing here is entered by hand."
        actions={
          <button
            onClick={() => { if (confirm('Reset all project data? This clears every step and cannot be undone.')) resetProject() }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-dim hover:text-danger border border-steel hover:border-danger/40 rounded-md px-3 py-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> Reset Project
          </button>
        }
      />

      {/* Completion overview */}
      <Card className="mb-6">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-steel)" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="var(--color-amber)" strokeWidth="8"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - pct / 100)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-text text-lg">
              {pct}%
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-text font-semibold mb-1">{project.name || 'Untitled Project'}</div>
            <div className="text-text-dim text-sm mb-2">{doneCount} of {totalCount} workflow steps complete</div>
            <div className="flex flex-wrap gap-1.5">
              {WORKFLOW_ITEMS.filter((w) => w.key).map((w) => (
                <Badge key={w.path} tone={steps[w.key] ? 'safe' : 'neutral'}>
                  {w.shortLabel}
                </Badge>
              ))}
            </div>
          </div>
          <Link to="/report" className="inline-flex items-center gap-1.5 bg-amber text-ink text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-amber-dim transition-colors shrink-0">
            <FileText size={15} /> Open Report
          </Link>
        </div>
      </Card>

      {/* Recommended next step + engineering warnings — two different signals:
          one says what's missing, the other says what's already wrong. */}
      {(nextTask || warnings.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          {nextTask && (
            <Card className="border-amber/40 bg-amber/5">
              <div className="flex items-center gap-1.5 text-amber font-semibold text-sm mb-2.5">
                <Compass size={15} /> Recommended Next Step
              </div>
              <div className="text-text font-semibold text-sm mb-1">{nextTask.label}</div>
              <p className="text-text-muted text-xs leading-relaxed mb-3">{nextTask.description}</p>
              <Link to={nextTask.path} className="inline-flex items-center gap-1.5 bg-amber text-ink text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-amber-dim transition-colors">
                Continue <ArrowRight size={12} />
              </Link>
            </Card>
          )}
          {warnings.length > 0 && (
            <Card variant="danger">
              <div className="flex items-center gap-1.5 text-danger font-semibold text-sm mb-2.5">
                <ShieldAlert size={15} /> Engineering Warnings
              </div>
              <div className="space-y-1.5">
                {warnings.map((w) => (
                  <Link key={w.id} to={w.link} className="flex items-center justify-between gap-2 bg-inset border border-danger/30 rounded-lg px-3 py-2 text-xs hover:border-danger/60 transition-colors group">
                    <span className="text-text-muted">{w.text}</span>
                    <ArrowRight size={12} className="text-text-dim group-hover:text-danger transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Missing inputs */}
      {incomplete.length > 0 && (
        <Card variant="warning" className="mb-6">
          <div className="flex items-center gap-1.5 text-amber font-semibold text-sm mb-2.5">
            <AlertTriangle size={15} /> Incomplete Sections
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {incomplete.map((w) => (
              <Link key={w.path} to={w.path} className="flex items-center justify-between gap-2 bg-inset border border-steel rounded-lg px-3 py-2 text-sm hover:border-amber/40 transition-colors group">
                <span className="text-text-muted">{w.label}</span>
                <ArrowRight size={13} className="text-text-dim group-hover:text-amber transition-colors" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid lg:grid-cols-2 gap-5">
        <SummaryCard icon={Factory} title="Crane Selection" done={!!crane} link="/cranes" linkLabel="Select a crane type">
          {crane && (
            <DataRows rows={[
              ['Type', crane.fullName],
              ['Category', crane.category],
              ['Capacity Range', crane.capacityRange],
              ['Duty Class', crane.specs.typicalDutyClass],
              ['Girders', crane.specs.girders],
            ]} />
          )}
        </SummaryCard>

        <SummaryCard icon={Zap} title="Motor Selection" done={!!motors} link="/calculator" linkLabel="Run the Load Calculator">
          {motors && (
            <div className="space-y-2.5">
              {Object.entries(motors.motors).map(([key, m]) => (
                <div key={key} className="bg-inset border border-steel rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text text-sm font-semibold">{m.label}</span>
                    {m.star_delta_required && <Badge tone="caution">Star-Delta</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[0.7rem] text-text-dim">
                    <span>{m.hp} HP</span>
                    <span>FLC {m.flc} A</span>
                    <span>MPCB {m.mpcb_rating} A</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>

        <SummaryCard icon={CableIcon} title="Cable & Busbar" done={!!cableBusbar} link="/cable-busbar" linkLabel="Run the Cable & Busbar Designer">
          {cableBusbar && (
            <DataRows rows={[
              ['Cable Size', `${cableBusbar.result.cable_size} mm²`],
              ['Voltage Drop', `${cableBusbar.result.voltage_drop_v} V (${cableBusbar.result.voltage_drop_pct}%)`],
              ['Recommended System', cableBusbar.result.recommendation === 'busbar' ? 'Rigid Busbar' : 'Stretch Wire'],
            ]} />
          )}
        </SummaryCard>

        <SummaryCard icon={ClipboardList} title="Bill of Materials" done={!!bom} link="/bom" linkLabel="Generate the BOM">
          {bom && (
            <DataRows rows={[
              ['Line Items', bom.result.items.length],
              ['Starting Method', starDelta?.result?.required ? 'Star-Delta' : 'Direct-On-Line'],
            ]} />
          )}
        </SummaryCard>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, title, done, link, linkLabel, children }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-inset border border-steel flex items-center justify-center shrink-0">
          <Icon size={14} className="text-amber" />
        </div>
        <span className="text-text font-semibold text-sm flex-1">{title}</span>
        <span className={`w-2 h-2 rounded-full shrink-0 ${done ? 'bg-safe shadow-[0_0_5px_var(--color-safe)]' : 'bg-steel-light'}`} />
      </div>
      {done ? children : (
        <Link to={link} className="flex items-center gap-2 text-text-dim hover:text-amber text-sm border border-dashed border-steel rounded-lg px-3 py-2.5 transition-colors">
          <ArrowRight size={13} /> {linkLabel}
        </Link>
      )}
    </Card>
  )
}

function DataRows({ rows }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="text-text-dim text-[0.7rem]">{label}</div>
          <div className="text-text text-sm font-medium font-mono">{value}</div>
        </div>
      ))}
    </div>
  )
}
