import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from './components/ui/Toast'
import Navbar from './components/layout/Navbar'
import WorkflowStepper from './components/layout/WorkflowStepper'
import PageTransition from './components/layout/PageTransition'

import Home from './pages/Home'
import CraneSelector from './pages/CraneSelector'
import LoadCalculator from './pages/LoadCalculator'
import PanelSimulator from './pages/PanelSimulator'
import PowerCircuit from './pages/PowerCircuit'
import BOMGenerator from './pages/BOMGenerator'
import NameplateCalculator from './pages/NameplateCalculator'
import ControlCircuit from './pages/ControlCircuit'
import StarDelta from './pages/StarDelta'
import CableBusbar from './pages/CableBusbar'
import PanelLayout from './pages/PanelLayout'
import FaultDiagnosis from './pages/FaultDiagnosis'
import ProjectReport from './pages/ProjectReport'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
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
      </Routes>
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
