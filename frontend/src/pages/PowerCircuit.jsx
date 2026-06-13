import { useState, useEffect } from 'react'

const COMPONENTS = [
  { id: 'mcb', label: 'Main MCB', desc: 'Main Circuit Breaker — first protection point from incoming 3-phase supply', color: '#3b82f6', icon: '⊡' },
  { id: 'spp', label: 'SPP', desc: 'Single Phase Preventer — monitors phase balance, disconnects on phase loss/reversal', color: '#8b5cf6', icon: '⊞' },
  { id: 'mpcb_h', label: 'MPCB Hoist', desc: 'Motor Protection CB for Hoist — sized at motor FLC, protects against overload', color: '#f59e0b', icon: '⊟' },
  { id: 'cont_h', label: 'Contactor H', desc: 'Hoist contactors (Up/Down pair) — rated 3× FLC, controlled by relay circuit', color: '#ef4444', icon: '⊗' },
  { id: 'motor_h', label: 'Hoist Motor', desc: 'Hoist motor — lifts and lowers load. Phase reversal changes direction.', color: '#22c55e', icon: 'M' },
  { id: 'mpcb_lt', label: 'MPCB LT', desc: 'Motor Protection CB for Long Travel motor', color: '#f59e0b', icon: '⊟' },
  { id: 'cont_lt', label: 'Contactor LT', desc: 'LT contactors (Fwd/Rev pair) — phase swap reverses motor direction', color: '#ef4444', icon: '⊗' },
  { id: 'motor_lt', label: 'LT Motor', desc: 'Long Travel motor — moves crane bridge along runway', color: '#22c55e', icon: 'M' },
  { id: 'mpcb_ct', label: 'MPCB CT', desc: 'Motor Protection CB for Cross Travel motor', color: '#f59e0b', icon: '⊟' },
  { id: 'cont_ct', label: 'Contactor CT', desc: 'CT contactors (Left/Right pair)', color: '#ef4444', icon: '⊗' },
  { id: 'motor_ct', label: 'CT Motor', desc: 'Cross Travel motor — moves crab across bridge', color: '#22c55e', icon: 'M' },
]

export default function PowerCircuit() {
  const [highlighted, setHighlighted] = useState(null)
  const [animated, setAnimated] = useState(false)
  const [currentPos, setCurrentPos] = useState(0)

  useEffect(() => {
    if (!animated) return
    const interval = setInterval(() => {
      setCurrentPos(p => (p + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [animated])

  const comp = highlighted ? COMPONENTS.find(c => c.id === highlighted) : null

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔌 Power Circuit Visualizer</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Visualize the complete power circuit from 3-phase supply to motors. Click any component for details.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setAnimated(!animated)}
          style={{ padding: '0.5rem 1.25rem', backgroundColor: animated ? '#22c55e' : '#2d3f50', border: 'none', borderRadius: '0.375rem', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}
        >
          {animated ? '⏹ Stop' : '▶ Animate'} Current Flow
        </button>
        <button
          onClick={() => setHighlighted(null)}
          style={{ padding: '0.5rem 1.25rem', backgroundColor: '#2d3f50', border: 'none', borderRadius: '0.375rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Clear Selection
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>

        {/* SVG Circuit */}
        <div style={{ backgroundColor: '#1a2632', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <svg width="100%" viewBox="0 0 600 480" style={{ fontFamily: 'monospace' }}>

            {/* 3-Phase supply lines */}
            <text x="10" y="30" fill="#94a3b8" fontSize="11">3-Phase 415V Supply</text>
            {['R', 'Y', 'B'].map((phase, i) => (
              <g key={phase}>
                <line x1="20" y1={50 + i * 12} x2="80" y2={50 + i * 12}
                  stroke={['#ef4444', '#eab308', '#3b82f6'][i]} strokeWidth="3" />
                <text x="8" y={54 + i * 12} fill={['#ef4444', '#eab308', '#3b82f6'][i]} fontSize="10" fontWeight="bold">{phase}</text>
              </g>
            ))}

            {/* MCB */}
            <PowerComponent x={80} y={35} w={60} h={45} id="mcb" label="MCB" icon="⊡"
              highlighted={highlighted} onHover={setHighlighted} animated={animated} pos={currentPos} color="#3b82f6" />
            <line x1="140" y1="57" x2="160" y2="57" stroke={animated ? '#22c55e' : '#2d3f50'} strokeWidth="3" />

            {/* SPP */}
            <PowerComponent x={160} y={35} w={60} h={45} id="spp" label="SPP" icon="⊞"
              highlighted={highlighted} onHover={setHighlighted} animated={animated} pos={currentPos} color="#8b5cf6" />
            <line x1="220" y1="57" x2="240" y2="57" stroke={animated ? '#22c55e' : '#2d3f50'} strokeWidth="3" />

            {/* Distribution to 3 MPCBs */}
            <line x1="240" y1="57" x2="240" y2="400" stroke={animated ? '#22c55e' : '#2d3f50'} strokeWidth="2" strokeDasharray={animated ? '8,4' : 'none'} />

            {/* Hoist branch */}
            <BranchRow y={100} label="HOIST" highlighted={highlighted} onHover={setHighlighted} animated={animated} pos={currentPos}
              mpcbId="mpcb_h" contId="cont_h" motorId="motor_h" />

            {/* LT branch */}
            <BranchRow y={240} label="LONG TRAVEL" highlighted={highlighted} onHover={setHighlighted} animated={animated} pos={currentPos}
              mpcbId="mpcb_lt" contId="cont_lt" motorId="motor_lt" />

            {/* CT branch */}
            <BranchRow y={370} label="CROSS TRAVEL" highlighted={highlighted} onHover={setHighlighted} animated={animated} pos={currentPos}
              mpcbId="mpcb_ct" contId="cont_ct" motorId="motor_ct" />

          </svg>
        </div>

        {/* Component Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {comp ? (
            <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: `2px solid ${comp.color}` }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>{comp.icon}</div>
              <h3 style={{ color: comp.color, fontWeight: '700', fontSize: '1rem', marginBottom: '0.75rem', textAlign: 'center' }}>{comp.label}</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.6' }}>{comp.desc}</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Click any component to see details</p>
            </div>
          )}

          {/* Legend */}
          <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
            <h4 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Circuit Flow</h4>
            {[
              { label: 'MCB', desc: 'Main protection', color: '#3b82f6' },
              { label: 'SPP', desc: 'Phase protection', color: '#8b5cf6' },
              { label: 'MPCB', desc: 'Motor protection', color: '#f59e0b' },
              { label: 'Contactor', desc: 'Direction switch', color: '#ef4444' },
              { label: 'Motor', desc: 'Load drive', color: '#22c55e' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: item.color, flexShrink: 0 }} />
                <span style={{ color: item.color, fontSize: '0.8rem', fontWeight: '600', minWidth: '70px' }}>{item.label}</span>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#0f1923', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #2d3f50' }}>
            <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.8rem', marginBottom: '0.5rem' }}>📐 Wiring Rule</div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: '1.6' }}>
              Power and control wiring routed through separate cable ducts.
              100mm gap between ducts. 75mm between contactors.
              Phase reversal at reverse contactor output.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PowerComponent({ x, y, w, h, id, label, icon, highlighted, onHover, color }) {
  const isHighlighted = highlighted === id
  return (
    <g onClick={() => onHover(id)} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={w} height={h} rx="6"
        fill={isHighlighted ? color + '33' : '#0f1923'}
        stroke={isHighlighted ? color : '#2d3f50'} strokeWidth={isHighlighted ? 2.5 : 1.5} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fill={isHighlighted ? color : '#94a3b8'} fontSize="14">{icon}</text>
      <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fill={isHighlighted ? color : '#64748b'} fontSize="9" fontWeight="bold">{label}</text>
    </g>
  )
}

function BranchRow({ y, label, highlighted, onHover, animated, pos, mpcbId, contId, motorId }) {
  const lineColor = animated ? '#22c55e' : '#2d3f50'
  return (
    <g>
      <text x="248" y={y - 5} fill="#94a3b8" fontSize="10">{label}</text>
      <line x1="240" y1={y + 22} x2="270" y2={y + 22} stroke={lineColor} strokeWidth="2" />
      <PowerComponent x={270} y={y} w={70} h={45} id={mpcbId} label="MPCB" icon="⊟"
        highlighted={highlighted} onHover={onHover} animated={animated} pos={pos} color="#f59e0b" />
      <line x1="340" y1={y + 22} x2="360" y2={y + 22} stroke={lineColor} strokeWidth="2" />
      <PowerComponent x={360} y={y} w={80} h={45} id={contId} label="CONTACTOR" icon="⊗"
        highlighted={highlighted} onHover={onHover} animated={animated} pos={pos} color="#ef4444" />
      <line x1="440" y1={y + 22} x2="460" y2={y + 22} stroke={lineColor} strokeWidth="2" />
      <PowerComponent x={460} y={y} w={70} h={45} id={motorId} label="MOTOR" icon="M"
        highlighted={highlighted} onHover={onHover} animated={animated} pos={pos} color="#22c55e" />
    </g>
  )
}