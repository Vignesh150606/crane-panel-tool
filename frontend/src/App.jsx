import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from './components/ui/Toast'
import Navbar from './components/layout/Navbar'
import WorkflowStepper from './components/layout/WorkflowStepper'
import PageTransition from './components/layout/PageTransition'

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

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-text-dim text-sm">
      <div className="w-4 h-4 border-2 border-steel border-t-amber rounded-full animate-spin mr-2.5" />
      Loading page…
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
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
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

function AppShell() {
  const location = useLocation()
  const isReport = location.pathname === '/report'

  return (
    <div className="min-h-screen">
      <div className="no-print">
        <Navbar />
        {!isReport && (
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-3">
            <WorkflowStepper />
          </div>
        )}
      </div>
      <div className={isReport ? '' : 'max-w-[1280px] mx-auto px-4 sm:px-6 py-8'}>
        <AnimatedRoutes />
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
