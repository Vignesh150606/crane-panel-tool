import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, ShieldCheck, BookOpenCheck, Radio, FileOutput, Gamepad2, LayoutDashboard } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { WORKFLOW_ITEMS, REFERENCE_ITEMS, TRAINING_ITEMS, HANDBOOK_ITEM } from '../config/navigation'
import PanelSchematic from '../components/illustrations/PanelSchematic'

const CAPABILITIES = [
  { icon: ShieldCheck, label: 'IS/IEC Standards', sub: 'Every rating traceable' },
  { icon: BookOpenCheck, label: 'Formula Explainer', sub: 'Worked examples, 4 tiers' },
  { icon: Radio, label: 'Live Circuit Logic', sub: 'Real NO/NC interlocks' },
  { icon: FileOutput, label: 'Export-Ready Report', sub: 'Print to PDF' },
]

export default function Home() {
  const hasProject = useProjectStore((s) => !!(s.craneType || s.motors))

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="grid lg:grid-cols-[1fr_minmax(360px,440px)] gap-10 lg:gap-14 items-center py-6 lg:py-10">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border border-steel bg-inset px-3 py-1 text-xs font-medium text-text-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-safe shadow-[0_0_6px_var(--color-safe)]" />
            IS/IEC-referenced · built on real panel-assembly experience
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl font-bold text-text leading-[1.08] mb-5 text-balance">
            Design. Simulate. Validate.
            <br />
            <span className="text-amber">EOT Crane</span> Control Panels.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="text-text-muted text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
            A complete engineering workflow for industrial crane control panels — motor sizing, cable and busbar
            selection, interlock circuits, panel layout and BOM, every step backed by a full formula explanation.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
            className="flex gap-3 flex-wrap mb-10">
            <Link to="/cranes" className="bg-amber text-ink px-6 py-3 rounded-lg font-semibold hover:bg-amber-dim transition-colors inline-flex items-center gap-2">
              {hasProject ? 'Resume Your Project' : 'Start a New Design'} <ArrowRight size={16} />
            </Link>
            <Link to="/simulator" className="border-2 border-amber text-amber px-6 py-3 rounded-lg font-semibold hover:bg-amber/10 transition-colors inline-flex items-center gap-2">
              <Gamepad2 size={16} /> Open Panel Simulator
            </Link>
            {hasProject && (
              <Link to="/dashboard" className="text-text-muted px-6 py-3 rounded-lg font-semibold hover:text-amber transition-colors inline-flex items-center gap-2">
                <LayoutDashboard size={16} /> View Dashboard
              </Link>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.22 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.label} className="flex items-start gap-2.5 rounded-lg border border-steel bg-surface/60 px-3 py-2.5">
                  <Icon size={16} className="text-amber shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="min-w-0">
                    <div className="text-text text-xs font-semibold leading-tight">{c.label}</div>
                    <div className="text-text-dim text-xs leading-tight mt-0.5 opacity-70">{c.sub}</div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative hidden sm:block overflow-hidden rounded-[2rem]"
        >
          <div className="absolute -inset-6 bg-amber/5 rounded-[2rem] blur-2xl -z-10" />
          <PanelSchematic className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]" />
        </motion.div>
      </section>

      {/* ── Design Workflow ──────────────────────────────────────────── */}
      <section className="pt-6 pb-6">
        <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-text mb-1">Design Workflow</h2>
            <p className="text-text-muted text-sm sm:text-base">Seven steps in sequence — or jump directly to any step standalone.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {WORKFLOW_ITEMS.map((f, i) => (
            <FeatureCard key={f.path} feature={f} delay={i * 0.03} />
          ))}
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="border-t border-steel" />

      {/* ── More tools ────────────────────────────────────────────────
          Reference calculators, the Handbook, and the training modules
          used to be two more full card grids (8 equal-weight cards) —
          visually competing with the primary 7-step workflow above for
          the same attention. They're all still one click away, just as a
          compact, quieter list now: the workflow is what a first-time
          visitor should register first; everything below is "also
          available", not "equally important". */}
      <section className="pt-8 pb-6">
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold text-text mb-1">More tools</h2>
          <p className="text-text-muted text-sm">Standalone calculators, reference and training — use anytime, in any order.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-steel bg-surface divide-y divide-steel/70 overflow-hidden">
            {REFERENCE_ITEMS.map((item, i) => (
              <ToolRow key={item.path} item={item} delay={i * 0.02} />
            ))}
          </div>
          <div className="rounded-xl border border-steel bg-surface divide-y divide-steel/70 overflow-hidden">
            <ToolRow item={HANDBOOK_ITEM} delay={0} />
            {TRAINING_ITEMS.map((item, i) => (
              <ToolRow key={item.path} item={item} delay={(i + 1) * 0.02} />
            ))}
          </div>
        </div>
        <p className="text-text-dim text-xs mt-5 leading-relaxed">
          Built with engineering data from real EOT crane panel assembly · component ratings follow IS/IEC standards.
        </p>
      </section>
    </div>
  )
}

function FeatureCard({ feature, delay }) {
  const Icon = feature.icon
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <Link
        to={feature.path}
        className="group block bg-surface border border-steel rounded-xl p-5 hover:border-amber hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 h-full relative"
      >
        {feature.step && (
          <span className="absolute top-4 right-4 text-[0.65rem] font-mono text-text-dim border border-steel rounded-full w-5 h-5 flex items-center justify-center">
            {feature.step}
          </span>
        )}
        <div className="w-10 h-10 rounded-lg bg-inset border border-steel flex items-center justify-center mb-3 group-hover:border-amber transition-colors">
          <Icon size={18} className="text-amber" strokeWidth={2} />
        </div>
        <h3 className="text-text font-semibold mb-1.5">{feature.label}</h3>
        <p className="text-text-dim text-sm leading-relaxed">{feature.description}</p>
      </Link>
    </motion.div>
  )
}

// Compact row for secondary destinations — icon, label, one-line description,
// and a chevron. Same information as FeatureCard's grid, at a fraction of the
// visual weight, so "More tools" reads as a scannable list rather than a
// second wall of cards.
function ToolRow({ item, delay }) {
  const Icon = item.icon
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay }}>
      <Link to={item.path} className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors">
        <div className="w-8 h-8 rounded-md bg-inset border border-steel flex items-center justify-center shrink-0 group-hover:border-amber transition-colors">
          <Icon size={15} className="text-amber" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text text-sm font-medium truncate">{item.label}</span>
            {item.isNew && (
              <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide bg-safe-dim text-safe border border-safe/40 rounded-full px-1.5 py-0.5">
                New
              </span>
            )}
          </div>
          <p className="text-text-dim text-xs truncate">{item.description}</p>
        </div>
        <ChevronRight size={15} className="text-text-dim shrink-0 group-hover:text-amber group-hover:translate-x-0.5 transition-transform duration-150" />
      </Link>
    </motion.div>
  )
}
