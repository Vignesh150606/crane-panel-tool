import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileText, BookOpen, Tag, ArrowRight, CornerDownLeft } from 'lucide-react'
import { searchAll } from '../../data/workspaceIndex'

const TYPE_ICON = {
  'Page': FileText,
  'Formula & Topic': BookOpen,
  'Glossary': Tag,
  'IEC Symbol': Tag,
}

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const results = useMemo(() => (query ? searchAll(query) : []), [query])

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }

  useEffect(() => {
    if (open) {
      // Focusing a DOM node is a genuine imperative side effect (not a
      // state derivation), so this stays in an effect — waits for the
      // mount/animation frame before focusing.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setActiveIndex(0)
  }

  function go(entry) {
    if (!entry) return
    navigate(entry.to)
    onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); go(results[activeIndex]) }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-surface border border-steel rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-4 border-b border-steel">
            <Search size={17} className="text-text-dim shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search formulas, components, pages, IEC symbols…"
              className="flex-1 bg-transparent py-3.5 text-sm text-text placeholder:text-text-dim outline-none"
            />
            <button onClick={onClose} className="text-text-dim hover:text-text cursor-pointer shrink-0" aria-label="Close search">
              <X size={17} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto py-1.5">
            {query && results.length === 0 && (
              <div className="px-4 py-8 text-center text-text-dim text-sm">No results for &ldquo;{query}&rdquo;</div>
            )}
            {!query && (
              <div className="px-4 py-8 text-center text-text-dim text-sm">
                Search across every page, formula, glossary term and IEC symbol in the app.
              </div>
            )}
            {results.map((r, i) => {
              const Icon = TYPE_ICON[r.type] || FileText
              return (
                <button
                  key={`${r.type}-${r.title}-${i}`}
                  onClick={() => go(r)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer
                    ${i === activeIndex ? 'bg-surface-hover' : ''}`}
                >
                  <Icon size={15} className="text-amber shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-text text-sm font-medium truncate">{r.title}</div>
                    <div className="text-text-dim text-xs truncate">{r.subtitle}</div>
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-wide text-text-dim shrink-0">{r.type}</span>
                  {i === activeIndex && <ArrowRight size={13} className="text-amber shrink-0" />}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 px-4 py-2 border-t border-steel text-[0.68rem] text-text-dim">
            <span className="flex items-center gap-1"><CornerDownLeft size={11} /> to select</span>
            <span>↑↓ to navigate</span>
            <span>esc to close</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
