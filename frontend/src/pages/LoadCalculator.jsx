import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calculator, ArrowUpDown, MoveHorizontal, MoveVertical, ArrowRight, Zap } from 'lucide-react'

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
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../hooks/useToast'
import { useCountUp } from '../hooks/useCountUp'
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
      toast.success('Motor ratings calculated')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={Calculator}
        title="Load Calculator"
        description="Enter crane load and speeds to calculate motor HP, contactor ratings, MPCB sizing, and cable size — every result computed server-side against IS/IEC standards."
      />

      {prefilled && (
        <PrefillBanner
          message="Inputs restored from your last calculation in this project."
          onDismiss={() => { setInputs(DEFAULTS); setPrefilled(false) }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Inputs */}
        <Card>
          <h2 className="font-display text-amber font-semibold mb-4">Input Parameters</h2>

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
            {loading ? 'Calculating…' : 'Calculate Ratings'}
          </Button>

          {apiError && <div className="mt-3"><ErrorBanner message={apiError} onRetry={calculate} retrying={loading} /></div>}
        </Card>

        {/* Results */}
        <div>
          {loading ? (
            <div className="space-y-4">
              <Card><Skeleton rows={4} className="h-5" /></Card>
              <Card><Skeleton rows={4} className="h-5" /></Card>
            </div>
          ) : results ? (
            <>
              <div className="flex flex-col gap-4 mb-4">
                {Object.entries(results.motors).map(([key, data]) => (
                  <MotorResultCard key={key} motorKey={key} data={data} />
                ))}
              </div>
              <AssumedVsComputed assumptions={results.assumptions} />
              <div className="flex justify-end mt-4">
                <Button variant="outline" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/cable-busbar')}>
                  Continue to Cable & Busbar Sizing
                </Button>
              </div>
            </>
          ) : (
            <EmptyState icon={Calculator} title="No results yet" description="Enter parameters on the left and click Calculate Ratings to see motor sizing, protection and formula breakdowns." />
          )}
        </div>
      </div>
    </div>
  )
}

function MotorResultCard({ motorKey, data }) {
  const meta = MOTOR_META[motorKey]
  const Icon = meta.icon
  const hp = useCountUp(data.hp)
  const flc = useCountUp(data.flc)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card variant="computed">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-display font-semibold text-text flex items-center gap-2">
            <Icon size={17} className="text-copper" />
            {meta.label}
          </h3>
          {data.star_delta_required && <Badge tone="caution">Star-Delta Required</Badge>}
          {data.hp_was_override && <Badge tone="info" dot={false}>Custom HP</Badge>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <StatPlate label="Motor HP" value={hp.toFixed(2)} unit="HP" />
          <StatPlate label="Motor kW" value={data.kw} unit="kW" />
          <StatPlate label="Efficiency" value={data.efficiency_pct} unit="%" />
          <StatPlate label="Full Load Current" value={flc.toFixed(2)} unit="A" tone="amber" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <StatPlate label="Contactor" value={data.contactor_rating} unit="A" tone={data.status.contactor.sizing_status === 'undersized' ? 'danger' : 'safe'} />
          <StatPlate label="MPCB" value={data.mpcb_rating} unit="A" tone={data.status.mpcb.sizing_status === 'undersized' ? 'danger' : 'safe'} />
          <StatPlate label="Cable Size" value={data.cable_size} unit="mm²" tone={data.status.cable.sizing_status === 'undersized' ? 'danger' : 'safe'} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <EngineeringStatus label="Contactor margin" status={data.status.contactor} />
          <EngineeringStatus label="MPCB margin" status={data.status.mpcb} />
          <EngineeringStatus label="Cable margin" status={data.status.cable} />
        </div>

        <div className="space-y-2">
          {data.explanations.motor_hp && <FormulaExplainer title="Why this HP?" explanation={data.explanations.motor_hp} />}
          <FormulaExplainer title="Why this FLC?" explanation={data.explanations.flc} />
          <FormulaExplainer title="Why this contactor rating?" explanation={data.explanations.contactor} />
          <FormulaExplainer title="Why this MPCB rating?" explanation={data.explanations.mpcb} />
          <FormulaExplainer title="Why this overload setting?" explanation={data.explanations.overload} />
          <FormulaExplainer title="Why this cable size?" explanation={data.explanations.cable} />
        </div>
      </Card>
    </motion.div>
  )
}
