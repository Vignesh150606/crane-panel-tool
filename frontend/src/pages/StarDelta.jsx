import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Triangle, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import NumberField from '../components/ui/NumberField'
import FormulaExplainer from '../components/ui/FormulaExplainer'
import ErrorBanner from '../components/ui/ErrorBanner'
import Skeleton from '../components/ui/Skeleton'
import { calcStarDelta } from '../api/calculations'
import { useProjectStore } from '../store/projectStore'

export default function StarDelta() {
  const storedInputs = useProjectStore((s) => s.starDelta?.inputs)
  const setStarDelta = useProjectStore((s) => s.setStarDelta)

  const [hp, setHp] = useState(storedInputs?.hp ?? 7.5)
  const [timer, setTimer] = useState(storedInputs?.timer ?? 5)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const runCalc = async (hpVal, timerVal) => {
    setLoading(true)
    setError(null)
    try {
      const data = await calcStarDelta({ hp: hpVal, timer_seconds: timerVal })
      setResult(data)
      setStarDelta({ hp: hpVal, timer: timerVal }, data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!(hp > 0)) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runCalc(hp, timer), 350)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hp, timer])

  return (
    <div>
      <PageHeader
        icon={Triangle}
        title="Star-Delta Calculator"
        description="For motors above 5HP. Reduces starting current to 1/3 of DOL by starting in star, switching to delta for run."
        actions={<Button as={Link} to="/handbook#star-delta-starting" variant="outline" size="sm" icon={BookOpen}>Learn the theory</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <NumberField label="Motor Power" value={hp} onChange={setHp} unit="HP" step={0.5} min={0.1} />

          <label className="block text-xs text-text-muted mb-1.5 font-medium">Star-to-Delta Timer</label>
          <input
            type="range" min="3" max="15" value={timer}
            onChange={(e) => setTimer(parseInt(e.target.value))}
            className="w-full accent-amber cursor-pointer"
          />
          <div className="text-amber text-center mt-1 font-mono text-sm">{timer} seconds</div>

          {error && <div className="mt-3"><ErrorBanner message={error} onRetry={() => runCalc(hp, timer)} retrying={loading} /></div>}

          {result && !result.required && (
            <div className="mt-4 flex items-center gap-2 px-3.5 py-2.5 bg-safe-dim border border-safe/40 rounded-lg">
              <CheckCircle2 size={16} className="text-safe shrink-0" />
              <span className="text-safe text-sm">DOL starting sufficient — Star-Delta not required below 5HP</span>
            </div>
          )}

          <div className="mt-6 bg-inset rounded-lg p-4 border border-steel">
            <div className="text-amber font-semibold text-sm mb-3">Motor Terminal Wiring</div>
            <svg width="100%" viewBox="0 0 280 140">
              <text x="60" y="15" fill="var(--color-info)" fontSize="11" fontWeight="bold" textAnchor="middle">STAR (Start)</text>
              {['U1', 'V1', 'W1'].map((t, i) => (
                <g key={t}>
                  <line x1={30 + i * 30} y1="25" x2={30 + i * 30} y2="55" stroke="var(--color-info)" strokeWidth="2" />
                  <text x={30 + i * 30} y="20" fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">{t}</text>
                </g>
              ))}
              {['U2', 'V2', 'W2'].map((t, i) => (
                <line key={t} x1={30 + i * 30} y1="55" x2="60" y2="75" stroke="var(--color-safe)" strokeWidth="2" />
              ))}
              <circle cx="60" cy="75" r="3" fill="var(--color-safe)" />
              <text x="60" y="92" fill="var(--color-safe)" fontSize="9" textAnchor="middle">U2-V2-W2 shorted</text>

              <text x="200" y="15" fill="var(--color-amber)" fontSize="11" fontWeight="bold" textAnchor="middle">DELTA (Run)</text>
              {['U1', 'V1', 'W1'].map((t, i) => (
                <text key={t} x={170 + i * 30} y="20" fill="var(--color-text-muted)" fontSize="9" textAnchor="middle">{t}</text>
              ))}
              <line x1="170" y1="25" x2="230" y2="65" stroke="var(--color-amber)" strokeWidth="2" />
              <line x1="200" y1="25" x2="170" y2="65" stroke="var(--color-amber)" strokeWidth="2" />
              <line x1="230" y1="25" x2="200" y2="65" stroke="var(--color-amber)" strokeWidth="2" />
              <text x="170" y="80" fill="var(--color-amber)" fontSize="8" textAnchor="middle">U1→W2</text>
              <text x="200" y="92" fill="var(--color-amber)" fontSize="8" textAnchor="middle">V1→U2</text>
              <text x="230" y="80" fill="var(--color-amber)" fontSize="8" textAnchor="middle">W1→V2</text>
            </svg>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          {loading && !result && (
            <Card><Skeleton rows={5} className="h-6" /></Card>
          )}
          {result && (
            <>
              <Card variant="computed">
                <h3 className="font-display text-amber font-semibold mb-3">Current & Torque Comparison</h3>
                <ComparisonBar label="Starting Current (DOL)" value={result.dol_inrush} max={result.dol_inrush} tone="danger" unit="A" />
                <ComparisonBar label="Starting Current (Star)" value={result.star_inrush} max={result.dol_inrush} tone="safe" unit="A" />
                <div className="mt-3 bg-inset rounded-lg p-3">
                  <div className="text-text-dim text-xs">Current Reduction</div>
                  <div className="text-safe font-bold text-2xl font-mono">{result.current_reduction_pct}% lower</div>
                </div>
                <div className="mt-3 bg-inset rounded-lg p-3">
                  <div className="text-text-dim text-xs">Starting Torque (Star vs Full)</div>
                  <div className="text-amber font-bold text-2xl font-mono">{result.star_torque_pct}% of DOL torque</div>
                </div>
                <div className="mt-3">
                  <FormulaExplainer title="Why does star-delta reduce current like this?" explanation={result.explanations.star_delta} defaultOpen />
                </div>
              </Card>

              <Card>
                <h3 className="font-display text-amber font-semibold mb-3">Switching Sequence</h3>
                {[
                  { t: '0s', event: 'Main contactor ON. Star contactor ON. Motor starts in STAR.', tone: 'text-info' },
                  { t: `${timer}s`, event: 'Timer expires. Star contactor OFF.', tone: 'text-amber' },
                  { t: `${timer}.2s`, event: 'Delta contactor ON. Motor runs in DELTA at full voltage.', tone: 'text-safe' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 mb-2.5">
                    <div className={`min-w-[42px] font-bold text-sm font-mono ${step.tone}`}>{step.t}</div>
                    <div className="text-text-muted text-sm">{step.event}</div>
                  </div>
                ))}
                <div className="mt-2 flex items-start gap-2 bg-inset rounded-md p-2.5">
                  <AlertTriangle size={14} className="text-amber shrink-0 mt-0.5" />
                  <span className="text-text-dim text-xs leading-relaxed">
                    Star and Delta contactors must be interlocked (NC contacts) — both can never be ON simultaneously, which would short-circuit the motor windings.
                  </span>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ComparisonBar({ label, value, max, tone, unit }) {
  const pct = (value / max) * 100
  const barColor = tone === 'danger' ? 'bg-danger' : 'bg-safe'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-muted">{label}</span>
        <span className={tone === 'danger' ? 'text-danger' : 'text-safe'}>{value.toFixed(1)} {unit}</span>
      </div>
      <div className="h-2.5 bg-inset rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} className={`h-full rounded-full ${barColor}`} />
      </div>
    </div>
  )
}
