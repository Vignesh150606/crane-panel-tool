import { useState } from 'react'

export default function StarDelta() {
  const [hp, setHp] = useState(7.5)
  const [timer, setTimer] = useState(5)

  const flc = (hp * 0.746 * 1000) / (Math.sqrt(3) * 415 * 0.85 * 0.85)
  const dolInrush = flc * 6
  const starInrush = dolInrush / 3
  const starTorque = (1/3) * 100

  return (
    <div style={{ width: '100%' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>⭐ Star-Delta Calculator</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>For motors above 5HP. Reduces starting current to 1/3 of DOL by starting in star, switching to delta for run.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #2d3f50' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.4rem' }}>Motor Power (HP)</label>
          <input type="number" value={hp} step="0.5" onChange={e => setHp(parseFloat(e.target.value))}
            style={{ width: '100%', backgroundColor: '#0f1923', border: '1px solid #2d3f50', borderRadius: '0.375rem', padding: '0.5rem', color: 'white', marginBottom: '1rem' }} />

          <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.4rem' }}>Star-to-Delta Timer (seconds)</label>
          <input type="range" min="3" max="15" value={timer} onChange={e => setTimer(parseInt(e.target.value))} style={{ width: '100%' }} />
          <div style={{ color: '#f59e0b', textAlign: 'center', marginTop: '0.5rem' }}>{timer} seconds</div>

          {hp <= 5 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#0f1923', border: '1px solid #22c55e', borderRadius: '0.5rem' }}>
              <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>✓ DOL starting sufficient — Star-Delta not required below 5HP</span>
            </div>
          )}

          {/* Terminal diagram */}
          <div style={{ marginTop: '1.5rem', backgroundColor: '#0f1923', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Motor Terminal Wiring</div>
            <svg width="100%" viewBox="0 0 280 140">
              {/* Star connection */}
              <text x="60" y="15" fill="#3b82f6" fontSize="11" fontWeight="bold" textAnchor="middle">STAR (Start)</text>
              {['U1','V1','W1'].map((t,i) => (
                <g key={t}>
                  <line x1={30+i*30} y1="25" x2={30+i*30} y2="55" stroke="#3b82f6" strokeWidth="2"/>
                  <text x={30+i*30} y="20" fill="#94a3b8" fontSize="9" textAnchor="middle">{t}</text>
                </g>
              ))}
              {['U2','V2','W2'].map((t,i) => (
                <line key={t} x1={30+i*30} y1="55" x2="60" y2="75" stroke="#22c55e" strokeWidth="2"/>
              ))}
              <circle cx="60" cy="75" r="3" fill="#22c55e"/>
              <text x="60" y="92" fill="#22c55e" fontSize="9" textAnchor="middle">U2-V2-W2 shorted</text>

              {/* Delta connection */}
              <text x="200" y="15" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">DELTA (Run)</text>
              {['U1','V1','W1'].map((t,i) => (
                <text key={t} x={170+i*30} y="20" fill="#94a3b8" fontSize="9" textAnchor="middle">{t}</text>
              ))}
              <line x1="170" y1="25" x2="230" y2="65" stroke="#f59e0b" strokeWidth="2"/>
              <line x1="200" y1="25" x2="170" y2="65" stroke="#f59e0b" strokeWidth="2"/>
              <line x1="230" y1="25" x2="200" y2="65" stroke="#f59e0b" strokeWidth="2"/>
              <text x="170" y="80" fill="#f59e0b" fontSize="8" textAnchor="middle">U1→W2</text>
              <text x="200" y="92" fill="#f59e0b" fontSize="8" textAnchor="middle">V1→U2</text>
              <text x="230" y="80" fill="#f59e0b" fontSize="8" textAnchor="middle">W1→V2</text>
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
            <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Current & Torque Comparison</h3>
            <ComparisonBar label="Starting Current (DOL)" value={dolInrush} max={dolInrush} color="#ef4444" unit="A" />
            <ComparisonBar label="Starting Current (Star)" value={starInrush} max={dolInrush} color="#22c55e" unit="A" />
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#0f1923', borderRadius: '0.5rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Current Reduction</div>
              <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '1.5rem' }}>{(100 - (starInrush/dolInrush*100)).toFixed(0)}% lower</div>
            </div>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#0f1923', borderRadius: '0.5rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Starting Torque (Star vs Full)</div>
              <div style={{ color: '#f59e0b', fontWeight: '700', fontSize: '1.5rem' }}>{starTorque.toFixed(0)}% of DOL torque</div>
            </div>
          </div>

          {/* Sequence timeline */}
          <div style={{ backgroundColor: '#1a2632', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #2d3f50' }}>
            <h3 style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1rem' }}>Switching Sequence</h3>
            {[
              { t: '0s', event: 'Main contactor ON. Star contactor ON. Motor starts in STAR.', color: '#3b82f6' },
              { t: `${timer}s`, event: 'Timer expires. Star contactor OFF.', color: '#f59e0b' },
              { t: `${timer}.2s`, event: 'Delta contactor ON. Motor runs in DELTA at full voltage.', color: '#22c55e' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ minWidth: '40px', color: step.color, fontWeight: '700', fontSize: '0.875rem' }}>{step.t}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{step.event}</div>
              </div>
            ))}
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#0f1923', borderRadius: '0.375rem', color: '#64748b', fontSize: '0.75rem' }}>
              ⚠ Star and Delta contactors must be interlocked (NC contacts) — both can never be ON simultaneously, which would short-circuit the motor windings.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComparisonBar({ label, value, max, color, unit }) {
  const pct = (value/max*100)
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
        <span style={{ color: '#94a3b8' }}>{label}</span>
        <span style={{ color }}>{value.toFixed(1)} {unit}</span>
      </div>
      <div style={{ height: '10px', backgroundColor: '#0f1923', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '5px', transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}