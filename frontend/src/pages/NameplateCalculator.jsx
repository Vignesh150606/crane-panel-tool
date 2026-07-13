import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Tag, Zap, AlertTriangle, BookOpen } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import NumberField from '../components/ui/NumberField'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import StatPlate from '../components/ui/StatPlate'
import EngineeringStatus from '../components/ui/EngineeringStatus'
import FormulaExplainer from '../components/ui/FormulaExplainer'
import ErrorBanner from '../components/ui/ErrorBanner'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../hooks/useToast'
import { calcNameplate } from '../api/calculations'
import { validateFields, hasErrors, BOUNDS } from '../lib/validate'
import { useProjectStore } from '../store/projectStore'

const DEFAULTS = { voltage: 415, current: 10, hp: 7.5, kw: 5.5, rpm: 1440, pf: 0.85, useHP: true }

export default function NameplateCalculator() {
  const toast = useToast()
  const storedNameplate = useProjectStore((s) => s.nameplate)
  const setNameplate = useProjectStore((s) => s.setNameplate)

  const [inputs, setInputs] = useState(() => storedNameplate?.inputs || DEFAULTS)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [result, setResult] = useState(storedNameplate?.result || null)

  const update = (k, v) => setInputs((p) => ({ ...p, [k]: v }))

  const calculate = async () => {
    const fieldErrors = validateFields({
      voltage: { value: inputs.voltage, label: 'Voltage', ...BOUNDS.voltage },
      current: { value: inputs.current, label: 'Full load current', ...BOUNDS.current },
      [inputs.useHP ? 'hp' : 'kw']: { value: inputs.useHP ? inputs.hp : inputs.kw, label: inputs.useHP ? 'Power (HP)' : 'Power (kW)', ...BOUNDS.hp },
      rpm: { value: inputs.rpm, label: 'Speed', ...BOUNDS.rpm },
      pf: { value: inputs.pf, label: 'Power factor', ...BOUNDS.powerFactor },
    })
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return

    setLoading(true)
    setApiError(null)
    try {
      const data = await calcNameplate({
        voltage: inputs.voltage, current: inputs.current, use_hp: inputs.useHP,
        hp: inputs.useHP ? inputs.hp : undefined, kw: !inputs.useHP ? inputs.kw : undefined,
        rpm: inputs.rpm, power_factor: inputs.pf,
      })
      setResult(data)
      setNameplate(inputs, data)
      toast.success('Component ratings calculated')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={Tag}
        title="Nameplate Calculator"
        description="Enter motor nameplate values to get contactor rating, MPCB setting, overload relay setting, and cable size — sized against IS/IEC crane-duty practice."
        actions={<Button as={Link} to="/handbook#contactor-sizing" variant="outline" size="sm" icon={BookOpen}>Learn the theory</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-amber font-semibold mb-4">Motor Nameplate Data</h2>

          {/* Nameplate visual */}
          <div className="bg-inset border-2 border-steel rounded-lg p-4 mb-5 font-mono">
            <div className="text-amber font-bold text-center mb-2 text-sm tracking-wide">MOTOR NAMEPLATE</div>
            {[
              { label: 'Voltage', value: `${inputs.voltage} V` },
              { label: 'Current', value: `${inputs.current} A` },
              { label: 'Speed', value: `${inputs.rpm} RPM` },
              { label: 'Power Factor', value: inputs.pf },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-text-muted text-xs mb-1">
                <span>{item.label}:</span>
                <span className="text-text">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <Toggle checked={inputs.useHP} onChange={(v) => update('useHP', v)} label="Enter power in HP" description="Uncheck to enter kW instead" />
          </div>

          <NumberField label="Voltage" value={inputs.voltage} onChange={(v) => update('voltage', v)} unit="V" min={110} max={690} error={errors.voltage} />
          <NumberField label="Full Load Current" value={inputs.current} onChange={(v) => update('current', v)} unit="A" min={0.1} max={500} step={0.1} error={errors.current} />
          {inputs.useHP ? (
            <NumberField label="Power (HP)" value={inputs.hp} onChange={(v) => update('hp', v)} unit="HP" min={0.1} max={500} step={0.1} error={errors.hp} />
          ) : (
            <NumberField label="Power (kW)" value={inputs.kw} onChange={(v) => update('kw', v)} unit="kW" min={0.1} max={373} step={0.1} error={errors.kw} />
          )}
          <NumberField label="Speed" value={inputs.rpm} onChange={(v) => update('rpm', v)} unit="RPM" min={500} max={3000} error={errors.rpm} />
          <NumberField label="Power Factor" value={inputs.pf} onChange={(v) => update('pf', v)} min={0.5} max={1.0} step={0.01} error={errors.pf} />

          <Button className="w-full mt-2" icon={Zap} onClick={calculate} disabled={loading}>
            {loading ? 'Calculating…' : 'Calculate Component Ratings'}
          </Button>
          {apiError && <div className="mt-3"><ErrorBanner message={apiError} onRetry={calculate} retrying={loading} /></div>}
        </Card>

        <div>
          {result ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <Card variant="computed">
                <h3 className="font-display text-amber font-semibold mb-3">Component Ratings</h3>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <StatPlate label="Motor Power" value={`${result.hp} HP`} note={`${result.kw} kW`} />
                  <StatPlate label="Full Load Current" value={result.flc} unit="A" />
                  <StatPlate label="Contactor Rating" value={result.contactor_rating} unit="A" tone={result.status.contactor.sizing_status === 'undersized' ? 'danger' : 'safe'} note="2x FLC rule" />
                  <StatPlate label="MPCB Rating" value={result.mpcb_rating} unit="A" tone={result.status.mpcb.sizing_status === 'undersized' ? 'danger' : 'safe'} />
                  <StatPlate label="Overload Setting" value={result.overload_setting} unit="A" tone="amber" />
                  <StatPlate label="Cable Size" value={result.cable_size} unit="mm²" tone={result.status.cable.sizing_status === 'undersized' ? 'danger' : 'info'} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <EngineeringStatus label="Contactor" status={result.status.contactor} />
                  <EngineeringStatus label="MPCB" status={result.status.mpcb} />
                  <EngineeringStatus label="Cable" status={result.status.cable} />
                </div>
              </Card>

              {result.star_delta_required && (
                <Card variant="highlight">
                  <h3 className="font-display text-amber font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} /> Star-Delta Starter Required
                  </h3>
                  <p className="text-text-muted text-sm mb-3">Motor HP exceeds 5 HP — direct-on-line starting would cause high inrush current.</p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-inset rounded-md p-2.5">
                      <div className="text-text-dim text-xs">DOL Inrush Current</div>
                      <div className="text-danger font-bold font-mono">{result.dol_inrush} A</div>
                    </div>
                    <div className="bg-inset rounded-md p-2.5">
                      <div className="text-text-dim text-xs">Star Start Inrush</div>
                      <div className="text-safe font-bold font-mono">{result.star_inrush} A</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-text-muted leading-relaxed mb-3">
                    <div>STAR: U2-V2-W2 shorted → reduced voltage</div>
                    <div>DELTA: U1→W2, V1→U2, W1→V2 → full voltage</div>
                  </div>
                  {result.explanations.star_delta && <FormulaExplainer title="Why star-delta here?" explanation={result.explanations.star_delta} />}
                </Card>
              )}

              <div className="space-y-2">
                <FormulaExplainer title="Why this contactor rating?" explanation={result.explanations.contactor} />
                <FormulaExplainer title="Why this MPCB rating?" explanation={result.explanations.mpcb} />
                <FormulaExplainer title="Why this overload setting?" explanation={result.explanations.overload} />
                <FormulaExplainer title="Why this cable size?" explanation={result.explanations.cable} />
              </div>
            </motion.div>
          ) : (
            <EmptyState icon={Tag} title="No results yet" description="Enter nameplate values on the left and click Calculate." />
          )}
        </div>
      </div>
    </div>
  )
}
