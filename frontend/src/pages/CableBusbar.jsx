import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cable, Zap, ArrowRight } from 'lucide-react'

import PageHeader, { PrefillBanner } from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import NumberField from '../components/ui/NumberField'
import Button from '../components/ui/Button'
import StatPlate from '../components/ui/StatPlate'
import EngineeringStatus from '../components/ui/EngineeringStatus'
import FormulaExplainer from '../components/ui/FormulaExplainer'
import ErrorBanner from '../components/ui/ErrorBanner'
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../hooks/useToast'
import { calcCableBusbar } from '../api/calculations'
import { validateFields, hasErrors, BOUNDS } from '../lib/validate'
import { useProjectStore, pickAvailableFLC } from '../store/projectStore'

export default function CableBusbar() {
  const navigate = useNavigate()
  const toast = useToast()
  const storeState = useProjectStore((s) => s)
  const storedCalc = useProjectStore((s) => s.cableBusbar)
  const setCableBusbar = useProjectStore((s) => s.setCableBusbar)

  const suggestedFLC = pickAvailableFLC(storeState)
  const [inputs, setInputs] = useState(() => storedCalc?.inputs || {
    flc: suggestedFLC || 20, length: 20, travelLength: 20,
  })
  const [prefilled, setPrefilled] = useState(!!suggestedFLC && !storedCalc)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [result, setResult] = useState(storedCalc?.result || null)

  const update = (key, val) => setInputs((p) => ({ ...p, [key]: val }))

  const calculate = async () => {
    const fieldErrors = validateFields({
      flc: { value: inputs.flc, label: 'Full load current', ...BOUNDS.current },
      length: { value: inputs.length, label: 'Cable run length', ...BOUNDS.length },
      travelLength: { value: inputs.travelLength, label: 'Crane travel span', ...BOUNDS.length },
    })
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return

    setLoading(true)
    setApiError(null)
    try {
      const data = await calcCableBusbar({ flc: inputs.flc, length: inputs.length, travel_length: inputs.travelLength })
      setResult(data)
      setCableBusbar(inputs, data)
      toast.success('Cable & busbar sizing calculated')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={Cable}
        title="Cable & Busbar Designer"
        description="Calculate cable sizing with voltage drop, and get a busbar vs. stretch-wire recommendation for the travel span."
      />

      {prefilled && (
        <PrefillBanner
          message={`Full load current (${suggestedFLC} A) carried over from your Load Calculator results.`}
          onDismiss={() => { setInputs((p) => ({ ...p, flc: 20 })); setPrefilled(false) }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cable Sizing */}
        <Card>
          <h2 className="font-display text-amber font-semibold mb-4">Cable Sizing</h2>
          <NumberField label="Full Load Current" value={inputs.flc} onChange={(v) => update('flc', v)} unit="A" error={errors.flc} />
          <NumberField label="Cable Run Length" value={inputs.length} onChange={(v) => update('length', v)} unit="m" error={errors.length} />
          <Button icon={Zap} onClick={calculate} disabled={loading} className="w-full mt-1">
            {loading ? 'Calculating…' : 'Calculate'}
          </Button>
          {apiError && <div className="mt-3"><ErrorBanner message={apiError} onRetry={calculate} retrying={loading} /></div>}

          {loading ? (
            <div className="mt-4"><Skeleton rows={3} className="h-6" /></div>
          ) : result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <StatPlate label="Recommended Size" value={result.cable_size} unit="mm²" tone={result.status.cable.sizing_status === 'undersized' ? 'danger' : 'safe'} />
                <StatPlate label="Capacity" value={result.cable_capacity} unit="A" tone="info" />
                <StatPlate label="Voltage Drop" value={result.voltage_drop_v} unit="V" tone="amber" />
                <StatPlate label="Drop %" value={result.voltage_drop_pct} unit="%" tone={result.voltage_drop_exceeds_limit ? 'danger' : 'safe'} />
              </div>

              {result.voltage_drop_exceeds_limit && (
                <div className="mb-3 px-3 py-2 bg-danger-dim border border-danger/40 rounded-md text-danger text-xs">
                  Voltage drop exceeds the {result.voltage_drop_limit_pct}% limit. Consider a larger cable size or a shorter run.
                </div>
              )}

              <EngineeringStatus label="Cable sizing margin" status={result.status.cable} />

              <div className="mt-3 bg-inset rounded-lg p-4 text-center border border-steel">
                <div className="text-text-dim text-xs mb-2">Cable Cross Section (to relative scale)</div>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={Math.min(45, 10 + result.cable_size)} fill="color-mix(in srgb, var(--color-amber) 15%, transparent)" stroke="var(--color-amber)" strokeWidth="2" />
                  <text x="50" y="55" textAnchor="middle" fill="var(--color-amber)" fontSize="14" fontWeight="bold">{result.cable_size}</text>
                  <text x="50" y="70" textAnchor="middle" fill="var(--color-text-dim)" fontSize="9">mm²</text>
                </svg>
              </div>

              <div className="mt-3 space-y-2">
                <FormulaExplainer title="Why this cable size?" explanation={result.explanations.cable} />
                <FormulaExplainer title="Why this voltage drop?" explanation={result.explanations.voltage_drop} />
              </div>
            </motion.div>
          )}
        </Card>

        {/* Bus Bar vs Stretch Wire */}
        <Card>
          <h2 className="font-display text-amber font-semibold mb-4">Bus Bar vs. Stretch Wire</h2>
          <NumberField label="Crane Travel Span" value={inputs.travelLength} onChange={(v) => update('travelLength', v)} unit="m" error={errors.travelLength} />

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={`p-4 rounded-lg border-2 mb-4 ${result.recommendation === 'busbar' ? 'border-safe bg-safe-dim/30' : 'border-info bg-info-dim/30'}`}>
                <div className={`font-bold text-lg mb-1.5 ${result.recommendation === 'busbar' ? 'text-safe' : 'text-info'}`}>
                  Recommended: {result.recommendation === 'busbar' ? 'Bus Bar System' : 'Stretch Wire'}
                </div>
                <p className="text-text-muted text-sm leading-relaxed">
                  {result.recommendation === 'busbar'
                    ? `For a ${inputs.travelLength}m span, stretch wire (${result.stretch_wire_length}m) becomes prone to sag, mechanical stress and frequent maintenance. Busbar provides maintenance-free, continuous power via spring-loaded collector shoes.`
                    : `For a ${inputs.travelLength}m span, stretch wire (${result.stretch_wire_length}m total) is cost-effective and simple. Below ${result.busbar_span_threshold_m}m, busbar installation cost isn't justified.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-inset rounded-lg p-3 border border-steel">
                  <div className="text-info font-semibold text-sm mb-2">Stretch Wire</div>
                  <ul className="text-text-dim text-xs leading-relaxed pl-4 list-disc space-y-0.5">
                    <li>Length = 1.5 x span = {result.stretch_wire_length}m</li>
                    <li>Lower upfront cost</li>
                    <li>Sag affects safety</li>
                    <li>Mechanical wear over time</li>
                  </ul>
                </div>
                <div className="bg-inset rounded-lg p-3 border border-steel">
                  <div className="text-safe font-semibold text-sm mb-2">Bus Bar</div>
                  <ul className="text-text-dim text-xs leading-relaxed pl-4 list-disc space-y-0.5">
                    <li>Rigid Cu/Al conductors</li>
                    <li>Spring-loaded collector shoes</li>
                    <li>No sag, no wear</li>
                    <li>Higher install cost, low maintenance</li>
                  </ul>
                </div>
              </div>

              <svg width="100%" height="60" viewBox="0 0 300 60" className="mb-3">
                {result.recommendation === 'busbar' ? (
                  <>
                    <motion.rect initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5 }} x="20" y="25" width="260" height="6" fill="var(--color-safe)" style={{ transformOrigin: '20px 0px' }} />
                    <rect x="140" y="15" width="8" height="15" fill="var(--color-text-muted)" />
                    <rect x="135" y="30" width="18" height="10" fill="var(--color-text-dim)" rx="2" />
                    <text x="150" y="55" textAnchor="middle" fill="var(--color-text-dim)" fontSize="9">Collector shoe on rigid busbar</text>
                  </>
                ) : (
                  <>
                    <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} d="M20 25 Q150 50 280 25" stroke="var(--color-info)" strokeWidth="3" fill="none" />
                    <text x="150" y="55" textAnchor="middle" fill="var(--color-text-dim)" fontSize="9">Stretch wire with characteristic sag</text>
                  </>
                )}
              </svg>

              <FormulaExplainer title="Why busbar vs. stretch wire?" explanation={result.explanations.busbar} />
            </motion.div>
          )}
        </Card>
      </div>

      {result && (
        <div className="flex justify-end mt-6">
          <Button variant="outline" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/control-circuit')}>
            Continue to Circuit Design
          </Button>
        </div>
      )}
    </div>
  )
}
