import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookMarked, AlertTriangle, Lightbulb } from 'lucide-react'

/**
 * `explanation` is the exact shape returned by the backend's explain.py:
 * { formula, variables: [{symbol,name,value,unit}], substitution, result,
 *   reasoning, standard, common_mistakes: [] }
 */
export default function FormulaExplainer({ title = 'Why this value?', explanation, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!explanation) return null

  return (
    <div className="border border-steel rounded-lg overflow-hidden bg-inset">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left cursor-pointer hover:bg-surface-hover transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-amber">
          <Lightbulb size={15} strokeWidth={2.25} />
          {title}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-text-dim" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-4 pt-1 border-t border-steel">
              {/* Formula */}
              <div className="mt-3 mb-3">
                <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Formula</div>
                <div className="font-mono text-sm text-text bg-surface border border-steel rounded-md px-3 py-2 overflow-x-auto">
                  {explanation.formula}
                </div>
              </div>

              {/* Variables */}
              {explanation.variables?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1.5">Variables in this calculation</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {explanation.variables.map((v) => (
                      <div key={v.symbol} className="flex items-baseline justify-between bg-surface rounded px-2.5 py-1.5 text-xs">
                        <span className="text-text-muted">
                          <span className="font-mono text-copper mr-1.5">{v.symbol}</span>
                          {v.name}
                        </span>
                        <span className="font-mono text-text">{v.value}{v.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Substitution */}
              <div className="mb-3">
                <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Worked substitution</div>
                <div className="font-mono text-xs text-safe bg-surface border border-steel rounded-md px-3 py-2 overflow-x-auto">
                  {explanation.substitution}
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-3">
                <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Engineering reasoning</div>
                <p className="text-sm text-text-muted leading-relaxed">{explanation.reasoning}</p>
              </div>

              {/* Standard */}
              <div className="flex items-start gap-2 mb-3 bg-info-dim/50 border border-info/30 rounded-md px-3 py-2">
                <BookMarked size={14} className="text-info shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-relaxed">{explanation.standard}</p>
              </div>

              {/* Common mistakes */}
              {explanation.common_mistakes?.length > 0 && (
                <div className="flex items-start gap-2 bg-caution-dim/50 border border-amber/30 rounded-md px-3 py-2">
                  <AlertTriangle size={14} className="text-amber shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-amber mb-1">Common mistakes</div>
                    <ul className="space-y-1">
                      {explanation.common_mistakes.map((m, i) => (
                        <li key={i} className="text-xs text-text-muted leading-relaxed">• {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
