import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Factory, Grid3x3, Columns3, Check, X, Factory as FactoryIcon, Settings2, BarChart3, Lightbulb, ArrowRight } from 'lucide-react'

import { CRANE_TYPES, DUTY_CLASSES } from '../data/craneData'
import CraneDiagram from '../components/CraneDiagram'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import FormulaExplainer from '../components/ui/FormulaExplainer'
import { useProjectStore } from '../store/projectStore'

const CATEGORIES = ['All', 'EOT', 'Gantry', 'Jib', 'Special']

const DUTY_CLASS_ELECTRICAL_EXPLANATION = {
  formula: 'Duty class isn\'t only a mechanical rating — it also sets how many start/stop/reversal cycles per hour the electrical components must survive, which drives motor duty type and contactor selection downstream, not just their current rating.',
  variables: [
    { symbol: 'M3–M4', name: 'Light/moderate duty — infrequent starts, long rest periods', value: 'standard AC-3 contactors, S4 motor duty typically adequate', unit: '' },
    { symbol: 'M6–M8', name: 'Heavy to continuous duty — frequent reversing, high cycle rate', value: 'AC-4-rated contactors, higher cyclic-duty motor rating needed', unit: '' },
  ],
  substitution: 'The M-class picked on this page feeds forward into every later page: it\'s part of why "just pick a contactor rated for the current" on the Cable & Busbar / Load Calculator pages isn\'t the whole story.',
  result: 'Two cranes with identical motor HP but different duty classes can legitimately need different-grade contactors, even though the FLC-based current calculation comes out the same.',
  reasoning:
    'Crane duty classification (the M3–M8 scale here) exists because a crane\'s components — mechanical AND electrical — see completely different stress depending on how the crane is actually used, not just how strong it needs to be. An M3 crane in a maintenance bay starting a few times an hour has nothing in common electrically with an M7 crane in a steel plant reversing continuously. Two concrete downstream consequences: first, crane motors are rated for intermittent/cyclic duty (duty types like S4/S5 in motor nameplate terms), not continuous S1 duty the way a pump motor would be, and the specific duty class affects how that cyclic rating is chosen. Second, and more directly relevant to the contactor sizing shown elsewhere in this app: contactors have a rated utilization category — AC-3 covers standard motor starting and stopping, AC-4 covers rapid reversing and jogging, which is electrically far more punishing per operation (breaking current while the motor is still near full starting current, repeatedly) — and every contactor has a finite number of rated electrical operations before end-of-life. A current-based (FLC × multiplier) sizing calculation doesn\'t know how many times per hour that contactor will be asked to reverse; the duty class picked on this page is where that information should come from.',
  standard: 'Crane mechanism/duty classification per ISO 4301-1 / FEM 9.511 (the M1–M8 scale used here); motor duty types per IEC 60034-1 (S1–S10); contactor utilization categories AC-3/AC-4 per IEC 60947-4-1.',
  common_mistakes: [
    'Sizing a contactor purely from FLC × multiplier and ignoring duty class — two motors with identical FLC can need different contactor grades if their duty classes differ.',
    'Assuming "heavier duty class" only means "build the structure stronger" — it has real electrical component consequences too, which is why this page comes before the electrical calculators in the workflow, not after.',
  ],
}

export default function CraneSelector() {
  const navigate = useNavigate()
  const storedCraneType = useProjectStore((s) => s.craneType)
  const setCraneTypeStore = useProjectStore((s) => s.setCraneType)

  const [selected, setSelected] = useState(storedCraneType || null)
  const [filter, setFilter] = useState('All')
  const [view, setView] = useState('grid')
  const detailRef = useRef(null)

  const cranes = Object.values(CRANE_TYPES)
  const filtered = filter === 'All' ? cranes : cranes.filter((c) => c.category === filter)
  const selectedCrane = selected ? CRANE_TYPES[selected] : null

  const selectCrane = (id) => {
    const next = id === selected ? null : id
    setSelected(next)
    if (next) setCraneTypeStore(next)
  }

  return (
    <div>
      <PageHeader
        icon={Factory}
        title="Crane Type Selector"
        description="Select a crane type to view specifications, applications, an SVG diagram, and typical component requirements."
      />

      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors cursor-pointer
                ${filter === cat ? 'bg-amber text-ink border-amber font-semibold' : 'border-steel text-text-muted hover:border-steel-light'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer
              ${view === 'grid' ? 'border-amber text-amber bg-surface' : 'border-steel text-text-dim hover:text-text-muted'}`}
          >
            <Grid3x3 size={14} /> Grid
          </button>
          <button
            onClick={() => setView('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer
              ${view === 'compare' ? 'border-amber text-amber bg-surface' : 'border-steel text-text-dim hover:text-text-muted'}`}
          >
            <Columns3 size={14} /> Compare
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((crane) => (
            <motion.div
              key={crane.id}
              layout
              whileHover={{ y: -3 }}
              onClick={() => selectCrane(crane.id)}
              className={`bg-surface border-2 rounded-xl p-4 cursor-pointer transition-colors
                ${selected === crane.id ? 'border-amber' : 'border-steel hover:border-steel-light'}`}
            >
              <div className="bg-inset rounded-lg p-2 mb-3">
                <CraneDiagram craneId={crane.id} width={260} height={140} />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-text font-semibold">{crane.name}</h3>
                <span className="bg-inset text-amber text-xs px-2 py-0.5 rounded-full shrink-0 ml-2">{crane.category}</span>
              </div>
              <p className="text-text-dim text-sm mb-3 leading-relaxed">{crane.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-inset rounded-md px-2.5 py-1.5">
                  <div className="text-text-dim">Capacity</div>
                  <div className="text-amber font-semibold font-mono">{crane.capacityRange}</div>
                </div>
                <div className="bg-inset rounded-md px-2.5 py-1.5">
                  <div className="text-text-dim">Span</div>
                  <div className="text-amber font-semibold font-mono">{crane.spanRange}</div>
                </div>
              </div>
              {selected === crane.id && (
                <div className="mt-3 pt-3 border-t border-steel flex items-center gap-1.5 text-safe text-xs font-semibold">
                  <Check size={13} /> Selected — full specs below
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <CompareTable cranes={filtered} />
      )}

      <AnimatePresence>
        {selectedCrane && (
          <motion.div
            ref={detailRef}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={{ collapsed: { opacity: 0, height: 0 }, expanded: { opacity: 1, height: 'auto' } }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={(def) => {
              if (def === 'expanded') detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="overflow-hidden"
          >
            <DetailPanel crane={selectedCrane} onClose={() => setSelected(null)} onContinue={() => navigate('/calculator')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailPanel({ crane, onClose, onContinue }) {
  return (
    <Card variant="highlight" padding="lg" className="mt-6">
      <div className="flex justify-between items-start mb-6 gap-4">
        <div>
          <h2 className="font-display text-amber text-xl font-bold">{crane.fullName}</h2>
          <p className="text-text-dim mt-1 text-sm">{crane.description}</p>
        </div>
        <button onClick={onClose} className="text-text-dim hover:text-text cursor-pointer">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-inset rounded-xl p-4 mb-5 text-center">
            <CraneDiagram craneId={crane.id} width={280} height={180} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Capacity Range', value: crane.capacityRange },
              { label: 'Span Range', value: crane.spanRange },
              { label: 'Max Capacity', value: `${crane.specs.maxCapacity}T` },
              { label: 'Duty Class', value: crane.specs.typicalDutyClass },
              { label: 'Girders', value: crane.specs.girders },
              { label: 'Hoist Position', value: crane.specs.hoistPosition },
            ].map((item) => (
              <div key={item.label} className="bg-inset rounded-lg px-3 py-2">
                <div className="text-text-dim text-xs mb-0.5">{item.label}</div>
                <div className="text-amber font-semibold text-sm font-mono">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Section title="Applications" icon={FactoryIcon}>
            {crane.applications.map((app) => (
              <div key={app} className="flex items-center gap-2 mb-1.5 text-sm text-text">
                <Check size={14} className="text-safe shrink-0" /> {app}
              </div>
            ))}
          </Section>

          <Section title="Operating Motions" icon={Settings2}>
            <div className="flex flex-wrap gap-1.5">
              {crane.motions.map((m) => (
                <Badge key={m} tone="caution" dot={false}>{m}</Badge>
              ))}
            </div>
          </Section>

          <Section title="Duty Class Guide" icon={BarChart3}>
            {['M3', 'M4', 'M5'].map((dc) => (
              <div key={dc} className="mb-1.5 text-xs">
                <span className="text-amber font-semibold font-mono">{dc}: </span>
                <span className="text-text-muted">{DUTY_CLASSES[dc]}</span>
              </div>
            ))}
          </Section>

          <FormulaExplainer title="Why does duty class matter electrically, not just structurally?" explanation={DUTY_CLASS_ELECTRICAL_EXPLANATION} />

          <div className="flex items-start gap-2 bg-safe-dim/50 border border-safe/30 rounded-lg px-3.5 py-3 mt-4">
            <Lightbulb size={15} className="text-safe shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed">
              Each motion (LT, CT, Hoist) requires a dedicated pair of contactors with interlock logic
              to prevent simultaneous energisation of opposing directions. Contactor rating &ge; 2x motor
              full load current for crane duty (severe-duty reversing/jogging per IS/IEC 60947-4-1 AC-3
              sizing practice) &mdash; see the Cable & Busbar / Load Calculator pages for the full derivation.
            </p>
          </div>

          <Button className="w-full mt-4" icon={ArrowRight} iconPosition="right" onClick={onContinue}>
            Continue to Load Calculator
          </Button>
        </div>
      </div>
    </Card>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="mb-5">
      <h4 className="text-text font-semibold text-sm mb-2.5 flex items-center gap-1.5">
        <Icon size={14} className="text-text-dim" /> {title}
      </h4>
      {children}
    </div>
  )
}

function CompareTable({ cranes }) {
  const rows = [
    { label: 'Category', key: 'category' },
    { label: 'Capacity Range', key: 'capacityRange' },
    { label: 'Span Range', key: 'spanRange' },
    { label: 'Max Capacity', fn: (c) => `${c.specs.maxCapacity}T` },
    { label: 'Girders', fn: (c) => c.specs.girders },
    { label: 'Duty Class', fn: (c) => c.specs.typicalDutyClass },
    { label: 'Motions', fn: (c) => c.motions.join(', ') },
  ]
  return (
    <div className="overflow-x-auto rounded-xl border border-steel">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface">
            <th className="text-left px-4 py-3 text-text-muted border-b border-steel whitespace-nowrap">Specification</th>
            {cranes.map((c) => (
              <th key={c.id} className="text-left px-4 py-3 text-amber border-b border-steel whitespace-nowrap">{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-inset' : 'bg-surface'}>
              <td className="px-4 py-2.5 border-b border-steel text-text-muted font-medium align-top whitespace-nowrap">{row.label}</td>
              {cranes.map((c) => (
                <td key={c.id} className="px-4 py-2.5 border-b border-steel text-text align-top">
                  {row.fn ? row.fn(c) : c[row.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
