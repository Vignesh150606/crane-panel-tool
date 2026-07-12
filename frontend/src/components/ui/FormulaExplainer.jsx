import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookMarked, AlertTriangle, Lightbulb, GraduationCap, Calculator, Factory, FlaskConical } from 'lucide-react'

/**
 * `explanation` is the exact shape returned by the backend's explain.py:
 * { formula, variables: [{symbol,name,value,unit}], substitution, result,
 *   reasoning, standard, common_mistakes: [] }
 *
 * TIERED DISCLOSURE (Phase 4/5 redesign): rather than dumping formula,
 * variables, substitution, reasoning, standard AND common-mistakes on the
 * reader all at once, this reveals them in four cumulative tiers so nobody
 * is shown more than they asked for:
 *
 *   Basic       "What is this?"        — the answer, in one plain sentence.
 *   Intermediate "How is it worked out?" — + the formula and the actual numbers.
 *   Industrial  "What's the standard basis?" — + every variable and the code/standard reference.
 *   Expert      "What can go wrong?"    — + full engineering reasoning and common mistakes.
 *
 * Each tier is a superset of the one before it, so moving up never hides
 * something you already saw — it only adds.
 */
const TIERS = [
  { key: 'basic', label: 'Basic', icon: GraduationCap, question: 'What is this?' },
  { key: 'intermediate', label: 'Intermediate', icon: Calculator, question: 'How is it worked out?' },
  { key: 'industrial', label: 'Industrial', icon: Factory, question: "What's the standard basis?" },
  { key: 'expert', label: 'Expert', icon: FlaskConical, question: 'What can go wrong?' },
]
const TIER_INDEX = Object.fromEntries(TIERS.map((t, i) => [t.key, i]))

function oneLineTakeaway(explanation) {
  // First sentence of the reasoning reads as a plain-English summary in
  // every explain.py block in this codebase (by convention) — fall back to
  // the raw result if reasoning is ever missing.
  const firstSentence = explanation.reasoning?.split(/(?<=\.)\s+/)[0]
  return firstSentence || `Result: ${explanation.result}`
}

export default function FormulaExplainer({ title = 'Why this value?', explanation, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const [tier, setTier] = useState('basic')
  if (!explanation) return null

  const level = TIER_INDEX[tier]
  const show = (minTier) => level >= TIER_INDEX[minTier]

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
            <div className="px-3.5 pb-4 pt-3 border-t border-steel">
              {/* Tier selector */}
              <div className="flex gap-1 mb-3.5 bg-surface border border-steel rounded-md p-1" role="tablist">
                {TIERS.map((t) => {
                  const Icon = t.icon
                  const active = t.key === tier
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTier(t.key)}
                      className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded text-[0.68rem] font-medium transition-colors cursor-pointer
                        ${active ? 'bg-amber/15 text-amber' : 'text-text-dim hover:text-text-muted'}`}
                    >
                      <Icon size={12} strokeWidth={2.25} />
                      {t.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-[0.7rem] text-text-dim mb-3 italic">"{TIERS[level].question}"</p>

              {/* BASIC — always shown once open: the plain-English takeaway */}
              <div className="mb-3 bg-amber/5 border border-amber/20 rounded-md px-3 py-2.5">
                <p className="text-sm text-text leading-relaxed font-medium">{oneLineTakeaway(explanation)}</p>
                <p className="text-xs text-text-muted mt-1">Result: <span className="font-mono text-safe">{explanation.result}</span></p>
              </div>

              {/* INTERMEDIATE — formula + worked substitution */}
              {show('intermediate') && (
                <>
                  <div className="mb-3">
                    <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Formula</div>
                    <div className="font-mono text-sm text-text bg-surface border border-steel rounded-md px-3 py-2 overflow-x-auto">
                      {explanation.formula}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Worked substitution</div>
                    <div className="font-mono text-xs text-safe bg-surface border border-steel rounded-md px-3 py-2 overflow-x-auto">
                      {explanation.substitution}
                    </div>
                  </div>
                </>
              )}

              {/* INDUSTRIAL — every variable + standard reference */}
              {show('industrial') && (
                <>
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
                  <div className="flex items-start gap-2 mb-3 bg-info-dim/50 border border-info/30 rounded-md px-3 py-2">
                    <BookMarked size={14} className="text-info shrink-0 mt-0.5" />
                    <p className="text-xs text-text-muted leading-relaxed">{explanation.standard}</p>
                  </div>
                </>
              )}

              {/* EXPERT — full reasoning + common mistakes */}
              {show('expert') && (
                <>
                  <div className="mb-3">
                    <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Full engineering reasoning</div>
                    <p className="text-sm text-text-muted leading-relaxed">{explanation.reasoning}</p>
                  </div>
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
                </>
              )}

              {level < 3 && (
                <button
                  onClick={() => setTier(TIERS[level + 1].key)}
                  className="text-xs text-info hover:text-info/80 mt-1 cursor-pointer"
                >
                  Curious why? See "{TIERS[level + 1].label}" →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
