import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Settings, Factory, Calculator, Cable, CircuitBoard, LayoutGrid, ClipboardList,
  FileText, Tag, Triangle, Zap, Gamepad2, Search, ArrowRight, BookOpen,
} from 'lucide-react'
import { useProjectStore } from '../store/projectStore'

const WORKFLOW_FEATURES = [
  { path: '/cranes', icon: Factory, title: 'Crane Selector', desc: 'Compare EOT, Gantry, Jib and more. View specs, applications and diagrams.', step: 1 },
  { path: '/calculator', icon: Calculator, title: 'Load Calculator', desc: 'Enter load in tons — get motor HP, contactor ratings, MPCB sizing, cable size.', step: 2 },
  { path: '/cable-busbar', icon: Cable, title: 'Cable & Busbar', desc: 'Cable sizing with voltage drop, plus busbar vs. stretch-wire recommendation.', step: 3 },
  { path: '/control-circuit', icon: CircuitBoard, title: 'Control Circuit', desc: 'Live relay interlock circuit — press push buttons to see NO/NC states in real time.', step: 4 },
  { path: '/panel-layout', icon: LayoutGrid, title: 'Panel Layout', desc: '2D component placement following DIN rail mounting standards.', step: 5 },
  { path: '/bom', icon: ClipboardList, title: 'BOM Generator', desc: 'Auto-generate a complete bill of materials with part specs and quantities.', step: 6 },
  { path: '/report', icon: FileText, title: 'Project Report', desc: 'A professional, printable report combining every step of your design.', step: 7 },
]

const REFERENCE_FEATURES = [
  { path: '/handbook', icon: BookOpen, title: 'Engineering Handbook', desc: 'Every formula used in this app in one place — equation, worked example, and where it\'s actually used. Start here if you\'re new.' },
  { path: '/nameplate', icon: Tag, title: 'Nameplate Calculator', desc: 'Enter motor nameplate values — get contactor, MPCB and overload ratings directly.' },
  { path: '/star-delta', icon: Triangle, title: 'Star-Delta Calculator', desc: 'Compare DOL vs. star-delta starting current and torque, with switching sequence.' },
  { path: '/power-circuit', icon: Zap, title: 'Power Circuit', desc: 'Animated MCB → SPP → MPCB → Contactor → Motor power flow diagram.' },
  { path: '/simulator', icon: Gamepad2, title: 'Panel Simulator', desc: 'Live control panel with NO/NC contacts and interlock logic for CT, LT, Hoist.' },
  { path: '/fault-diagnosis', icon: Search, title: 'Fault Diagnosis', desc: 'Common crane panel faults — reveal cause, diagnosis logic and fix step by step.' },
]

export default function Home() {
  const hasProject = useProjectStore((s) => !!(s.craneType || s.motors))

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-14 sm:py-20">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber to-copper flex items-center justify-center mx-auto mb-6">
          <Settings size={30} className="text-ink" strokeWidth={2} />
        </motion.div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text mb-4">
          EOT Crane Control Panel <span className="text-amber">Design Tool</span>
        </h1>
        <p className="text-text-muted text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          A complete engineering tool for designing, simulating and validating industrial crane control panels —
          every calculation backed by IS/IEC standards with full formula explanations, built on real industrial
          experience from EOT crane panel assembly.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/cranes" className="bg-amber text-ink px-6 py-3 rounded-lg font-semibold hover:bg-amber-dim transition-colors inline-flex items-center gap-2">
            {hasProject ? 'Resume Your Project' : 'Start a New Design'} <ArrowRight size={16} />
          </Link>
          <Link to="/simulator" className="border-2 border-amber text-amber px-6 py-3 rounded-lg font-semibold hover:bg-amber/10 transition-colors">
            Open Panel Simulator
          </Link>
        </div>
      </div>

      {/* Workflow */}
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-text mb-1">Design Workflow</h2>
        <p className="text-text-dim text-sm mb-5">Seven steps, in order — but every page also works standalone.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {WORKFLOW_FEATURES.map((f, i) => (
          <FeatureCard key={f.path} feature={f} delay={i * 0.04} />
        ))}
      </div>

      {/* Reference tools */}
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-text mb-1">Reference Tools</h2>
        <p className="text-text-dim text-sm mb-5">Standalone calculators and simulators — use anytime, no setup needed.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {REFERENCE_FEATURES.map((f, i) => (
          <FeatureCard key={f.path} feature={f} delay={i * 0.04} />
        ))}
      </div>

      <div className="border border-steel rounded-xl p-4 text-center mb-8">
        <p className="text-text-dim text-sm">
          Built with engineering data from real EOT crane panel assembly · Relay interlock logic based on
          industrial standards · Component ratings follow IS/IEC standards
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ feature, delay }) {
  const Icon = feature.icon
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
      <Link
        to={feature.path}
        className="group block bg-surface border border-steel rounded-xl p-5 hover:border-amber hover:-translate-y-0.5 transition-all duration-200 h-full relative"
      >
        {feature.step && (
          <span className="absolute top-4 right-4 text-[0.65rem] font-mono text-text-dim border border-steel rounded-full w-5 h-5 flex items-center justify-center">
            {feature.step}
          </span>
        )}
        <div className="w-10 h-10 rounded-lg bg-inset border border-steel flex items-center justify-center mb-3 group-hover:border-amber transition-colors">
          <Icon size={18} className="text-amber" strokeWidth={2} />
        </div>
        <h3 className="text-text font-semibold mb-1.5">{feature.title}</h3>
        <p className="text-text-dim text-sm leading-relaxed">{feature.desc}</p>
      </Link>
    </motion.div>
  )
}
