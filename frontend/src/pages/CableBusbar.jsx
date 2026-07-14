import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts'
import { Cable, Zap, ArrowRight, BookOpen, ChevronDown, Factory, AlertTriangle } from 'lucide-react'

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
import { cableComparisonWindow } from '../data/cableReference'

// Same 1.25x continuous-duty derating factor shown in the "Formula" tier of
// the cable FormulaExplainer below (backend/app/data/standards.py:
// CABLE_DERATE_FACTOR) — used here only to mark the required-capacity line
// on the comparison chart, not to size anything.
const CABLE_DERATE_FACTOR = 1.25

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

  const requiredCapacity = inputs.flc * CABLE_DERATE_FACTOR
  const comparisonData = result ? cableComparisonWindow(result.cable_size, requiredCapacity) : []

  return (
    <div>
      <PageHeader
        icon={Cable}
        title="Cable & Busbar Designer"
        description="Cable sizing with voltage drop, and a busbar vs. stretch-wire recommendation for the travel span — with the reasoning behind each choice."
        actions={<Button as={Link} to="/handbook#cable-sizing" variant="outline" size="sm" icon={BookOpen}>Learn the theory</Button>}
      />

      {prefilled && (
        <PrefillBanner
          message={`Full load current (${suggestedFLC} A) carried over from your Load Calculator results.`}
          onDismiss={() => { setInputs((p) => ({ ...p, flc: 20 })); setPrefilled(false) }}
        />
      )}

      {/* ── Single shared input card — one calculation feeds both panels below ── */}
      <Card className="mb-6">
        <h2 className="font-display text-amber font-semibold mb-3 text-sm">Circuit Parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <NumberField label="Full Load Current" value={inputs.flc} onChange={(v) => update('flc', v)} unit="A" error={errors.flc} />
          <NumberField label="Cable Run Length" value={inputs.length} onChange={(v) => update('length', v)} unit="m" error={errors.length} />
          <NumberField label="Crane Travel Span" value={inputs.travelLength} onChange={(v) => update('travelLength', v)} unit="m" error={errors.travelLength} />
        </div>
        <Button icon={Zap} onClick={calculate} disabled={loading} className="w-full sm:w-auto mt-1">
          {loading ? 'Calculating…' : result ? 'Recalculate' : 'Calculate'}
        </Button>
        {apiError && <div className="mt-3"><ErrorBanner message={apiError} onRetry={calculate} retrying={loading} /></div>}
      </Card>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><Skeleton rows={5} className="h-6" /></Card>
          <Card><Skeleton rows={5} className="h-6" /></Card>
        </div>
      )}

      {!loading && !result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WaitingPanel title="Cable Sizing" desc="Recommended cross-section, capacity and voltage drop against the IS 732 limit." />
          <WaitingPanel title="Bus Bar vs. Stretch Wire" desc="A span-based recommendation with the decision logic laid out step by step." />
        </div>
      )}

      {!loading && result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Cable Sizing ── */}
          <Card>
            <h2 className="font-display text-amber font-semibold mb-4">Cable Sizing</h2>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatPlate label="Recommended Size" value={result.cable_size} unit="mm²" tone={result.status.cable.sizing_status === 'undersized' ? 'danger' : 'safe'} />
                <StatPlate label="Capacity" value={result.cable_capacity} unit="A" tone="info" />
              </div>

              <div className="mb-4">
                <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1.5">Voltage Drop vs. IS 732 Limit</div>
                <VoltageDropGauge dropPct={result.voltage_drop_pct} limitPct={result.voltage_drop_limit_pct} dropV={result.voltage_drop_v} />
              </div>

              {result.voltage_drop_exceeds_limit && (
                <div className="mb-4 flex items-start gap-2 px-3 py-2 bg-danger-dim border border-danger/40 rounded-md">
                  <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
                  <p className="text-danger text-xs leading-relaxed">
                    Voltage drop exceeds the {result.voltage_drop_limit_pct}% limit. Consider a larger cable size or a shorter run.
                  </p>
                </div>
              )}

              <EngineeringStatus label="Cable sizing margin" status={result.status.cable} />

              {/* Visual cable comparison — why this size, not a smaller one */}
              <div className="mt-4">
                <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1.5">Standard Sizes Compared (mm²)</div>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={comparisonData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-steel)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--color-text-dim)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--color-steel)' }} />
                    <YAxis stroke="var(--color-text-dim)" fontSize={10} tickLine={false} axisLine={false} width={34} />
                    <Tooltip content={<CableTooltip />} cursor={{ fill: 'var(--color-steel)', opacity: 0.2 }} />
                    <ReferenceLine
                      y={requiredCapacity}
                      stroke="var(--color-danger)"
                      strokeDasharray="4 3"
                      label={{ value: 'Required', position: 'insideTopRight', fill: 'var(--color-danger)', fontSize: 10 }}
                    />
                    <Bar dataKey="capacity" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {comparisonData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.selected ? 'var(--color-amber)' : d.adequate ? 'var(--color-steel-light)' : 'var(--color-danger-dim)'}
                          stroke={d.selected ? 'var(--color-amber)' : 'transparent'}
                          strokeWidth={d.selected ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-3 mt-1 text-[0.65rem] text-text-dim">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber inline-block" /> Selected</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-steel-light inline-block" /> Also adequate</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-danger-dim inline-block" /> Below requirement</span>
                </div>
              </div>

              <div className="mt-4 bg-inset rounded-lg p-4 text-center border border-steel">
                <div className="text-text-dim text-xs mb-2">Cable Cross Section (to relative scale)</div>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={Math.min(45, 10 + result.cable_size)} fill="color-mix(in srgb, var(--color-amber) 15%, transparent)" stroke="var(--color-amber)" strokeWidth="2" />
                  <text x="50" y="55" textAnchor="middle" fill="var(--color-amber)" fontSize="14" fontWeight="bold">{result.cable_size}</text>
                  <text x="50" y="70" textAnchor="middle" fill="var(--color-text-dim)" fontSize="9">mm²</text>
                </svg>
              </div>

              <div className="mt-4 space-y-2">
                <FormulaExplainer title="Why this cable size?" explanation={result.explanations.cable} />
                <FormulaExplainer title="Why this voltage drop?" explanation={result.explanations.voltage_drop} />
              </div>
            </motion.div>
          </Card>

          {/* ── Bus Bar vs Stretch Wire ── */}
          <Card>
            <h2 className="font-display text-amber font-semibold mb-4">Bus Bar vs. Stretch Wire</h2>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Decision flow — the actual logic, laid out step by step */}
              <div className="mb-4">
                <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-2">Selection Flow</div>
                <BusbarDecisionFlow
                  travelLength={inputs.travelLength}
                  threshold={result.busbar_span_threshold_m}
                  recommendation={result.recommendation}
                />
              </div>

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

              <svg width="100%" height="60" viewBox="0 0 300 60" className="mb-4">
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

              <Card variant="inset" padding="sm" className="mb-4">
                <div className="flex items-center gap-1.5 text-amber font-semibold text-xs mb-2">
                  <Factory size={13} /> Industrial Notes
                </div>
                <ul className="text-text-dim text-xs leading-relaxed pl-4 list-disc space-y-1">
                  <li>Busbar collector shoes ride the rail under spring tension — continuous contact, no sag, per IEC 61439-6.</li>
                  <li>Stretch wire needs periodic inspection for insulation wear near the festoon trolley flex points.</li>
                  <li>Below {result.busbar_span_threshold_m}m, busbar's install cost rarely pays back against stretch wire's simplicity.</li>
                </ul>
              </Card>

              <FormulaExplainer title="Why busbar vs. stretch wire?" explanation={result.explanations.busbar} />
            </motion.div>
          </Card>
        </div>
      )}

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

function VoltageDropGauge({ dropPct, limitPct, dropV }) {
  const scaleMax = Math.max(limitPct * 1.4, dropPct * 1.15, limitPct + 1)
  const fillPct = Math.min(100, (dropPct / scaleMax) * 100)
  const limitPos = Math.min(100, (limitPct / scaleMax) * 100)
  const exceeds = dropPct > limitPct
  return (
    <div>
      <div className="relative h-3 bg-inset border border-steel rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${exceeds ? 'bg-danger' : 'bg-safe'}`}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <div className="absolute top-0 bottom-0 w-0.5 bg-amber" style={{ left: `${limitPos}%` }} title={`${limitPct}% limit`} />
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className={`text-xs font-mono font-semibold ${exceeds ? 'text-danger' : 'text-safe'}`}>{dropV} V ({dropPct}% drop)</span>
        <span className="text-[0.7rem] text-amber font-mono">{limitPct}% limit</span>
      </div>
    </div>
  )
}

function CableTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-steel rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="text-text font-semibold mb-1">{label} mm²</div>
      <div className="text-text-muted">Capacity: <span className="font-mono text-text">{d.capacity} A</span></div>
      <div className={`mt-1 font-medium ${d.adequate ? 'text-safe' : 'text-danger'}`}>{d.adequate ? 'Clears requirement' : 'Below requirement'}</div>
      {d.selected && <div className="text-amber mt-1 font-semibold">Selected size</div>}
    </div>
  )
}

function BusbarDecisionFlow({ travelLength, threshold, recommendation }) {
  const isBusbar = recommendation === 'busbar'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="bg-inset border border-steel rounded-lg px-4 py-2 text-center w-full">
        <div className="text-[0.65rem] uppercase tracking-wide text-text-dim">Travel Span</div>
        <div className="font-mono text-text font-semibold text-sm">{travelLength} m</div>
      </div>
      <ChevronDown size={15} className="text-text-dim" />
      <div className="bg-inset border border-steel rounded-lg px-4 py-2 text-center w-full text-xs text-text-muted">
        Compare against {threshold}m threshold
      </div>
      <ChevronDown size={15} className="text-text-dim" />
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className={`rounded-lg border-2 px-2 py-3 text-center transition-colors ${!isBusbar ? 'border-info bg-info-dim/30' : 'border-steel/40 opacity-40'}`}>
          <div className={`text-sm font-semibold ${!isBusbar ? 'text-info' : 'text-text-dim'}`}>Stretch Wire</div>
          <div className="text-[0.68rem] text-text-dim mt-0.5">below {threshold}m</div>
        </div>
        <div className={`rounded-lg border-2 px-2 py-3 text-center transition-colors ${isBusbar ? 'border-safe bg-safe-dim/30' : 'border-steel/40 opacity-40'}`}>
          <div className={`text-sm font-semibold ${isBusbar ? 'text-safe' : 'text-text-dim'}`}>Bus Bar</div>
          <div className="text-[0.68rem] text-text-dim mt-0.5">{threshold}m and above</div>
        </div>
      </div>
    </div>
  )
}

function WaitingPanel({ title, desc }) {
  return (
    <Card padding="lg">
      <div className="text-center py-8">
        <div className="w-10 h-10 rounded-full bg-inset border border-steel flex items-center justify-center mx-auto mb-3">
          <Cable size={18} className="text-text-dim" strokeWidth={1.75} />
        </div>
        <p className="text-text-muted font-medium text-sm mb-1">{title}</p>
        <p className="text-text-dim text-xs max-w-xs mx-auto">{desc}</p>
      </div>
    </Card>
  )
}
