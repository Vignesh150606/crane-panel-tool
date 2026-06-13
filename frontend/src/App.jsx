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
      <div style={{ minHeight: '100vh', backgroundColor: '#0f1923' }}>
        <Navbar />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cranes" element={<CraneSelector />} />
            <Route path="/calculator" element={<LoadCalculator />} />
            <Route path="/simulator" element={<PanelSimulator />} />
            <Route path="/power-circuit" element={<PowerCircuit />} />
            <Route path="/bom" element={<BOMGenerator />} />
            <Route path="/nameplate" element={<NameplateCalculator />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App