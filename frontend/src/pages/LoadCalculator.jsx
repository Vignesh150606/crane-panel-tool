import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import {
  Calculator, ArrowUpDown, MoveHorizontal, MoveVertical, ArrowRight, Zap, Check,
  ClipboardList, Cog, Flag, BookOpen, AlertTriangle, Lightbulb, Gauge, Cable,
  CheckCircle2, TrendingUp,
} from 'lucide-react'

import PageHeader, { PrefillBanner } from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import NumberField from '../components/ui/NumberField'
import SelectField from '../components/ui/SelectField'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import StatPlate from '../components/ui/StatPlate'
import Badge from '../components/ui/Badge'
import EngineeringStatus from '../components/ui/EngineeringStatus'
import AssumedVsComputed from '../components/ui/AssumedVsComputed'
import FormulaExplainer from '../components/ui/FormulaExplainer'
import ErrorBanner from '../components/ui/ErrorBanner'
import { useToast } from '../hooks/useToast'
import { calcMotor } from '../api/calculations'
import { validateFields, hasErrors, BOUNDS } from '../lib/validate'
import { useProjectStore } from '../store/projectStore'

const DEFAULTS = {
  load: 5, hoistSpeed: 4, ltSpeed: 20, ctSpeed: 10,
  hoistHP: '', ltHP: '', ctHP: '', useCustomHP: false,
  ieClass: 'IE3',
}

const IE_CLASS_OPTIONS = [
  { value: 'IE3', label: 'IE3 — Premium efficiency (India-mandated minimum since 2023)' },
  { value: 'IE2', label: 'IE2 — High efficiency (legacy / already-installed motors)' },
]

const MOTOR_META = {
  hoist: { label: 'Hoist Motor', shortLabel: 'Hoist', icon: ArrowUpDown },
  lt: { label: 'Long Travel Motor', shortLabel: 'LT', icon: MoveHorizontal },
  ct: { label: 'Cross Travel Motor', shortLabel: 'CT', icon: MoveVertical },
}

// Overview / Components / Understand Why / Recommendation — a tabbed
// results workspace replaces the old locked 5-step wizard. All four are
// simply different views onto the SAME calculation response (one API call
// returns everything), so gating them behind sequential "unlock" steps was
// pacing, not a real dependency. Tabs let a returning user jump straight to
// what they need instead of re-walking steps 1-4 to reach the summary.
const TABS = [
  { key: 'overview', label: 'Overview', icon: Gauge },
  { key: 'components', label: 'Components', icon: Cog },
  { key: 'why', label: 'Understand Why', icon: Lightbulb },
  { key: 'recommendation', label: 'Recommendation', icon: Flag },
]

// Purely presentational sequencing shown right after a calculation returns
// — the API resolves all of this in one round trip, but revealing it as a
// short build-up (mechanical -> electrical -> protection -> cable) mirrors
// the actual dependency order of the engineering and gives the result some
// weight instead of an instant wall of numbers. Skipped entirely under
// prefers-reduced-motion.
const CALC_STAGES = [
  { key: 'mechanical', label: 'Computing mechanical load per motion', icon: ClipboardList },
  { key: 'motor', label: 'Sizing motor HP, kW and full-load current', icon: Cog },
  { key: 'protection', label: 'Selecting contactor, MPCB and overload setting', icon: Zap },
  { key: 'cable', label: 'Sizing feeder cable for continuous duty', icon: Cable },
]

export default function LoadCalculator() {
  const navigate = useNavigate()
  const toast = useToast()
  const storedInputs = useProjectStore((s) => s.motorInputs)
  const storedMotors = useProjectStore((s) => s.motors)
  const setMotors = useProjectStore((s) => s.setMotors)

  const [inputs, setInputs] = useState(() => storedInputs || DEFAULTS)
  const [results, setResults] = useState(storedMotors)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [prefilled, setPrefilled] = useState(!!storedInputs)

  const [activeTab, setActiveTab] = useState('overview')
  const [activeMotorKey, setActiveMotorKey] = useState(null)
  const [revealing, setRevealing] = useState(false)
  const [revealStage, setRevealStage] = useState(CALC_STAGES.length)
  const revealTimers = useRef([])
  useEffect(() => () => revealTimers.current.forEach(clearTimeout), [])

  const motorKeys = results ? Object.keys(results.motors) : []
  const activeKey = activeMotorKey && motorKeys.includes(activeMotorKey) ? activeMotorKey : motorKeys[0]

  const update = (key, val) => setInputs((p) => ({ ...p, [key]: val }))

  const validate = () => {
    if (inputs.useCustomHP) {
      return validateFields({
        hoistHP: { value: inputs.hoistHP, label: 'Hoist HP', ...BOUNDS.hp },
        ltHP: { value: inputs.ltHP, label: 'LT HP', ...BOUNDS.hp },
        ctHP: { value: inputs.ctHP, label: 'CT HP', ...BOUNDS.hp },
      })
    }
    return validateFields({
      load: { value: inputs.load, label: 'Rated load', ...BOUNDS.loadTons },
      hoistSpeed: { value: inputs.hoistSpeed, label: 'Hoist speed', ...BOUNDS.speed },
      ltSpeed: { value: inputs.ltSpeed, label: 'Long travel speed', ...BOUNDS.speed },
      ctSpeed: { value: inputs.ctSpeed, label: 'Cross travel speed', ...BOUNDS.speed },
    })
  }

  const startReveal = () => {
    revealTimers.current.forEach(clearTimeout)
    revealTimers.current = []
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setRevealing(false); setRevealStage(CALC_STAGES.length); return }
    setRevealing(true)
    setRevealStage(0)
    CALC_STAGES.forEach((_, i) => {
      const t = setTimeout(() => {
        setRevealStage(i + 1)
        if (i === CALC_STAGES.length - 1) {
          const t2 = setTimeout(() => setRevealing(false), 260)
          revealTimers.current.push(t2)
        }
      }, 230 * (i + 1))
      revealTimers.current.push(t)
    })
  }

  const calculate = async () => {
    const fieldErrors = validate()
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return

    setLoading(true)
    setApiError(null)
    try {
      const payload = {
        load_tons: inputs.load,
        hoist_speed: inputs.hoistSpeed,
        lt_speed: inputs.ltSpeed,
        ct_speed: inputs.ctSpeed,
        ie_class: inputs.ieClass,
        ...(inputs.useCustomHP
          ? {
              hoist_hp_override: inputs.hoistHP,
              lt_hp_override: inputs.ltHP,
              ct_hp_override: inputs.ctHP,
              load_tons: inputs.load || 0.1,
            }
          : {}),
      }
      const data = await calcMotor(payload)
      setResults(data)
      setMotors(inputs, data)
      setActiveMotorKey(Object.keys(data.motors)[0])
      toast.success('Motor ratings calculated')
      setActiveTab('overview')
      startReveal()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const summary = results ? summarizeStatus(results, motorKeys) : null
  const chartData = results
    ? motorKeys.map((key) => ({
        name: MOTOR_META[key].shortLabel,
        HP: results.motors[key].hp,
        FLC: results.motors[key].flc,
      }))
    : []

  return (
    <div>
      <PageHeader
        icon={Calculator}
        title="Load Calculator"
        description="Crane parameters in, motor sizing and protection selection out — with the engineering reasoning behind every value one tab away."
        actions={<Button as={Link} to="/handbook#motor-hp" variant="outline" size="sm" icon={BookOpen}>Learn the theory</Button>}
      />

      {prefilled && (
        <PrefillBanner
          message="Inputs restored from your last calculation in this project."
          onDismiss={() => { setInputs(DEFAULTS); setPrefilled(false) }}
        />
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-[340px_1fr] gap-6 items-start">
        {/* ── Persistent input panel — always visible and editable, not a one-time step ── */}
        <Card padding="lg" className="2xl:sticky 2xl:top-6">
          <h2 className="font-display text-amber font-semibold mb-1 text-sm">Crane Parameters</h2>
          <p className="text-text-dim text-xs mb-4">
            Enter rated load and motion speeds, or switch to custom HP if you already know the motor sizes.
          </p>

          <div className="mb-4">
            <Toggle
              checked={inputs.useCustomHP}
              onChange={(v) => update('useCustomHP', v)}
              label="Use custom motor HP"
              description="Override the mechanical calculation and enter known HP directly"
            />
          </div>

          {!inputs.useCustomHP ? (
            <>
              <NumberField label="Rated Load" value={inputs.load} onChange={(v) => update('load', v)} unit="tonnes" min={0.5} max={500} step={0.5} error={errors.load} />
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-1 gap-x-3">
                <NumberField label="Hoist Speed" value={inputs.hoistSpeed} onChange={(v) => update('hoistSpeed', v)} unit="m/min" min={1} max={30} error={errors.hoistSpeed} />
                <NumberField label="Long Travel Speed" value={inputs.ltSpeed} onChange={(v) => update('ltSpeed', v)} unit="m/min" min={5} max={80} error={errors.ltSpeed} />
                <NumberField label="Cross Travel Speed" value={inputs.ctSpeed} onChange={(v) => update('ctSpeed', v)} unit="m/min" min={5} max={40} error={errors.ctSpeed} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-1 gap-x-3">
              <NumberField label="Hoist Motor HP" value={inputs.hoistHP} onChange={(v) => update('hoistHP', v)} unit="HP" error={errors.hoistHP} />
              <NumberField label="LT Motor HP" value={inputs.ltHP} onChange={(v) => update('ltHP', v)} unit="HP" error={errors.ltHP} />
              <NumberField label="CT Motor HP" value={inputs.ctHP} onChange={(v) => update('ctHP', v)} unit="HP" error={errors.ctHP} />
            </div>
          )}

          <SelectField
            label="Motor Efficiency Class"
            value={inputs.ieClass}
            onChange={(v) => update('ieClass', v)}
            options={IE_CLASS_OPTIONS}
            helper="Looked up per motor from IEC 60034-30-1, not one flat number."
          />

          <Button className="w-full mt-1" size="lg" icon={Zap} onClick={calculate} disabled={loading}>
            {loading ? 'Calculating…' : results ? 'Recalculate' : 'Calculate'}
          </Button>

          {apiError && <div className="mt-3"><ErrorBanner message={apiError} onRetry={calculate} retrying={loading} /></div>}

          <p className="text-[0.7rem] text-text-dim mt-3 leading-relaxed">
            Defaults to 415V 3-phase supply and 0.85 power factor — see "Assumed vs. computed" in the Overview tab after calculating.
          </p>
        </Card>

        {/* ── Results workspace ── */}
        <div className="min-w-0">
          {!results ? (
            <WaitingPanel />
          ) : (
            <>
              <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
                {TABS.map((t) => {
                  const Icon = t.icon
                  const active = t.key === activeTab
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border-2 transition-colors cursor-pointer
                        ${active ? 'border-amber text-amber bg-surface' : 'border-steel text-text-muted hover:border-steel-light'}`}
                    >
                      <Icon size={14} /> {t.label}
                    </button>
                  )
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

                  {activeTab === 'overview' && (
                    <div className="space-y-5">
                      {revealing ? (
                        <CalcProgress stage={revealStage} />
                      ) : (
                        <>
                          <StatusBanner summary={summary} />

                          <Card>
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingUp size={14} className="text-amber" />
                              <h3 className="font-display text-sm font-semibold text-text">Motor Comparison</h3>
                            </div>
                            <p className="text-text-dim text-xs mb-3">Motor HP (mechanical rating) against full-load current (electrical draw) — the two numbers every downstream selection is built from.</p>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-steel)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--color-text-dim)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--color-steel)' }} />
                                <YAxis yAxisId="hp" stroke="var(--color-text-dim)" fontSize={10} tickLine={false} axisLine={false} width={40} />
                                <YAxis yAxisId="flc" orientation="right" stroke="var(--color-text-dim)" fontSize={10} tickLine={false} axisLine={false} width={40} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-steel)', opacity: 0.2 }} />
                                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-text-dim)' }} />
                                <Bar yAxisId="hp" dataKey="HP" name="Motor HP" fill="var(--color-info)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                                <Bar yAxisId="flc" dataKey="FLC" name="FLC (A)" fill="var(--color-amber)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Card>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {motorKeys.map((key) => {
                              const data = results.motors[key]
                              const meta = MOTOR_META[key]
                              const Icon = meta.icon
                              return (
                                <Card key={key} variant="computed">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-display font-semibold text-text flex items-center gap-2 text-sm">
                                      <Icon size={16} className="text-copper" /> {meta.label}
                                    </h3>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {data.star_delta_required && <Badge tone="caution">Star-Delta Required</Badge>}
                                    {data.hp_was_override && <Badge tone="info" dot={false}>Custom HP</Badge>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <StatPlate label="Motor HP" value={data.hp} unit="HP" size="sm" />
                                    <StatPlate label="Motor kW" value={data.kw} unit="kW" size="sm" />
                                    <StatPlate label="Efficiency" value={data.efficiency_pct} unit="%" size="sm" />
                                    <StatPlate label="Full Load Current" value={data.flc} unit="A" tone="amber" size="sm" />
                                  </div>
                                </Card>
                              )
                            })}
                          </div>

                          <AssumedVsComputed assumptions={results.assumptions} />
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'components' && (
                    <div>
                      <p className="text-text-dim text-xs mb-4 max-w-2xl">
                        Every rating below already carries the crane-duty margin — IEC 60947-4-1 AC-3 practice for repeated
                        start/stop and locked-rotor current, not a general-purpose selection. Each block's margin bar shows
                        how far the selected rating sits above the minimum requirement.
                      </p>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {motorKeys.map((key) => {
                          const data = results.motors[key]
                          const meta = MOTOR_META[key]
                          const Icon = meta.icon
                          return (
                            <Card key={key} variant="computed">
                              <h3 className="font-display font-semibold text-text flex items-center gap-2 text-sm mb-3">
                                <Icon size={16} className="text-copper" /> {meta.label}
                              </h3>
                              <div className="grid grid-cols-1 gap-2 mb-3">
                                <StatPlate label="Contactor" value={data.contactor_rating} unit="A" tone={data.status.contactor.sizing_status === 'undersized' ? 'danger' : 'safe'} />
                                <StatPlate label="MPCB" value={data.mpcb_rating} unit="A" tone={data.status.mpcb.sizing_status === 'undersized' ? 'danger' : 'safe'} />
                                <StatPlate label="Cable Size" value={data.cable_size} unit="mm²" tone={data.status.cable.sizing_status === 'undersized' ? 'danger' : 'safe'} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <EngineeringStatus label="Contactor margin" status={data.status.contactor} />
                                <EngineeringStatus label="MPCB margin" status={data.status.mpcb} />
                                <EngineeringStatus label="Cable margin" status={data.status.cable} />
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'why' && (
                    <div>
                      <p className="text-text-dim text-xs mb-4">Pick a motor, then a tier above each block for as much or as little depth as you want.</p>
                      <div className="flex gap-1.5 mb-4 flex-wrap">
                        {motorKeys.map((key) => {
                          const meta = MOTOR_META[key]
                          const Icon = meta.icon
                          return (
                            <button
                              key={key}
                              onClick={() => setActiveMotorKey(key)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border-2 transition-colors cursor-pointer
                                ${activeKey === key ? 'border-amber text-amber bg-surface' : 'border-steel text-text-muted hover:border-steel-light'}`}
                            >
                              <Icon size={14} /> {meta.label}
                            </button>
                          )
                        })}
                      </div>

                      {activeKey && (
                        <div className="space-y-2">
                          {results.motors[activeKey].explanations.motor_hp && (
                            <FormulaExplainer title="Why this HP?" explanation={results.motors[activeKey].explanations.motor_hp} />
                          )}
                          <FormulaExplainer title="Why this FLC?" explanation={results.motors[activeKey].explanations.flc} />
                          <FormulaExplainer title="Why this contactor rating?" explanation={results.motors[activeKey].explanations.contactor} />
                          <FormulaExplainer title="Why this MPCB rating?" explanation={results.motors[activeKey].explanations.mpcb} />
                          <FormulaExplainer title="Why this overload setting?" explanation={results.motors[activeKey].explanations.overload} />
                          <FormulaExplainer title="Why this cable size?" explanation={results.motors[activeKey].explanations.cable} />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'recommendation' && (
                    <div>
                      <div className="overflow-x-auto rounded-xl border border-steel mb-5">
                        <table className="w-full border-collapse text-sm min-w-[520px]">
                          <thead>
                            <tr className="bg-surface">
                              <th className="text-left px-4 py-3 text-text-muted border-b border-steel">Motion</th>
                              <th className="text-left px-4 py-3 text-text-muted border-b border-steel">HP / kW</th>
                              <th className="text-left px-4 py-3 text-text-muted border-b border-steel">FLC</th>
                              <th className="text-left px-4 py-3 text-text-muted border-b border-steel">Contactor</th>
                              <th className="text-left px-4 py-3 text-text-muted border-b border-steel">MPCB</th>
                              <th className="text-left px-4 py-3 text-text-muted border-b border-steel">Cable</th>
                              <th className="text-left px-4 py-3 text-text-muted border-b border-steel">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {motorKeys.map((key, i) => {
                              const data = results.motors[key]
                              const statuses = [data.status.contactor.sizing_status, data.status.mpcb.sizing_status, data.status.cable.sizing_status]
                              const worst = statuses.includes('undersized') ? 'undersized' : statuses.includes('adequate') ? 'adequate' : 'optimal'
                              return (
                                <tr key={key} className={i % 2 === 0 ? 'bg-inset' : 'bg-surface'}>
                                  <td className="px-4 py-2.5 border-b border-steel text-text font-medium">{MOTOR_META[key].label}</td>
                                  <td className="px-4 py-2.5 border-b border-steel text-text-muted">{data.hp} HP / {data.kw} kW</td>
                                  <td className="px-4 py-2.5 border-b border-steel text-text-muted">{data.flc} A</td>
                                  <td className="px-4 py-2.5 border-b border-steel text-text-muted">{data.contactor_rating} A</td>
                                  <td className="px-4 py-2.5 border-b border-steel text-text-muted">{data.mpcb_rating} A</td>
                                  <td className="px-4 py-2.5 border-b border-steel text-text-muted">{data.cable_size} mm²</td>
                                  <td className="px-4 py-2.5 border-b border-steel">
                                    <Badge tone={worst === 'undersized' ? 'danger' : worst === 'adequate' ? 'caution' : 'safe'} dot={false}>
                                      {worst === 'undersized' ? 'Review required' : worst === 'adequate' ? 'Adequate' : 'Optimal'}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {motorKeys.some((k) => results.motors[k].star_delta_required) && (
                        <div className="mb-5 flex items-start gap-2 bg-caution-dim/50 border border-amber/30 rounded-md px-3 py-2">
                          <AlertTriangle size={14} className="text-amber shrink-0 mt-0.5" />
                          <p className="text-amber text-sm leading-relaxed">
                            One or more motors require Star-Delta starting (above the HP threshold for Direct-On-Line) — see the Star-Delta page to size the starter and timer.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button variant="outline" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/cable-busbar')}>
                          Continue to Cable & Busbar Sizing
                        </Button>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function summarizeStatus(results, motorKeys) {
  const order = { undersized: 3, adequate: 2, oversized: 1, optimal: 0 }
  let worst = 'optimal'
  const problems = []
  for (const key of motorKeys) {
    const m = results.motors[key]
    for (const comp of ['contactor', 'mpcb', 'cable']) {
      const s = m.status[comp].sizing_status
      if (order[s] > order[worst]) worst = s
      if (s === 'undersized') problems.push(`${MOTOR_META[key].label} ${comp}`)
    }
  }
  return { worst, problems }
}

const STATUS_CONFIG = {
  undersized: { tone: 'danger', icon: AlertTriangle, title: 'Review required' },
  adequate: { tone: 'caution', icon: AlertTriangle, title: 'Adequately sized, tight margins' },
  oversized: { tone: 'caution', icon: TrendingUp, title: 'Some components oversized' },
  optimal: { tone: 'safe', icon: CheckCircle2, title: 'Optimally sized' },
}

function StatusBanner({ summary }) {
  const c = STATUS_CONFIG[summary.worst]
  const Icon = c.icon
  const colorClass = c.tone === 'danger' ? 'text-danger' : c.tone === 'caution' ? 'text-amber' : 'text-safe'
  const bgClass = c.tone === 'danger' ? 'bg-danger-dim/40 border-danger/40' : c.tone === 'caution' ? 'bg-caution-dim/40 border-amber/40' : 'bg-safe-dim/30 border-safe/40'
  const desc = summary.worst === 'undersized'
    ? `${summary.problems.length} component${summary.problems.length > 1 ? 's are' : ' is'} below the required safety margin: ${summary.problems.join(', ')}.`
    : summary.worst === 'adequate'
    ? 'Every component clears its requirement, but on the tighter side — limited room to grow.'
    : summary.worst === 'oversized'
    ? 'Selections clear requirements with a wide margin — safe, but worth a cost/space check.'
    : 'Every motor, contactor, MPCB and cable falls within the recommended design margin band.'

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${bgClass}`}>
      <Icon size={18} className={`shrink-0 mt-0.5 ${colorClass}`} />
      <div>
        <div className={`font-semibold text-sm mb-0.5 ${colorClass}`}>{c.title}</div>
        <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-steel rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="text-text font-semibold mb-1">{label} Motor</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-text-muted">{p.name}:</span>
          <span className="font-mono text-text">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function CalcProgress({ stage }) {
  return (
    <Card padding="lg">
      <div className="max-w-sm mx-auto py-4 space-y-3.5">
        {CALC_STAGES.map((s, i) => {
          const Icon = s.icon
          const done = stage > i
          const active = stage === i
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0.2, x: -6 }}
              animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3"
            >
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-200
                ${done ? 'bg-safe/15 border-safe text-safe' : active ? 'bg-amber/15 border-amber text-amber' : 'border-steel text-text-dim'}`}>
                {done ? <Check size={13} /> : <Icon size={13} />}
              </div>
              <span className={`text-sm ${done || active ? 'text-text' : 'text-text-dim'}`}>{s.label}</span>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}

function WaitingPanel() {
  return (
    <Card padding="lg">
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-inset border border-steel flex items-center justify-center mx-auto mb-4">
          <Calculator size={22} className="text-text-dim" strokeWidth={1.75} />
        </div>
        <p className="text-text-muted font-medium mb-1">Results appear here</p>
        <p className="text-text-dim text-sm max-w-sm mx-auto mb-6">
          Fill in the crane parameters on the left and calculate to see motor sizing, protection selection and cable sizing — all in one view.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
        {[
          { icon: Cog, label: 'Motor sizing', desc: 'HP, kW, FLC per motion' },
          { icon: Zap, label: 'Protection', desc: 'Contactor, MPCB, overload' },
          { icon: Cable, label: 'Cable sizing', desc: 'Feeder cross-section' },
        ].map((f) => (
          <div key={f.label} className="border border-dashed border-steel rounded-lg px-3 py-4 text-center">
            <f.icon size={16} className="text-text-dim mx-auto mb-2" />
            <div className="text-text-muted text-xs font-semibold mb-0.5">{f.label}</div>
            <div className="text-text-dim text-[0.7rem]">{f.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
