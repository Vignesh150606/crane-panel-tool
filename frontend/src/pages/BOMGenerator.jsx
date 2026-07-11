import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, Zap, ArrowRight, Download } from 'lucide-react'

import PageHeader, { PrefillBanner } from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import NumberField from '../components/ui/NumberField'
import Button from '../components/ui/Button'
import EngineeringStatus from '../components/ui/EngineeringStatus'
import FormulaExplainer from '../components/ui/FormulaExplainer'
import ErrorBanner from '../components/ui/ErrorBanner'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../hooks/useToast'
import { generateBOM } from '../api/calculations'
import { validateFields, hasErrors, BOUNDS } from '../lib/validate'
import { useProjectStore } from '../store/projectStore'

export default function BOMGenerator() {
  const navigate = useNavigate()
  const toast = useToast()
  const storedMotors = useProjectStore((s) => s.motors)
  const storedBOM = useProjectStore((s) => s.bom)
  const setBOM = useProjectStore((s) => s.setBOM)

  const suggested = storedMotors ? {
    hoistHP: storedMotors.motors.hoist.hp,
    ltHP: storedMotors.motors.lt.hp,
    ctHP: storedMotors.motors.ct.hp,
  } : null

  const [inputs, setInputs] = useState(() => storedBOM?.inputs || {
    hoistHP: suggested?.hoistHP ?? 10,
    ltHP: suggested?.ltHP ?? 3,
    ctHP: suggested?.ctHP ?? 2,
    travelLength: 20,
  })
  const [prefilled, setPrefilled] = useState(!!suggested && !storedBOM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [result, setResult] = useState(storedBOM?.result || null)

  const update = (key, val) => setInputs((p) => ({ ...p, [key]: val }))

  const calculate = async () => {
    const fieldErrors = validateFields({
      hoistHP: { value: inputs.hoistHP, label: 'Hoist HP', ...BOUNDS.hp },
      ltHP: { value: inputs.ltHP, label: 'LT HP', ...BOUNDS.hp },
      ctHP: { value: inputs.ctHP, label: 'CT HP', ...BOUNDS.hp },
      travelLength: { value: inputs.travelLength, label: 'Travel length', ...BOUNDS.length },
    })
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return

    setLoading(true)
    setApiError(null)
    try {
      const data = await generateBOM({
        hoist_hp: inputs.hoistHP, lt_hp: inputs.ltHP, ct_hp: inputs.ctHP, travel_length: inputs.travelLength,
      })
      setResult(data)
      setBOM(inputs, data)
      toast.success(`BOM generated — ${data.items.length} line items`)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        icon={ClipboardList}
        title="BOM Generator"
        description="Generate a complete Bill of Materials from your motor ratings — every sizing decision backed by the same formulas used elsewhere in this tool."
        actions={result && <Button variant="secondary" size="sm" icon={Download} onClick={() => window.print()}>Print / Save PDF</Button>}
      />

      {prefilled && (
        <PrefillBanner
          message="Motor HP values carried over from your Load Calculator results."
          onDismiss={() => setPrefilled(false)}
        />
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <NumberField label="Hoist Motor" value={inputs.hoistHP} onChange={(v) => update('hoistHP', v)} unit="HP" error={errors.hoistHP} />
          <NumberField label="LT Motor" value={inputs.ltHP} onChange={(v) => update('ltHP', v)} unit="HP" error={errors.ltHP} />
          <NumberField label="CT Motor" value={inputs.ctHP} onChange={(v) => update('ctHP', v)} unit="HP" error={errors.ctHP} />
          <NumberField label="Travel Length" value={inputs.travelLength} onChange={(v) => update('travelLength', v)} unit="m" error={errors.travelLength} />
        </div>
        <Button icon={Zap} onClick={calculate} disabled={loading} className="mt-1">
          {loading ? 'Generating…' : 'Generate BOM'}
        </Button>
        {apiError && <div className="mt-3"><ErrorBanner message={apiError} onRetry={calculate} retrying={loading} /></div>}
      </Card>

      {loading ? (
        <Card><Skeleton rows={8} className="h-6" /></Card>
      ) : result ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {Object.entries(result.per_motor).map(([name, data]) => (
              <Card key={name} variant="computed">
                <div className="text-text font-semibold text-sm mb-2">{name}</div>
                <div className="text-text-dim text-xs mb-3 font-mono">FLC: {data.flc} A</div>
                <div className="space-y-2">
                  <EngineeringStatus label="Contactor" status={data.status.contactor} />
                  <EngineeringStatus label="MPCB" status={data.status.mpcb} />
                </div>
              </Card>
            ))}
          </div>

          <Card padding="none" className="overflow-x-auto mb-5 print-avoid-break">
            <table className="w-full text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-inset">
                  {['Sl.No', 'Component', 'Specification', 'Qty', 'Unit', 'Purpose'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-text-muted font-medium border-b border-steel whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.items.map((item, i) => (
                  <motion.tr
                    key={item.slNo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    className={i % 2 === 0 ? 'bg-surface' : 'bg-inset'}
                  >
                    <td className="px-4 py-2.5 border-b border-steel text-text-dim font-mono">{item.slNo}</td>
                    <td className="px-4 py-2.5 border-b border-steel text-text font-medium">{item.component}</td>
                    <td className="px-4 py-2.5 border-b border-steel text-text-muted font-mono text-xs">{item.spec}</td>
                    <td className="px-4 py-2.5 border-b border-steel text-amber font-mono">{item.qty}</td>
                    <td className="px-4 py-2.5 border-b border-steel text-text-dim">{item.unit}</td>
                    <td className="px-4 py-2.5 border-b border-steel text-text-dim text-xs">{item.purpose}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="space-y-2 mb-6 no-print">
            <FormulaExplainer title="Why this main MCB rating?" explanation={result.explanations.main_mcb} />
          </div>

          <div className="flex justify-end no-print">
            <Button variant="outline" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/report')}>
              Continue to Project Report
            </Button>
          </div>
        </>
      ) : (
        <EmptyState icon={ClipboardList} title="No BOM generated yet" description="Enter motor ratings above and click Generate BOM." />
      )}
    </div>
  )
}
