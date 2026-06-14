import { useState } from 'react'
import { CABLE_SIZES, CABLE_CAPACITY } from '../data/craneData'

export default function CableBusbar() {
  const [flc, setFlc] = useState(20)
  const [length, setLength] = useState(20)
  const [travelLength, setTravelLength] = useState(20)

  // Cable sizing with voltage drop
  const required = flc * 1.25
  const cableSize = CABLE_SIZES.find(s => CABLE_CAPACITY[s] >= required) || CABLE_SIZES[CABLE_SIZES.length-1]
  const resistance = { 1.5:12.1, 2.5:7.41, 4:4.61, 6:3.08, 10:1.83, 16:1.15, 25:0.727, 35:0.524, 50:0.387, 70:0.268, 95:0.193, 120:0.153 }
  const r = resistance[cableSize] || 0.1
  const voltageDrop = (Math.sqrt(3) * flc * r * length / 1000)
  const voltageDropPct = (voltageDrop / 415 * 100)

  // Bus bar vs stretch wire
  const stretchWireLength = travelLength * 1.5
  const recommendation = travelLength > 15 ? 'busbar' : 'stretch'

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔋 Cable & Busbar Designer</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Calculate cable sizing with voltage drop, and get Bus Bar vs Stretch Wire recommendations.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Cable Sizing */}
        <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <h2 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Cable Sizing</h2>
          <Input label="Full Load Current (A)" value={flc} onChange={setFlc} />
          <Input label="Cable Run Length (m)" value={length} onChange={setLength} />

          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <Stat label="Recommended Size" value={`${cableSize} mm²`} color="#22c55e" />
            <Stat label="Capacity" value={`${CABLE_CAPACITY[cableSize]} A`} color="#3b82f6" />
            <Stat label="Voltage Drop" value={`${voltageDrop.toFixed(2)} V`} color="#f59e0b" />
            <Stat label="Drop %" value={`${voltageDropPct.toFixed(2)}%`} color={voltageDropPct > 5 ? '#ef4444' : '#22c55e'} />
          </div>

          {voltageDropPct > 5 && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem', backgroundColor: '#0f1923', border: '1px solid #ef4444', borderRadius: '0.375rem', color: '#ef4444', fontSize: '0.8rem' }}>
              ⚠ Voltage drop exceeds 5% limit. Consider larger cable size or shorter run.
            </div>
          )}

          {/* Cable cross section visual */}
          <div style={{ marginTop: '1rem', backgroundColor: '#0f1923', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Cable Cross Section</div>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={Math.min(45, 10 + cableSize)} fill="#f59e0b22" stroke="#f59e0b" strokeWidth="2" />
              <text x="50" y="55" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="bold">{cableSize}</text>
              <text x="50" y="70" textAnchor="middle" fill="#64748b" fontSize="9">mm²</text>
            </svg>
          </div>
        </div>

        {/* Bus Bar vs Stretch Wire */}
        <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <h2 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Bus Bar vs Stretch Wire</h2>
          <Input label="Crane Travel Span (m)" value={travelLength} onChange={setTravelLength} />

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#0f1923', borderRadius: '0.5rem', border: `2px solid ${recommendation === 'busbar' ? '#22c55e' : '#3b82f6'}` }}>
            <div style={{ color: recommendation === 'busbar' ? '#22c55e' : '#3b82f6', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Recommended: {recommendation === 'busbar' ? '🔌 Bus Bar System' : '〜 Stretch Wire'}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.6' }}>
              {recommendation === 'busbar'
                ? `For ${travelLength}m span, stretch wire (${stretchWireLength}m) becomes prone to sag, mechanical stress and frequent maintenance. Bus bar provides maintenance-free, continuous power via spring-loaded collector shoes.`
                : `For ${travelLength}m span, stretch wire (${stretchWireLength}m total) is cost-effective and simple. Below 15m, bus bar installation cost isn't justified.`
              }
            </p>
          </div>

          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ backgroundColor: '#0f1923', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Stretch Wire</div>
              <ul style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: '1.8', paddingLeft: '1rem' }}>
                <li>Cable length = 1.5 × span = {stretchWireLength}m</li>
                <li>Lower upfront cost</li>
                <li>Sag affects safety</li>
                <li>Mechanical wear over time</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#0f1923', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <div style={{ color: '#22c55e', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Bus Bar</div>
              <ul style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: '1.8', paddingLeft: '1rem' }}>
                <li>Rigid Cu/Al conductors</li>
                <li>Spring-loaded collector shoes</li>
                <li>No sag, no wear</li>
                <li>Higher install cost, low maintenance</li>
              </ul>
            </div>
          </div>

          {/* Visual diagram */}
          <svg width="100%" height="60" viewBox="0 0 300 60" style={{ marginTop: '1rem' }}>
            {recommendation === 'busbar' ? (
              <>
                <rect x="20" y="25" width="260" height="6" fill="#22c55e" />
                <rect x="140" y="15" width="8" height="15" fill="#94a3b8" />
                <rect x="135" y="30" width="18" height="10" fill="#64748b" rx="2" />
                <text x="150" y="55" textAnchor="middle" fill="#64748b" fontSize="9">Collector shoe on rigid busbar</text>
              </>
            ) : (
              <>
                <path d="M20 25 Q150 50 280 25" stroke="#3b82f6" strokeWidth="3" fill="none" />
                <text x="150" y="55" textAnchor="middle" fill="#64748b" fontSize="9">Stretch wire with characteristic sag</text>
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', backgroundColor: '#0f1923', border: '1px solid #2d3f50', borderRadius: '0.375rem', padding: '0.5rem', color: 'white' }} />
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ backgroundColor: '#0f1923', padding: '0.6rem', borderRadius: '0.375rem' }}>
      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{label}</div>
      <div style={{ color, fontWeight: '700', fontSize: '0.9rem' }}>{value}</div>
    </div>
  )
}