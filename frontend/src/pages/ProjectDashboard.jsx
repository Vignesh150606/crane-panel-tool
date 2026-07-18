import { Link } from 'react-router-dom'
import {
  LayoutDashboard, RotateCcw, ArrowRight, ShieldAlert, Compass, PartyPopper,
  FileText, Factory, Zap, Cable as CableIcon, ClipboardList,
  LayoutPanelTop, Gamepad2, ClipboardCheck, History,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import CollapsibleSection from '../components/ui/CollapsibleSection'
import { useProjectStore } from '../store/projectStore'
import { useTrainingStore, trainingSummary } from '../store/trainingStore'
import { useUIStore } from '../store/uiStore'
import { CRANE_TYPES } from '../data/craneData'
import { WORKFLOW_ITEMS, findNavItem } from '../config/navigation'
import { PANEL_COMPONENTS } from '../data/panelComponents'
import { FAULTS } from '../data/faultLibrary'

const MOTOR_LABEL = { hoist: 'Hoist', lt: 'Long Travel', ct: 'Cross Travel' }
const COMPONENT_LABEL = { contactor: 'contactor', mpcb: 'MPCB', cable: 'cable' }

/**
 * Distinct from "which steps are incomplete" below — this scans data that
 * DOES exist for engineering-level concerns (a component came back
 * undersized, or a voltage drop exceeds the IS 732 limit), the same
 * sizing_status / voltage_drop_exceeds_limit fields the individual pages
 * already surface, just rolled up in one place so a warning doesn't stay
 * buried on a page nobody's revisited. Kept visible and undimmed even
 * though this page otherwise favors progressive disclosure — a mis-sized
 * contactor isn't the kind of thing that should live behind a click.
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
  const training = trainingSummary(useTrainingStore())
  const recent = useUIStore((s) => s.recent)

  const doneCount = Object.values(steps).filter(Boolean).length
  const totalCount = Object.keys(steps).length
  const pct = Math.round((doneCount / totalCount) * 100)
  const isFresh = doneCount === 0
  const isComplete = doneCount === totalCount

  // Which numbered workflow steps have no data yet — the first one drives
  // the hero card; all of them stay reachable as links on the step chips
  // below instead of a separate "incomplete sections" list repeating the
  // same set.
  const incomplete = WORKFLOW_ITEMS.filter((w) => w.key && !steps[w.key])
  const nextTask = incomplete[0] || (isComplete ? WORKFLOW_ITEMS.find((w) => w.path === '/report') : null)
  const warnings = getEngineeringWarnings(store)
  const hasDesignData = !!(crane || motors || cableBusbar || bom)

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Project Dashboard"
        description="Where you left off, and what to do next."
        actions={
          <button
            onClick={() => { if (confirm('Reset all project data? This clears every step and cannot be undone.')) resetProject() }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-dim hover:text-danger border border-steel hover:border-danger/40 rounded-md px-3 py-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} /> Reset Project
          </button>
        }
      />

      {/* HERO — the one question this page exists to answer. Everything
          else on the page is supporting context for this card. */}
      <Card
        padding="lg"
        className={`mb-5 ${isComplete ? 'border-safe/40 bg-safe/5' : 'border-amber/40 bg-amber/5'}`}
      >
        {isFresh ? (
          <HeroContent
            icon={Compass} tone="amber" eyebrow="New project"
            heading="Start with a crane type"
            body="Every downstream step — motor sizing, cable selection, the panel BOM — builds on the crane you pick here. It takes about a minute."
            ctaTo="/cranes" ctaLabel="Select a crane type"
          />
        ) : isComplete ? (
          <HeroContent
            icon={PartyPopper} tone="safe" eyebrow="Design complete"
            heading="Every step is done — review your report"
            body={`${project.name || 'This project'} is fully specified. Open the report for the full write-up, or revisit any step below.`}
            ctaTo="/report" ctaLabel="Open Report" ctaIcon={FileText}
          />
        ) : (
          <HeroContent
            icon={Compass} tone="amber" eyebrow={`Step ${nextTask.step} of ${WORKFLOW_ITEMS.length} · What to do next`}
            heading={nextTask.label}
            body={nextTask.description}
            ctaTo={nextTask.path} ctaLabel="Continue"
          />
        )}
      </Card>

      {/* Continue where you left off + engineering warnings — two different
          signals worth surfacing before anything else: recent activity,
          and anything already wrong. Only rendered when there's something
          real to show — no empty placeholder cards. */}
      {(recent.length > 0 || warnings.length > 0) && (
        <div className={`grid gap-5 mb-5 ${recent.length > 0 && warnings.length > 0 ? 'sm:grid-cols-2' : ''}`}>
          {recent.length > 0 && (
            <Card>
              <div className="flex items-center gap-1.5 text-text-muted font-semibold text-sm mb-2.5">
                <History size={15} /> Continue Where You Left Off
              </div>
              <div className="space-y-1.5">
                {recent.map((r) => {
                  const Icon = findNavItem(r.path)?.icon
                  return (
                    <Link key={r.path} to={r.path} className="flex items-center justify-between gap-2 bg-inset border border-steel rounded-lg px-3 py-2 text-sm hover:border-amber/40 transition-colors group">
                      <span className="flex items-center gap-2 text-text-muted min-w-0">
                        {Icon && <Icon size={14} className="text-text-dim shrink-0" />}
                        <span className="truncate">{r.label}</span>
                      </span>
                      <ArrowRight size={13} className="text-text-dim group-hover:text-amber transition-colors shrink-0" />
                    </Link>
                  )
                })}
              </div>
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

      {/* Progress — compact by design. Step chips double as navigation:
          anything not yet done is a link straight to that step, so there's
          no separate "incomplete sections" list duplicating this one. */}
      <Card className="mb-5">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
              <circle cx="28" cy="28" r="23" fill="none" stroke="var(--color-steel)" strokeWidth="6" />
              <circle
                cx="28" cy="28" r="23" fill="none" stroke="var(--color-amber)" strokeWidth="6"
                strokeDasharray={2 * Math.PI * 23}
                strokeDashoffset={2 * Math.PI * 23 * (1 - pct / 100)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-text text-xs">
              {pct}%
            </div>
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="text-text font-semibold text-sm mb-0.5">{project.name || 'Untitled Project'}</div>
            <div className="text-text-dim text-xs mb-2">{doneCount} of {totalCount} workflow steps complete</div>
            <div className="flex flex-wrap gap-1.5">
              {WORKFLOW_ITEMS.filter((w) => w.key).map((w) => (
                steps[w.key] ? (
                  <Badge key={w.path} tone="safe">{w.shortLabel}</Badge>
                ) : (
                  <Link key={w.path} to={w.path}>
                    <Badge tone="neutral" className="hover:border-amber/50 hover:text-text transition-colors cursor-pointer">{w.shortLabel}</Badge>
                  </Link>
                )
              ))}
            </div>
          </div>
          <Button as={Link} to="/report" icon={FileText} size="sm" className="shrink-0">Open Report</Button>
        </div>
      </Card>

      {/* Everything already entered — reference detail, not the next
          action, so it stays collapsed by default rather than dumping
          four data-dense cards above the fold on every visit. */}
      {hasDesignData && (
        <CollapsibleSection title="Your design so far" subtitle="Crane, motors, cable and BOM at a glance" icon={ClipboardList} className="mb-5">
          <div className="grid lg:grid-cols-2 gap-4 pt-1">
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
                    <div key={key} className="bg-surface border border-steel rounded-lg px-3 py-2">
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
        </CollapsibleSection>
      )}

      {/* Training platform progress — practice/reference activity, not
          project data, so it's a quiet strip rather than three more big
          stat cards competing with the design workflow above. */}
      <div className="flex items-center gap-4 flex-wrap text-sm border-t border-steel pt-4">
        <TrainingChip icon={LayoutPanelTop} label="Panel Explorer" value={`${training.componentsViewed}/${PANEL_COMPONENTS.length}`} to="/panel-explorer" />
        <TrainingChip icon={Gamepad2} label="Challenge Mode" value={`${training.challengesSolved}/${FAULTS.length}`} to="/challenge-mode" />
        <TrainingChip
          icon={ClipboardCheck} label="Commissioning"
          value={training.lastCommissioningScore !== null ? `${training.lastCommissioningScore}/${training.lastCommissioningMax}` : 'Not started'}
          to="/commissioning"
        />
      </div>
    </div>
  )
}

function HeroContent({ icon: Icon, tone, eyebrow, heading, body, ctaTo, ctaLabel, ctaIcon }) {
  const toneClasses = tone === 'safe'
    ? { bg: 'bg-safe/15', text: 'text-safe', icon: 'text-safe' }
    : { bg: 'bg-amber/15', text: 'text-amber', icon: 'text-amber' }
  return (
    <div className="flex items-start gap-4 flex-wrap">
      <div className={`w-11 h-11 rounded-full ${toneClasses.bg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={toneClasses.icon} />
      </div>
      <div className="flex-1 min-w-[240px]">
        <div className={`${toneClasses.text} text-xs font-semibold uppercase tracking-wide mb-1`}>{eyebrow}</div>
        <div className="text-text font-display font-bold text-xl mb-1.5">{heading}</div>
        <p className="text-text-muted text-sm leading-relaxed mb-4 max-w-lg">{body}</p>
        <Button as={Link} to={ctaTo} icon={ctaIcon || ArrowRight} iconPosition={ctaIcon ? 'left' : 'right'}>{ctaLabel}</Button>
      </div>
    </div>
  )
}

function TrainingChip({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-text-dim hover:text-text transition-colors">
      <Icon size={14} className="text-amber shrink-0" />
      <span>{label}</span>
      <span className="font-mono text-text-muted">{value}</span>
    </Link>
  )
}

function SummaryCard({ icon: Icon, title, done, link, linkLabel, children }) {
  return (
    <Card variant="inset">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-surface border border-steel flex items-center justify-center shrink-0">
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
