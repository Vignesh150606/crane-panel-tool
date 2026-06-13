import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import CraneSelector from './pages/CraneSelector'
import LoadCalculator from './pages/LoadCalculator'
import PanelSimulator from './pages/PanelSimulator'
import PowerCircuit from './pages/PowerCircuit'
import BOMGenerator from './pages/BOMGenerator'
import NameplateCalculator from './pages/NameplateCalculator'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-industrial-dark">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cranes" element={<CraneSelector />} />
            <Route path="/calculator" element={<LoadCalculator />} />
            <Route path="/simulator" element={<PanelSimulator />} />
            <Route path="/power-circuit" element={<PowerCircuit />} />
            <Route path="/bom" element={<BOMGenerator />} />
            <Route path="/nameplate" element={<NameplateCalculator />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App