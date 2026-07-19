import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
  LayoutPanelTop, BookOpen, ArrowRight, AlertTriangle, Wrench, HelpCircle,
  Gauge, ExternalLink, CheckCircle2, X,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { PANEL_COMPONENTS, PANEL_CATEGORIES } from '../data/panelComponents'
import { useTrainingStore } from '../store/trainingStore'
import { backdropFade, sheetSlideY } from '../lib/motion'

export default function PanelExplorer() {
  const [selectedId, setSelectedId] = useState(null)
  const viewedComponents = useTrainingStore((s) => s.viewedComponents)
  const markViewed = useTrainingStore((s) => s.markComponentViewed)
  const dragControls = useDragControls()

  const selected = PANEL_COMPONENTS.find((c) => c.id === selectedId) || null

  useEffect(() => {
    if (selectedId) markViewed(selectedId)
  }, [selectedId, markViewed])

  return (
    <div>
      <PageHeader
        icon={LayoutPanelTop}
        title="Interactive Panel Explorer"
        description="Tap any component on a realistic crane control panel to see its function, ratings, failure symptoms, maintenance tips and interview questions — all cross-linked to the rest of the app."
        actions={<Badge tone="info" dot={false}>{viewedComponents.length}/{PANEL_COMPONENTS.length} explored</Badge>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* The canvas is the page — everything else is chrome around it.
            Previously the SVG scaled to fill whatever width the flex column
            gave it with no ceiling, so on a wide desktop monitor it rendered
            over 1400px tall (measured), turning "large canvas" into "canvas
            so oversized it needs its own scroll". Capped to a size that's
            still clearly the dominant element but actually fits a viewport. */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-3 gap-3">
            <span className="text-text-dim text-xs">Panel Enclosure (Front View) — tap a component</span>
            <div className="hidden sm:flex items-center gap-3 flex-wrap justify-end">
              {PANEL_CATEGORIES.map((cat) => (
                <span key={cat} className="text-[0.65rem] text-text-dim flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: PANEL_COMPONENTS.find((c) => c.category === cat).color }} />
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div className="max-w-[560px] mx-auto">
            <svg width="100%" viewBox="-5 -10 275 320" className="font-mono">
              <rect x="5" y="5" width="255" height="300" fill="var(--color-inset)" stroke="var(--color-steel)" strokeWidth="3" rx="4" />
              {[15, 82, 142, 202, 262].map((y, i) => (
                <line key={i} x1="12" y1={y} x2="248" y2={y} stroke="var(--color-text-dim)" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
              ))}

              {PANEL_COMPONENTS.map((c) => {
                const isSelected = selectedId === c.id
                const isViewed = viewedComponents.includes(c.id)
                return (
                  <g
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(c.id) } }}
                    role="button" tabIndex={0} aria-pressed={isSelected} aria-label={c.label}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect x={c.x} y={c.y} width={c.w} height={c.h}
                      fill={`${c.color}${isSelected ? '55' : '2b'}`}
                      stroke={c.color} strokeWidth={isSelected ? 2.75 : 1.5} rx="3" />
                    <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 3} textAnchor="middle" fill={c.color} fontSize="8" fontWeight="600">
                      {c.label.split(' — ')[0].split(' (')[0]}
                    </text>
                    {isViewed && (
                      <circle cx={c.x + c.w - 7} cy={c.y + 7} r="3" fill="var(--color-safe)" />
                    )}
                  </g>
                )
              })}

              <text x="128" y="292" textAnchor="middle" fill="var(--color-text-muted)" fontSize="7.5">Cable Glands (IP55) →</text>
              {[30, 65, 100, 135, 170, 205].map((x) => (
                <circle key={x} cx={x} cy="300" r="3.5" fill="var(--color-steel)" stroke="var(--color-text-muted)" />
              ))}
            </svg>
          </div>

          {!selected && (
            <p className="xl:hidden text-center text-text-dim text-xs mt-3">
              Tap a component above to see its function, ratings and failure symptoms.
            </p>
          )}
        </Card>

        {/* Desktop / wide-tablet: persistent side panel, room enough that it
            doesn't need to be an overlay — unchanged from before. */}
        <div className="min-w-0 hidden xl:block">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState icon={LayoutPanelTop} title="Select a component to begin" description="Every clickable block cross-links to the Handbook, calculators, and the circuit pages where it actually does something." />
              </motion.div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3.5">
                <InspectorBody selected={selected} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Below xl: the inspector is a Google-Maps-style "tap a pin" card —
          slides up over the canvas instead of pushing it down the page
          (previously the only option below xl, which meant every tap
          required scrolling down past the diagram to see what you'd just
          selected). Drag-to-dismiss and backdrop-tap both close it, same
          pattern as the bottom nav's category sheets. */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              {...backdropFade}
              className="xl:hidden fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              {...sheetSlideY}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setSelectedId(null)
              }}
              role="dialog"
              aria-label={selected.label}
              className="xl:hidden fixed inset-x-0 bottom-0 z-50 max-h-[80vh] bg-surface border-t border-steel
                         rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="relative flex items-center justify-center py-2.5 shrink-0">
                <div
                  className="w-9 h-1 rounded-full bg-steel-light cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={(e) => dragControls.start(e)}
                />
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto px-4 pb-4 flex flex-col gap-3.5">
                <InspectorBody selected={selected} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {viewedComponents.length === PANEL_COMPONENTS.length && (
        <div className="mt-6 flex items-center gap-2.5 bg-safe-dim/30 border border-safe/40 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} className="text-safe shrink-0" />
          <p className="text-safe text-sm font-medium">
            All {PANEL_COMPONENTS.length} components explored. Ready to test this on a real fault? Try{' '}
            <Link to="/challenge-mode" className="underline underline-offset-2">Challenge Mode</Link>.
          </p>
        </div>
      )}
    </div>
  )
}

/** The six-card breakdown for whichever component is selected — shared
 * between the desktop persistent panel and the mobile/tablet bottom sheet
 * so the two surfaces can't drift out of sync with each other. */
function InspectorBody({ selected }) {
  return (
    <>
      <Card style={{ borderColor: selected.color, borderWidth: 2 }} padding="lg">
        <div className="text-[0.65rem] uppercase tracking-wide text-text-dim mb-1">{selected.category}</div>
        <h2 className="font-display font-bold text-lg mb-2.5" style={{ color: selected.color }}>{selected.label}</h2>
        <p className="text-text text-sm leading-relaxed">{selected.function}</p>
      </Card>

      <Card>
        <div className="flex items-center gap-1.5 text-amber font-semibold text-sm mb-2">
          <Gauge size={14} /> Typical Rating
        </div>
        <div className="font-mono text-sm text-text bg-inset border border-steel rounded-md px-3 py-2 mb-2">{selected.typicalRating}</div>
        {selected.ratingNote && <p className="text-text-dim text-xs leading-relaxed">{selected.ratingNote}</p>}
      </Card>

      <Card>
        <div className="flex items-center gap-1.5 text-danger font-semibold text-sm mb-2">
          <AlertTriangle size={14} /> Failure Symptoms
        </div>
        <ul className="text-text-muted text-sm leading-relaxed pl-4 list-disc space-y-1">
          {selected.failureSymptoms.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </Card>

      <Card>
        <div className="flex items-center gap-1.5 text-safe font-semibold text-sm mb-2">
          <Wrench size={14} /> Maintenance Tips
        </div>
        <ul className="text-text-muted text-sm leading-relaxed pl-4 list-disc space-y-1">
          {selected.maintenanceTips.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </Card>

      <Card variant="inset">
        <div className="flex items-center gap-1.5 text-info font-semibold text-sm mb-2">
          <HelpCircle size={14} /> Interview Questions
        </div>
        <ul className="text-text-muted text-sm leading-relaxed pl-4 list-disc space-y-1.5">
          {selected.interviewQuestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </Card>

      <Card>
        <div className="text-text-dim text-[0.65rem] uppercase tracking-wide mb-2">Related</div>
        <div className="flex flex-col gap-1.5">
          {selected.relatedHandbookAnchor && (
            <Link to={`/handbook#${selected.relatedHandbookAnchor}`} className="flex items-center gap-1.5 text-xs font-semibold text-amber hover:text-amber-dim transition-colors">
              <BookOpen size={12} /> Open in Handbook <ArrowRight size={11} />
            </Link>
          )}
          {selected.relatedCalc && (
            <Link to={selected.relatedCalc.path} className="flex items-center gap-1.5 text-xs font-semibold text-info hover:text-info/80 transition-colors">
              <ExternalLink size={12} /> {selected.relatedCalc.label} <ArrowRight size={11} />
            </Link>
          )}
          {selected.relatedPage && (
            <Link to={selected.relatedPage.path} className="flex items-center gap-1.5 text-xs font-semibold text-safe hover:text-safe/80 transition-colors">
              <ExternalLink size={12} /> {selected.relatedPage.label} <ArrowRight size={11} />
            </Link>
          )}
        </div>
      </Card>
    </>
  )
}
