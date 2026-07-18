import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Home as HomeIcon, Compass, Wrench, GraduationCap, MoreHorizontal, Check, X } from 'lucide-react'
import {
  DASHBOARD_ITEM, HANDBOOK_ITEM, WORKFLOW_ITEMS, REFERENCE_ITEMS, TRAINING_ITEMS,
} from '../../config/navigation'
import { useProjectStore } from '../../store/projectStore'
import { backdropFade, sheetSlideY } from '../../lib/motion'

// Five real destinations, not a scaled-down copy of the 18-item sidebar.
// Home is a direct link; the other four open a sheet of that category's
// actual pages — same underlying routes as desktop, organized the way a
// phone wants them (a handful of big tappable rows), not the same dense
// list squeezed into a drawer.
const SECTIONS = [
  { key: 'design', label: 'Design', icon: Compass, items: WORKFLOW_ITEMS, numbered: true,
    match: (p) => WORKFLOW_ITEMS.some((i) => i.path === p) },
  { key: 'tools', label: 'Tools', icon: Wrench, items: REFERENCE_ITEMS,
    match: (p) => REFERENCE_ITEMS.some((i) => i.path === p) },
  { key: 'training', label: 'Training', icon: GraduationCap, items: TRAINING_ITEMS,
    match: (p) => TRAINING_ITEMS.some((i) => i.path === p) },
  { key: 'more', label: 'More', icon: MoreHorizontal, items: [DASHBOARD_ITEM, HANDBOOK_ITEM],
    match: (p) => p === DASHBOARD_ITEM.path || p === HANDBOOK_ITEM.path },
]

export default function BottomNav() {
  const location = useLocation()
  const [openSection, setOpenSection] = useState(null)
  const completed = useProjectStore((s) => s.completedSteps())
  const dragControls = useDragControls()

  const active = SECTIONS.find((s) => s.match(location.pathname))?.key
  const isHome = location.pathname === '/'
  const section = SECTIONS.find((s) => s.key === openSection)

  return (
    <>
      <nav
        aria-label="Primary"
        className="no-print lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around
                   bg-ink/95 backdrop-blur border-t border-steel"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Link
          to="/"
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors
            ${isHome ? 'text-amber' : 'text-text-dim active:text-text'}`}
        >
          <HomeIcon size={22} strokeWidth={isHome ? 2.4 : 2} />
          <span className="text-[0.65rem] font-medium">Home</span>
        </Link>
        {SECTIONS.map((s) => {
          const isActive = active === s.key
          return (
            <button
              key={s.key}
              onClick={() => setOpenSection(s.key)}
              aria-haspopup="dialog"
              aria-expanded={openSection === s.key}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] cursor-pointer transition-colors
                ${isActive ? 'text-amber' : 'text-text-dim active:text-text'}`}
            >
              <s.icon size={22} strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-[0.65rem] font-medium">{s.label}</span>
            </button>
          )
        })}
      </nav>

      <AnimatePresence>
        {section && (
          <>
            <motion.div
              {...backdropFade}
              className="lg:hidden fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
              onClick={() => setOpenSection(null)}
            />
            <motion.div
              {...sheetSlideY}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setOpenSection(null)
              }}
              role="dialog"
              aria-label={section.label}
              className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[75vh] bg-surface border-t border-steel
                         rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div
                className="flex items-center justify-center py-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-9 h-1 rounded-full bg-steel-light" />
              </div>
              <div className="flex items-center justify-between px-4 pb-3 shrink-0 border-b border-steel">
                <h2 className="font-display font-semibold text-base text-text">{section.label}</h2>
                <button
                  onClick={() => setOpenSection(null)}
                  className="p-1.5 -mr-1.5 text-text-muted hover:text-text cursor-pointer"
                  aria-label={`Close ${section.label}`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-3 space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpenSection(null)}
                    className="flex items-center gap-3.5 rounded-xl border border-steel bg-inset px-4 py-3.5 min-h-[56px] active:bg-surface-hover transition-colors"
                  >
                    <span className="shrink-0 w-9 h-9 rounded-lg bg-surface border border-steel flex items-center justify-center">
                      {section.numbered && item.step ? (
                        completed[item.key] ? (
                          <Check size={16} className="text-safe" strokeWidth={3} />
                        ) : (
                          <span className="text-xs font-mono text-amber">{item.step}</span>
                        )
                      ) : (
                        <item.icon size={17} className="text-amber" strokeWidth={2} />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-text truncate">{item.label}</span>
                      {item.description && (
                        <span className="block text-xs text-text-dim mt-0.5 line-clamp-1">{item.description}</span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
