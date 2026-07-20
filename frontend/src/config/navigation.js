// Single source of truth for every page's nav metadata — path, label, icon,
// description, and (for workflow pages) step number + the projectStore key
// that marks it complete. Sidebar and Home both read from here instead of
// keeping their own copies, which had already drifted out of sync with each
// other (different labels/order in different places before this pass). A
// separate WorkflowStepper component used to duplicate the sidebar's own
// step list at the top of every page — removed; the sidebar is the single
// place workflow position is shown now.
import {
  Home as HomeIcon, Factory, Calculator, Cable, CircuitBoard, LayoutGrid,
  ClipboardList, FileText, Tag, Triangle, Zap, Gamepad2, Search, BookOpen,
  LayoutDashboard, LayoutPanelTop, ClipboardCheck, GraduationCap,
} from 'lucide-react'

export const HOME_ITEM = { path: '/', label: 'Home', icon: HomeIcon }

export const DASHBOARD_ITEM = {
  path: '/dashboard',
  label: 'Project Dashboard',
  icon: LayoutDashboard,
  description: 'A live snapshot of your current design — crane, motors, cable and BOM, updated automatically as you work.',
}

export const HANDBOOK_ITEM = {
  path: '/handbook',
  label: 'Engineering Handbook',
  icon: BookOpen,
  description: 'Every formula used in this app in one place — equation, worked example, and where it\'s actually used. Start here if you\'re new.',
  isNew: true,
}

// Reachable via the Ask Tutor launcher on every other page, not the
// sidebar/bottom nav — it's a utility grounded in whatever page you came
// from, not a destination you browse to directly. Still a real route
// (findNavItem, breadcrumbs, uiStore.recent all need it registered).
export const TUTOR_ITEM = {
  path: '/tutor',
  label: 'Engineering Tutor',
  icon: GraduationCap,
  description: 'Ask about whatever you\'re working on — a calculation, a component, a formula, or where to start.',
}

// The seven-step guided design flow, in order. `key` maps to
// projectStore.completedSteps() for the checkmark; steps without a key
// (Panel Layout, Report) don't have a standalone "done" signal of their own.
export const WORKFLOW_ITEMS = [
  { path: '/cranes', step: 1, key: 'crane', label: 'Crane Selector', shortLabel: 'Crane', icon: Factory,
    description: 'Compare EOT, Gantry, Jib and more. View specs, applications and diagrams.' },
  { path: '/calculator', step: 2, key: 'load', label: 'Load Calculator', shortLabel: 'Load Calc', icon: Calculator,
    description: 'Enter load in tons — get motor HP, contactor ratings, MPCB sizing, cable size.' },
  { path: '/cable-busbar', step: 3, key: 'cable', label: 'Cable & Busbar', shortLabel: 'Cable/Busbar', icon: Cable,
    description: 'Cable sizing with voltage drop, plus busbar vs. stretch-wire recommendation.' },
  { path: '/control-circuit', step: 4, key: 'circuit', label: 'Control Circuit', shortLabel: 'Circuit', icon: CircuitBoard,
    description: 'Live relay interlock circuit — press push buttons to see NO/NC states in real time.' },
  { path: '/panel-layout', step: 5, key: null, label: 'Panel Layout', shortLabel: 'Panel Layout', icon: LayoutGrid,
    description: '2D component placement following DIN rail mounting standards.' },
  { path: '/bom', step: 6, key: 'bom', label: 'BOM Generator', shortLabel: 'BOM', icon: ClipboardList,
    description: 'Auto-generate a complete bill of materials with part specs and quantities.' },
  { path: '/report', step: 7, key: null, label: 'Project Report', shortLabel: 'Report', icon: FileText,
    description: 'A professional, printable report combining every step of your design.' },
]

// Standalone calculators/simulators — not part of the numbered sequence,
// usable in any order.
export const REFERENCE_ITEMS = [
  { path: '/nameplate', label: 'Nameplate Calculator', icon: Tag,
    description: 'Enter motor nameplate values — get contactor, MPCB and overload ratings directly.' },
  { path: '/star-delta', label: 'Star-Delta Calculator', icon: Triangle,
    description: 'Compare DOL vs. star-delta starting current and torque, with switching sequence.' },
  { path: '/power-circuit', label: 'Power Circuit', icon: Zap,
    description: 'Animated MCB → SPP → MPCB → Contactor → Motor power flow diagram.' },
  { path: '/simulator', label: 'Panel Simulator', icon: Gamepad2,
    description: 'Live control panel with NO/NC contacts and interlock logic for CT, LT, Hoist.' },
  { path: '/fault-diagnosis', label: 'Fault Diagnosis', icon: Search,
    description: 'Common crane panel faults — reveal cause, diagnosis logic and fix step by step.' },
]

// The Industrial Crane Controls Training Platform — Version 2's three new
// modules. Not part of the numbered workflow (they're practice/reference,
// not design steps that produce project data) but distinct enough from the
// standalone calculators in REFERENCE_ITEMS to get their own sidebar
// section, same treatment the Handbook got when it shipped.
export const TRAINING_ITEMS = [
  { path: '/panel-explorer', label: 'Panel Explorer', icon: LayoutPanelTop,
    description: 'Click any component on a realistic panel — function, ratings, failure symptoms, maintenance tips and interview questions.', isNew: true },
  { path: '/challenge-mode', label: 'Challenge Mode', icon: Gamepad2,
    description: 'Diagnose real fault scenarios on a live, fault-injected circuit or with field measurements — hints and wrong attempts cost points.', isNew: true },
  { path: '/commissioning', label: 'Virtual Commissioning', icon: ClipboardCheck,
    description: '13-step commissioning checklist, in order. Some checks include a wrong reading you have to catch, not rubber-stamp.', isNew: true },
]

export const ALL_NAV_ITEMS = [HOME_ITEM, DASHBOARD_ITEM, HANDBOOK_ITEM, TUTOR_ITEM, ...WORKFLOW_ITEMS, ...REFERENCE_ITEMS, ...TRAINING_ITEMS]

export function findNavItem(path) {
  return ALL_NAV_ITEMS.find((i) => i.path === path) || null
}
