import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import SidebarContent from './SidebarContent'
import { useUIStore } from '../../store/uiStore'
import { DURATION, EASE } from '../../lib/motion'
import Tooltip from '../ui/Tooltip'

// Desktop-only persistent rail. Collapses to a 72px icon rail so the tool
// stays navigable without permanently spending ~200px of a laptop screen —
// the collapse preference is remembered (uiStore, persisted).
export default function Sidebar({ onOpenSearch }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ duration: DURATION.base, ease: EASE.standard }}
      className="hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r border-steel bg-surface/50 backdrop-blur"
    >
      <div className={`h-16 flex items-center shrink-0 border-b border-steel ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-4'}`}>
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber to-copper flex items-center justify-center shrink-0">
            <Zap size={16} className="text-ink" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="leading-none min-w-0">
              <div className="font-display font-semibold text-sm text-text truncate">Crane Panel</div>
              <div className="text-[0.65rem] text-text-dim tracking-wide">DESIGN TOOL</div>
            </div>
          )}
        </Link>
      </div>

      <div className="p-2.5 border-b border-steel shrink-0">
        <Tooltip label={collapsed ? 'Search (Ctrl K)' : null} placement="right" className="w-full flex">
          <button
            onClick={onOpenSearch}
            className={`w-full flex items-center gap-2 rounded-lg border border-steel bg-inset text-text-dim hover:text-text hover:border-steel-light transition-colors cursor-pointer text-sm
              ${collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-2'}`}
          >
            <Search size={14} className="shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Search…</span>}
            {!collapsed && (
              <span className="text-[0.65rem] font-mono border border-steel rounded px-1 py-0.5 text-text-dim shrink-0">Ctrl K</span>
            )}
          </button>
        </Tooltip>
      </div>

      <SidebarContent collapsed={collapsed} />

      <div className="shrink-0 border-t border-steel p-2.5">
        <Tooltip label={collapsed ? 'Expand sidebar' : null} placement="right" className="w-full flex">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer justify-center lg:justify-start"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
