import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

/**
 * Wraps secondary/reference content that doesn't need to be visible by
 * default — a long list, a reference table, extra detail beyond the
 * primary result. Same collapse mechanics and visual language as
 * FormulaExplainer (border-steel/bg-inset/ChevronDown), so a page that
 * uses both doesn't look like two different disclosure widgets.
 *
 * Not for anything load-bearing to the task at hand — inputs, primary
 * results, and anything the student needs to see to proceed stay outside
 * this component, always visible.
 */
export default function CollapsibleSection({ title, subtitle, icon: Icon, defaultOpen = false, badge, className = '', children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`border border-steel rounded-xl overflow-hidden bg-inset ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer hover:bg-surface-hover transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon size={15} className={`shrink-0 transition-colors ${open ? 'text-amber' : 'text-text-dim'}`} />}
          <span className="min-w-0">
            <span className="text-sm font-semibold text-text">{title}</span>
            {subtitle && <span className="block text-xs text-text-dim mt-0.5 truncate">{subtitle}</span>}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {badge}
          <ChevronDown size={15} className={`text-text-dim transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-1 border-t border-steel">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
