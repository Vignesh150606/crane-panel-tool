import { motion } from 'framer-motion'
import { Gauge, Search } from 'lucide-react'

/**
 * A clickable list of "test points" — the interaction pattern for faults
 * that a boolean relay-logic diagram can't represent (single phasing, wrong
 * phase sequence, brake failure, a contactor chattering under a sagging
 * control rail). Nothing is shown until "measured," on purpose: it mirrors
 * FaultDiagnosis's own diagnostic-method explainer ("test at the boundary
 * between working and not working, not at the component you first
 * suspect") instead of just handing over the answer, and lets both Challenge
 * Mode and Virtual Commissioning score how many checks a scenario needed.
 */
export default function InspectionPanel({ checks, revealed, onReveal }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {checks.map((c) => {
        const isRevealed = revealed.includes(c.id)
        return (
          <div key={c.id} className={`rounded-lg border px-3.5 py-3 transition-colors ${isRevealed ? (c.abnormal ? 'border-danger/40 bg-danger-dim/20' : 'border-steel bg-inset') : 'border-dashed border-steel'}`}>
            <div className="flex items-center gap-1.5 text-text-muted text-xs font-semibold mb-1.5">
              <Gauge size={12} /> {c.label}
            </div>
            {isRevealed ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={`font-mono text-sm font-semibold ${c.abnormal ? 'text-danger' : 'text-safe'}`}>{c.reading}</div>
                {c.note && <div className="text-text-dim text-[0.7rem] mt-1 leading-relaxed">{c.note}</div>}
              </motion.div>
            ) : (
              <button
                onClick={() => onReveal(c.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber border border-amber/40 bg-amber/5 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-amber/10 transition-colors"
              >
                <Search size={12} /> Measure
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
