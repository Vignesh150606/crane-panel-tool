import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, ArrowUpDown, MoveHorizontal, MoveVertical, ArrowRight, ArrowLeft, Zap, Check,
  ClipboardList, Cog, Sigma, Flag, BookOpen,
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
import EmptyState from '../components/ui/EmptyState'
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
  hoist: { label: 'Hoist Motor', icon: ArrowUpDown },
  lt: { label: 'Long Travel Motor', icon: MoveHorizontal },
  ct: { label: 'Cross Travel Motor', icon: MoveVertical },
}

// Five steps, not the six a first pass at this suggested — "Calculation
// Breakdown" and "Engineering Explanation" collapsed into one step
// deliberately, because they're not two different sets of content here:
// they're the Intermediate and Expert tiers of the exact same
// FormulaExplainer blocks. Splitting them into separate steps would mean
// either duplicating every block or showing the same block twice.
const STEPS = [
  { n: 1, key: 'input', label: 'Input Parameters', icon: ClipboardList },
  { n: 2, key: 'motor', label: 'Motor Selection', icon: Cog },
  { n: 3, key: 'components', label: 'Electrical Components', icon: Zap },
  { n: 4, key: 'why', label: 'Understand Why', icon: Sigma },
  { n: 5, key: 'recommend', label: 'Recommendation', icon: Flag },
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

  const [step, setStep] = useState(storedMotors ? 2 : 1)
  const [activeMotorKey, setActiveMotorKey] = useState(null)

  const unlocked = results ? 5 : 1
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
              // backend still requires speeds for shape consistency; use safe placeholders
              load_tons: inputs.load || 0.1,
            }
          : {}),
      }
      const data = await calcMotor(payload)
      setResults(data)
      setMotors(inputs, data)
      setActiveMotorKey(Object.keys(data.motors)[0])
      toast.success('Motor ratings calculated')
      setStep(2)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const goToStep = (n) => {
    if (n <= unlocked) setStep(n)
  }

  return (
    <div>
      <PageHeader
        icon={Calculator}
        title="Load Calculator"
        description="A guided walk from crane parameters to motor sizing, protection selection and the engineering reasoning behind every value."
        actions={<Button as={Link} to="/handbook#motor-hp" variant="outline" size="sm" icon={BookOpen}>Learn the theory</Button>}
      />

      {prefilled && step === 1 && (
        <PrefillBanner
          message="Inputs restored from your last calculation in this project."
          onDismiss={() => { setInputs(DEFAULTS); setPrefilled(false) }}
        />
      )}

      <CalculatorSteps current={step} unlocked={unlocked} onSelect={goToStep} />

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {step === 1 && (
            <div className="max-w-xl mx-auto">
              <Card padding="lg">
                <h2 className="font-display text-amber font-semibold mb-1">Step 1 — Input Parameters</h2>
                <p className="text-text-dim text-sm mb-5">
                  Enter the crane's rated load and motion speeds, or switch to custom HP if you already know the motor sizes.
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
                    <NumberField label="Hoist Speed" value={inputs.hoistSpeed} onChange={(v) => update('hoistSpeed', v)} unit="m/min" min={1} max={30} error={errors.hoistSpeed} />
                    <NumberField label="Long Travel Speed" value={inputs.ltSpeed} onChange={(v) => update('ltSpeed', v)} unit="m/min" min={5} max={80} error={errors.ltSpeed} />
                    <NumberField label="Cross Travel Speed" value={inputs.ctSpeed} onChange={(v) => update('ctSpeed', v)} unit="m/min" min={5} max={40} error={errors.ctSpeed} />
                  </>
                ) : (
                  <>
                    <NumberField label="Hoist Motor HP" value={inputs.hoistHP} onChange={(v) => update('hoistHP', v)} unit="HP" error={errors.hoistHP} />
                    <NumberField label="LT Motor HP" value={inputs.ltHP} onChange={(v) => update('ltHP', v)} unit="HP" error={errors.ltHP} />
                    <NumberField label="CT Motor HP" value={inputs.ctHP} onChange={(v) => update('ctHP', v)} unit="HP" error={errors.ctHP} />
                  </>
                )}

                <SelectField
                  label="Motor Efficiency Class"
                  value={inputs.ieClass}
                  onChange={(v) => update('ieClass', v)}
                  options={IE_CLASS_OPTIONS}
                  helper="Efficiency is looked up per motor from IEC 60034-30-1, not one flat number — smaller motors are genuinely less efficient than larger ones at the same class."
                />

                <Button className="w-full mt-2" size="lg" icon={Zap} onClick={calculate} disabled={loading}>
                  {loading ? 'Calculating…' : results ? 'Recalculate & Continue' : 'Calculate & Continue'}
                </Button>

                {apiError && <div className="mt-3"><ErrorBanner message={apiError} onRetry={calculate} retrying={loading} /></div>}
              </Card>
            </div>
          )}

          {step === 2 && results && (
            <div>
              <StepHeading n={2} title="Motor Selection" desc="Mechanical requirement converted into a motor rating for each motion." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
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
              <StepNav onBack={() => goToStep(1)} onNext={() => goToStep(3)} nextLabel="Electrical Components" />
            </div>
          )}

          {step === 3 && results && (
            <div>
              <StepHeading n={3} title="Electrical Component Selection" desc="Contactor, MPCB and cable sizing, each checked against its own margin band." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
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
              <StepNav onBack={() => goToStep(2)} onNext={() => goToStep(4)} nextLabel="Understand Why" />
            </div>
          )}

          {step === 4 && results && (
            <div>
              <StepHeading n={4} title="Understand Why" desc="Every value above, worked out — pick a tier above each block for as much or as little depth as you want." />

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

              <StepNav onBack={() => goToStep(3)} onNext={() => goToStep(5)} nextLabel="Recommendation" className="mt-5" />
            </div>
          )}

          {step === 5 && results && (
            <div>
              <StepHeading n={5} title="Industrial Recommendation" desc="Summary of every motor's sizing status, ready to carry forward into the rest of the panel design." />

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
                <div className="mb-5 px-4 py-3 bg-caution-dim/40 border border-amber/30 rounded-lg text-amber text-sm">
                  One or more motors require Star-Delta starting (above the HP threshold for Direct-On-Line) — see the Star-Delta page to size the starter and timer.
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button variant="secondary" icon={ArrowLeft} onClick={() => goToStep(1)}>
                  Edit Inputs
                </Button>
                <Button variant="outline" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/cable-busbar')}>
                  Continue to Cable & Busbar Sizing
                </Button>
              </div>
            </div>
          )}

          {step !== 1 && !results && (
            <EmptyState icon={Calculator} title="No results yet" description="Enter parameters in Step 1 and calculate to unlock the rest of the workflow." />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StepHeading({ n, title, desc }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-amber font-semibold">Step {n} — {title}</h2>
      <p className="text-text-dim text-sm mt-1">{desc}</p>
    </div>
  )
}

function StepNav({ onBack, onNext, nextLabel, className = '' }) {
  return (
    <div className={`flex justify-between gap-3 ${className}`}>
      <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
      <Button icon={ArrowRight} iconPosition="right" onClick={onNext}>{nextLabel}</Button>
    </div>
  )
}

function CalculatorSteps({ current, unlocked, onSelect }) {
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
      {STEPS.map((s, i) => {
        const isUnlocked = s.n <= unlocked
        const isDone = s.n < current && isUnlocked
        const isCurrent = s.n === current
        const Icon = s.icon
        return (
          <div key={s.key} className="flex items-center shrink-0">
            <button
              onClick={() => onSelect(s.n)}
              disabled={!isUnlocked}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                ${isCurrent
                  ? 'bg-amber text-ink'
                  : isUnlocked
                    ? 'bg-inset text-text-muted hover:text-text border border-steel cursor-pointer'
                    : 'bg-inset text-text-dim/50 border border-steel/50 cursor-not-allowed'}`}
            >
              {isDone ? <Check size={12} /> : <Icon size={12} />}
              {s.n}. {s.label}
            </button>
            {i < STEPS.length - 1 && <div className={`w-4 h-px shrink-0 ${s.n < unlocked ? 'bg-amber' : 'bg-steel'}`} />}
          </div>
        )
      })}
    </div>
  )
}
