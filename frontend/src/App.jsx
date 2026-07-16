import { Suspense, lazy, useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from './components/ui/Toast'
import Sidebar from './components/layout/Sidebar'
import MobileHeader from './components/layout/MobileHeader'
import WorkflowStepper from './components/layout/WorkflowStepper'
import PageTransition from './components/layout/PageTransition'
import Breadcrumb from './components/layout/Breadcrumb'
import ProjectStatusBar from './components/layout/ProjectStatusBar'
import ContextPanel from './components/layout/ContextPanel'
import CommandPalette from './components/layout/CommandPalette'
import TutorPanel from './components/tutor/TutorPanel'
import { findNavItem } from './config/navigation'
import { useUIStore } from './store/uiStore'

// Home loads eagerly — it's the landing page, so it's needed for first paint
// regardless of lazy-loading anything else.
import Home from './pages/Home'

// Every other page is loaded on demand. This was the direct fix for the
// ">500kB chunk" warning every previous build produced: 12 calculator/
// simulator pages were all bundled into one eager chunk, so visiting "/"
// downloaded every page's code up front, most of which nobody would open
// that session. Route-level code splitting means each page's JS only loads
// the moment its route is actually visited.
const CraneSelector = lazy(() => import('./pages/CraneSelector'))
const LoadCalculator = lazy(() => import('./pages/LoadCalculator'))
const PanelSimulator = lazy(() => import('./pages/PanelSimulator'))
const PowerCircuit = lazy(() => import('./pages/PowerCircuit'))
const BOMGenerator = lazy(() => import('./pages/BOMGenerator'))
const NameplateCalculator = lazy(() => import('./pages/NameplateCalculator'))
const ControlCircuit = lazy(() => import('./pages/ControlCircuit'))
const StarDelta = lazy(() => import('./pages/StarDelta'))
const CableBusbar = lazy(() => import('./pages/CableBusbar'))
const PanelLayout = lazy(() => import('./pages/PanelLayout'))
const FaultDiagnosis = lazy(() => import('./pages/FaultDiagnosis'))
const ProjectReport = lazy(() => import('./pages/ProjectReport'))
const EngineeringHandbook = lazy(() => import('./pages/EngineeringHandbook'))
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'))
const PanelExplorer = lazy(() => import('./pages/PanelExplorer'))
const ChallengeMode = lazy(() => import('./pages/ChallengeMode'))
const VirtualCommissioning = lazy(() => import('./pages/VirtualCommissioning'))

// Pages that manage their own full layout and opt out of the shared
// breadcrumb / project-status-bar / context-panel workspace chrome: the
// marketing home page, the handbook (its own two-column doc layout), the
// print-focused report, and the dashboard (which *is* the project summary,
// so wrapping it in another one would be redundant).
const WORKSPACE_EXCLUDED = new Set(['/', '/handbook', '/report', '/dashboard'])

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-text-dim text-sm">
      <div className="w-4 h-4 border-2 border-steel border-t-amber rounded-full animate-spin mr-2.5" />
      Loading page…
    </div>
  )
}

// Records the last few pages visited (excluding Home) so the sidebar can
// surface a "Recently Visited" shortcut list. Silent — renders nothing.
function RecentTracker() {
  const location = useLocation()
  const pushRecent = useUIStore((s) => s.pushRecent)
  useEffect(() => {
    const item = findNavItem(location.pathname)
    if (item) pushRecent(item.path, item.label)
  }, [location.pathname, pushRecent])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><ProjectDashboard /></PageTransition>} />
          <Route path="/cranes" element={<PageTransition><CraneSelector /></PageTransition>} />
          <Route path="/calculator" element={<PageTransition><LoadCalculator /></PageTransition>} />
          <Route path="/simulator" element={<PageTransition><PanelSimulator /></PageTransition>} />
          <Route path="/power-circuit" element={<PageTransition><PowerCircuit /></PageTransition>} />
          <Route path="/bom" element={<PageTransition><BOMGenerator /></PageTransition>} />
          <Route path="/nameplate" element={<PageTransition><NameplateCalculator /></PageTransition>} />
          <Route path="/control-circuit" element={<PageTransition><ControlCircuit /></PageTransition>} />
          <Route path="/star-delta" element={<PageTransition><StarDelta /></PageTransition>} />
          <Route path="/cable-busbar" element={<PageTransition><CableBusbar /></PageTransition>} />
          <Route path="/panel-layout" element={<PageTransition><PanelLayout /></PageTransition>} />
          <Route path="/fault-diagnosis" element={<PageTransition><FaultDiagnosis /></PageTransition>} />
          <Route path="/report" element={<PageTransition><ProjectReport /></PageTransition>} />
          <Route path="/handbook" element={<PageTransition><EngineeringHandbook /></PageTransition>} />
          <Route path="/panel-explorer" element={<PageTransition><PanelExplorer /></PageTransition>} />
          <Route path="/challenge-mode" element={<PageTransition><ChallengeMode /></PageTransition>} />
          <Route path="/commissioning" element={<PageTransition><VirtualCommissioning /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

function AppShell() {
  const location = useLocation()
  const isReport = location.pathname === '/report'
  const isWorkspace = !WORKSPACE_EXCLUDED.has(location.pathname)
  const [searchOpen, setSearchOpen] = useState(false)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen lg:flex">
      <RecentTracker />
      <CommandPalette open={searchOpen} onClose={closeSearch} />
      <TutorPanel />
      <div className="no-print">
        <Sidebar onOpenSearch={openSearch} />
        <MobileHeader onOpenSearch={openSearch} />
      </div>
      <div className="flex-1 min-w-0">
        {!isReport && (
          <div className="no-print max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <WorkflowStepper />
          </div>
        )}
        <div className={isReport ? '' : 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8'}>
          {isWorkspace ? (
            <>
              <Breadcrumb path={location.pathname} />
              <ProjectStatusBar />
              <div className="grid xl:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="min-w-0"><AnimatedRoutes /></div>
                <ContextPanel path={location.pathname} />
              </div>
            </>
          ) : (
            <AnimatedRoutes />
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </Router>
  )
}
