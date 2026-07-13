import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Factory, Calculator, Cable, CircuitBoard, LayoutGrid, ClipboardList,
  FileText, Tag, Triangle, Zap, Gamepad2, Search, Menu, X, BookOpen,
} from 'lucide-react'

const WORKFLOW_ITEMS = [
  { path: '/cranes', label: 'Crane Selector', icon: Factory },
  { path: '/calculator', label: 'Load Calculator', icon: Calculator },
  { path: '/cable-busbar', label: 'Cable & Busbar', icon: Cable },
  { path: '/control-circuit', label: 'Control Circuit', icon: CircuitBoard },
  { path: '/panel-layout', label: 'Panel Layout', icon: LayoutGrid },
  { path: '/bom', label: 'BOM Generator', icon: ClipboardList },
  { path: '/report', label: 'Project Report', icon: FileText },
]

const REFERENCE_ITEMS = [
  { path: '/handbook', label: 'Engineering Handbook', icon: BookOpen },
  { path: '/nameplate', label: 'Nameplate Calculator', icon: Tag },
  { path: '/star-delta', label: 'Star-Delta', icon: Triangle },
  { path: '/power-circuit', label: 'Power Circuit', icon: Zap },
  { path: '/simulator', label: 'Panel Simulator', icon: Gamepad2 },
  { path: '/fault-diagnosis', label: 'Fault Diagnosis', icon: Search },
]

function NavLink({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors shrink-0
        ${active ? 'bg-amber text-ink font-semibold' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
    >
      <Icon size={14} strokeWidth={2} />
      {item.label}
    </Link>
  )
}

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur border-b border-steel">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber to-copper flex items-center justify-center">
              <Zap size={16} className="text-ink" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-display font-semibold text-sm text-text">Crane Panel</div>
              <div className="text-[0.65rem] text-text-dim tracking-wide">DESIGN TOOL</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            <NavLink item={{ path: '/', label: 'Home', icon: Home }} active={isActive('/')} />
            <span className="w-px h-5 bg-steel mx-1" />
            {WORKFLOW_ITEMS.map((item) => (
              <NavLink key={item.path} item={item} active={isActive(item.path)} />
            ))}
            <span className="w-px h-5 bg-steel mx-1" />
            {REFERENCE_ITEMS.map((item) => (
              <NavLink key={item.path} item={item} active={isActive(item.path)} />
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden p-2 text-text-muted hover:text-text cursor-pointer"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-steel bg-ink"
          >
            <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
              <NavLink item={{ path: '/', label: 'Home', icon: Home }} active={isActive('/')} onClick={() => setMobileOpen(false)} />
              <div className="text-[0.65rem] uppercase tracking-wide text-text-dim px-3 pt-3 pb-1">Design Workflow</div>
              <div className="flex flex-col gap-0.5">
                {WORKFLOW_ITEMS.map((item) => (
                  <NavLink key={item.path} item={item} active={isActive(item.path)} onClick={() => setMobileOpen(false)} />
                ))}
              </div>
              <div className="text-[0.65rem] uppercase tracking-wide text-text-dim px-3 pt-3 pb-1">Reference Tools</div>
              <div className="flex flex-col gap-0.5 pb-2">
                {REFERENCE_ITEMS.map((item) => (
                  <NavLink key={item.path} item={item} active={isActive(item.path)} onClick={() => setMobileOpen(false)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
