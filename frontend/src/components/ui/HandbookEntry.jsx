import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, BookMarked, AlertTriangle, Lightbulb, ArrowRight, GraduationCap, Bookmark } from 'lucide-react'
import { useHandbookStore } from '../../store/handbookStore'

export default function HandbookEntry({ topic, defaultOpen = false, forwardedRef }) {
  const [open, setOpen] = useState(defaultOpen)
  const bookmarked = useHandbookStore((s) => s.isBookmarked(topic.id))
  const toggleBookmark = useHandbookStore((s) => s.toggleBookmark)
  const pushRecentTopic = useHandbookStore((s) => s.pushRecentTopic)

  function handleToggle() {
    setOpen((o) => {
      const next = !o
      if (next) pushRecentTopic(topic.id)
      return next
    })
  }

  return (
    <div id={topic.id} ref={forwardedRef} className="border border-steel rounded-lg overflow-hidden bg-inset scroll-mt-24">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer hover:bg-surface-hover transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-text">{topic.title}</span>
        <span className="flex items-center gap-1 shrink-0">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); toggleBookmark(topic.id) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); toggleBookmark(topic.id) } }}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this topic'}
            aria-pressed={bookmarked}
            className="p-1 -m-1 rounded hover:bg-surface cursor-pointer"
          >
            <Bookmark size={14} className={bookmarked ? 'fill-amber text-amber' : 'text-text-dim'} />
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-text-dim" />
          </motion.span>
        </span>
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
            <div className="px-4 pb-4 pt-1 border-t border-steel space-y-3">
              {topic.equation && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Equation</div>
                  <div className="font-mono text-sm text-amber bg-surface border border-steel rounded-md px-3 py-2 overflow-x-auto">
                    {topic.equation}
                  </div>
                </div>
              )}

              {topic.variables?.length > 0 && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1.5">Variables</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {topic.variables.map((v) => (
                      <div key={v.symbol} className="flex items-baseline justify-between bg-surface rounded px-2.5 py-1.5 text-xs gap-2">
                        <span className="text-text-muted">
                          <span className="font-mono text-copper mr-1.5">{v.symbol}</span>
                          {v.name}
                        </span>
                        <span className="font-mono text-text-dim shrink-0">{v.value ?? ''}{v.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {topic.meaning && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">What it means</div>
                  <p className="text-sm text-text-muted leading-relaxed">{topic.meaning}</p>
                </div>
              )}

              {topic.assumptions && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Assumptions & scope</div>
                  <p className="text-sm text-text-muted leading-relaxed">{topic.assumptions}</p>
                </div>
              )}

              {topic.workedExample && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">Worked example</div>
                  <p className="font-mono text-xs text-safe bg-surface border border-steel rounded-md px-3 py-2 leading-relaxed overflow-x-auto">
                    {topic.workedExample}
                  </p>
                </div>
              )}

              {topic.industrialNote && (
                <div className="flex items-start gap-2 bg-info-dim/50 border border-info/30 rounded-md px-3 py-2">
                  <BookMarked size={14} className="text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted leading-relaxed">{topic.industrialNote}</p>
                </div>
              )}

              {topic.commonMistakes?.length > 0 && (
                <div className="flex items-start gap-2 bg-caution-dim/50 border border-amber/30 rounded-md px-3 py-2">
                  <AlertTriangle size={14} className="text-amber shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-amber mb-1">Common mistakes</div>
                    <ul className="space-y-1">
                      {topic.commonMistakes.map((m, i) => (
                        <li key={i} className="text-xs text-text-muted leading-relaxed">• {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {topic.interviewTip && (
                <div className="flex items-start gap-2 bg-amber/5 border border-amber/20 rounded-md px-3 py-2">
                  <Lightbulb size={14} className="text-amber shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-amber mb-1">Interview tip</div>
                    <p className="text-xs text-text-muted leading-relaxed">{topic.interviewTip}</p>
                  </div>
                </div>
              )}

              {topic.relatedCalculator && (
                <Link
                  to={topic.relatedCalculator.path}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-info hover:text-info/80 transition-colors"
                >
                  <GraduationCap size={13} />
                  Use this in {topic.relatedCalculator.label}
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
