import { Link, useLocation } from 'react-router-dom'
import { Check, HelpCircle, ArrowRight, History } from 'lucide-react'
import { HOME_ITEM, DASHBOARD_ITEM, HANDBOOK_ITEM, WORKFLOW_ITEMS, REFERENCE_ITEMS, TRAINING_ITEMS, findNavItem } from '../../config/navigation'
import { useProjectStore } from '../../store/projectStore'
import { useUIStore } from '../../store/uiStore'

function SectionLabel({ collapsed, children }) {
  if (collapsed) return <div className="h-px bg-steel mx-2 my-3" />
  return (
    <div className="px-2.5 pt-4 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-text-dim first:pt-0">
      {children}
    </div>
  )
}

function Row({ to, icon: Icon, label, active, collapsed, onNavigate, badge, numbered, done }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors mb-0.5
        ${active
          ? "text-amber font-semibold bg-amber/10 before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-amber"
          : 'text-text-muted hover:text-text hover:bg-surface-hover'}
        ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
        {numbered ? (
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.62rem] font-mono shrink-0
            ${active ? 'bg-ink text-amber border border-amber/50' : done ? 'bg-safe text-ink' : 'border border-steel-light'}`}>
            {done && !active ? <Check size={11} strokeWidth={3} /> : numbered}
          </span>
        ) : (
          <Icon size={16} strokeWidth={2} />
        )}
      </span>
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && badge && (
        <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide bg-safe-dim text-safe border border-safe/40 rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-surface border border-steel px-2 py-1 text-xs text-text opacity-0 shadow-lg z-50 transition-opacity duration-100 group-hover:opacity-100">
          {label}
          {badge && <span className="text-safe ml-1.5">· {badge}</span>}
        </span>
      )}
    </Link>
  )
}

export default function SidebarContent({ collapsed = false, onNavigate }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const completed = useProjectStore((s) => s.completedSteps())
  const recent = useUIStore((s) => s.recent)

  return (
    <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2.5 pb-3">
      <SectionLabel collapsed={collapsed}>Quick Access</SectionLabel>
      <Row to={HOME_ITEM.path} icon={HOME_ITEM.icon} label={HOME_ITEM.label} active={isActive('/')} collapsed={collapsed} onNavigate={onNavigate} />
      <Row to={DASHBOARD_ITEM.path} icon={DASHBOARD_ITEM.icon} label={DASHBOARD_ITEM.label} active={isActive(DASHBOARD_ITEM.path)} collapsed={collapsed} onNavigate={onNavigate} />
      <Row to={HANDBOOK_ITEM.path} icon={HANDBOOK_ITEM.icon} label={HANDBOOK_ITEM.label} active={isActive(HANDBOOK_ITEM.path)} collapsed={collapsed} onNavigate={onNavigate} badge="New" />

      {recent.length > 0 && (
        <>
          <SectionLabel collapsed={collapsed}>
            {collapsed ? <History size={13} className="mx-auto text-text-dim" /> : 'Recently Visited'}
          </SectionLabel>
          {recent.map((r) => {
            const item = findNavItem(r.path)
            if (!item) return null
            return (
              <Row key={r.path} to={item.path} icon={item.icon} label={item.label} active={isActive(item.path)} collapsed={collapsed} onNavigate={onNavigate} />
            )
          })}
        </>
      )}

      <SectionLabel collapsed={collapsed}>Design Workflow</SectionLabel>
      {WORKFLOW_ITEMS.map((item) => (
        <Row
          key={item.path}
          to={item.path}
          label={item.label}
          active={isActive(item.path)}
          collapsed={collapsed}
          onNavigate={onNavigate}
          numbered={item.step}
          done={item.key ? completed[item.key] : false}
        />
      ))}

      <SectionLabel collapsed={collapsed}>Reference Tools</SectionLabel>
      {REFERENCE_ITEMS.map((item) => (
        <Row key={item.path} to={item.path} icon={item.icon} label={item.label} active={isActive(item.path)} collapsed={collapsed} onNavigate={onNavigate} />
      ))}

      <SectionLabel collapsed={collapsed}>Training Modules</SectionLabel>
      {TRAINING_ITEMS.map((item) => (
        <Row key={item.path} to={item.path} icon={item.icon} label={item.label} active={isActive(item.path)} collapsed={collapsed} onNavigate={onNavigate} badge={item.isNew ? 'New' : undefined} />
      ))}

      {!collapsed && (
        <div className="mt-5 rounded-xl border border-steel bg-inset p-3.5">
          <div className="flex items-center gap-1.5 text-text text-xs font-semibold mb-1.5">
            <HelpCircle size={13} className="text-amber" /> Need help?
          </div>
          <p className="text-text-dim text-[0.75rem] leading-relaxed mb-2.5">
            Explore formulas, standards, symbols and engineering concepts in the Engineering Handbook.
          </p>
          <Link to="/handbook" onClick={onNavigate} className="inline-flex items-center gap-1 text-amber text-xs font-semibold hover:gap-1.5 transition-all">
            Open Handbook <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </nav>
  )
}
